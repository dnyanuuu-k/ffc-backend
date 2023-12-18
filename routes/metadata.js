/**
 * @Page: Metadata Routes
 * @Description: Create metadata related routes here
 */

const { successRes, errorRes, serverError } = require("#utils/common");
const { authenticateJWT } = require("#utils/middlewares");

const onehealthCapture = require("#utils/oneHealthCapture");
const metadataService = require("#services/metadata");
const router = require("express").Router();

router.post("/list", authenticateJWT, async (req, res) => {
	try {
		let response = await metadataService.getMetadataList(req.body);
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