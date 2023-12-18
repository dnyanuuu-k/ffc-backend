/**
 * @Page: Photo Services
 * @Description: Create festival photo related functions here
 */

//Models
const Models = require("#models");

//Constants
const sequelize = require("#utils/dbConnection");
const sharpUtil = require("#utils/sharp");
const err = require("#utils/errors");
const aws = require("#utils/aws");
//Helper Functions
const onehealthCapture = require("#utils/oneHealthCapture");
const validation = require("#utils/validation");
const common = require("#utils/common");
const blur = require("#utils/blurhash");
const { Op, QueryTypes } = require("sequelize");
//Third Party Functions
const sharp = require("sharp");
const moment = require("moment");

const uploadFestivalPhoto = async (params, photoFile) => {
	let deleteObjects = [];
	try {
		let { festivalId, festivalAlbumId } = params;
		if (!validation.validId(parseInt(festivalId))) {
			return {
				message: err.invalid_request,
			};
		}
		if (!photoFile) {
			return {
				message: "Photo file is required",
			};
		}
		const imageSize = await sharp(photoFile.buffer).metadata();
		if (!imageSize) {
			return {
				message: err.invalid_image,
			};
		}

		const maxRelativeOrderData = await sequelize.query(
			`select max(relative_order) as max_order from festival_photos where festival_id = ${festivalId}`,
			{
				type: QueryTypes.SELECT,
			}
		);

		const dbMaxRelativeOrder = maxRelativeOrderData?.[0]?.max_order || 0;
		const relativeOrder = Math.min(
			Math.max((dbMaxRelativeOrder || 0) + 1, 1),
			global.FEATURED_PHOTO_COUNT + 1
		);

		//Original Image

		const resizedImage = common.calculateAspectRatioFit(
			imageSize.width,
			imageSize.height,
			global.MAX_IMAGE_WIDTH,
			global.MAX_IMAGE_HEIGHT
		);
		let modifiedImage = sharp(photoFile.buffer);
		modifiedImage = modifiedImage
			.resize(resizedImage.width, resizedImage.height)
			.withMetadata()
			.jpeg({
				compressionLevel: 6,
				quality: 90,
				adaptiveFiltering: true,
				force: true,
			});
		const { data, info } = await modifiedImage.toBuffer({
			resolveWithObject: true,
		});
		const file = {
			buffer: data,
			mimetype: "image/jpeg",
			size: info.size,
		};
		const uniqueId = common.uniqueId();
		const fileName = `${festivalId}-${uniqueId}`;
		const originalFileKey = `${fileName}-photo.jpeg`;
		const [photoUploadErr, photoUrl] = await aws.addFileToBucket(
			{ file, name: originalFileKey },
			aws.FESTIVAL_GALLERY_BUCKET
		);
		if (photoUploadErr) {
			return {
				message: err.image_upload_error,
			};
		}
		const photoHash = await blur(data);
		//Thumb Image
		const thumbImage = await modifiedImage
			.resize(global.THUMB_SIZE.w, global.THUMB_SIZE.h)
			.withMetadata()
			.png({
				compressionLevel: 6,
				quality: 45,
				adaptiveFiltering: true,
				force: true,
			})
			.toBuffer({ resolveWithObject: true });
		const thumbFile = {
			buffer: thumbImage.data,
			mimetype: "image/png",
			size: thumbImage.info.size,
		};
		const thumbFileKey = `${fileName}-thumb.png`;
		const [thumbUploadErr, thumbUrl] = await aws.addFileToBucket(
			{ file: thumbFile, name: thumbFileKey },
			aws.FESTIVAL_GALLERY_BUCKET
		);
		if (thumbUploadErr) {
			aws.deleteFileFromBucket(
				originalFileKey,
				aws.FESTIVAL_GALLERY_BUCKET
			);
			return {
				message: err.image_upload_error,
			};
		}
		const photoObject = {
			festivalId,
			sizeInKb: common.bytesToKb(info.size),
			width: info.width,
			height: info.height,
			format: info.format,
			hash: photoHash,
			url: photoUrl,
			thumbUrl,
			relativeOrder,
		};
		deleteObjects = [originalFileKey, thumbFileKey];
		const festivalPhoto = await Models.FestivalPhotos.create(photoObject);
		let _festivalAlbumId = parseInt(festivalAlbumId);
		if (validation.validId(_festivalAlbumId)) {
			addFestivalPhotoToFestivalAlbum({
				festivalAlbumId: _festivalAlbumId,
				festivalPhotoId: festivalPhoto.id,
			});
		}
		const result = festivalPhoto.dataValues;
		if (festivalAlbumId) {
			result.festivalAlbumId = _festivalAlbumId;
		}
		return {
			success: true,
			data: result,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		deleteObjects.forEach((key) => {
			aws.deleteFileFromBucket(key, aws.FESTIVAL_GALLERY_BUCKET);
		});
		return {
			message: err.server_error,
		};
	}
};

const deleteFestivalPhoto = async (params) => {
	const { festivalPhotoId } = params;
	const photoData = await Models.FestivalPhotos.findOne({
		where: {
			id: festivalPhotoId,
		},
	});
	if (!photoData) {
		return {
			success: true,
			data: {
				festivalPhotoId,
			},
		};
	}
	const photoKey = photoData.url.replace(aws.FESTIVAL_GALLERY_BUCKET + "/", "");
	const thumbKey = photoData.thumbUrl.replace(
		aws.FESTIVAL_GALLERY_BUCKET + "/",
		""
	);
	aws.deleteFileFromBucket(photoKey, aws.FESTIVAL_GALLERY_BUCKET);
	aws.deleteFileFromBucket(thumbKey, aws.FESTIVAL_GALLERY_BUCKET);	
	await Models.FestivalAlbumPhotos.destroy({
		where: {
			festivalPhotoId,
		},
	});
	Models.FestivalPhotos.destroy({
		where: {
			id: festivalPhotoId,
		},
	});
	return {
		success: true,
		data: {
			festivalPhotoId,
		},
	};
};

const deleteFestivalAlbumPhoto = async (params) => {
	const { festivalAlbumPhotoId } = params;
	const photoData = await Models.FestivalAlbumPhotos.findOne({
		where: {
			id: festivalAlbumPhotoId,
		},
	});
	if (!photoData) {
		return {
			success: true,
			data: {
				festivalAlbumPhotoId,
			},
		};
	}
	Models.FestivalAlbumPhotos.destroy({
		where: {
			id: festivalAlbumPhotoId,
		},
	});
	return {
		success: true,
		data: {
			festivalAlbumPhotoId,
		},
	};
};

const getFestivalPhotos = async ({ festivalId }) => {
	const festivalPhotos = await Models.FestivalPhotos.findAll({
		where: {
			festivalId,
		},
		order: [
			["relative_order", "asc"],
			["created_at", "desc"],
		],
	});
	return {
		success: true,
		data: festivalPhotos,
	};
};

const savePhotosRelativeOrder = async ({ festivalPhotoIds }) => {
	let transaction = await sequelize.transaction();
	try {
		for (
			let relativeOrder = 1;
			relativeOrder <= festivalPhotoIds.length;
			relativeOrder++
		) {
			const festivalPhotoId = festivalPhotoIds[relativeOrder - 1];
			await Models.FestivalPhotos.update(
				{ relativeOrder },
				{
					where: {
						id: festivalPhotoId,
					},
					transaction,
				}
			);
		}
		await transaction.commit();
		return {
			success: true,
			data: festivalPhotoIds,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const saveAlbumPhotosRelativeOrder = async ({ festivalAlbumPhotoIds }) => {
	let transaction = await sequelize.transaction();
	try {
		for (
			let relativeOrder = festivalAlbumPhotoIds.length, idx = 0;
			relativeOrder > 0;
			relativeOrder--, idx++
		) {
			const festivalAlbumPhotoId = festivalAlbumPhotoIds[idx];
			console.log(festivalAlbumPhotoId, relativeOrder);
			await Models.FestivalAlbumPhotos.update(
				{ relativeOrder },
				{
					where: {
						id: festivalAlbumPhotoId,
					},
					transaction,
				}
			);
		}
		await transaction.commit();
		return {
			success: true,
			data: festivalAlbumPhotoIds,
		};
	} catch (tryErr) {
		if (transaction) {
			transaction.rollback();
		}
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const createFestivalAlbum = async ({
	id,
	festivalPhotoId,
	festivalId,
	name,
}) => {
	if (!validation.validName(name)) {
		return {
			message: err.invalid_name,
		};
	}
	if (!validation.validId(festivalId)) {
		return {
			message: err.invalid_request,
		};
	}
	let createdAlbum = {};
	let transaction = await sequelize.transaction();
	try {
		if (id) {
			//Festival Album Id
			createdAlbum = {
				id,
				name,
				festivalId,
			};
			await Models.FestivalAlbums.update(
				{ name },
				{
					where: {
						id,
					},
				},
				{ transaction }
			);
		} else {
			const maxRelativeOrderData = await sequelize.query(
				`select max(relative_order) as max_order from festival_albums where festival_id = ${festivalId}`,
				{
					type: QueryTypes.SELECT,
				}
			);
			const relativeOrder =
				(maxRelativeOrderData?.[0]?.max_order || 0) + 1;
			createdAlbum = await Models.FestivalAlbums.create({
				name,
				festivalId,
				relativeOrder,
			});
		}

		if (validation.validId(festivalPhotoId)) {
			const photoData = await Models.FestivalPhotos.findOne({
				where: {
					id: festivalPhotoId,
				},
				attributes: ["thumbUrl"],
			});
			if (photoData) {
				throw new Error();
			}
			await Models.FestivalAlbumPhotos.create(
				{
					festivalPhotoId,
					festivalAlbumId: createdAlbum.id,
					relativeOrder: 1,
				},
				{ ignoreDuplicate: true, transaction }
			);

			createdAlbum.thumbUrl = photoData.thumbUrl;
		}

		await transaction.commit();
		return {
			success: true,
			data: createdAlbum,
		};
	} catch (tryErr) {
		if (transaction) {
			transaction.rollback();
		}
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getFestivalAlbums = async (params) => {
	try {
		const { festivalId, festivalPhotoId = null } = params;
		const selectedQuery = festivalPhotoId ? `, exists(select id from festival_album_photos
		where festival_photo_id = ${festivalPhotoId} and
		festival_album_id = festival_album.id limit 1) as is_added` : "";		
		const query = `select 
		  festival_album.*, 
		  (
		    select 
		      thumb_url 
		    from 
		      festival_photos 
		    where 
		      id = (
		        select 
		          festival_photo_id 
		        from 
		          festival_album_photos 
		        where 
		          festival_album_id = festival_album.id 
		        order by 
		          relative_order desc 
		        limit 
		          1
		      )
		  ) as thumb_url, 
		  (
		    select 
		      count(id) 
		    from 
		      festival_album_photos 
		    where 
		      festival_album_id = festival_album.id
		  ) as photo_count 
		  ${selectedQuery}
		from 
		  festival_albums as festival_album 
		where 
		  festival_id = ${festivalId}
		order by festival_album.relative_order desc
		`;
		const festivalAlbums = await sequelize.query(query, {
			type: QueryTypes.SELECT,
		});
		const albums = festivalAlbums.map((festivalAlbum) => ({
			id: festivalAlbum.id,
			name: festivalAlbum.name,
			relativeOrder: festivalAlbum.relativeOrder,
			festivalId: festivalAlbum.festival_id,
			thumbUrl: festivalAlbum.thumb_url || global.DEFAULT_ALBUM_THUMB,
			photoCount: festivalAlbum.photo_count,
			isAdded: festivalAlbum?.is_added
		}));
		return {
			success: true,
			data: albums,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getFestivalAlbumPhotos = async ({ festivalAlbumId }) => {
	const festivalAlbumPhotos = await Models.FestivalAlbumPhotos.findAll({
		where: {
			festivalAlbumId,
		},
		attributes: ["id", "festivalPhotoId", "relativeOrder"],
		include: {
			model: Models.FestivalPhotos,
			as: "festivalPhoto",
			attributes: { exclude: ["id", "relativeOrder"] },
		},
		order: [["relative_order", "desc"]],
	});
	const photos = festivalAlbumPhotos.map((festivalAlbumPhoto) => ({
		id: festivalAlbumPhoto.id,
		festivalPhotoId: festivalAlbumPhoto.festivalPhotoId,
		relativeOrder: festivalAlbumPhoto.relativeOrder,
		festivalAlbumId,
		...festivalAlbumPhoto.festivalPhoto.dataValues,
	}));
	return {
		success: true,
		data: photos,
	};
};

const addFestivalPhotoToFestivalAlbum = async ({
	festivalAlbumId,
	festivalPhotoId,
}) => {
	try {
		const festivalAlbumData = await Models.FestivalAlbums.findOne({
			where: {
				id: festivalAlbumId,
			},
			attributes: ["festivalId"],
		});
		if (!festivalAlbumData) {
			return {
				message: err.festival_not_found,
			};
		}
		const alreadyAdded = await Models.FestivalAlbumPhotos.count({
			where: {
				festivalPhotoId,
				festivalAlbumId,
			},
		});
		if (alreadyAdded) {
			return {
				message: "Photo already added to album",
			};
		}
		const maxRelativeOrderData = await sequelize.query(
			`select max(relative_order) as max_order from festival_album_photos where festival_album_id = ${festivalAlbumId}`,
			{
				type: QueryTypes.SELECT,
			}
		);
		const relativeOrder = (maxRelativeOrderData?.[0]?.max_order || 0) + 1;
		const addedPhoto = await Models.FestivalAlbumPhotos.create({
			festivalPhotoId,
			festivalAlbumId,
			relativeOrder,
		});
		return {
			success: true,
			data: addedPhoto,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const deleteFestivalAlbum = async (params) => {
	const { festivalAlbumId } = params;
	await Models.FestivalAlbumPhotos.destroy({
		where: {
			festivalAlbumId,
		},
	});
	Models.FestivalAlbums.destroy({
		where: {
			id: festivalAlbumId,
		},
	});
	return {
		success: true,
		data: {
			festivalAlbumId,
		},
	};
};

const uploadTempAvatar = async (params = {}, avatarFile) => {
	let transaction = null;
	const LOGO_MIN_REQUIRED_SIZE = 100;
	try {
		let { userId } = params;
		if (!validation.validId(parseInt(userId))) {
			return {
				message: err.invalid_request,
			};
		}
		if (!avatarFile) {
			return {
				message: "Avatar image is required",
			};
		}
		const imageSize = await sharp(avatarFile.buffer).metadata();
		if (
			imageSize.width < LOGO_MIN_REQUIRED_SIZE ||
			imageSize.height < LOGO_MIN_REQUIRED_SIZE
		) {
			return {
				message: "Avatar Size is too small",
			};
		}
		console.log("Called", "hre");
		const { data, info } = await sharpUtil.avatar(avatarFile.buffer);
		const file = {
			buffer: data,
			mimetype: "image/png",
			size: info.size,
		};
		const guid = common.guid2();
		const key = `${guid}.png`;
		const [errUpload, avatarUrl] = await aws.addFileToBucket(
			{ file, name: key },
			aws.TEMP_BUCKET
		);
		console.log("Called", errUpload, avatarUrl);
		const avatarHash = await blur(data);

		if (errUpload) {
			if (transaction) {
				transaction.rollback();
			}
			return {
				message: err.uanble_to_upload_avatar_image,
			};
		}
		if (transaction) {
			transaction.commit();
		}
		return {
			success: true,
			data: {
				avatarUrl,
				avatarHash,
			},
		};
	} catch (tryErr) {
		if (transaction) {
			transaction.rollback();
		}
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const uploadFilmPhoto = async (params, photoFile) => {
	let deleteObjects = [];
	try {
		let { filmId } = params;
		if (!validation.validId(parseInt(filmId))) {
			return {
				message: err.invalid_request,
			};
		}
		if (!photoFile) {
			return {
				message: "Photo file is required",
			};
		}
		const imageSize = await sharp(photoFile.buffer).metadata();
		if (!imageSize) {
			return {
				message: err.invalid_image,
			};
		}

		const maxRelativeOrderData = await sequelize.query(
			`select max(relative_order) as max_order from film_photos where film_id = ${filmId}`,
			{
				type: QueryTypes.SELECT,
			}
		);

		const dbMaxRelativeOrder = maxRelativeOrderData?.[0]?.max_order || 0;
		const relativeOrder = Math.min(
			Math.max((dbMaxRelativeOrder || 0) + 1, 1),
			global.FEATURED_PHOTO_COUNT + 1
		);

		//Original Image

		const resizedImage = common.calculateAspectRatioFit(
			imageSize.width,
			imageSize.height,
			global.MAX_IMAGE_WIDTH,
			global.MAX_IMAGE_HEIGHT
		);
		let modifiedImage = sharp(photoFile.buffer);
		modifiedImage = modifiedImage
			.resize(resizedImage.width, resizedImage.height)
			.withMetadata()
			.jpeg({
				compressionLevel: 6,
				quality: 90,
				adaptiveFiltering: true,
				force: true,
			});
		const { data, info } = await modifiedImage.toBuffer({
			resolveWithObject: true,
		});
		const file = {
			buffer: data,
			mimetype: "image/jpeg",
			size: info.size,
		};
		const uniqueId = common.uniqueId();
		const fileName = `${filmId}-${uniqueId}`;
		const originalFileKey = `${fileName}-photo.jpeg`;
		const [photoUploadErr, photoUrl] = await aws.addFileToBucket(
			{ file, name: originalFileKey },
			aws.FILM_GALLERY_BUCKET
		);
		if (photoUploadErr) {
			return {
				message: err.image_upload_error,
			};
		}
		const photoHash = await blur(data);
		//Thumb Image
		const thumbImage = await modifiedImage
			.resize(global.THUMB_SIZE.w, global.THUMB_SIZE.h)
			.withMetadata()
			.png({
				compressionLevel: 6,
				quality: 45,
				adaptiveFiltering: true,
				force: true,
			})
			.toBuffer({ resolveWithObject: true });
		const thumbFile = {
			buffer: thumbImage.data,
			mimetype: "image/png",
			size: thumbImage.info.size,
		};
		const thumbFileKey = `${fileName}-thumb.png`;
		const [thumbUploadErr, thumbUrl] = await aws.addFileToBucket(
			{ file: thumbFile, name: thumbFileKey },
			aws.FILM_GALLERY_BUCKET
		);
		if (thumbUploadErr) {
			aws.deleteFileFromBucket(originalFileKey, aws.FILM_GALLERY_BUCKET);
			return {
				message: err.image_upload_error,
			};
		}
		const photoObject = {
			filmId,
			sizeInKb: common.bytesToKb(info.size),
			width: info.width,
			height: info.height,
			format: info.format,
			hash: photoHash,
			url: photoUrl,
			thumbUrl,
			relativeOrder,
		};
		deleteObjects = [originalFileKey, thumbFileKey];
		const festivalPhoto = await Models.FilmPhotos.create(photoObject);
		const result = festivalPhoto.dataValues;
		return {
			success: true,
			data: result,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		deleteObjects.forEach((key) => {
			aws.deleteFileFromBucket(key, aws.FILM_GALLERY_BUCKET);
		});
		return {
			message: err.server_error,
		};
	}
};

const deleteFilmPhoto = async (params) => {
	const { filmPhotoId } = params;
	const photoData = await Models.FilmPhotos.findOne({
		where: {
			id: filmPhotoId,
		},
	});
	if (!photoData) {
		return {
			success: true,
			data: {
				filmPhotoId,
			},
		};
	}
	const photoKey = photoData.url.replace(aws.FILM_GALLERY_BUCKET + "/", "");
	const thumbKey = photoData.thumbUrl.replace(
		aws.FILM_GALLERY_BUCKET + "/",
		""
	);
	aws.deleteFileFromBucket(photoKey, aws.FILM_GALLERY_BUCKET);
	aws.deleteFileFromBucket(thumbKey, aws.FILM_GALLERY_BUCKET);
	Models.FilmPhotos.destroy({
		where: {
			id: filmPhotoId,
		},
	});
	return {
		success: true,
		data: {
			filmPhotoId,
		},
	};
};

const getFilmPhotos = async ({ filmId }) => {
	const festivalPhotos = await Models.FilmPhotos.findAll({
		where: {
			filmId,
		},
		order: [
			["relative_order", "asc"],
			["created_at", "desc"],
		],
	});
	return {
		success: true,
		data: festivalPhotos,
	};
};

module.exports = {
	uploadFestivalPhoto,
	deleteFestivalPhoto,
	getFestivalPhotos,
	savePhotosRelativeOrder,
	createFestivalAlbum,
	getFestivalAlbums,
	getFestivalAlbumPhotos,
	saveAlbumPhotosRelativeOrder,
	addFestivalPhotoToFestivalAlbum,
	deleteFestivalAlbumPhoto,
	deleteFestivalAlbum,
	uploadTempAvatar,

	uploadFilmPhoto,
	deleteFilmPhoto,
	getFilmPhotos,
};