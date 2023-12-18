/**
 * @Page: Tinode IM Routes
 * @Description: Create tinode im related routes here
 */

const { successRes, errorRes, serverError } = require("#utils/common");
const { authenticateJWT } = require("#utils/middlewares");

const onehealthCapture = require("#utils/oneHealthCapture");
const tinodeService = require("#services/tinode");
const router = require("express").Router();

router.post("/init_chat", authenticateJWT, async (req, res) => {
	try {
		let response = await tinodeService.initChat(req.body);
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

router.post("/user_topic", authenticateJWT, async (req, res) => {
	try {
		let response = await tinodeService.getUserTopic(req.body);
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