/**
 * @Page: Account Services
 * @Description: Create user related functions here
 */

//Models
const Models = require("#models");

//Services
// const subscriptionService = require("./subscription");

//Handlers
const phoneHandler = require("#handler/phone/");
const TinodeHandler = require("#handler/tinode");
// const cartHandler = require("#handler/cart/");

//Constants
const constants = require("#utils/constants");
const common = require("#utils/common");
const err = require("#utils/errors");

//Helper Functions
const onehealthCapture = require("#utils/oneHealthCapture");
const validation = require("#utils/validation");

const blur = require("#utils/blurhash");
const aws = require("#utils/aws");

//Third Party Functions
const sharp = require("sharp");
const md5 = require("crypto-js/md5");
const aes = require("crypto-js/aes");
const { enc } = require("crypto-js");
const moment = require("moment");

const createAccount = async ({
	email = "",
	phoneNo = "",
	countryCode = "IN",
	password = "",
}) => {
	if (!validation.validateEmail(email)) {
		return {
			message: err.invalid_email,
		};
	}
	const userCount = await Models.Users.count({
		where: { email },
	});
	if (userCount > 0) {
		return {
			message: err.email_used,
		};
	}
	const phoneData = phoneHandler.getNumberForCountry(phoneNo, countryCode);
	if (!phoneData.success) {
		return phoneData;
	}
	if (!(password?.length > 5)) {
		return {
			message: err.password_length,
		};
	}
	const encryptedPassword = md5(password).toString();
	const currencyData = await Models.Currencies.findOne({
		where: {
			country: countryCode,
		},
		attributes: ["id"],
	});
	const user = await Models.Users.create({
		password: encryptedPassword,
		phoneNo: phoneData.data,
		email: email,
		countryCode,
		currencyId: currencyData.id,
	});
	const token = common.signToken(user.id);
	return {
		success: true,
		data: {
			token,
		},
	};
};

const loginAccount = async ({ email = "", password = "" }) => {
	if (!validation.validateEmail(email)) {
		return {
			message: err.invalid_email,
		};
	}
	if (!(password?.length > 5)) {
		return {
			message: err.password_length,
		};
	}
	const encryptedPassword = md5(password).toString();
	const user = await Models.Users.findOne({
		where: {
			password: encryptedPassword,
			email: email,
		},
	});
	if (user) {
		const token = common.signToken(user.id);
		return {
			success: true,
			data: {
				token,
			},
		};
	}
	return {
		message: err.email_pass_incorrect,
	};
};

const sendOTP = async ({ email = "" }) => {
	if (!validation.validateEmail(email)) {
		return {
			message: err.invalid_email,
		};
	}
	const user = await Models.Users.findOne({
		email: email,
		attributes: ["id"],
	});
	if (!user) {
		return {
			message: err.user_not_found,
		};
	}
	const otp = common.generateOTP(global.OTP_LENGTH);
	console.log(`TODO: OTP Send on MAIL: ${otp}`);
	const encryptedOTP = md5(otp).toString();
	return {
		success: true,
		data: {
			_z: encryptedOTP,
			_x: common.verifyToken(user.id, otp),
		},
	};
};

const resetPassword = async ({ userId, oldPassword, password }) => {
	const user = await Models.Users.findOne({
		attributes: ["password"],
		where: {
			id: userId,
		},
		raw: true,
	});
	if (!user) {
		return {
			message: err.user_not_found,
		};
	}
	const oldPasswordEncrypted = md5(oldPassword).toString();
	if (user.password != oldPasswordEncrypted) {
		return {
			message: "Old password is incorrect",
		};
	}
	const update = await updatePassword({ userId, password });
	return update;
};

const updatePassword = async ({ userId, password }) => {
	if (!(password?.length > 5)) {
		return {
			message: err.password_length,
		};
	}
	const newPasswordEnypt = md5(password).toString();
	await Models.Users.update(
		{
			password: newPasswordEnypt,
		},
		{
			where: {
				id: userId,
			},
		}
	);
	return {
		success: true,
		data: "Updated!",
	};
};

const getToken = ({ userId }) => {
	const token = common.signToken(userId);
	return {
		success: true,
		data: {
			token,
		},
	};
};

const getWorkTypes = async () => {
	const workTypes = await Models.WorkTypes.findAll({
		raw: true,
		order: [["id", "asc"]],
	});
	return {
		success: true,
		data: workTypes,
	};
};

const updateWorkType = async ({ userId, festivalId = null, workType }) => {
	try {
		await Models.Users.update(
			{
				workType,
			},
			{
				where: {
					id: userId,
				},
			}
		);
		const wk = parseInt(workType, 10);
		if (wk === constants.WORK_TYPES.SUBMIT_WORK) {
			// General User
			const userData = await Models.Users.findOne({
				where: {
					id: userId,
				},
				attributes: ["firstName", "lastName", "email"],
			});
			await TinodeHandler.createAccount({
				id: userId,
				type: TinodeHandler.GENERAL_USER,
				firstName: userData.firstName,
				lastName: userData.lastName || "",
				email: userData.email,
			});
		}
		let tinodeConfig = {};
		if (wk === constants.WORK_TYPES.MANAGE_FESTIVAL && festivalId) {
			tinodeConfig = await Models.TinodeConfig.findOne({
				where: {
					festivalId
				}
			});
		} else if(wk === constants.WORK_TYPES.SUBMIT_WORK && userId) {
			tinodeConfig = await Models.TinodeConfig.findOne({
				where: {
					userId
				}
			});			
		}
		return {
			success: true,
			data: {
				tinodeData: tinodeConfig?.config || null
			},
		};
	} catch (err) {
		onehealthCapture.catchError(err);
		return {
			message: "Unable to update work type",
		};
	}
};

const basicProfileData = async ({ profileId }) => {
	try {
		const decryptedProfileId = aes
			.decrypt(profileId, constants.XRT)
			.toString(enc.Utf8);
		const validProfileId = parseInt(decryptedProfileId);
		if (Number.isNaN(validProfileId)) {
			return {
				message: err.user_not_found,
			};
		}
		const userData = await Models.Users.findOne({
			attributes: [
				"firstName",
				"lastName",
				"middleName",
				"avatarUrl",
				"avatarHash",
			],
			where: {
				id: validProfileId,
			},
		});
		if (userData) {
			return {
				success: true,
				data: userData,
			};
		} else {
			return {
				message: err.user_not_found,
			};
		}
	} catch (err) {
		onehealthCapture.catchError(err);
		return {
			message: "Unable to update work type",
		};
	}
};

const initialSetupData = async ({ userId }) => {
	try {
		const userData = await Models.Users.findOne({
			attributes: ["firstName", "lastName", "middleName", "workType"],
			where: {
				id: userId,
			},
		});
		if (userData) {
			return {
				success: true,
				data: userData,
			};
		} else {
			return {
				message: err.user_not_found,
			};
		}
	} catch (err) {
		onehealthCapture.catchError(err);
		return {
			message: "Unable to update work type",
		};
	}
};

const updateSetupData = async ({ firstName, lastName, workType, userId }) => {
	try {
		if (!validation.validName(firstName)) {
			return {
				err: err.invalid_name,
			};
		}
		const wk = parseInt(workType, 10);
		if (!validation.validNumber(wk)) {
			return {
				err: err.invalid_work_type,
			};
		}
		const userData = await Models.Users.findOne({
			where: {
				id: userId,
			},
			attributes: ["email"],
		});
		if (!userData) {
			return {
				message: err.user_not_found,
			};
		}
		await Models.Users.update(
			{
				firstName,
				lastName: lastName || "",
				workType,
			},
			{
				where: {
					id: userId,
				},
			}
		);
		const response = {
			firstName,
			lastName,
			workType,
		};
		if (wk === constants.WORK_TYPES.SUBMIT_WORK) {
			// General User
			const tinodeData = await TinodeHandler.createAccount({
				id: userId,
				type: TinodeHandler.GENERAL_USER,
				firstName: firstName,
				lastName: lastName || "",
				email: userData.email,
			});
			response.tinode = tinodeData;
		}
		return {
			success: true,
			data: response,
		};
	} catch (err) {
		onehealthCapture.catchError(err);
		return {
			message: "Unable to update basic data",
		};
	}
};

const getUserData = async ({ userId }) => {
	try {		
		const userData = await Models.Users.findOne({
			attributes: [
				"firstName",
				"lastName",
				"middleName",
				"avatarUrl",
				"avatarHash",
				"coverHash",
				"coverUrl",
				"fbUrl",
				"instaUrl",
				"linkedinUrl",
				"twitterUrl",
				"workType"
			],
			include: [{
				model: Models.FestivalJudges,
				attributes: ["id", "accepted"],
				as: "festivalJudges",
				include: {
					model: Models.Festivals,
					as: "festival",
					attributes: ["id", "name", "logoUrl", "logoHash"]
				}
			}],
			where: {
				id: userId,
			},
		});
		if (userData) {
			return {
				success: true,
				data: userData,
			};
		} else {
			return {
				message: err.user_not_found,
			};
		}
	} catch (err) {
		onehealthCapture.catchError(err);
		return {
			message: err.server_error,
		};
	}
};

const updateUserData = async ({
	firstName,
	lastName,
	fbUrl,
	instaUrl,
	twitterUrl,
	linkedinUrl,
	userId,
}) => {
	try {
		if (!validation.validName(firstName)) {
			return {
				err: err.invalid_name,
			};
		}
		const validatedObject = {
			firstName,
			lastName: lastName || "",
		};
		if (fbUrl?.length > 0) {
			if (!validation.validFacebookUrl(fbUrl)) {
				return {
					message: err.invalid_facebook,
				};
			}
			validatedObject.fbUrl = fbUrl;
		}
		if (instaUrl?.length > 0) {
			if (!validation.validInstagramUrl(instaUrl)) {
				return {
					message: err.invalid_instagram,
				};
			}
			validatedObject.instaUrl = instaUrl;
		}
		if (twitterUrl?.length > 0) {
			if (!validation.validTwitterUrl(twitterUrl)) {
				return {
					message: err.invalid_twitter,
				};
			}
			validatedObject.twitterUrl = twitterUrl;
		}
		if (twitterUrl?.length > 0) {
			if (!validation.validTwitterUrl(twitterUrl)) {
				return {
					message: err.invalid_twitter,
				};
			}
			validatedObject.twitterUrl = twitterUrl;
		}
		if (linkedinUrl?.length > 0) {
			if (!validation.validLinkedinUrl(linkedinUrl)) {
				return {
					message: err.invalid_twitter,
				};
			}
			validatedObject.linkedinUrl = linkedinUrl;
		}
		await Models.Users.update(validatedObject, {
			where: {
				id: userId,
			},
		});
		const response = {
			userId,
			firstName,
			lastName,
			fbUrl,
			instaUrl,
			twitterUrl,
			linkedinUrl,
		};
		return {
			success: true,
			data: response,
		};
	} catch (err) {
		onehealthCapture.catchError(err);
		return {
			message: "Unable to update basic data",
		};
	}
};

const uploadUserAvatar = async (params = {}, avatarFile) => {
	let transaction = null;
	const LOGO_MIN_REQUIRED_SIZE = 100;
	try {
		let { userId } = params;
		if (!validation.validId(userId)) {
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
		const { data, info } = await sharp(avatarFile.buffer)
			.png({
				compressionLevel: 6,
				quality: 95,
				adaptiveFiltering: true,
				force: true,
			})
			.resize(global.LOGO_SIZE.w, global.LOGO_SIZE.h)
			.toBuffer({ resolveWithObject: true });
		const file = {
			buffer: data,
			mimetype: "image/png",
			size: info.size,
		};
		const [errUpload, logoPath] = await aws.addFileToBucket(
			{ file, name: `${userId}-avatar.png` },
			aws.PROFILE_IMAGES_BUCKET
		);
		const avatarHash = await blur(data);
		const currentStamp = moment().unix();
		const avatarUrl = `${logoPath}?t=${currentStamp}`;
		await Models.Users.update(
			{
				avatarUrl,
				avatarHash,
			},
			{
				transaction,
				where: {
					id: userId,
				},
			}
		);
		if (errUpload) {
			if (transaction) {
				transaction.rollback();
			}
			return {
				message: err.uanble_to_upload_cover_image,
			};
		}
		if (transaction) {
			transaction.commit();
		}
		return {
			success: true,
			data: {
				id: userId,
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

const uploadUserCover = async (params, coverFile) => {
	let transaction = null;
	const COVER_MIN_REQUIRED_WIDTH = 200;
	const COVER_MIN_REQUIRED_HEIGHT = 67; //Based on 1/3 Aspect Ratio
	try {
		let { userId } = params;
		if (!validation.validId(userId)) {
			return {
				message: err.invalid_request,
			};
		}
		if (!coverFile) {
			return {
				message: "Cover image is required",
			};
		}
		const imageSize = await sharp(coverFile.buffer).metadata();
		if (
			imageSize.width < COVER_MIN_REQUIRED_WIDTH ||
			imageSize.height < COVER_MIN_REQUIRED_HEIGHT
		) {
			return {
				message: "Logo Size is too small",
			};
		}
		let modifiedImage = sharp(coverFile.buffer);
		if (
			imageSize.width > global.COVER_SIZE.w ||
			imageSize.height > global.COVER_SIZE.h
		) {
			modifiedImage = modifiedImage.resize(
				global.COVER_SIZE.w,
				global.COVER_SIZE.h
			);
		}
		modifiedImage = modifiedImage.jpeg({
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
		const [errUpload, coverPath] = await aws.addFileToBucket(
			{ file, name: `${userId}-cover.jpeg` },
			aws.PROFILE_IMAGES_BUCKET
		);
		const coverHash = await blur(data);
		const currentStamp = moment().unix();
		const coverUrl = `${coverPath}?t=${currentStamp}`;
		console.log(coverUrl, coverHash);
		await Models.Users.update(
			{
				coverUrl,
				coverHash,
			},
			{
				transaction,
				where: {
					id: userId,
				},
			}
		);
		if (errUpload) {
			if (transaction) {
				transaction.rollback();
			}
			return {
				message: err.uanble_to_upload_cover_image,
			};
		}
		if (transaction) {
			transaction.commit();
		}
		return {
			success: true,
			data: {
				id: userId,
				coverHash,
				coverUrl,
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
module.exports = {
	basicProfileData,
	initialSetupData,
	uploadUserAvatar,
	uploadUserCover,
	updateSetupData,
	updateWorkType,
	updatePassword,
	createAccount,
	resetPassword,
	loginAccount,
	getUserData,
	updateUserData,
	getWorkTypes,
	getToken,
	sendOTP,
};