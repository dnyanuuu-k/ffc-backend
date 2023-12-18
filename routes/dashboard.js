/**
 * @Page: Dashboard Routes
 * @Description: Create festival related routes here
 */
const { successRes, errorRes, serverError } = require("#utils/common");
const { authenticateJWT } = require("#utils/middlewares");

const onehealthCapture = require("#utils/oneHealthCapture");
const festivalService = require("#services/dashboard/festival");
const router = require("express").Router();

router.post("/festival/sales_summary", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.getSalesSummary(req.body);
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

router.post("/festival/payment_summary", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.getPaymentSummary(req.body);
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

router.post("/festival/submission_summary", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.getSubmissionSummary(req.body);
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

router.post("/festival/filter_payments", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.filterPayments(req.body);
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

router.post("/festival/filter_payouts", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.filterPayouts(req.body);
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

router.post("/festival/filter_submissions", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.filterSubmissions(req.body);
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

router.post("/festival/filter_submission_group", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.filterSubmissionGroup(req.body);
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



router.post("/festival/payout_list", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.generatePayoutList(req.body);
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