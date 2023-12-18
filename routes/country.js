/**
 * @Page: Country Routes
 * @Description: Create country related routes here
 */
const { successRes, serverError } = require("#utils/common");

//Handlers
const phoneHandler = require("#handler/phone/");

const onehealthCapture = require("#utils/oneHealthCapture");
const router = require("express").Router();


router.post("/get_all", async (req, res) => {
	try {
		const data = await phoneHandler.getCountryList();
		successRes(res, data);
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return serverError(res);
	}
});

module.exports = router;
