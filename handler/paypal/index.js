/**
 * @Page: Paypal Handler
 */

const fetch = require("node-fetch");
const constants = require("#utils/constants");

const generateAccessToken = async () => {
	try {
		const auth = Buffer.from(
			constants.paypalClientId + ":" + constants.paypalSecret
		).toString("base64");
		const response = await fetch(
			`${constants.paypalBaseUrl}/v1/oauth2/token`,
			{
				method: "post",
				body: "grant_type=client_credentials",
				headers: {
					Authorization: `Basic ${auth}`,
				},
			}
		);

		const data = await response.json();
		return data.access_token;
	} catch (error) {
		console.error("Failed to generate Access Token:", error);
	}
};

const createOrder = async (amount, currencyCode = "USD") => {
	if (!amount) {
		throw new Error("Amount is required");
	}
	const accessToken = await generateAccessToken();
	const url = `${constants.paypalBaseUrl}/v2/checkout/orders`;
	const payload = {
		intent: "CAPTURE",
		purchase_units: [
			{
				amount: {
					currency_code: currencyCode,
					value: `${amount}`,
				},
			},
		],
		payment_source: {
			paypal: {
				experience_context: {
					payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
					brand_name: "FilmFestBook",
					locale: "en-US",
					landing_page: "GUEST_CHECKOUT",
					shipping_preference: "NO_SHIPPING",
					user_action: "PAY_NOW",
				},
			},
		},
	};

	const response = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
		method: "POST",
		body: JSON.stringify(payload),
	});

	return handleResponse(response);
};

const capturePayment = async (orderID) => {
	if (!orderID) {
		throw new Error("Order ID required");
	}
	const accessToken = await generateAccessToken();
	const url = `${constants.paypalBaseUrl}/v2/checkout/orders/${orderID}/capture`;

	const response = await fetch(url, {
		method: "post",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
	});

	return handleResponse(response);
};

const createPayout = async (paypalEmail, amount, payoutId) => {
	if (!paypalEmail || !amount || !payoutId) {
		throw new Error("Bad Request!");
	}
	const accessToken = await generateAccessToken();
	const url = `${constants.paypalBaseUrl}/v1/payments/payouts`;
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify({
			sender_batch_header: {
				sender_batch_id: `payout_${payoutId}`,
				email_subject: "You have a payout!",
				email_message:
					"You have received a payout! Thanks for using our service!",
			},
			items: [
				{
					recipient_type: "EMAIL",
					amount: { value: amount, currency: "USD" },
					note: "Thanks for your patronage!",
					receiver: paypalEmail,
					recipient_wallet: "RECIPIENT_SELECTED",
				},
			],
		}),
	});
	const data = response.json();
	console.log(data);
	return data;
};

async function handleResponse(response) {
	if (response.status === 200 || response.status === 201) {
		return response.json();
	}

	const errorMessage = await response.text();
	throw new Error(errorMessage);
}

const getAmount = (grossSales) => {
	const internationalFee =
		grossSales * constants.PAYPAL_FEE_PERCENT_USD +
		constants.PAYPAL_FEE_AMOUNT_USD;
	const internationalNetSales = grossSales - internationalFee;

	console.log(grossSales, internationalNetSales, internationalFee);
	if (internationalNetSales < 0) {
		return internationalNetSales;
	}
	return {
		netAmount: internationalNetSales,
		paymentFee: internationalFee,
	};
};

module.exports = {
	generateAccessToken,
	capturePayment,
	getAmount,
	createOrder,
	createPayout,
};