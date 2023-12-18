/**
 * @Page: Judge Routes
 * @Description: Create judge related routes here
 */
const { successRes, errorRes, serverError } = require("#utils/common");
const { authenticateJWT } = require("#utils/middlewares");

const onehealthCapture = require("#utils/oneHealthCapture");
const judgeService = require("#services/judge");
const router = require("express").Router();

router.post("/accept_invitation", authenticateJWT, async (req, res) => {
	try {
		let response = await judgeService.updateInvitation({
			...(req.body || {}),
			accepted: true
		});
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

router.post("/reject_invitation", authenticateJWT, async (req, res) => {
	try {
		let response = await judgeService.updateInvitation({
			...(req.body || {}),
			accepted: false
		});
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