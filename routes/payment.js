/**
 * @Page: Payment Routes
 * @Description: Create payment related routes here
 */

const { successRes, errorRes, serverError } = require("#utils/common");
const { authenticateJWT } = require("#utils/middlewares");

const onehealthCapture = require("#utils/oneHealthCapture");
const paymentService = require("#services/payment");
const router = require("express").Router();

router.post("/create_cart_order", authenticateJWT, async (req, res) => {
	try {
		let response = await paymentService.createCartOrder(req.body);
		if (response.success) {
			successRes(res, response.data);
		} else {
			errorRes(res, response.message);
		}
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return serverError(res);
	}
});

router.post("/capture_paypal_payment", authenticateJWT, async (req, res) => {
	try {
		let response = await paymentService.capturePaypalPayment(req.body);
		if (response.success) {
			successRes(res, response.data);
		} else {
			errorRes(res, response.message);
		}
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return serverError(res);
	}
});

router.post("/capture_razor_payment", authenticateJWT, async (req, res) => {
	try {
		let response = await paymentService.captureRazorpayPayment(req.body);
		if (response.success) {
			successRes(res, response.data);
		} else {
			errorRes(res, response.message);
		}
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return serverError(res);
	}
});

router.post("/create_payout", authenticateJWT, async (req, res) => {
	try {
		let response = await paymentService.createPayout(req.body);
		if (response.success) {
			successRes(res, response.data);
		} else {
			errorRes(res, response.message);
		}
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return serverError(res);
	}
});

router.post("/generate_order_receipt", authenticateJWT, async (req, res) => {
	try {
		let response = await paymentService.generateOrderReceipt(req.body);
		if (response.success) {
			successRes(res, response.data);
		} else {
			errorRes(res, response.message);
		}
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return serverError(res);
	}
});
module.exports = router;