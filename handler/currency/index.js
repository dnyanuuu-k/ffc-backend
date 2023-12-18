const logger = require("#utils/logger");
const fetch = require("node-fetch");
const moment = require("moment");

let cache = new Map();
const MODULE_NAME = "CURRENCY_HANDLER";

const convertAmount = async (amount, fromCurrency, toCurrency) => {
	try {
		if (fromCurrency === toCurrency) {
			return parseFloat(Number(amount));
		}
		const dateStr = moment().utc().format(global.YYYYMMDD);
		if (!cache.has(dateStr)) {
			await updateRates();
		}
		const rates = cache.get(dateStr);		
		const fromCurrencyBaseRate = rates[fromCurrency];
		const toCurrencyBaseRate = rates[toCurrency];

		if (!toCurrencyBaseRate || !fromCurrencyBaseRate) {
			throw new Error(
				`Rate not aviliable for ${fromCurrency} or ${toCurrency}`
			);
		}
		const rate = toCurrencyBaseRate / fromCurrencyBaseRate;
		const convertedAmount = rate * amount;
		const finalAmount = parseFloat(Number(convertedAmount));
		return {
			amount: finalAmount,
			rate,
		};
	} catch (tryErr) {
		logger.slack(MODULE_NAME, tryErr.message);
		return false;
	}
};

const updateRates = async () => {
	const apiKey = "4a4a1386eef346d5d134966530a0ddc9";
	const date = moment().format("YYYY-MM-DD");
	const baseSource = "USD";
	const url = `http://api.exchangerate.host/historical?access_key=${apiKey}&date=${date}`;
	const response = await fetch(url);
	const data = (await response.json()) || false;
	if (data.success) {
		cache = new Map();
		const rates = {
			USD: 1
		};
		Object.keys(data.quotes).forEach((key) => {
			const curr = key.replace(baseSource, "");
			rates[curr] = data.quotes[key];
		});
		cache.set(date, rates);
	} else {
		throw new Error("Unable to get rates");
	}
};

/**
 * @TODO: Optimize for Other Currencies also
 */
const getVisibleCurrency = async (amount, filmCurrency, festivalCurrency) => {
	// NF -> NFF
	if (
		filmCurrency.code === global.NATIONAL_CURRENCY &&
		festivalCurrency.code === global.NATIONAL_CURRENCY
	) {
		const prasedAmount = parseFloat(Number(amount));
		return {
			amount: prasedAmount,
			currency: filmCurrency,
			exchRate: 1,
		};
	}

	// NF -> INFF
	// As From Currency if of INsuch that film
	// is being submitted from IN, so we will show
	// converted fee to Indian Users
	if (
		filmCurrency.code === global.NATIONAL_CURRENCY &&
		festivalCurrency.code !== global.NATIONAL_CURRENCY
	) {
		const prasedAmount = await convertAmount(
			amount,
			festivalCurrency.code,
			filmCurrency.code
		);
		// Process things via RazorPay in INR
		return {
			amount: prasedAmount.amount,
			currency: filmCurrency,
			exchRate: prasedAmount.rate,
		};
	}

	// INF -> NFF
	// As From Currency is not INR such that film
	// is not being submitted from IN, so we will show
	// USD to non-Indian users
	if (
		filmCurrency.code !== global.NATIONAL_CURRENCY &&
		festivalCurrency.code === global.NATIONAL_CURRENCY
	) {
		const prasedAmount = await convertAmount(
			amount,
			filmCurrency.code,
			festivalCurrency.code
		);
		// Process things via Paypal in USD
		return {
			amount: prasedAmount.amount,
			currency: filmCurrency,
			exchRate: prasedAmount.rate,
		};
	}

	// INF -> INFF
	// TODO: USD === USD as we don't support other currencies
	// currently
	if (filmCurrency.code === festivalCurrency.code) {
		// Process things via Paypal in USD
		return {
			amount: amount,
			currency: filmCurrency,
			exchRate: 1,
		};
	}

	logger.slack(
		"Encountered Currency Malfunction",
		JSON.stringify({
			filmCurrency,
			festivalCurrency,
		})
	);

	return false;
};

module.exports = {
	convertAmount,
	getVisibleCurrency,
};