/**
 * @Page: Film Routes
 * @Description: Create film related routes here
 */
const { successRes, errorRes, serverError } = require("#utils/common");
const { authenticateJWT } = require("#utils/middlewares");
const onehealthCapture = require("#utils/oneHealthCapture");
const multerHandler = require("#utils/multer");
const filmService = require("#services/film");
const RLVUService = require("#services/rlvu");
const router = require("express").Router();

router.post("/update_film_details", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.updateFilmDetails(req.body);
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

router.post("/update_submitter_details", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.updateSubmitterDeatils(req.body);
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

router.post("/update_film_credits", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.updateFilmCredits(req.body);
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
	"/update_film_specifications",
	authenticateJWT,
	async (req, res) => {
		try {
			let response = await filmService.updateFilmSpecifications(req.body);
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

router.post("/update_film_screenings", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.updateFilmScreenings(req.body);
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

router.post("/film_data", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.getFilmData(req.body);
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

router.post("/get_films", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.getFilms(req.body);
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

router.post("/generate_film_stages", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.generateFilmStages(req.body);
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

router.post("/get_stage_wise_data", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.getStageWiseData(req.body);
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

router.post("/get_form_types", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.getFormTypes(req.body);
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

router.post("/home", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.getHome(req.body);
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

router.post("/submission_list", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.getSubmissions(req.body);
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

router.post("/view_data", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.getFilmView(req.body);
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
// Film Video and TUS Related Functions

router.post("/create_tus_film_record", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.createTusFilmRecord(req.body);
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

router.post("/reset_film_record", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.resetTusFilmRecord(req.body);
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

// Deprecated
router.post("/create_film_record", authenticateJWT, async (req, res) => {
	try {
		let response = await RLVUService.createFilmRecord(req.body);
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

router.post("/get_film_video", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.getFilmVideo(req.body);
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
	"/upload_film_video",
	multerHandler.single("file"),
	async (req, res) => {
		try {
			let response = await RLVUService.uploadVideoPart(
				req.body,
				req.headers,
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
	"/upload_film_poster",	
	multerHandler.single("file"),
	authenticateJWT,
	async (req, res) => {
		try {
			let response = await filmService.uploadFilmPoster(
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

router.post("/get_films_for_submission", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.getFilmsForSubmission(req.body);
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

router.post("/get_video_status", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.getVideoStatus(req.body);
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

router.post("/update_film_video_url", authenticateJWT, async (req, res) => {
	try {
		let response = await filmService.updateFilmVideoUrl(req.body);
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