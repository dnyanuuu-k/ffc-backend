/**
 * @Page: Cart Routes
 * @Description: Create cart related routes here
 */
const { successRes, errorRes, serverError } = require("#utils/common");
const { authenticateJWT } = require("#utils/middlewares");

const onehealthCapture = require("#utils/oneHealthCapture");
const cartService = require("#services/cart");
const router = require("express").Router();


router.post("/add_film_to_cart", authenticateJWT, async (req, res) => {
	try {		
		let response = await cartService.addFilmToCart(req.body);
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

router.post("/remove_item_from_cart", authenticateJWT, async (req, res) => {
	try {		
		let response = await cartService.removeItemFromCart(req.body);
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

router.post("/add_film_to_cart_multi", authenticateJWT, async (req, res) => {
	try {		
		let response = await cartService.addFilmToMulitpleCategory(req.body);
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

router.post("/generate_cart_summary", authenticateJWT, async (req, res) => {
	try {		
		let response = await cartService.generateCartSummary(req.body);
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

router.post("/add_membership_to_cart", authenticateJWT, async (req, res) => {
	try {		
		let response = await cartService.addMembershipToCart(req.body);
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
