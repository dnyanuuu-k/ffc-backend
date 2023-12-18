/**
 * @Page: Festival Routes
 * @Description: Create festival related routes here
 */
const { successRes, errorRes, serverError } = require("#utils/common");
const { authenticateJWT } = require("#utils/middlewares");

const onehealthCapture = require("#utils/oneHealthCapture");
const festivalService = require("#services/festival");
const router = require("express").Router();
const multer = require("multer");
const multerHandler = multer();

router.post("/update_festival_details", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.updateFestivalDetails(req.body);
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

router.post("/update_festival_contact_details", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.updateFestivalContactDetails(req.body);
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

router.post("/update_festival_deadline_details", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.updateFestivalDeadlineDetails(req.body);
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

router.post("/update_festival_category_details", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.updateFestivalCategoryDetails(req.body);
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

router.post("/update_festival_category_order", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.updateCategoryRelativeOrder(req.body);
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

router.post("/delete_festival_category", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.deleteFestivalCategory(req.body);
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

router.post("/update_festival_listing_details", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.updateFestivalListingDetails(req.body);
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

router.post("/get_festival_types", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.getFestivalTypes(req.body);
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

router.post("/get_festival_data", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.getFestivalData(req.body);
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

router.post("/get_festival_category_data", authenticateJWT, async (req, res) => {
	try {
		let response = await festivalService.getFestivalCategoryData(req.body);
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
	"/upload_festival_logo",	
	multerHandler.single("file"),
	authenticateJWT,
	async (req, res) => {
		try {
			let response = await festivalService.uploadFestivalLogo(
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
	"/upload_festival_cover",	
	multerHandler.single("file"),
	authenticateJWT,
	async (req, res) => {
		try {
			let response = await festivalService.uploadFestivalCover(
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

router.post("/festival_submission_categories", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.getFestivalSubmissionCategory(
				req.body
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

router.post("/create_update_request", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.createUpdateRequest(
				req.body
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

router.post("/generate_festival_stages", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.generateFestivalStages(
				req.body
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

router.post("/get_stage_wise_data", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.getStageWiseData(
				req.body
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

router.post("/home", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.getHome(
				req.body
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

router.post("/view_data", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.getFestivalViewData(
				req.body
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

router.post("/contact_and_venue", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.getContactAndVenue(
				req.body
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

router.post("/listing_url", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.getFestivalListingUrl(
				req.body
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

router.post("/button_and_logo", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.getButtonAndLogo(
				req.body
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

router.post("/create_default_flag", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.createDefaultFlag(
				req.body
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

router.post("/get_festival_flags", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.getFestivalFlags(
				req.body
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

router.post("/save_festival_flags", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.saveFestivalFlags(
				req.body
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

router.post("/create_festival_judge", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.createFestivalJudge(
				req.body
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

router.post("/delete_festival_judge", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.deleteFestivalJudge(
				req.body
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

router.post("/get_festival_judges", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.getFestivalJudges(
				req.body
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

router.post("/update_notification_pref", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.updateNotificationPreference(
				req.body
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

router.post("/get_notification_perf", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.getNotificationPerf(
				req.body
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

router.post("/get_submissions", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.getSubmissions(
				req.body
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

router.post("/get_festival_seasons", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.getFestivalSeasons(
				req.body
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

router.post("/get_submission_filters", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.getSubmissionFilters(
				req.body
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

router.post("/filter_festivals", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.filterFestivals(
				req.body
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

router.post("/category_with_deadlines", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.getCategoryWithDeadlines(
				req.body
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

router.post("/festival_timeline", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.getFestivalDateTimeline(
				req.body
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

router.post("/publish_festival", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.publishFestival(
				req.body
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

router.post("/update_like_state", authenticateJWT, async (req, res) => {
		try {
			let response = await festivalService.updateLikeState(
				req.body
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