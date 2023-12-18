/**
 * @Note: durationUnit should be moment compatible
 */

const MONTHLY_GOLD_MEMBERSHIP = {
	id: 1,
	fee: 6,
	feeCurrency: "USD",
	planName: "Monthly",
	title: "Gold Membership",
	durationUnit: "days",
	duration: 31,
};

const YEARLY_GOLD_MEMBERSHIP = {
	id: 2,
	fee: 60,
	feeCurrency: "USD",
	planName: "Annual",
	title: "Gold Membership",
	durationUnit: "days",
	duration: 365,
};

const PRODUCT_LIST = [
	MONTHLY_GOLD_MEMBERSHIP,
	YEARLY_GOLD_MEMBERSHIP
];
module.exports = {
	MONTHLY_GOLD_MEMBERSHIP,
	YEARLY_GOLD_MEMBERSHIP,
	PRODUCT_LIST
};