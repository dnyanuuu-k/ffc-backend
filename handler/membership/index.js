const currencyHandler = require("../currency");
const sequelize = require("#utils/dbConnection");
const { PRODUCT_LIST } = require("#utils/products");
const { QueryTypes } = require("sequelize");

const isGoldMember = async (userId) => {
	try {
		const query = `select 
			id 
		from subscriptions 
		where user_id = $1 
		and now() between from_date and to_date 
		and is_active = 1 limit 1`;
		const response = await sequelize.query(query, {
			bind: [userId],
			type: QueryTypes.SELECT,
		});
		return response?.length ? true : false;
	} catch (tryErr) {
		return false;
	}
};

// Function created considoring we have month as a smallest unit
// for any subscription
// TODO: Optimize for any plan support
const getMembershipData = async (userCurrency) => {
	const productList = [];
	for (const product of PRODUCT_LIST) {
		const feeInCurrency = await currencyHandler.getVisibleCurrency(
			product.fee,
			userCurrency,
			{ code: product.feeCurrency }
		);
		let perMonthFee = null;
		let planDesc = null;
		if (product.planName === "Annual") {
			const monthlyAmount = product.fee / 12;
			const feeInCurrency2 = await currencyHandler.getVisibleCurrency(
				monthlyAmount,
				userCurrency,
				{ code: product.feeCurrency }
			);
			perMonthFee = userCurrency.symbol + Number(feeInCurrency2.amount).toFixed(2);
			planDesc = userCurrency.symbol + Number(feeInCurrency.amount).toFixed(2);
		}else{
			perMonthFee = userCurrency.symbol + Number(feeInCurrency.amount).toFixed(2);
		}
		productList.push({
			...product,
			planDesc,
			perMonthFee,
		});
	}
	const featureList = [
		{
			id: 1,
			name: "Discounts",
			desc: "Get 10% to 50% off on submissions for gold festivals",
			icon: "https://img.icons8.com/?size=60&id=60661&format=png",
			iconBg: "#32C5FF",
		},
		{
			id: 2,
			name: "Priority Support",
			desc: "Support aviliable on phone call 24/7",
			icon: "https://img.icons8.com/?size=60&id=60635&format=png",
			iconBg: "#44D7B6",
		},
	];
	return {
		productList,
		featureList,
	};
};

module.exports = {
	getMembershipData,
	isGoldMember,
};