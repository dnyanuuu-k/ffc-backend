/**
 * @Page: Photos Routes
 * @Description: Create photo related routes here
 */

const { successRes, errorRes, serverError } = require("#utils/common");
const { authenticateJWT } = require("#utils/middlewares");
const multerHandler = require("#utils/multer");
const onehealthCapture = require("#utils/oneHealthCapture");
const photoService = require("#services/photos");
const router = require("express").Router();


router.post(
	"/upload",	
	multerHandler.single("file"),
	authenticateJWT,
	async (req, res) => {
		try {
			let response = await photoService.uploadFestivalPhoto(
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
	"/upload_temp_avatar",	
	multerHandler.single("file"),
	authenticateJWT,
	async (req, res) => {
		try {
			let response = await photoService.uploadTempAvatar(
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

router.post("/delete_festival_photo", authenticateJWT, async (req, res) => {
		try {
			let response = await photoService.deleteFestivalPhoto(req.body);
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

router.post("/delete_festival_album_photo", authenticateJWT, async (req, res) => {
		try {
			let response = await photoService.deleteFestivalAlbumPhoto(req.body);
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


router.post("/festival_photos", authenticateJWT, async (req, res) => {
		try {
			let response = await photoService.getFestivalPhotos(req.body);
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

router.post("/create_festival_album", authenticateJWT, async (req, res) => {
		try {
			let response = await photoService.createFestivalAlbum(req.body);
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

router.post("/festival_albums", authenticateJWT, async (req, res) => {
		try {
			let response = await photoService.getFestivalAlbums(req.body);
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

router.post("/festival_album_photos", authenticateJWT, async (req, res) => {
		try {
			let response = await photoService.getFestivalAlbumPhotos(req.body);
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

router.post("/add_festival_photo_to_album", authenticateJWT, async (req, res) => {
		try {
			let response = await photoService.addFestivalPhotoToFestivalAlbum(req.body);
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

router.post("/save_festival_album_photos_order", authenticateJWT, async (req, res) => {
		try {
			let response = await photoService.saveAlbumPhotosRelativeOrder(req.body);
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

router.post("/delete_festival_album", authenticateJWT, async (req, res) => {
		try {
			let response = await photoService.deleteFestivalAlbum(req.body);
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

router.post("/save_festival_photos_order", authenticateJWT, async (req, res) => {
		try {
			let response = await photoService.savePhotosRelativeOrder(req.body);
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

router.post("/delete_festival_photo", authenticateJWT, async (req, res) => {
		try {
			let response = await photoService.deleteFestivalPhoto(req.body);
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

router.post("/delete_festival_album_photo", authenticateJWT, async (req, res) => {
		try {
			let response = await photoService.deleteFestivalAlbumPhoto(req.body);
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


router.post("/festival_photos", authenticateJWT, async (req, res) => {
		try {
			let response = await photoService.getFestivalPhotos(req.body);
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
	"/upload_film_photo",	
	multerHandler.single("file"),
	authenticateJWT,
	async (req, res) => {
		try {
			let response = await photoService.uploadFilmPhoto(
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

router.post("/delete_film_photo", authenticateJWT, async (req, res) => {
		try {
			let response = await photoService.deleteFilmPhoto(req.body);
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

router.post("/film_photos", authenticateJWT, async (req, res) => {
		try {
			let response = await photoService.getFilmPhotos(req.body);
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
