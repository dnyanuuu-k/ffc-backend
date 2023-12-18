/**
 * @Page: Submission Routes
 * @Description: Create submission related routes here
 */
const { successRes, serverError, errorRes } = require("#utils/common");
const { authenticateJWT } = require("#utils/middlewares");
const submissionService = require("#services/submission");
const onehealthCapture = require("#utils/oneHealthCapture");
const router = require("express").Router();

router.post("/update_submission_status", authenticateJWT, async (req, res) => {
	try {
		let response = await submissionService.updateSubmissionStatus(req.body);
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

router.post("/update_submission_flag", authenticateJWT, async (req, res) => {
	try {
		let response = await submissionService.updateSubmissionFlag(req.body);
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

router.post("/update_submission_judgement", authenticateJWT, async (req, res) => {
	try {
		let response = await submissionService.updateJudgeStatus(req.body);
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

router.post("/withdraw_submission", authenticateJWT, async (req, res) => {
	try {
		let response = await submissionService.withdrawSubmission(req.body);
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