/**
 * @Page: Account Routes
 * @Description: Create user related routes here
 */
const { successRes, errorRes, serverError } = require("#utils/common");
const { authenticateJWT, verifyJWT } = require("#utils/middlewares");

const onehealthCapture = require("#utils/oneHealthCapture");
const accountService = require("#services/account");
const router = require("express").Router();
const multer = require("multer");
const multerHandler = multer();

router.post("/create", async (req, res) => {
	try {
		let response = await accountService.createAccount(req.body);
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

router.post("/login", async (req, res) => {
	try {
		let response = await accountService.loginAccount(req.body);
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

router.post("/send_otp", async (req, res) => {
	try {
		let response = await accountService.sendOTP(req.body);
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

router.post("/verify_otp", verifyJWT, async (req, res) => {
	try {
		if(req.body?.otp != req?.body?.authOTP){
			return errorRes("Incorrect OTP");
		}
		let response = await accountService.getToken(req.body);
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

router.post("/reset_password", authenticateJWT, async (req, res) => {
	try {
		let response = await accountService.resetPassword(req.body);
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

router.post("/refresh_token", authenticateJWT, async (req, res) => {
	try {
		let response = await accountService.getToken(req.body);
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

router.post("/update_password", authenticateJWT, async (req, res) => {
	try {
		let response = await accountService.updatePassword(req.body);
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

router.post("/get_work_types", authenticateJWT, async (req, res) => {
	try {
		let response = await accountService.getWorkTypes(req.body);
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

router.post("/update_work_type", authenticateJWT, async (req, res) => {
	try {
		let response = await accountService.updateWorkType(req.body);
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

router.post("/basic_profile_data", authenticateJWT, async (req, res) => {
	try {
		let response = await accountService.basicProfileData(req.body);
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

router.post("/initial_setup_data", authenticateJWT, async (req, res) => {
	try {
		let response = await accountService.initialSetupData(req.body);
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

router.post("/update_setup_data", authenticateJWT, async (req, res) => {
	try {
		let response = await accountService.updateSetupData(req.body);
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

router.post("/get_user_data", authenticateJWT, async (req, res) => {
	try {
		let response = await accountService.getUserData(req.body);
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

router.post("/update_user_data", authenticateJWT, async (req, res) => {
	try {
		let response = await accountService.updateUserData(req.body);
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

router.post(
	"/upload_user_avatar",	
	multerHandler.single("file"),
	authenticateJWT,
	async (req, res) => {
		try {
			let response = await accountService.uploadUserAvatar(
				req.body,
				req.file
			);
			if (response.success) {
				successRes(res, response.data);
			} else {
				errorRes(res, response.message);
			}
		} catch (tryErr) {
			onehealthCapture.catchError(tryErr);
			return serverError(res);
		}
	}
);

router.post(
	"/upload_user_cover",	
	multerHandler.single("file"),
	authenticateJWT,
	async (req, res) => {
		try {
			let response = await accountService.uploadUserCover(
				req.body,
				req.file
			);
			if (response.success) {
				successRes(res, response.data);
			} else {
				errorRes(res, response.message);
			}
		} catch (tryErr) {
			onehealthCapture.catchError(tryErr);
			return serverError(res);
		}
	}
);

module.exports = router;
