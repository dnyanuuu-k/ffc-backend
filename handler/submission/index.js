const { PRODUCT_LIST } = require("#utils/products");
const { QueryTypes } = require("sequelize");

const Models = require("#models");
const sequelize = require("#utils/dbConnection");
const constants = require("#utils/constants");
const moment = require("moment");
const phoneHandler = require("../phone");
const onehealthCapture = require("#utils/oneHealthCapture");

const festivalSubmissionHelperQuery = `select fcf.id from festival_dates fd
	  join festival_date_deadlines fdd on fdd.festival_date_id = fd.id
	  join festival_category_fees fcf on fcf.festival_date_deadline_id = fdd.id
	  where fd.id = $fdi`;

/**
 * @Desc: Handles Submission Creation and Subscription Creation
 * for given cart order id
 */
const createSubmission = async (orderId, paymentId = null) => {
	let transaction = null;
	try {
		const submissions = [];
		const orderData = await Models.CartOrders.findOne({
			where: {
				id: orderId,
			},
			include: {
				as: "cartOrderItems",
				model: Models.CartOrderItems,
			},
		});
		console.log(orderId, paymentId);
		const orderItems = orderData?.cartOrderItems || [];
		transaction = await sequelize.transaction();
		for (const orderItem of orderItems) {
			const { id, filmId, festivalCategoryFeeId, productId } = orderItem;
			if (filmId && festivalCategoryFeeId) {
				submissions.push({
					filmId,
					paymentId,
					orderItemId: id,
					festivalCategoryFeeId,
				});
			}

			if (productId) {
				const currentProduct = PRODUCT_LIST.find(
					(p) => p.id === parseInt(productId, 10)
				);
				if (currentProduct) {
					const currentMoment = moment();
					const fromDate = currentMoment.format("YYYY-MM-DD");
					currentMoment.add(
						currentProduct.durationUnit,
						currentProduct.duration
					);
					const toDate = currentMoment.format("YYYY-MM-DD");
					await Models.Subscriptions.update(
						{
							isActive: false,
						},
						{
							where: {
								userId: orderData.userId,
							},
						},
						{ transaction }
					);
					await Models.Subscriptions.create(
						{
							productId: currentProduct.id,
							userId: orderData.userId,
							orderItemId: orderItem.id,
							fromDate,
							toDate,
							isActive: true,
						},
						{ transaction }
					);
				}
			}
		}
		// console.log('Add this: ', submissions);
		await Models.FestivalSubmissions.bulkCreate(submissions, {
			transaction,
		});
		// console.log('Empty Cart: ', submissions);
		await Models.Cart.destroy({
			where: {
				userId: orderData.userId,
			},
			transaction,
		});
		await transaction.commit();
		return true;
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		if (transaction) {
			transaction.rollback();
		}
		return false;
	}
};

const getSubmissionByCountry = async (filters) => {
	let limitOffset = "";

	if (filters.limit) {
		limitOffset += " limit " + filters.limit;
	}

	if (filters.offset) {
		limitOffset += " offset " + filters.offset;
	}
	const query = `select
	  count(*) OVER() "totalCount",
	  count(fs.id) "submissionCount",
	  ur.country_code "countryCode"
	from festival_submissions fs
	join films fm on fm.id = fs.film_id
	join users ur on ur.id = fm.user_id
	where fs.festival_category_fee_id in (
	  ${festivalSubmissionHelperQuery}
	)
	group by "countryCode"
	order by "submissionCount" desc
	${limitOffset}`;

	const response = await sequelize.query(query, {
		type: QueryTypes.SELECT,
		bind: {
			fdi: filters.festivalDateId,
		},
	});

	const result = (response || []).map((cty) => {
		const country = phoneHandler.getCountry(cty.countryCode) || {};
		return {
			countryName: country.name,
			...cty,
		};
	});

	return result;
};

const getSubmissionByCategories = async (filters) => {
	let limitOffset = "";

	if (filters.limit) {
		limitOffset += " limit " + filters.limit;
	}

	if (filters.offset) {
		limitOffset += " offset " + filters.offset;
	}
	const query = `select
	  fc.id "categoryId",
    fc.name "categoryName",
    count(fs.id) "submissionCount"
	from festival_submissions fs
	join festival_category_fees fcf on fcf.id = fs.festival_category_fee_id
	join festival_categories fc on fc.id = fcf.festival_category_id
	where fs.festival_category_fee_id in (
	  ${festivalSubmissionHelperQuery}
	)
	group by "categoryId"
	order by "submissionCount" desc
	${limitOffset}`;

	const result = await sequelize.query(query, {
		type: QueryTypes.SELECT,
		bind: {
			fdi: filters.festivalDateId,
		},
	});

	return result;
};

const getDistinctCountries = async (filters) => {
	const query = `select
	  distinct(ur.country_code) country
	from festival_submissions fs
	join films fm on fm.id = fs.film_id
	join users ur on ur.id = fm.user_id
	where fs.festival_category_fee_id in (
	  ${festivalSubmissionHelperQuery}
	)`;
	const result = await sequelize.query(query, {
		type: QueryTypes.SELECT,
		bind: {
			fdi: filters.festivalDateId,
		},
	});
	const countries = (result || []).map((data) => data.country);
	return countries;
};

const isSelectedStatus = (status) => {
	return status >= constants.JUDGE.SELECTED;
};

const SubmissionHandler = {
	createSubmission,
	getSubmissionByCountry,
	getSubmissionByCategories,
	getDistinctCountries,
	isSelectedStatus
};

module.exports = SubmissionHandler;