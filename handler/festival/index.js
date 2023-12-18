const Models = require("#models");
const sequelize = require("#utils/dbConnection");

//Constants
const { QueryTypes } = require("sequelize");
const constants = require("#utils/constants");

const defaultFlags = [
	{
		title: "Blue",
		color: "#65BBFC",
	},
	{
		title: "Red",
		color: "#FC6265",
	},
	{
		title: "Yellow",
		color: "#EBCF34",
	},
	{
		title: "Purple",
		color: "#D381F7",
	},
	{
		title: "Grey",
		color: "#C8C8C8",
	},
	{
		title: "Orange",
		color: "#FCB32A",
	},
	{
		title: "Black",
		color: "#111111",
	},
];

const numberMonthMap = {
	"01": "Jan",
	"02": "Feb",
	"03": "Mar",
	"04": "Apr",
	"05": "May",
	"06": "Jun",
	"07": "Jul",
	"08": "Aug",
	"09": "Sep",
	10: "Oct",
	11: "Nov",
	12: "Dec",
};

const getFestivalBasicInfo = async (festivalId, userId = null) => {
	let whereFilter = "f.id = $festivalId";
	if (userId) {
		whereFilter = "f.user_id = $userId";
	}
	const query = `select f.id, f.name, f.logo_hash,
	f.logo_url, f.cover_url,
	cr.code currency_code, cr.symbol "currency",
	fd.id deadline_id, fd.opening_date, fd.festival_end
	from festivals f 
	join users u on u.id = f.user_id
	join currencies cr on cr.id = u.currency_id
	left join festival_dates fd on fd.festival_id = f.id
	where ${whereFilter}
	order by fd.festival_end desc
	limit 1`;
	const response = await sequelize.query(query, {
		type: QueryTypes.SELECT,
		bind: {
			festivalId,
			userId,
		},
	});
	let festivalData = {};
	const festivalSeasons = [];

	if (!response.length) {
		return false;
	}
	let infoNotAdded = true;
	response.forEach((festival) => {
		if (infoNotAdded) {
			infoNotAdded = false;
			festivalData = {
				id: festival.id,
				name: festival.name,
				logoHash: festival.logo_hash,
				logoUrl: festival.logo_url,
				coverUrl: festival.cover_url,
				currencyCode: festival.currency_code,
				currency: festival.currency,
			};
		}
		festivalSeasons.push({
			id: festival.deadline_id,
			openingDate: festival.opening_date,
			festivalEnd: festival.festival_end,
		});
	});

	return {
		...festivalData,
		festivalSeasons,
	};
};

const getFestivalSalesSummary = async (filters) => {
	let whereFilter = "";
	let totalGross = 0;
	let totalNet = 0;
	let submissionCount = 0;
	if (filters.festivalDateId) {
		whereFilter = "fd.id = $fd";
	} else if (filters.festivalId) {
		whereFilter = "fd.festival_id = $f";
	} else {
		return {
			totalGross,
			totalNet,
			submissionCount,
		};
	}
	// @SalesSummary - TAG to Search Purpose
	const sales = await sequelize.query(
		`select count(fs.id) submission_count, sum(coi.festival_amount) total_gross
		from festival_dates fd
		join festival_date_deadlines fdd on fdd.festival_date_id = fd.id
		join festival_category_fees fcf on fcf.festival_date_deadline_id = fdd.id
		join festival_submissions fs on fs.festival_category_fee_id = fcf.id
		join cart_order_items coi on coi.id = fs.order_item_id
		where ${whereFilter}`,
		{
			bind: {
				fd: filters.festivalDateId,
				f: filters.festivalId,
			},
			type: QueryTypes.SELECT,
		}
	);
	if (sales?.length) {
		const paymentGatewayFee =
			sales[0].total_gross * constants.COMMON_PAYMENT_FEE_PERCENT;
		totalGross = parseFloat(sales[0].total_gross);
		totalNet = totalGross - paymentGatewayFee;
		submissionCount = sales[0].submission_count;
	}
	return {
		totalGross,
		totalNet,
		submissionCount,
	};
};

const getSubmissionPaymentList = async (filters) => {
	let limitOffset = "";

	if (filters.limit) {
		limitOffset += " limit " + filters.limit;
	}

	if (filters.offset) {
		limitOffset += " offset " + filters.offset;
	}

	const query = `select count(*) OVER() "totalCount", * from (
	  select 
	    distinct on (fs.id) fs.id "submissionId",
	    py.id "paymentId",
	    py.cart_order_id "orderId",
	    fm.title "filmTitle",
	    coi.festival_amount "festivalAmount",
	    fcf.id "categoryId",
	    fc.name "categoryName",
	    fs.created_at "createdAt"
	  from festival_submissions fs
	  join films fm on fm.id = fs.film_id
	  join festival_category_fees fcf on fcf.id = fs.festival_category_fee_id
	  join festival_categories fc on fc.id = fcf.festival_category_id
	  join cart_order_items coi on coi.id = fs.order_item_id
	  join payments py on py.id = fs.payment_id
	  where fs.festival_category_fee_id in (
	    select fcf.id from festival_dates fd
	    join festival_date_deadlines fdd on fdd.festival_date_id = fd.id
	    join festival_category_fees fcf on fcf.festival_date_deadline_id = fdd.id
	    where fd.id = $festivalDateId
	  )
	) payments
	order by "createdAt" desc
	${limitOffset}`;

	const submissionPayments = await sequelize.query(query, {
		type: QueryTypes.SELECT,
		bind: {
			festivalDateId: filters.festivalDateId,
		},
	});

	return submissionPayments;
};

const getFestivalPayoutSummary = async () => {
	return {
		amountSettled: 0,
		amountRemaining: 0,
	};
};

const getSubmissionAgg = async (festivalDateId) => {
	const submissionQuery = `select 
	  count(id) submissions, 
	  sum(case when judging_status = ${constants.JUDGE.SELECTED} or judging_status > ${constants.JUDGE.AWARD_WINNER} then 1 else 0 end) selections,
	  sum(case when judging_status = ${constants.JUDGE.AWARD_WINNER} then 1 else 0 end) winners
	from festival_submissions where festival_category_fee_id in (
	  select fcf.id from festival_category_fees fcf where fcf.festival_date_deadline_id in (
	  	select fdd.id from festival_date_deadlines fdd where fdd.festival_date_id = $1
	  )
	)`;
	const response = await sequelize.query(submissionQuery, {
		type: QueryTypes.SELECT,
		bind: [festivalDateId]
	});
	return response?.length ? response[0] : {
		submissions: 0,
		selected: 0,
		winners: 0,
	};
};

const getFestivalPayoutList = async () => {
	return [];
};

const getFestivalPaymentGraph = async (festivalDateId) => {
	const query = `select sum(sale_list.sale) value, label from (  
	   select 0 sale, to_char(generate_series(fd.opening_date, fd.festival_end, '1 month'), 'MM') label from festival_dates fd where id = 2
	   
	   union
	   
		 select
		    sum(coi.festival_amount) sale,
		    to_char(fs.created_at, 'MM') label
		  from festival_submissions fs
		  join cart_order_items coi on coi.id = fs.order_item_id
		  where fs.festival_category_fee_id in (
		    select fcf.id from festival_dates fd
		    join festival_date_deadlines fdd on fdd.festival_date_id = fd.id
		    join festival_category_fees fcf on fcf.festival_date_deadline_id = fdd.id
		    where fd.id = $1
		  )    
	    group by label
	)  sale_list
	group by label
	order by label asc`;
	const response = await sequelize.query(query, {
		type: QueryTypes.SELECT,
		bind: [festivalDateId],
	});
	const result = (response || []).map((month) => ({
		label: numberMonthMap[month.label],
		value: parseFloat(month.value),
	}));
	return result;
};

const createDefaultFestivalFlags = async (festivalId) => {
	if (!festivalId) {
		return false;
	}
	const alreadyCreated = await Models.FestivalFlags.count({
		where: {
			festivalId,
		},
	});
	if (alreadyCreated) {
		return false;
	}
	const flagsToCreate = defaultFlags.slice(4).map((flag) => ({
		...flag,
		festivalId
	}));
	await Models.FestivalFlags.bulkCreate(flagsToCreate);
	return true;
};

module.exports = {
	getFestivalBasicInfo,
	getFestivalSalesSummary,
	getFestivalPayoutSummary,
	getSubmissionPaymentList,
	getFestivalPayoutList,
	getFestivalPaymentGraph,
	createDefaultFestivalFlags,
	getSubmissionAgg
};