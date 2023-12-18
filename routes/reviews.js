/**
 * @Page: Review Routes
 * @Description: Create festival review related routes here
 */
const { successRes, serverError, errorRes } = require("#utils/common");
const { authenticateJWT } = require("#utils/middlewares");
const reviewService = require("#services/reviews");
const onehealthCapture = require("#utils/oneHealthCapture");
const router = require("express").Router();


router.post("/create_festival_review", authenticateJWT, async (req, res) => {
	try {
		let response = await reviewService.createFestivalReview(req.body);
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

router.post("/festival_reviews", authenticateJWT, async (req, res) => {
	try {
		let response = await reviewService.getFestivalReviews(req.body);
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

router.post("/update_festival_review_reply", authenticateJWT, async (req, res) => {
	try {
		let response = await reviewService.updateFestivalReviewReply(req.body);
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

router.post("/delete_festival_review", authenticateJWT, async (req, res) => {
	try {
		let response = await reviewService.deleteFestivalReview(req.body);
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

router.post("/festival_review_submission_data", authenticateJWT, async (req, res) => {
	try {
		let response = await reviewService.getReviewSubmissionData(req.body);
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
