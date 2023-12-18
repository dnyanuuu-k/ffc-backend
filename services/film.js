/**
 * @Page: Film Services
 * @Description: Create film related functions here
 */

//Models
const Models = require("#models");

//Handlers
const phoneHandler = require("#handler/phone");
const CountryMap = require("#handler/map");

//Constants
const {
	MONTHLY_GOLD_MEMBERSHIP,
	YEARLY_GOLD_MEMBERSHIP,
} = require("#utils/products");
const sequelize = require("#utils/dbConnection");
const constants = require("#utils/constants");
const common = require("#utils/common");
const err = require("#utils/errors");
const aws = require("#utils/aws");

//Helper Functions
const onehealthCapture = require("#utils/oneHealthCapture");
const validation = require("#utils/validation");
const logger = require("#utils/logger");
const { Op, QueryTypes } = require("sequelize");
const blur = require("#utils/blurhash");
const apiVideo = require("#utils/apiVideo");

//Third Party Functions
const sharp = require("sharp");
const moment = require("moment");

const STAGE_1 = 0;
const STAGE_2 = 1;
const STAGE_3 = 2;
const STAGE_4 = 3;
const STAGE_5 = 4;

const getFilmDraftTitle = () => {
	const name = moment().format(global.MMMMDDYYYY);
	return `Draft Film ${name}`;
};

/*
	Create Film Details takes
	
	Film Title
	Film Short Summary
	Film Storyline

	Film isDifferentLanguage | Whether film title is in different language
		 -> nativeTitle
		 -> nativeShortSummary
		 -> nativeStoryline

	Film facebook
	Film instagram
	Film twitter
	Film linkedin
*/
const updateFilmDetails = async (filmDetails) => {
	try {
		if (!validation.validId(filmDetails?.userId)) {
			return {
				message: err.user_not_found,
			};
		}
		if (!validation.validName(filmDetails?.title)) {
			return {
				message: err.invalid_film_name,
			};
		}

		let facebook = "";
		let instagram = "";
		let twitter = "";
		let linkedin = "";

		let nativeTitle = "";
		let nativeShortSummary = "";
		let nativeStoryline = "";

		let shortSummary = "";
		let storyline = "";

		let hasNonEnglishTitle = filmDetails?.hasNonEnglishTitle || false;

		if (filmDetails?.shortSummary?.length > 0) {
			if (!validation.validName(filmDetails?.shortSummary)) {
				return {
					message: err.invalid_film_desc,
				};
			}
			shortSummary = filmDetails?.shortSummary;
		}

		if (filmDetails?.storyline?.length > 0) {
			if (!validation.validName(filmDetails?.storyline)) {
				return {
					message: err.invalid_film_desc,
				};
			}
			storyline = filmDetails?.storyline;
		}

		if (validation.validName(filmDetails?.nativeTitle)) {
			nativeTitle = filmDetails?.nativeTitle;
		}

		if (validation.validName(filmDetails?.nativeShortSummary)) {
			nativeShortSummary = filmDetails?.nativeShortSummary;
		}

		if (validation.validName(filmDetails?.nativeStoryline)) {
			nativeStoryline = filmDetails?.nativeStoryline;
		}

		if (filmDetails?.facebook?.length > 0) {
			if (!validation.validFacebookUrl(filmDetails.facebook)) {
				return {
					message: err.invalid_facebook,
				};
			}
			facebook = filmDetails.facebook;
		}
		if (filmDetails?.instagram?.length > 0) {
			if (!validation.validInstagramUrl(filmDetails.instagram)) {
				return {
					message: err.invalid_instagram,
				};
			}
			instagram = filmDetails.instagram;
		}
		if (filmDetails?.twitter?.length > 0) {
			if (!validation.validTwitterUrl(filmDetails.twitter)) {
				return {
					message: err.invalid_twitter,
				};
			}
			twitter = filmDetails.twitter;
		}

		if (filmDetails?.linkedin?.length > 0) {
			if (!validation.validLinkedinUrl(filmDetails.linkedin)) {
				return {
					message: err.invalid_twitter,
				};
			}
			linkedin = filmDetails.linkedin;
		}

		const finalObject = {
			title: filmDetails.title,
			nativeShortSummary,
			nativeStoryline,
			nativeTitle,
			shortSummary,
			storyline,
			facebook,
			instagram,
			twitter,
			linkedin,
			hasNonEnglishTitle,
		};
		if (filmDetails?.id) {
			const updatingFilm = await Models.Films.update(finalObject, {
				where: {
					id: filmDetails.id,
				},
			});
			if (!updatingFilm) {
				return {
					message: err.unable_to_update_film,
				};
			}
			finalObject.userId = filmDetails.userId;
			finalObject.id = filmDetails?.id;
		} else {
			finalObject.userId = filmDetails.userId;
			const currentFilm = await Models.Films.create(finalObject);
			if (!currentFilm) {
				return {
					message: err.unable_to_create_film,
				};
			}
			finalObject.id = currentFilm.id;
		}
		return {
			success: true,
			data: finalObject,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const updateSubmitterDeatils = async (filmDetails) => {
	if (!validation.validId(filmDetails?.userId)) {
		return {
			message: err.user_not_found,
		};
	}

	const validatedObject = {
		submitterEmail: "",
		submitterPhone: "",
		submitterState: "",
		submitterCity: "",
		submitterAddress: "",
		submitterPostalCode: "",
		submitterDob: null,
		submitterGender: "",
	};

	try {
		if (!validation.validateEmail(filmDetails?.submitterEmail)) {
			return {
				message: err.invalid_email,
			};
		} else {
			validatedObject.submitterEmail = filmDetails.submitterEmail;
		}

		if (validation.validPhoneNumber(filmDetails?.submitterPhone)) {
			validatedObject.submitterPhone = filmDetails.submitterPhone;
		}

		if (
			filmDetails?.submitterCountry?.length > 0 &&
			!phoneHandler.isValidCountry(filmDetails?.submitterCountry)
		) {
			return {
				message: err.invalid_country,
			};
		} else {
			validatedObject.submitterCountry = filmDetails.submitterCountry;
		}

		if (filmDetails?.phone?.length > 0) {
			if (!validation.validPhoneNumber(filmDetails.phone)) {
				return {
					message: err.invalid_phone_number,
				};
			}
			validatedObject.phone = filmDetails.phone;
		}
		if (filmDetails?.submitterAddress?.length > 0) {
			if (!validation.validName(filmDetails.submitterAddress, 4)) {
				return {
					message: err.address_short,
				};
			}
			validatedObject.submitterAddress = filmDetails.submitterAddress;
		}

		if (filmDetails?.submitterCity?.length > 0) {
			if (!validation.validName(filmDetails.submitterCity)) {
				return {
					message: err.city_short,
				};
			}
			validatedObject.submitterCity = filmDetails.submitterCity;
		}

		if (filmDetails?.submitterState?.length > 0) {
			if (!validation.validName(filmDetails.submitterState)) {
				return {
					message: err.state_short,
				};
			}
			validatedObject.submitterState = filmDetails.submitterState;
		}

		if (filmDetails?.submitterPostalCode?.length > 0) {
			if (!validation.validName(filmDetails.submitterPostalCode)) {
				return {
					message: err.postal_code_short,
				};
			}
			validatedObject.submitterPostalCode =
				filmDetails.submitterPostalCode;
		}

		if (filmDetails?.submitterDob?.length > 0) {
			const dob = moment(filmDetails?.submitterDob, global.MMMMDDYYYY);
			if (dob.isValid()) {
				validatedObject.submitterDob = dob;
			}
		}

		if (
			filmDetails?.submitterGender?.length > 0 &&
			validation.validGender(filmDetails?.submitterGender)
		) {
			validatedObject.submitterGender = filmDetails?.submitterGender;
		}

		if (filmDetails?.id) {
			const updatingFilm = await Models.Films.update(validatedObject, {
				where: {
					id: filmDetails.id,
				},
			});
			validatedObject.id = filmDetails?.id;
			if (!updatingFilm) {
				return {
					message: err.unable_to_update_film,
				};
			}
		} else {
			validatedObject.title = getFilmDraftTitle();
			validatedObject.userId = filmDetails.userId;
			const currentFilm = await Models.Films.create(validatedObject);
			if (!currentFilm) {
				return {
					message: err.unable_to_create_film,
				};
			}
			validatedObject.id = currentFilm.id;
		}

		return {
			success: true,
			data: validatedObject,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

/*
	Film Credits
	------------------
	film_credit_section {
		id
		film_id
		title		
		film_credit_section_credit: {
			film_credit_section_id,
			first_name,
			last_name,
			middle_name,
		 	avatar_url,
		 	avatar_hash,
			user_id,
		}
	}
	------------------
	If we get avatar_url as temp in starting
	then we will add it to valid s3 bucket 
	and then delete temp and in caste their
	is already a url then we will delete 
	that also
*/
const updateFilmCredits = async (filmDetails) => {
	let transaction = null;
	try {
		const { id, userId, filmCreditSections } = filmDetails || {};
		if (
			!validation.validArray(filmCreditSections) ||
			filmCreditSections.length === 0
		) {
			return {
				message: err.one_film_credits,
			};
		}

		const validFilmCreditSection = [];
		const currentFilm = {};

		// Film Id
		transaction = await sequelize.transaction();
		if (!validation.validId(id)) {
			const title = getFilmDraftTitle();
			const createdFilm = await Models.Films.create(
				{ title, userId },
				{
					transaction,
				}
			);
			if (!createdFilm) {
				transaction.rollback();
				return {
					message: err.unable_to_create_film,
				};
			}
			currentFilm.id = createdFilm.id;
		} else {
			currentFilm.id = id;
		}

		const allCreditSectionIds = new Set();
		const creditsIds = new Set();

		const sections = await Models.FilmCreditSections.findAll({
			where: {
				filmId: currentFilm.id,
			},
			attributes: ["id"],
			include: {
				model: Models.FilmCreditSectionCredits,
				as: "filmCreditSectionCredits",
				attributes: ["id"],
			},
		});
		for (const section of sections || []) {
			allCreditSectionIds.add(section.id);
			const credits = section.filmCreditSectionCredits || [];
			for (const credit of credits) {
				creditsIds.add(credit.id);
			}
		}

		// invalid_film_credits
		let creditSectionRelativeOrder = 1;
		for (const filmCreditSection of filmCreditSections) {
			if (!validation.validName(filmCreditSection.name)) {
				transaction.rollback();
				return {
					message: err.invalid_credit_section_name,
				};
			}

			if (
				(filmCreditSection.filmCreditSectionCredits || []).length === 0
			) {
				transaction.rollback();
				return {
					message: `In ${filmCreditSection.name} at least one person is required`,
				};
			}

			const creditSection = {
				filmId: currentFilm.id,
				name: filmCreditSection.name,
				relativeOrder: creditSectionRelativeOrder,
			};
			const somethingWrong = `Something went worng at ${creditSection.name}`;
			if (filmCreditSection.id) {
				creditSection.id = filmCreditSection.id;
				await Models.FilmCreditSections.update(
					{
						name: creditSection.name,
						relativeOrder: creditSectionRelativeOrder,
					},
					{
						transaction,
						where: {
							id: filmCreditSection.id,
						},
					}
				);
			} else {
				const createdSection = await Models.FilmCreditSections.create(
					creditSection,
					{
						transaction,
					}
				);
				if (!createdSection) {
					transaction.rollback();
					return {
						message: somethingWrong,
					};
				}
				creditSection.id = createdSection.id;
			}

			allCreditSectionIds.delete(creditSection.id);

			creditSection.filmCreditSectionCredits = [];

			let creditSectionCreditRelativeOrder = 1;

			for (const filmCreditSectionCredit of filmCreditSection.filmCreditSectionCredits) {
				const creditSectionCredit = {
					relativeOrder: creditSectionCreditRelativeOrder,
				};
				const validUserId = parseInt(filmCreditSectionCredit.userId);
				if (validation.validId(validUserId)) {
					const userPresent = await Models.Users.count({
						where: {
							id: validUserId,
						},
					});
					if (userPresent === 0) {
						transaction.rollback();
						return {
							message: somethingWrong,
						};
					}
					creditSectionCredit.userId = filmCreditSectionCredit.userId;
				} else {
					let firstName = filmCreditSectionCredit.firstName;
					let lastName = filmCreditSectionCredit.lastName || "";
					let middleName = filmCreditSectionCredit.middleName || "";
					if (!validation.validName(firstName)) {
						transaction.rollback();
						return {
							message: `First name invalid at ${creditSection.name}`,
						};
					} else {
						creditSectionCredit.firstName = firstName;
					}
					creditSectionCredit.lastName = lastName;
					creditSectionCredit.middleName = middleName;
				}

				if (typeof filmCreditSectionCredit.avatarUrl === "string") {
					//Check Whether it starts with temp
					if (
						filmCreditSectionCredit.avatarUrl.startsWith(
							aws.TEMP_BUCKET
						)
					) {
						const [errUpload, avatarNewUrl] =
							await aws.moveToBucket(
								filmCreditSectionCredit.avatarUrl, // Bucket / Key
								aws.PROFILE_IMAGES_BUCKET // Target Bucket
							);
						if (errUpload) {
							// Ignore Image not present

							// transaction.rollback();
							// return {
							// 	message: `Unable to upload avatar of ${filmCreditSectionCredit.firstName} at ${creditSection.title}`,
							// };
							creditSectionCredit.avatarUrl = "";
						} else {
							creditSectionCredit.avatarUrl = avatarNewUrl;
						}
					} else {
						creditSectionCredit.avatarUrl =
							filmCreditSectionCredit.avatarUrl;
					}

					creditSectionCredit.avatarHash =
						filmCreditSectionCredit.avatarHash;
				} else {
					creditSectionCredit.avatarUrl = "";
					creditSectionCredit.avatarHash = "";
				}

				if (filmCreditSectionCredit.id) {
					await Models.FilmCreditSectionCredits.update(
						creditSectionCredit,
						{
							where: {
								id: filmCreditSectionCredit.id,
							},
							transaction,
						}
					);

					creditSectionCredit.id = filmCreditSectionCredit.id;
					creditSectionCredit.filmCreditSectionId = creditSection.id;
				} else {
					creditSectionCredit.filmCreditSectionId = creditSection.id;
					const createdCredit =
						await Models.FilmCreditSectionCredits.create(
							creditSectionCredit,
							{
								transaction,
							}
						);
					if (!createdCredit) {
						transaction.rollback();
						return {
							message: somethingWrong,
						};
					}
					creditSectionCredit.id = createdCredit.id;
				}

				creditsIds.delete(creditSectionCredit.id);

				creditSection.filmCreditSectionCredits.push(
					creditSectionCredit
				);
			}

			validFilmCreditSection.push(creditSection);
		}
		if (allCreditSectionIds.size) {
			await Models.FilmCreditSections.destroy({
				where: {
					id: Array.from(allCreditSectionIds),
				},
				transaction,
			});
		} else if (creditsIds.size) {
			await Models.FilmCreditSections.destroy({
				where: {
					id: Array.from(creditsIds),
				},
				transaction,
			});
		}
		await transaction.commit();

		return {
			success: true,
			data: {
				id: currentFilm.id,
				filmCreditSections: validFilmCreditSection,
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

/*

	type
	genres
	runtime_seconds
	Completion Date
	production_budget
	production_budget_currency
	country_of_orgin
	film_language
	shooting_format
	aspect_ratio_w
	aspect_ratio_h
	film_color_id
	first_time

*/
const updateFilmSpecifications = async (filmDetails) => {
	let transaction = null;
	try {
		const { filmGenres, filmTypes, filmLanguages } = filmDetails || {};

		const firstTime = filmDetails?.firstTime || false;
		const filmColorId = filmDetails?.filmColorId || null;
		const aspectRatio = filmDetails?.aspectRatio || null;
		const shootingFormat = filmDetails?.shootingFormat || null;
		const countryOfOrgin = filmDetails?.countryOfOrgin || null;
		const productionBudget = filmDetails?.productionBudget || null;
		const productionBudgetCurrencyId =
			filmDetails?.productionBudgetCurrencyId || null;
		const runtimeSeconds = filmDetails?.runtimeSeconds || null;
		let completionDate = null;
		const _date = moment(filmDetails?.completionDate, global.YYYYMMDD);
		if (_date.isValid()) {
			completionDate = _date;
		}
		const filmObject = {
			firstTime,
			filmColorId,
			aspectRatio,
			shootingFormat,
			countryOfOrgin,
			productionBudget,
			productionBudgetCurrencyId,
			runtimeSeconds,
			completionDate,
		};
		transaction = await sequelize.transaction();
		if (filmDetails?.id) {
			await Models.Films.update(filmObject, {
				transaction,
				where: {
					id: filmDetails.id,
				},
			});
			filmObject.id = filmDetails.id;
		} else {
			filmObject.title = getFilmDraftTitle();
			filmObject.userId = filmDetails.userId;
			const createdFilm = await Models.Films.create(filmObject, {
				transaction,
			});
			filmObject.id = createdFilm.id;
		}

		if (filmTypes?.length > 0) {
			const updatableTypes = filmTypes.map((typeId) => ({
				filmId: filmObject.id,
				filmTypeId: typeId,
				isActive: true,
			}));
			if (filmObject.id) {
				await Models.FilmTypes.destroy(
					{
						where: {
							filmId: filmObject.id,
							filmTypeId: {
								[Op.notIn]: filmTypes,
							},
						},
					},
					{ transaction }
				);
			}
			await Models.FilmTypes.bulkCreate(updatableTypes, {
				transaction,
				ignoreDuplicates: true,
			});
		}

		if (filmGenres?.length > 0) {
			const updatableGenres = filmGenres.map((typeId) => ({
				filmId: filmObject.id,
				filmGenreId: typeId,
				isActive: true,
			}));
			if (filmObject.id) {
				await Models.FilmGenres.destroy(
					{
						where: {
							filmId: filmObject.id,
							filmGenreId: {
								[Op.notIn]: filmGenres,
							},
						},
					},
					{ transaction }
				);
			}
			await Models.FilmGenres.bulkCreate(updatableGenres, {
				transaction,
				ignoreDuplicates: true,
			});
		}

		if (filmLanguages?.length > 0) {
			const updatableLanguages = filmLanguages.map((languageId) => ({
				filmId: filmObject.id,
				languageId: languageId,
			}));
			if (filmObject.id) {
				await Models.FilmLanguages.destroy(
					{
						where: {
							filmId: filmObject.id,
							languageId: {
								[Op.notIn]: filmLanguages,
							},
						},
					},
					{ transaction }
				);
			}
			await Models.FilmLanguages.bulkCreate(updatableLanguages, {
				transaction,
				ignoreDuplicates: true,
			});
		}

		await transaction.commit();
		return {
			success: true,
			data: {
				id: filmDetails.id,
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

/*
	id
	film_screenings {
		festival_name
		city
		country
		screening_date
		premiere
		award / selection
	}
*/
const updateFilmScreenings = async (filmDetails) => {
	let transaction = null;
	try {
		const { filmScreenings, userId } = filmDetails || {};
		if (!validation.validArray(filmScreenings) || !filmScreenings?.length) {
			return {
				message: "Film Screening data is required",
			};
		}
		let filmId = 0;
		transaction = await sequelize.transaction();
		if (!validation.validId(filmDetails?.id)) {
			const title = getFilmDraftTitle();
			const currentFilm = await Models.Films.create({
				title,
				userId,
			});
			if (!currentFilm) {
				return {
					message: err.unable_to_create_film,
				};
			}
			filmId = currentFilm.id;
		} else {
			filmId = filmDetails.id;
		}

		const allScreeningIds = new Set();
		if (filmId) {
			const allScreenings = await Models.FilmScreenings.findAll({
				where: {
					filmId,
				},
			});
			allScreenings.forEach((screen) => {
				allScreeningIds.add(screen.id);
			});
		}

		const finalFilmScreenings = [];
		let relativeOrder = 1;
		for (const filmScreening of filmScreenings) {
			const validatedObject = {
				filmId,
				relativeOrder,
			};
			if (!validation.validName(filmScreening.festivalName)) {
				transaction.rollback();
				return {
					message: "Invalid festival name in Screenings",
				};
			} else {
				validatedObject.festivalName = filmScreening.festivalName;
			}

			if (validation.validName(filmScreening.city)) {
				validatedObject.city = filmScreening.city;
			}
			if (phoneHandler.isValidCountry(filmScreening?.country)) {
				validatedObject.country = filmScreening.country;
			} else {
				transaction.rollback();
				return {
					message: `Invalid country for festival ${filmScreening.festivalName}`,
				};
			}

			if (validation.validName(filmScreening.premiere)) {
				validatedObject.premiere = filmScreening.premiere;
			}

			if (validation.validName(filmScreening.awardSelection)) {
				validatedObject.awardSelection = filmScreening.awardSelection;
			}
			/*else {
				transaction.rollback();
				return {
					message: `Please enter selection information for ${filmScreening.festivalName}`,
				};
			}*/
			if (filmScreening.id) {
				allScreeningIds.delete(filmScreening.id);
				await Models.FilmScreenings.update(validatedObject, {
					where: {
						id: filmScreening.id,
					},
					transaction,
				});
				validatedObject.id = filmScreening.id;
			} else {
				const createdFilmScreening = await Models.FilmScreenings.create(
					validatedObject,
					{
						transaction,
					}
				);
				if (!createdFilmScreening) {
					transaction.rollback();
					return {
						message: "Unable to update film Screening data",
					};
				}
				validatedObject.id = createdFilmScreening.id;
			}

			finalFilmScreenings.push(validatedObject);

			relativeOrder += 1;
		}

		if (allScreeningIds.size) {
			await Models.FilmScreenings.destroy({
				where: {
					id: Array.from(allScreeningIds),
				},
				transaction,
			});
		}

		await transaction.commit();
		return {
			success: true,
			data: {
				id: filmId,
				filmScreenings: finalFilmScreenings,
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

const getFilmData = async ({ filmId }) => {
	let filmData = await Models.Films.findOne({
		where: {
			id: filmId,
		},
		include: {
			as: "filmCreditSections",
			model: Models.FilmCreditSections,
			include: {
				model: Models.FilmCreditSectionCredits,
				as: "filmCreditSectionCredits",
			},
		},
	});
	if (!filmData) {
		return {
			message: err.film_not_found,
		};
	}
	return {
		success: true,
		data: filmData,
	};
};

const getFilms = async ({ filmMakerId, userId, isPublished, isActive }) => {
	try {
		const finalUserId = filmMakerId || userId;
		if (!finalUserId) {
			return {
				message: err.user_not_found,
			};
		}
		let additional = {};
		if (validation.validBoolean(isPublished)) {
			additional.isPublished = isPublished;
		}
		if (validation.validBoolean(isActive)) {
			additional.isActive = isActive;
		}
		const films = await Models.Films.findAll({
			where: {
				userId: finalUserId,
				...additional,
			},
		});
		return {
			data: films,
			success: true,
		};
	} catch (err) {
		return {
			message: err.server_error,
		};
	}
};

const getFilmsForSubmission = async ({ userId }) => {
	try {
		const films = [];
		const filmRecords = await Models.Films.findAll({
			where: {
				userId: userId,
			},
			attributes: [
				"id",
				"title",
				"posterUrl",
				"posterHash",
				"shortSummary",
			],
			include: {
				as: "filmVideo",
				model: Models.FilmVideos,
				attributes: ["id"],
				required: false,
				where: {
					status: "ready",
				},
			},
		});
		const finalRecords = filmRecords || [];
		for (const filmRecord of finalRecords) {
			const record = filmRecord.toJSON();
			const issues = [];
			if (!record?.title?.length) {
				issues.push("Film title is required!");
			}
			if (!record?.shortSummary?.length) {
				issues.push("Short summary is required");
			}
			if (record?.filmVideo?.id) {
				record.filmVideoId = filmRecord?.filmVideo.id;
			} else {
				issues.push("Your project don't have any video file or url");
			}
			record.issues = issues;
			films.push(record);
		}
		const response = await sequelize.query(
			`select id from cart where user_id = $1 and product_id in (
				${MONTHLY_GOLD_MEMBERSHIP.id}, ${YEARLY_GOLD_MEMBERSHIP.id}
			)`,
			{
				bind: [userId],
				type: QueryTypes.SELECT,
			}
		);
		const goldSubscriptionInCart = response?.length ? true : false;
		return {
			data: {
				films,
				goldSubscriptionInCart,
			},
			success: true,
		};
	} catch (tryErr) {
		console.log(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const generateFilmStages = async (params) => {
	try {
		const tabs = [
			{
				id: 1,
				title: "Project Information",
				completed: false,
				issues: [],
			},
			{
				id: 2,
				title: "Submitter Information",
				completed: false,
				issues: [],
			},
			{
				id: 3,
				title: "Credits",
				completed: false,
				issues: [],
			},
			{
				id: 4,
				title: "Specifications",
				completed: false,
				issues: [],
			},
			{
				id: 5,
				title: "Screenings",
				completed: false,
				issues: [],
				stared: true,
			},
		];
		const { filmId } = params;
		if (!filmId) {
			return {
				success: true,
				data: {
					tabs,
				},
			};
		}
		const query = `select 
		  title, 
		  short_summary, 
		  submitter_email, 
		  exists(select id from film_credit_sections where film_id = $1 limit 1) has_credit_section,
		  
		  exists(select id from film_types where film_id = $1 limit 1) has_type,
		  exists(select id from film_genres where film_id = $1 limit 1) has_genre,
		  exists(select id from film_languages where film_id = $1 limit 1) has_lang,
		  runtime_seconds,
		  
		  exists(select id from film_screenings where film_id = $1 limit 1) has_screening
		  
		from films where id = $1`;
		const response = await sequelize.query(query, {
			bind: [filmId],
			type: QueryTypes.SELECT,
		});
		if (response?.length === 0) {
			return {
				success: true,
				data: {
					tabs,
				},
			};
		}
		const filmData = response[0];
		// Stage 1 Check | Film Details
		let stage1Error = false;
		if (!filmData.title) {
			tabs[STAGE_1].issues.push("Film title is required");
			stage1Error = true;
		}
		if (!filmData.short_summary) {
			tabs[STAGE_1].issues.push("Short summary is required");
			stage1Error = true;
		}
		if (stage1Error === false) {
			tabs[STAGE_1].completed = true;
		}

		// Stage 2 Check | Submitter Details
		let stage2Error = false;
		if (!filmData.submitter_email) {
			tabs[STAGE_2].issues.push("Submitter Email is not updated");
			stage2Error = true;
		}
		if (stage2Error === false) {
			tabs[STAGE_2].completed = true;
		}

		// Stage 3 Check | Credits Details
		let stage3Error = true;
		if (filmData.has_credit_section) {
			stage3Error = false;
		}
		if (stage3Error === false) {
			tabs[STAGE_3].completed = true;
		}

		// Stage 4 Check | Credits Details
		let stage4Error = false;
		if (!filmData.has_type) {
			tabs[STAGE_4].issues.push("Film type not selected");
			stage4Error = true;
		}

		if (!filmData.has_genre) {
			tabs[STAGE_4].issues.push("Genre not selected");
			stage4Error = true;
		}

		if (!filmData.has_lang) {
			tabs[STAGE_4].issues.push("Film language not added");
			stage4Error = true;
		}

		if (!filmData.runtime_seconds) {
			tabs[STAGE_4].issues.push("Runtime not added");
			stage4Error = true;
		}
		if (stage4Error === false) {
			tabs[STAGE_4].completed = true;
		}

		// Stage 5 Check | Screening
		let stage5Error = true;
		if (filmData.has_screening) {
			stage5Error = false;
		}
		if (stage5Error === false) {
			tabs[STAGE_5].completed = true;
		}

		return {
			success: true,
			data: {
				tabs,
				filmId,
			},
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getStageWiseData = async ({ filmId, stageId }) => {
	try {
		if (!validation.validId(filmId)) {
			return {
				success: true,
				data: {},
			};
		}
		if (typeof stageId !== "number") {
			return {
				message: err.bad_request,
			};
		}
		let finalData = {};
		if (stageId === STAGE_1) {
			const filmData = await Models.Films.findOne({
				where: {
					id: filmId,
				},
				attributes: [
					"id",
					"title",
					"shortSummary",
					"storyline",
					"nativeTitle",
					"nativeShortSummary",
					"nativeStoryline",
					"hasNonEnglishTitle",
					"facebook",
					"instagram",
					"twitter",
					"linkedin",
				],
			});
			finalData = filmData.toJSON();
		} else if (STAGE_2 === stageId) {
			const filmData = await Models.Films.findOne({
				where: {
					id: filmId,
				},
				attributes: [
					"id",
					"submitterEmail",
					"submitterPhone",
					"submitterAddress",
					"submitterState",
					"submitterCity",
					"submitterState",
					"submitterPostalCode",
					"submitterCountry",
					"submitterDob",
					"submitterGender",
				],
				include: {
					as: "user",
					model: Models.Users,
				},
			});
			finalData = filmData.toJSON();
			const user = finalData.user;
			if (!finalData?.submitterEmail) {
				finalData.submitterEmail = user.email;
			}
			if (!finalData?.submitterPhone) {
				finalData.submitterPhone = user.phoneNo;
			}
			if (!finalData?.submitterCountry) {
				finalData.submitterCountry = user.countryCode;
			}
			delete finalData.user;
		} else if (STAGE_3 === stageId) {
			const filmData = await Models.FilmCreditSections.findAll({
				where: {
					filmId,
				},
				include: {
					model: Models.FilmCreditSectionCredits,
					as: "filmCreditSectionCredits",
				},
			});
			const sections = filmData.map((section) => section.toJSON());
			finalData = {
				id: filmId,
				filmCreditSections: sections,
			};
		} else if (STAGE_4 === stageId) {
			const filmData = await Models.Films.findOne({
				where: {
					id: filmId,
				},
				attributes: [
					"id",
					"runtimeSeconds",
					"filmColorId",
					"firstTime",
					"aspectRatio",
					"countryOfOrgin",
					"shootingFormat",
					"productionBudget",
					"productionBudgetCurrencyId",
					"completionDate",
				],
				include: [
					{
						model: Models.FilmGenres,
						as: "filmGenres",
						attributes: ["filmGenreId"],
						where: {
							isActive: true,
						},
						required: false,
					},
					{
						model: Models.FilmTypes,
						as: "filmTypes",
						attributes: ["filmTypeId"],
						where: {
							isActive: true,
						},
						required: false,
					},
					{
						model: Models.FilmLanguages,
						as: "filmLanguages",
						attributes: ["languageId"],
						required: false,
					},
				],
			});
			finalData = filmData.toJSON();
			const filmGenres = (finalData.filmGenres || []).map(
				(g) => g.filmGenreId
			);
			const filmTypes = (finalData.filmTypes || []).map(
				(t) => t.filmTypeId
			);
			const filmLanguages = (finalData.filmLanguages || []).map(
				(t) => t.languageId
			);
			finalData.filmGenres = filmGenres;
			finalData.filmTypes = filmTypes;
			finalData.filmLanguages = filmLanguages;
		} else if (STAGE_5 === stageId) {
			const filmData = await Models.Films.findOne({
				where: {
					id: filmId,
				},
				attributes: ["id"],
				include: [
					{
						model: Models.FilmScreenings,
						as: "filmScreenings",
						required: false,
					},
				],
			});
			finalData = filmData.toJSON();
		}
		if (finalData) {
			return {
				success: true,
				data: finalData,
			};
		}
		return {
			success: false,
			message: err.server_error,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getFormTypes = async () => {
	const query = `select id, name, 'color' type from film_colors where is_active = true
	union all
	select id, name, 'type' type  from film_type_list where is_active = true
	union all
	select id, title name, 'genre' type from film_genre_list where is_active = true`;
	const filmTypeList = [];
	const filmColors = [];
	const filmGenreList = [];
	const languages = [];
	const results = await sequelize.query(query, {
		type: QueryTypes.SELECT,
	});
	for (const result of results) {
		const object = {
			value: result.id,
			label: result.name,
		};
		switch (result.type) {
			case "color":
				filmColors.push(object);
				break;
			case "type":
				filmTypeList.push(object);
				break;
			case "genre":
				filmGenreList.push(object);
				break;
		}
	}
	return {
		success: true,
		data: {
			filmGenreList,
			filmTypeList,
			filmColors,
			languages,
		},
	};
};

const getHome = async (params) => {
	const { userId } = params || {};
	if (!userId) {
		return {
			message: err.user_not_found,
		};
	}
	try {
		const query = `select
		u.id,
		c.id "currencyId",
		c.symbol "currency",
		c.code "currencyCode",
		count(distinct(f.id))::int "filmCount",
		count(distinct(cr.id))::int "cartCount",
		count(distinct(fs.id))::int "submissionCount",
		count(distinct(case when fs.judging_status > ${constants.JUDGE.NOT_SELECTED} then fs.id else null end)) "selectionCount",
		array_agg(fv.country) "countries",
		tc.config "tinodeData"
		from users u
		join currencies c on c.id = u.currency_id
		join tinode_config tc on tc.user_id = u.id
		left join films f on f.user_id = u.id
		left join festival_submissions fs on fs.film_id = f.id
		left join festival_category_fees fe on fe.id = fs.festival_category_fee_id
		left join festival_categories fc on fc.id = fe.festival_category_id
		left join festivals fv on fv.id = fc.festival_id
		left join cart cr on cr.user_id = u.id
		where u.id = $userId
		group by u.id, c.id, tc.config`;
		const filmData = await sequelize.query(query, {
			bind: {
				userId,
			},
			type: QueryTypes.SELECT,
		});

		if (!filmData?.length) {
			return {
				message: err.user_not_found,
			};
		}

		const response = {
			success: true,
			data: null,
		};

		let submissionMap = "";
		let countryMap = {};
		if (filmData[0].filmCount) {
			const countrySet = new Set();
			(filmData[0].countries || []).forEach((countryCode) => {
				if (countryCode) {
					countrySet.add(countryCode);
					if (countryMap[countryCode]) {
						countryMap[countryCode].count += 1;
					} else {
						const country = phoneHandler.getCountry(countryCode);
						countryMap[countryCode] = {
							count: 1,
							name: country?.name || "Unknown",
						};
					}
				}
			});
			if (countrySet.size) {
				const fileKey = `map${userId}.png`;
				const currentStamp = moment().unix();
				submissionMap = `${aws.SUBMISSION_MAP_BUCKET}/${fileKey}?=${currentStamp}`;
				CountryMap.getHighlited({
					countries: Array.from(countrySet),
				})
					.then((buffer) => {
						aws.addFileToBucket(
							{ file: { buffer }, name: fileKey },
							aws.SUBMISSION_MAP_BUCKET
						);
					})
					.catch((err) => {
						logger.error(err);
					});
			}
		}

		const filmListQuery = `select
		f.id,
		f.title,
		f.poster_url "posterUrl",
		f.poster_hash "posterHash",
		count(distinct(fs.id)) "submissionCount",
		count(distinct(case when fs.judging_status > 0 then fs.id else null end)) "selectionCount",
		count(distinct(case when fs.judging_status < 1 then fs.id else null end)) "pendingCount",
		array_agg(distinct(fs.judging_status)) "judgingStatus"
		from users u
		join films f on f.user_id = u.id
		left join festival_submissions fs on fs.film_id = f.id
		left join festival_category_fees fe on fe.id = fs.festival_category_fee_id
		left join festival_categories fc on fc.id = fe.festival_category_id
		left join festivals fv on fv.id = fc.festival_id
		where u.id = $userId
		group by f.id`;
		const filmList = await sequelize.query(filmListQuery, {
			bind: {
				userId,
			},
			type: QueryTypes.SELECT,
		});
		const countries = Object.keys(countryMap).map((key) => countryMap[key]);
		response.data = {
			...filmData[0],
			films: filmList || [],
			submissionMap,
			countries,
		};
		return response;
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getSubmissions = async (params) => {
	const { userId } = params || {};
	if (!userId) {
		return {
			message: err.user_not_found,
		};
	}

	let whereFilters = "";

	if (params?.judgingStatus) {
		whereFilters += "and fs.judging_status = $judgingStatus ";
	}

	if (params?.status) {
		whereFilters += "and fs.status = $status ";
	}

	try {
		const query = `select 
		fs.id,
		fv.id "festivalId",
		fv.name "festivalName",
		fv.address "address",
		(case when fv.email is null then u.email else fv.email end) "email",
		(case when fv.phone is null then u.phone_no else fv.phone end) "phoneNo",
		to_char(fs.created_at, 'Mon DD, YYYY') "submissionDate",
		to_char(fd.notification_date, 'Mon DD, YYYY') "notificationDate",
		to_char(fd.festival_start, 'Mon DD, YYYY') "festivalStartDate",
		fm.title "projectTitle",
		fs.judging_status "judgingStatus",
		fs.status "status",
		fs.tracking_id as "trackingId"
		from users u
		join films fm on fm.user_id = u.id
		join festival_submissions fs on fs.film_id = fm.id
		join festival_category_fees fe on fe.id = fs.festival_category_fee_id
		join festival_date_deadlines fdd on fdd.id =  fe.festival_date_deadline_id
		join festival_dates fd on fd.id = fdd.festival_date_id
		join festival_categories fc on fc.id = fe.festival_category_id
		join festivals fv on fv.id = fc.festival_id
		where u.id = $userId ${whereFilters}
		order by fs.created_at desc`;
		const submissionList = await sequelize.query(query, {
			bind: {
				userId,
				judgingStatus: params?.judgingStatus,
				status: params?.status,
			},
			type: QueryTypes.SELECT,
		});
		if (!submissionList?.length) {
			return {
				message: err.user_not_found,
			};
		}
		const response = {
			success: true,
			data: submissionList,
		};
		return response;
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

// TUS Server Functions
const createTusFilmRecord = async (params) => {
	try {
		const { filmId } = params;
		const fileMetaData = new Map(Object.entries(params));
		const videoState = constants.VIDEO_STATES.CREATED;
		if (!validation.validId(filmId)) {
			return {
				message: err.film_not_found,
			};
		}
		if (!fileMetaData.has("sizeInMb")) {
			return {
				message: "File Size is required",
			};
		}
		if (!fileMetaData.has("mimetype")) {
			return {
				message: "File Type is required",
			};
		}
		if (
			constants.SUPPORTED_MIME_TYPES.indexOf(
				fileMetaData.get("mimetype")
			) === -1
		) {
			return {
				message: "Video Type not supported",
			};
		}
		const alreadyCreated = await Models.FilmVideos.findOne({
			where: {
				filmId,
				totalBytes: {
					[Op.not]: null,
				},
			},
		});
		if (alreadyCreated) {
			return {
				success: true,
				data: alreadyCreated,
			};
		}
		// Initiate the multipart upload
		const creatableRecord = {
			filmId,
			status: videoState,
			totalBytes: fileMetaData.get("totalBytes"),
			sizeInMb: fileMetaData.get("sizeInMb"),
			mimetype: fileMetaData.get("mimetype"),
		};
		const filmVideo = await Models.FilmVideos.create(creatableRecord);
		if (filmVideo) {
			return {
				success: true,
				data: filmVideo,
			};
		} else {
			return {
				message: "Unable to create video record",
			};
		}
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const resetTusFilmRecord = async (params) => {
	const filmData = await Models.FilmVideos.findOne({
		where: {
			filmId: params.filmId,
		},
		attributes: ["s3FileId", "tusTaskId", "id"],
	});
	if (filmData?.id) {
		await Models.FilmVideos.destroy({
			where: {
				id: filmData.id,
			},
		});
		if (filmData?.tusTaskId) {
			await fetch(`http://localhost:3301/v1/tus/${filmData?.tusTaskId}`, {
				method: "DELETE",
				headers: {
					"Tus-Resumable": "1.0.0",
				},
			});
			// aws.deleteFileFromBucket(filmData?.s3FileId, aws.FILM_VIDEOS);
			// aws.deleteFileFromBucket(
			// 	filmData?.s3FileId + ".info",
			// 	aws.FILM_VIDEOS
			// );
		}
		const fileMetaData = new Map(Object.entries(params));
		if (fileMetaData.has("totalBytes") && fileMetaData.has("mimetype")) {
			if (
				constants.SUPPORTED_MIME_TYPES.indexOf(
					fileMetaData.get("mimetype")
				) === -1
			) {
				return {
					success: true,
					data: {
						id: null,
					},
				};
			}
			const creatableRecord = {
				filmId: params.filmId,
				status: constants.VIDEO_STATES.CREATED,
				totalBytes: fileMetaData.get("totalBytes"),
				sizeInMb: fileMetaData.get("sizeInMb"),
				mimetype: fileMetaData.get("mimetype"),
			};
			const filmVideo = await Models.FilmVideos.create(creatableRecord);
			if (filmVideo) {
				return {
					success: true,
					data: filmVideo,
				};
			}
		}
	}
	return {
		success: true,
		data: {
			id: null,
		},
	};
};

const getFilmView = async ({ userId, filmId, submissionId }) => {
	try {
		if (!submissionId && !filmId) {
			return {
				message: err.film_not_found,
			};
		}

		let submissionData = {};

		if (submissionId) {
			const submissionQuery = `select
				fs.id "submissionId",
			  fs.film_id "filmId",
				to_char(fs.created_at, 'DD Mon YYYY') "submissionDate",
			  fs.judging_status "judgingStatusId",
			  fs.status "submissionStatusId",
			  fs.festival_flag_id "festivalFlagId",
			  fs.fee_type "feeType",
			  coi.amount / coi.exch_rate "feeAmount",
			  cr.symbol "currency",
			  
			  ur.first_name "firstName",
			  ur.last_name "lastName",
			  tc.config "submitterTinode",
			  ur.phone_no "submitterContact", 
			  fm.submitter_state "submitterState",
			  fm.submitter_city "submitterCity",
			  (case when  fm.submitter_country is null then ur.country_code else fm.submitter_country end) "submitterCountry",
			  fm.submitter_address "submitterAddress",
			  fm.submitter_address "submitterGender",
			  fm.submitter_address "submitterDob",
			 
			  fs.tracking_id "trackingId",
			  fc.name "categoryName",
			  fc.id "categoryId",
			  fc.id "categoryId",
			  fc.festival_id "festivalId",
			  fdd.id "deadlineId",
			  fdd.name "deadlineName",
			  (
			    select fs1.id from festival_submissions fs1 
			    where fs1.id < fs.id and fs1.festival_category_fee_id in (
			      select id from festival_category_fees where festival_date_deadline_id = fcf.festival_date_deadline_id
			    ) order by fs1.created_at desc
			  ) "previousSubmissionId",
			  (
			    select fs1.id from festival_submissions fs1 
			    where fs1.id > fs.id and fs1.festival_category_fee_id in (
			      select id from festival_category_fees where festival_date_deadline_id = fcf.festival_date_deadline_id
			    ) order by fs1.created_at asc
			  ) "nextSubmissionId"
			  
			from festival_submissions fs
			join festival_category_fees fcf on fcf.id = fs.festival_category_fee_id
			join festival_categories fc on fc.id = fcf.festival_category_id
			join festival_date_deadlines fdd on fdd.id = fcf.festival_date_deadline_id
			join films fm on fm.id = fs.film_id
			join users ur on ur.id = fm.user_id
			left join tinode_config tc on tc.user_id = ur.id

			join cart_order_items coi on coi.id = fs.order_item_id
			join currencies cr on cr.id = coi.festival_currency_id

			where fs.id = $1
			`;

			const result = await sequelize.query(submissionQuery, {
				bind: [submissionId],
				type: QueryTypes.SELECT,
			});

			if (!result?.length) {
				return {
					message: err.submission_not_found,
				};
			}

			submissionData = result[0];

			filmId = submissionData.filmId;
			const festivalFlags = await Models.FestivalFlags.findAll({
				where: {
					festivalId: submissionData.festivalId,
					isActive: true,
				},
				raw: true,
			});
			if (festivalFlags) {
				submissionData.festivalFlags = festivalFlags;
			} else {
				submissionData.festivalFlags = [];
			}
		}

		const query = `select
		  fm.id,
		  fm.title,
		  fm.storyline,
		  fm.user_id "userId",
		  (case when fm.user_id = ${userId} and fcu.work_type = ${constants.WORK_TYPES.SUBMIT_WORK} then true else false end) "isOwner",
		  fm.thumb_url "thumbUrl",
		  fm.thumb_hash "thumbHash",
		  fm.poster_url "posterUrl",
		  fm.poster_hash "posterHash",
		  fm.poster_config "posterConfig",
		  fm.short_summary "shortSummary",
		  fm.runtime_seconds "runtimeSeconds",
		  fm.completion_date "completionDate",
		  fm.production_budget "productionBudget",
		  fm.production_budget_currency_id "productionBudgetCurrencyId",
		  fm.country_of_orgin "countryOfOrigin",
		  fm.aspect_ratio "aspectRatio",
		  fm.shooting_format "shootingFormat",
		  fm.first_time "firstTime",
		  (select name from film_colors where id = fm.film_color_id) "filmColor",
		  array(
		    select ftl.name from film_types ft
		    join film_type_list ftl on ftl.id = ft.film_type_id
		    where ft.film_id = $1 and ft.is_active = true
		  ) "filmTypes",
		  
		  array(
		    select fgl.title from film_genres fg
		    join film_genre_list fgl on fgl.id = fg.film_genre_id
		    where fg.film_id = $1 and fg.is_active = true
		  ) "filmGenres",
		 	
		  array(
		    select lg.name from film_languages flg
		    join languages lg on lg.id = flg.language_id
		    where flg.film_id = $1
		  ) "filmLanguages",

		  array(
		    select lg.name from film_languages flg
		    join languages lg on lg.id = flg.language_id
		    where flg.film_id = $1
		  ) "filmLanguages",

		  (select json_build_object(
		    'id', id,
		    'videoUrl', video_url,
		    'streamUrl', stream_url,
		    'thumbnailUrl', thumbnail_url,  
		    'thumbnailHash', thumbnail_hash,
		    's3FileId', s3_file_id,
		    'mimeType', mimetype,
		    'status', status
		  ) video_data from film_videos where film_id = $1 limit 1) "filmVideo",
		  
		  fcs.id "sectionId",
		  fcs.name "sectionName",
		  
		  fcsc.id "sectionCreditId", 
		  fcsc.user_id "sectionCreditUserId",
		  
		  case when fcu.id is null then fcsc.first_name else fcu.first_name end "sectionCreditFirstName",
		  case when fcu.id is null then fcsc.last_name else fcu.last_name end "sectionCreditLastName",
		  case when fcu.id is null then fcsc.avatar_url else fcu.avatar_url end "sectionCreditAvatarUrl",
		  case when fcu.id is null then fcsc.avatar_hash else fcu.avatar_hash end "sectionCreditAvatarHash"
		  
		from films fm 
		  left join film_credit_sections fcs on fcs.film_id = fm.id
		  left join film_credit_section_credits fcsc on fcsc.film_credit_section_id = fcs.id
		  left join users fcu on fcu.id = fm.user_id
		where fm.id = $1
		order by fcs.relative_order asc, fcsc.relative_order asc`;
		const filmRecord = await sequelize.query(query, {
			bind: [filmId],
			type: QueryTypes.SELECT,
		});
		if (!filmRecord.length) {
			return {
				message: err.film_not_found,
			};
		}
		const rawData = filmRecord[0];
		const filmData = { ...rawData };
		const keysToDelete = [
			"sectionId",
			"sectionName",
			"sectionCreditId",
			"sectionCreditUserId",
			"sectionCreditFirstName",
			"sectionCreditLastName",
			"sectionCreditAvatarUrl",
			"sectionCreditAvatarHash",
		];
		keysToDelete.forEach((k) => {
			delete filmData[k];
		});
		const filmCredits = [];
		for (const creditSection of filmRecord) {
			if (!creditSection.sectionId) {
				continue;
			}
			const fn = creditSection.sectionCreditFirstName;
			const ln = creditSection.sectionCreditLastName;
			const name = common.getFullName(fn, null, ln);
			/** @TODO: Designation should be column in section_credits
			 * and not a section name
			 */
			filmCredits.push({
				id: creditSection.sectionCreditId,
				name: name,
				designation: creditSection.sectionName,
				userId: creditSection.sectionCreditUserId,
				sectionId: creditSection.sectionId,
				avatarUrl: creditSection.sectionCreditAvatarUrl,
				avatarHash: creditSection.sectionCreditAvatarHash,
			});
		}

		// Photo Section
		const PHOTO_LIMIT = 5;
		const photoQuery = `select
				id, film_id "filmId", 
		  		thumb_url "thumbUrl", hash, 
		  		count(id) over() as total 
		  	from film_photos where film_id = $1 limit ${PHOTO_LIMIT}`;
		const photos = await sequelize.query(photoQuery, {
			bind: [filmId],
			type: QueryTypes.SELECT,
		});
		filmData.photos = photos || [];

		filmData.filmCredits = filmCredits;
		return {
			success: true,
			data: {
				...filmData,
				...submissionData,
			},
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getFilmVideo = async ({ filmId }) => {
	const filmData = await Models.FilmVideos.findOne({
		where: {
			filmId,
		},
	});
	if (filmData) {
		const finalData = filmData.toJSON();
		if (finalData?.s3FileId && finalData?.status === "ready") {
			const assets = apiVideo.getAssets(finalData.s3FileId);
			const status = await apiVideo.videoStatus(finalData.s3FileId);
			finalData.streamUrl = assets.hls;
			finalData.thumbnailUrl = assets.thumbnail;
			if (status?.data?.encoding?.playable) {
				finalData.playable = true;
			} else {
				finalData.playable = false;
			}
		}
		return {
			success: true,
			data: finalData,
		};
	}
	return {
		message: err.server_error,
	};
};

// Upload Functions
const uploadFilmPoster = async (params = {}, posterFile) => {
	let transaction = null;
	try {
		let { userId, filmId } = params;
		if (
			!validation.validId(parseInt(filmId)) &&
			!validation.validId(userId)
		) {
			return {
				message: err.invalid_request,
			};
		}
		if (!posterFile) {
			return {
				message: "Poster image is required",
			};
		}
		const { data, info } = await sharp(posterFile.buffer)
			.jpeg({
				progressive: true,
				force: false,
			})
			.toBuffer({ resolveWithObject: true });
		const file = {
			buffer: data,
			mimetype: "image/jpeg",
			size: info.size,
		};
		const [errUpload, posterPath] = await aws.addFileToBucket(
			{ file, name: `${filmId}-poster.jpeg` },
			aws.FILM_IMAGES_BUCKET
		);
		const posterHash = await blur(data);
		const currentStamp = moment().unix();
		const posterUrl = `${posterPath}?t=${currentStamp}`;
		const posterConfig = {
			width: info.width,
			height: info.height,
		};
		await Models.Films.update(
			{
				posterUrl,
				posterHash,
				posterConfig,
			},
			{
				transaction,
				where: {
					id: filmId,
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
				id: filmId,
				posterUrl,
				posterHash,
				posterConfig,
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

const getVideoStatus = async ({ s3FileId }) => {
	const errMsg = "Video not found";
	try {
		if (!s3FileId) {
			throw new Error(errMsg);
		}
		const status = await apiVideo.videoStatus(s3FileId);

		if (status?.data?.encoding) {
			return {
				success: true,
				data: {
					playable: status.data.encoding.playable,
				},
			};
		} else {
			throw new Error(errMsg);
		}
	} catch (tryErr) {
		return {
			message: tryErr.message,
		};
	}
};

const updateFilmVideoUrl = async ({ filmId, videoUrl, password = "" }) => {
	if (!filmId) {
		return {
			message: err.film_not_found,
		};
	}

	try {
		const filmVideo = await Models.FilmVideos.findOne({
			where: {
				filmId,
			},
		});

		if (
			filmVideo?.streamUrl ||
			filmVideo?.s3FileId ||
			filmVideo?.tusTaskId
		) {
			return {
				message: "Film video already exists",
			};
		}

		if (filmVideo) {
			await Models.FilmVideos.update(
				{
					password,
					filmId,
					videoUrl,
					status: "ready",
				},
				{
					where: {
						id: filmVideo.id,
					},
				}
			);
		} else {
			await Models.FilmVideos.create({
				password,
				filmId,
				videoUrl,
				status: "ready",
			});
		}

		return {
			success: true,
			data: "Updated!",
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

module.exports = {
	updateFilmDetails,
	updateSubmitterDeatils,
	updateFilmCredits,
	updateFilmSpecifications,
	updateFilmScreenings,
	getFilmsForSubmission,
	getFilmData,
	getFilms,

	generateFilmStages,
	getStageWiseData,
	getFormTypes,

	getHome,
	getSubmissions,

	createTusFilmRecord,
	resetTusFilmRecord,

	getFilmView,
	getFilmVideo,
	uploadFilmPoster,
	getVideoStatus,
	updateFilmVideoUrl,
};