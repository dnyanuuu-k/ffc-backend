/**
 * @Page: Festival Services
 * @Description: Create festival related functions here
 */

//Models
const Models = require("#models");

//Services

//Handlers
const phoneHandler = require("#handler/phone");
const currencyHandler = require("#handler/currency");
const deadlineHandler = require("#handler/deadline");
const membershipHandler = require("#handler/membership");
const festivalHandler = require("#handler/festival");
const TinodeHandler = require("#handler/tinode");

//Constants
const sequelize = require("#utils/dbConnection");
const constants = require("#utils/constants");
// const common = require("#utils/common");
const err = require("#utils/errors");
const aws = require("#utils/aws");
//Helper Functions
const onehealthCapture = require("#utils/oneHealthCapture");
const validation = require("#utils/validation");
const blur = require("#utils/blurhash");
const { Op, QueryTypes } = require("sequelize");
//Third Party Functions
const sharp = require("sharp");
const moment = require("moment");

const STAGE_1 = 0;
const STAGE_2 = 1;
const STAGE_3 = 2;
const STAGE_4 = 3;
const STAGE_5 = 4;

const ALLOWED_NOTIFY_PERF = ["default", "immediate"];

const getFestivalDraftName = () => {
	const name = moment().format(global.YYYYMMDD);
	return `Draft ${name}`;
};

const isValidFestivalOrganizerStructure = (organizers = [], festivalId = 0) => {
	const nameKey = "name";
	const designationKey = "designation";
	let errorText = null;
	const organizerPayload = [];
	organizers.forEach((organizer, index) => {
		if (!validation.validName(organizer?.[nameKey])) {
			errorText = err.invalid_organizer_name;
			return false;
		}
		if (!validation.validName(organizer?.[designationKey])) {
			errorText = err.invalid_organizer_designation;
			return false;
		}
		organizer.relativeOrder = index + 1;
		if (festivalId) organizer.festivalId = festivalId;
		organizerPayload.push(organizer);
		return true;
	});
	const result = {
		success: errorText ? false : true,
		message: errorText,
	};
	if (result.success) {
		result.data = organizerPayload;
	}
	return result;
};

const isValidFestivalVenueStructure = (venues = [], festivalId = 0) => {
	let errorText = null;
	const venuePayload = [];
	venues.forEach((venue, index) => {
		if (!validation.validName(venue.name)) {
			errorText = err.invalid_organizer_name;
			return false;
		}
		const id = venue?.id || undefined;
		const address = venue?.address || "";
		const name = venue?.name || "";
		const city = venue?.city || "";
		const state = venue?.state || "";
		const country = venue?.country || "";
		const postalCode = venue?.postalCode || "";
		const lat = venue?.lat || 0;
		const lng = venue?.lng || 0;
		venuePayload.push({
			id,
			festivalId,
			address,
			city,
			name,
			state,
			postalCode,
			relativeOrder: index + 1,
			country,
			lat,
			lng,
		});
		return true;
	});
	const result = {
		success: errorText ? false : true,
		message: errorText,
	};
	if (result.success) {
		result.data = venuePayload;
	}
	return result;
};

const isValidFestivalDeadlineStructure = (
	deadlines = [],
	openingDate,
	festivalDateId = 0
) => {
	let errorText = null;
	let deadlineSet = new Set();
	const deadlinePayload = [];
	let maxDate = moment();
	if (deadlines?.length > 10) {
		return {
			message: err.ten_deadlines,
		};
	}
	deadlines.forEach((deadline) => {
		if (!validation.validName(deadline.name)) {
			errorText = `${deadline.name} is not valid deadline name`;
			return false;
		}
		const id = deadline?.id || undefined;
		const date = moment(deadline.date, global.YYYYMMDD);
		if (!date.isValid()) {
			errorText = `${deadline.name} don't have valid date`;
			return false;
		}
		if (date < openingDate) {
			errorText = `${deadline.name} cannot have date, less than opening date`;
			return false;
		}
		if (date > maxDate) {
			maxDate = date;
		}
		deadlineSet.add(date);
		const allCategories = true;
		deadlinePayload.push({
			id,
			festivalDateId,
			allCategories,
			date,
			name: deadline.name,
		});
		return true;
	});
	if (deadlineSet.size !== deadlinePayload.length) {
		return {
			message: "Two Deadline cannot have same date",
		};
	}
	const result = {
		success: errorText ? false : true,
		message: errorText,
	};
	if (result.success) {
		result.data = {
			list: deadlinePayload,
			maxDate,
		};
	}
	return result;
};

const createFestivalOrganizers = async (
	festivalOrganizers,
	transaction,
	deleteOther = false
) => {
	//TODO: Optimize for errors
	const result = [];
	const ids = [];
	let currentFestivalId = 0;
	for (
		let relativeOrder = 1;
		relativeOrder <= festivalOrganizers.length;
		relativeOrder++
	) {
		const index = relativeOrder - 1;
		const { id, name, designation, festivalId } = festivalOrganizers[index];
		currentFestivalId = festivalId;
		if (id) {
			await Models.FestivalOrganizers.update(
				{
					name,
					designation,
					relativeOrder,
				},
				{ where: { id }, transaction }
			);
			ids.push(id);
			result.push({ id, name, designation, relativeOrder });
		} else {
			const created = await Models.FestivalOrganizers.create(
				{
					name,
					designation,
					relativeOrder,
					festivalId,
				},
				{
					transaction,
				}
			);
			ids.push(created.id);
			result.push({ id: created.id, name, designation, relativeOrder });
		}
	}
	if (deleteOther) {
		let where = {};
		if (ids?.length > 0) {
			where = {
				id: {
					[Op.notIn]: ids,
				},
			};
		} else {
			where = {
				festivalId: currentFestivalId,
			};
		}
		await Models.FestivalOrganizers.destroy(
			{
				where,
			},
			{ transaction }
		);
	}
	return {
		success: true,
		data: result,
	};
};

const createFestivalVenues = async (
	festivalVenues,
	transaction,
	deleteOther = false
) => {
	const result = [];
	const ids = [];
	let currentFestivalId = 0;
	for (
		let relativeOrder = 1;
		relativeOrder <= festivalVenues.length;
		relativeOrder++
	) {
		const index = relativeOrder - 1;
		const { id, festivalId } = festivalVenues[index];
		let updatable = festivalVenues[index];
		updatable.relativeOrder = relativeOrder;
		currentFestivalId = festivalId;
		if (id) {
			delete updatable.id;
			await Models.FestivalVenues.update(updatable, {
				where: { id },
				transaction,
			});
			ids.push(id);
			result.push(festivalVenues[index]);
		} else {
			const created = await Models.FestivalVenues.create(updatable, {
				transaction,
			});
			ids.push(created.id);
			result.push({ ...updatable, id: created.id });
		}
	}
	if (deleteOther) {
		let where = {};
		if (ids?.length > 0) {
			where = {
				id: {
					[Op.notIn]: ids,
				},
			};
		} else {
			where = {
				festivalId: currentFestivalId,
			};
		}
		await Models.FestivalVenues.destroy(
			{
				where,
			},
			{ transaction }
		);
	}
	return {
		success: true,
		data: result,
	};
};

const createFestivalDateDeadlines = async (
	festivalDateDeadlines,
	transaction,
	deleteOther = false
) => {
	const result = [];
	const ids = [];
	let currentFestivalDateId = 0;
	for (const festivalDateDeadline of festivalDateDeadlines) {
		const { id, festivalDateId } = festivalDateDeadline || {};
		currentFestivalDateId = festivalDateId;
		if (id) {
			let updatable = { ...festivalDateDeadline };
			delete updatable.id;
			await Models.FestivalDateDeadlines.update(updatable, {
				where: { id },
				transaction,
			});
			ids.push(id);
			result.push(festivalDateDeadline);
		} else {
			const created = await Models.FestivalDateDeadlines.create(
				festivalDateDeadline,
				{
					transaction,
				}
			);
			ids.push(created.id);
			result.push({ ...festivalDateDeadline, id: created.id });
		}
	}
	if (deleteOther) {
		let where = {};
		if (ids?.length > 0) {
			where = {
				id: {
					[Op.notIn]: ids,
				},
				festivalDateId: currentFestivalDateId,
			};
		} else {
			where = {
				festivalDateId: currentFestivalDateId,
			};
		}
		await Models.FestivalDateDeadlines.destroy(
			{
				where,
			},
			{ transaction }
		);
	}
	return {
		success: true,
		data: result,
	};
};

const isFestivalPublished = async (festivalId) => {
	const query = "select published from festivals where id = $1";
	const response = await sequelize.query(query, {
		bind: [festivalId],
		type: QueryTypes.SELECT,
	});
	if (response && response.length > 0 && response[0].published) {
		return true;
	}
	return false;
};

const getUniqueUserNameForFestival = async (festivalId) => {
	const query = `select 
	concat(
	  regexp_replace(case when length(f.name) < 3 then 'festival' else f.name end, '\\s', '', 'g'), 
	  ((select id + 1 from festivals order by created_at desc limit 1)::text)
	) user_name
	from festivals f where f.id = $1`;
	const response = await sequelize.query(query, {
		bind: [festivalId],
		type: QueryTypes.SELECT,
	});
	return response?.[0].user_name || "festival2023";
};

/*
	Create Festival Details takes
	Festival Name
	Festival Type
	Festival Description ( Can save without this )
	Festival Awards & Prizes ( Can save without This )
	Festival Terms and Condition ( Can save without this )

	Festival Organizers should have following data
	Organizers are created only when Festival ID is not 
	passed otherwise
	Organizer stuff will be handled by
	another API for updation
	[
		{
			name: 
			designation:
		}
	]
*/
const updateFestivalDetails = async (festivalDetails) => {
	let transaction = null;
	try {
		if (!validation.validId(festivalDetails?.userId)) {
			return {
				message: err.user_not_found,
			};
		}
		if (!validation.validName(festivalDetails?.name)) {
			return {
				message: err.invalid_festival_name,
			};
		}
		if (festivalDetails.yearsRunning) {
			festivalDetails.yearsRunning = parseInt(
				festivalDetails.yearsRunning || 1
			);
			if (!validation.validNumber(festivalDetails.yearsRunning)) {
				return {
					message: err.invalid_year_running,
				};
			}
		}
		if (festivalDetails?.festivalType?.length > 0) {
			const festivalType = await Models.FestivalTypes.findAll({
				where: {
					id: festivalDetails?.festivalType,
				},
				attributes: ["id"],
			});
			if (festivalType?.length != festivalDetails.festivalType.length) {
				return {
					message: err.invalid_festival_type,
				};
			}
		} else {
			return {
				message: err.invalid_festival_type,
			};
		}
		transaction = await sequelize.transaction();
		let currentFestival = null;
		if (festivalDetails?.id) {
			currentFestival = { id: festivalDetails?.id };
			const isPublished = await isFestivalPublished(festivalDetails?.id);
			const updatable = {};
			if (!isPublished && festivalDetails.name?.length > 0) {
				updatable.name = festivalDetails.name;
			}
			if (festivalDetails.description?.length > 0) {
				updatable.description = festivalDetails.description;
			}
			if (festivalDetails.yearsRunning) {
				updatable.yearsRunning = festivalDetails.yearsRunning;
			}
			if (festivalDetails.awards?.length > 0) {
				updatable.awards = festivalDetails.awards;
			}
			if (festivalDetails.terms?.length > 0) {
				updatable.terms = festivalDetails.terms;
			}
			if (festivalDetails.festivalType?.length > 0) {
				updatable.festivalType = festivalDetails.festivalType;
			}
			const updatingFestival = await Models.Festivals.update(updatable, {
				where: {
					id: currentFestival.id,
				},
				transaction,
			});
			if (!updatingFestival) {
				transaction.rollback();
				return {
					message: err.unable_to_create_festival,
				};
			}
			// TODO: Update tinode account name and avatar
			if (updatable.name) {
				TinodeHandler.createAccount({
					id: currentFestival.id,
					type: TinodeHandler.FESTIVAL_USER,
					firstName: festivalDetails.name,
				});
			}
		} else {
			currentFestival = await Models.Festivals.create(
				{
					name: festivalDetails.name,
					description: festivalDetails?.description || "",
					userId: festivalDetails.userId,
					yearsRunning: festivalDetails?.yearsRunning || 0,
					awards: festivalDetails?.awards || "",
					terms: festivalDetails?.terms || "",
					festivalType: festivalDetails.festivalType,
				},
				{
					transaction,
				}
			);
			if (!currentFestival) {
				transaction.rollback();
				return {
					message: err.unable_to_create_festival,
				};
			}
			// Create Default Flags
			createDefaultFlag({
				festivalId: currentFestival.id,
			});

			TinodeHandler.createAccount({
				id: currentFestival.id,
				type: TinodeHandler.FESTIVAL_USER,
				firstName: festivalDetails.name,
			});
		}
		let updatedOrganizers = [];
		if (festivalDetails?.festivalOrganizers?.length > 0) {
			const validOrganizers = isValidFestivalOrganizerStructure(
				festivalDetails.festivalOrganizers,
				currentFestival.id
			);
			if (validOrganizers.success === false) {
				return validOrganizers;
			}
			const deleteOther = true;
			const currentOrganizers = await createFestivalOrganizers(
				validOrganizers.data,
				transaction,
				deleteOther
			);
			if (!currentOrganizers?.success) {
				transaction.rollback();
				return {
					message: err.unable_to_create_organizers,
				};
			}
			updatedOrganizers = currentOrganizers.data;
		}
		await transaction.commit();
		return {
			success: true,
			data: {
				id: currentFestival.id,
				festivalOrganizers: updatedOrganizers,
			},
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		if (transaction) transaction.rollback();
		return {
			message: err.server_error,
		};
	}
};

/*
	Update Festival Contact Details takes
	Email  		Required
	Country 	Required
	Phone
	Address
	City
	State
	Postal Code
	------------ Socail Media Links ------------
	Facebook
	Instagram
	Twitter

	Festival Venues
	Country
	Phone
	Address
	City
	State
	Postal Code
*/
const updateFestivalContactDetails = async (festivalDetails) => {
	let transaction = null;
	try {
		const validatedObject = {
			state: "",
			city: "",
			address: "",
			postalCode: "",
			facebook: "",
			instagram: "",
			twitter: "",
			website: "",
		};

		if (!validation.validateEmail(festivalDetails?.email)) {
			return {
				message: err.invalid_email,
			};
		} else {
			validatedObject.email = festivalDetails.email;
		}

		if (!phoneHandler.isValidCountry(festivalDetails?.country)) {
			return {
				message: err.invalid_country,
			};
		} else {
			validatedObject.country = festivalDetails.country;
		}

		if (festivalDetails?.phone?.length > 0) {
			if (!validation.validPhoneNumber(festivalDetails.phone)) {
				return {
					message: err.invalid_phone_number,
				};
			}
			validatedObject.phone = festivalDetails.phone;
		}
		if (festivalDetails?.address?.length > 0) {
			if (!validation.validName(festivalDetails.address, 4)) {
				return {
					message: err.address_short,
				};
			}
			validatedObject.address = festivalDetails.address;
		}

		if (festivalDetails?.city?.length > 0) {
			if (!validation.validName(festivalDetails.city)) {
				return {
					message: err.city_short,
				};
			}
			validatedObject.city = festivalDetails.city;
		}

		if (festivalDetails?.state?.length > 0) {
			if (!validation.validName(festivalDetails.state)) {
				return {
					message: err.state_short,
				};
			}
			validatedObject.state = festivalDetails.state;
		}

		if (festivalDetails?.postalCode?.length > 0) {
			if (!validation.validName(festivalDetails.postalCode)) {
				return {
					message: err.postal_code_short,
				};
			}
			validatedObject.postalCode = festivalDetails.postalCode;
		}

		if (festivalDetails?.facebook?.length > 0) {
			if (!validation.validFacebookUrl(festivalDetails.facebook)) {
				return {
					message: err.invalid_facebook,
				};
			}
			validatedObject.facebook = festivalDetails.facebook;
		}
		if (festivalDetails?.instagram?.length > 0) {
			if (!validation.validInstagramUrl(festivalDetails.instagram)) {
				return {
					message: err.invalid_instagram,
				};
			}
			validatedObject.instagram = festivalDetails.instagram;
		}
		if (festivalDetails?.twitter?.length > 0) {
			if (!validation.validTwitterUrl(festivalDetails.twitter)) {
				return {
					message: err.invalid_twitter,
				};
			}
			validatedObject.twitter = festivalDetails.twitter;
		}
		if (festivalDetails?.website?.length > 0) {
			if (!validation.validUrl(festivalDetails.website)) {
				return {
					message: err.invalid_website,
				};
			}
			validatedObject.website = festivalDetails.website;
		}

		transaction = await sequelize.transaction();
		let currentFestival = null;
		if (festivalDetails?.id) {
			currentFestival = { id: festivalDetails?.id, ...validatedObject };
			const updatingFestival = await Models.Festivals.update(
				validatedObject,
				{
					where: {
						id: currentFestival.id,
					},
					transaction,
				}
			);
			if (!updatingFestival) {
				transaction.rollback();
				return {
					message: err.unable_to_update_festival,
				};
			}
		} else {
			validatedObject.userId = festivalDetails.userId;
			currentFestival = await Models.Festivals.create(validatedObject, {
				transaction,
			});
			if (!currentFestival) {
				transaction.rollback();
				return {
					message: err.unable_to_create_festival,
				};
			}
		}
		let updatedVenues = [];
		if (festivalDetails?.festivalVenues?.length > 0) {
			const validVenues = isValidFestivalVenueStructure(
				festivalDetails.festivalVenues,
				currentFestival.id
			);
			if (validVenues.success === false) {
				return validVenues;
			}
			const deleteOther = true;
			const currentVenues = await createFestivalVenues(
				validVenues.data,
				transaction,
				deleteOther
			);
			if (!currentVenues?.success) {
				transaction.rollback();
				return {
					message: err.unable_to_create_organizers,
				};
			}
			updatedVenues = currentVenues.data;
		}
		await transaction.commit();
		return {
			success: true,
			data: {
				id: currentFestival.id,
				festivalVenues: updatedVenues,
			},
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		if (transaction) {
			transaction.rollback();
		}
		return {
			message: err.server_error,
		};
	}
};

/*
	Update Festival Deadline Details takes

	Opening Date
	DateDeadlines (Optional)
	Notification Date
	Festival Start
	Festival End
*/
const updateFestivalDeadlineDetails = async (festivalDates) => {
	if (typeof festivalDates != "object") {
		return {
			message: err.bad_request,
		};
	}
	let transaction = null;
	try {
		// Step: 1
		// Check is current opening date is not between
		// any other festival of same user
		const openingDate = moment(festivalDates.openingDate, global.YYYYMMDD);
		const currentMoment = moment();
		if (!openingDate.isValid()) {
			return {
				message: err.opening_date_invalid,
			};
		}
		if (openingDate < currentMoment) {
			return {
				message: "Opening date cannot be less than today's date",
			};
		}

		//TODO: Premium for multiple festival at a time
		const inBetweenWhere = {
			openingDate: {
				[Op.lte]: openingDate,
			},
			festivalEnd: {
				[Op.gte]: openingDate,
			},
		};
		if (festivalDates.festivalId) {
			inBetweenWhere.festivalId = {
				[Op.ne]: festivalDates.festivalId,
			};
		}
		const inBetween = await Models.FestivalDates.findOne({
			attributes: ["id"],
			where: inBetweenWhere,
			include: {
				as: "festival",
				model: Models.Festivals,
				attributes: ["name"],
				where: {
					userId: festivalDates.userId,
				},
				include: {
					as: "user",
					model: Models.Users,
					attributes: ["currencyId"],
				},
			},
		});
		if (inBetween) {
			return {
				message: `You can run only one festival at time, you have ${inBetween.festival.name} running in selected dates`,
			};
		}

		//Step 2: validate deadlines
		const hasDeadlines = festivalDates?.festivalDateDeadlines?.length > 0;
		let validatedDeadlines = isValidFestivalDeadlineStructure(
			festivalDates?.festivalDateDeadlines || [],
			openingDate
		);

		if (!validatedDeadlines.success) {
			return validatedDeadlines;
		}

		//Step 3: Validate Notification Date
		const notificationDate = moment(
			festivalDates.notificationDate,
			global.YYYYMMDD
		);
		if (!notificationDate.isValid()) {
			return {
				message: "Notification date is invalid",
			};
		}
		if (
			hasDeadlines &&
			notificationDate < validatedDeadlines.data.maxDate
		) {
			return {
				message:
					"Notification date sholud be greater than all deadline dates",
			};
		}

		//Step 4: Event From & to date validation
		const festivalStart = moment(
			festivalDates.festivalStart,
			global.YYYYMMDD
		);
		if (!festivalStart.isValid()) {
			return {
				message: "Invalid festival start date",
			};
		}

		if (festivalStart < notificationDate) {
			return {
				message:
					"Festival start date should be greater than notification date",
			};
		}
		const festivalEnd = moment(festivalDates.festivalEnd, global.YYYYMMDD);
		if (!festivalEnd.isValid()) {
			return {
				message: "Invalid festival end date",
			};
		}
		if (festivalEnd < festivalStart) {
			return {
				message:
					"Festival end date should be greater than festival start date",
			};
		}

		transaction = await sequelize.transaction();

		// Step 5: Create festival if not present
		if (!festivalDates?.festivalId) {
			const festivalName = getFestivalDraftName();
			//TODO: Limit Festival Creation
			const createdFestival = await Models.Festivals.create({
				name: festivalName,
				userId: festivalDates.userId,
			});
			if (!createdFestival) {
				return {
					message: err.unable_to_create_festival,
				};
			}
			festivalDates.festivalId = createdFestival.id;
		}

		//Step 6: Create Festival Dates
		let currentFestivalDate = {};
		const updatable = {
			openingDate,
			notificationDate,
			festivalStart,
			festivalEnd,
		};
		if (festivalDates.id) {
			currentFestivalDate = {
				id: festivalDates.id,
			};
			await Models.FestivalDates.update(
				updatable,
				{
					where: {
						id: festivalDates.id,
					},
				},
				{ transaction }
			);
		} else {
			const userData = await Models.Users.findOne({
				where: {
					id: festivalDates.userId,
				},
				attributes: ["currencyId"],
			});
			updatable.currencyId = userData.currencyId;
			updatable.festivalId = festivalDates.festivalId;
			currentFestivalDate = await Models.FestivalDates.create(updatable, {
				transaction,
			});
		}

		//Step 7: Create Festival Deadlines
		const deleteOther = true;
		let currentDateDeadlines = [];
		if (hasDeadlines) {
			const deadlineWithIds = validatedDeadlines.data.list.map((v) => {
				v.festivalDateId = currentFestivalDate.id;
				return v;
			});
			const createdDeadlines = await createFestivalDateDeadlines(
				deadlineWithIds,
				transaction,
				deleteOther
			);
			if (!createdDeadlines?.success) {
				return createdDeadlines;
			}
			currentDateDeadlines = createdDeadlines.data;
		} else if (deleteOther) {
			await Models.FestivalDateDeadlines.destroy(
				{
					where: {
						festivalDateId: currentFestivalDate.id,
					},
				},
				{ transaction }
			);
		}

		await transaction.commit();

		return {
			success: true,
			data: {
				festivalDateId: currentFestivalDate.id,
				festivalDateDeadlines: currentDateDeadlines,
			},
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		if (transaction) {
			transaction.rollback();
		}
		return {
			message: err.server_error,
		};
	}
};

/*
	Update Festival Category Details
	Currency //TODO Implemention
	FestivalCategory {
		...Festival_Category_data,
		festivalCategoryFees: [
			{
				
			}
		]
	}
*/

const updateFestivalCategoryDetails = async (festivalCategory) => {
	if (!festivalCategory) {
		return {
			message: "Festival category is required",
		};
	}
	const transaction = await sequelize.transaction();
	const rtn = (returnData) => {
		if (transaction) transaction.rollback();
		return returnData;
	};
	try {
		const name = festivalCategory.name;
		const description = festivalCategory.description;
		const runtimeType = festivalCategory.runtimeType;
		const runtimeStart = festivalCategory.runtimeStart;
		const runtimeEnd = festivalCategory.runtimeEnd;
		//Festival Category
		if (!validation.validName(name)) {
			return rtn({
				message: "Category name is invalid",
			});
		}
		if (description?.length > 0 && !validation.validName(description)) {
			return rtn({
				message: "Category description is invalid",
			});
		}
		if (runtimeType === global.FESTIVAL_RUNTIMES.BETWEEN) {
			//Between
			if (!runtimeStart && !runtimeEnd) {
				return rtn({
					message: "Category runtime start & end minutes is missing",
				});
			}
			if (runtimeStart > runtimeEnd) {
				return rtn({
					message:
						"Category runtime start minutes is greater than end minutes",
				});
			}
		} else if (
			festivalCategory.runtimeType === global.FESTIVAL_RUNTIMES.OVER
		) {
			//Over
			if (!runtimeEnd) {
				return rtn({
					message: "Category over minutes is not greater than 0",
				});
			}
		}
		const updatable = {
			name,
			description,
			runtimeType,
			projectOrigins: festivalCategory?.projectOrigins || [],
			runtimeStart,
			runtimeEnd,
		};
		if (festivalCategory.id) {
			await Models.FestivalCategories.update(updatable, {
				where: {
					id: festivalCategory.id,
				},
				transaction,
			});
			updatable.id = festivalCategory.id;
		} else {
			updatable.festivalId = festivalCategory.festivalId;
			const createdCategory = await Models.FestivalCategories.create(
				updatable,
				{
					transaction,
				}
			);
			updatable.id = createdCategory.id;
			festivalCategory.id = createdCategory.id;
		}
		updatable.festivalId = festivalCategory.festivalId;

		//Festival Category Fee
		const festivalCategoryFees =
			festivalCategory.festivalCategoryFees || [];
		for (const festivalCategoryFee of festivalCategoryFees) {
			const standardFee = parseFloat(
				festivalCategoryFee.standardFee || 0,
				10
			);
			const goldFee = parseFloat(festivalCategoryFee.goldFee || 0, 10);
			if (goldFee > 0) {
				const lessThanMax = standardFee - standardFee * 0.1;
				if (goldFee >= lessThanMax) {
					if (transaction) {
						transaction.rollback();
					}

					return {
						message: `Gold Fee for ${name} should be less than 10% of standard fee i.e ${Number(
							lessThanMax
						).toFixed(2)}`,
					};
				}
			}
			const feeUpdatable = {
				enabled: festivalCategoryFee.enabled,
				standardFee,
				goldFee,
			};
			if (
				!validation.validId(festivalCategoryFee.festivalDateDeadlineId)
			) {
				return rtn({
					message: err.server_error,
				});
			}
			if (festivalCategoryFee.id) {
				await Models.FestivalCategoryFees.update(feeUpdatable, {
					where: {
						id: festivalCategoryFee.id,
					},
					transaction,
				});
			} else {
				feeUpdatable.festivalCategoryId = festivalCategory.id;
				feeUpdatable.festivalDateDeadlineId =
					festivalCategoryFee.festivalDateDeadlineId;
				await Models.FestivalCategoryFees.create(feeUpdatable, {
					transaction,
				});
				// feeUpdatable.id = createdFee.id;
			}
		}
		await transaction.commit();
		return {
			success: true,
			data: updatable,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		if (transaction) {
			transaction.rollback();
		}
		return {
			message: err.server_error,
		};
	}
};

const updateCategoryRelativeOrder = async ({ festivalCategories }) => {
	let transaction = null;
	try {
		if (!(festivalCategories?.length > 0)) {
			return {
				message: "Atleast one festival categoy is required",
			};
		}
		let relativeOrder = 1;
		transaction = await sequelize.transaction();
		const result = [];
		for (const festivalCategory of festivalCategories) {
			await Models.FestivalCategories.update(
				{
					relativeOrder,
				},
				{ where: { id: festivalCategory.id }, transaction }
			);
			result.push({
				id: festivalCategory.id,
				relativeOrder,
			});
		}
		await transaction.commit();
		return {
			success: true,
			data: result,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		if (transaction) {
			transaction.rollback();
		}
		return {
			message: err.server_error,
		};
	}
};

const deleteFestivalCategory = async ({ festivalCategoryId }) => {
	try {
		await Models.FestivalCategoryFees.destroy({
			where: {
				festivalCategoryId,
			},
		});
		await Models.FestivalCategories.destroy({
			where: {
				id: festivalCategoryId,
			},
		});
		return {
			success: true,
			data: {
				id: festivalCategoryId,
				action: "deleted",
			},
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const updateFestivalListingDetails = async (festivalDetails) => {
	let transaction = null;
	try {
		let {
			listingUrl,
			trackingPrefix = "",
			startingNumber = "1001",
			maximumRuntime = 0,
			acceptsAllLength = false,
			minimumRuntime = 0,
			festivalTags = [],
			festivalFocus = [],
		} = festivalDetails || {};

		listingUrl = validation.validString(listingUrl);
		if (!listingUrl || typeof listingUrl !== "string") {
			return {
				message: err.listing_url,
			};
		}
		if (!validation.onlyAlphaNumber(listingUrl)) {
			return {
				message: "Listing URL should contian only alphabets and number",
			};
		}
		const isTakenWhere = {
			listingUrl,
		};
		if (festivalDetails.id) {
			isTakenWhere.id = {
				[Op.ne]: festivalDetails.id,
			};
		}
		const isTaken = await Models.Festivals.count({
			where: isTakenWhere,
		});

		if (isTaken) {
			return {
				message: err.listing_url_taken,
			};
		}

		const updatable = {
			listingUrl,
			maximumRuntime,
			minimumRuntime,
			acceptsAllLength,
			trackingPrefix,
			startingNumber,
		};
		let currentFestival = {};
		transaction = await sequelize.transaction();
		if (festivalDetails.id) {
			currentFestival = {
				id: festivalDetails.id,
			};
			await Models.Festivals.update(updatable, {
				transaction,
				where: {
					id: festivalDetails.id,
				},
			});
		} else {
			currentFestival = await Models.Festivals.create(updatable);
		}

		if (festivalTags?.length > 0) {
			const updatableTags = festivalTags.map((tagId) => ({
				festivalId: currentFestival.id,
				festivalTagId: tagId,
			}));
			if (festivalDetails.id) {
				await Models.FestivalTags.destroy(
					{
						where: {
							festivalId: currentFestival.id,
							festivalTagId: {
								[Op.notIn]: festivalTags,
							},
						},
					},
					{ transaction }
				);
			}
			await Models.FestivalTags.bulkCreate(updatableTags, {
				transaction,
				ignoreDuplicates: true,
			});
		}

		if (festivalFocus?.length > 0) {
			const updatableFocus = festivalFocus.map((festivalFocusId) => ({
				festivalId: currentFestival.id,
				festivalFocusId,
			}));
			if (festivalDetails.id) {
				await Models.FestivalFocus.destroy(
					{
						where: {
							festivalId: currentFestival.id,
							festivalFocusId: {
								[Op.notIn]: festivalFocus,
							},
						},
					},
					{ transaction }
				);
			}
			await Models.FestivalFocus.bulkCreate(updatableFocus, {
				transaction,
				ignoreDuplicates: true,
			});
		}
		await transaction.commit();
		return {
			success: true,
			data: {
				id: currentFestival.id,
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

const createUpdateRequest = async ({ festivalId, value, type }) => {
	try {
		if (!value) {
			return {
				message: "Value is required",
			};
		}
		const status = constants.REQUEST_STATUS.PENDING;
		await Models.ReviewTasks.create({
			type,
			value,
			festivalId,
			status,
		});
		return {
			success: true,
			message: "Updated successfully",
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const generateFestivalStages = async (params) => {
	try {
		const tabs = [
			{
				id: 1,
				title: "Festival Details",
				completed: false,
				issues: [],
			},
			{
				id: 2,
				title: "Contact & Venue",
				completed: false,
				issues: [],
			},
			{
				id: 3,
				title: "Dates & Deadlines",
				completed: false,
				issues: [],
			},
			{
				id: 4,
				title: "Category & Entry Fees",
				completed: false,
				issues: [],
			},
			{
				id: 5,
				title: "Listing Settings",
				completed: false,
				issues: [],
			},
		];
		const { userId } = params;
		const query = `select
			f.id, f.name, f.years_running,
			f.festival_type, f.description,
			f.terms, f.cover_url, f.logo_url,			
			f.email, f.listing_url, f.published, f.verified,

			fd.id festival_date_id,
			fd.opening_date,
			fd.notification_date,
			fd.festival_start,
			fd.festival_end,
      		fdd.id as festival_date_deadline_id,

      		fc.id festival_category_id
		  from festivals f
      		left join festival_dates fd on fd.festival_id = f.id and fd.festival_end > now()
      		left join festival_date_deadlines fdd on fdd.festival_date_id = fd.id
      		left join festival_categories fc on fc.festival_id = f.id
		  where user_id = $1
		  limit 1`;
		const response = await sequelize.query(query, {
			bind: [userId],
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
		const festivalData = response[0];
		let stage1Error = false;
		// Stage 1 Check | Festival Details
		if (!festivalData.name) {
			tabs[STAGE_1].issues.push("Name is required");
			stage1Error = true;
		}
		if (!festivalData.description) {
			tabs[STAGE_1].issues.push("Description is required");
			stage1Error = true;
		}
		if (!festivalData.terms) {
			tabs[STAGE_1].issues.push("Terms & condition is required");
			stage1Error = true;
		}
		if (!festivalData.festival_type?.length) {
			tabs[STAGE_1].issues.push("Festival type is not selected");
			stage1Error = true;
		}

		if (stage1Error === false) {
			tabs[STAGE_1].completed = true;
		}

		// Stage 2 Check | Contact & Venue
		let stage2Error = false;
		if (!festivalData.email?.length) {
			tabs[STAGE_2].issues.push("Festival email is required!");
			stage2Error = true;
		}

		if (stage2Error === false) {
			tabs[STAGE_2].completed = true;
		}

		// Stage 3 Check | Dead & deadline
		let stage3Error = false;
		// if (festivalData?.festival_date_id) {
		if (!festivalData.opening_date) {
			tabs[STAGE_3].issues.push("Festival Opening date is required!");
			stage3Error = true;
		}
		if (!festivalData.festival_date_deadline_id) {
			tabs[STAGE_3].issues.push("Atleast one deadline is required!");
			stage3Error = true;
		}
		if (!festivalData.notification_date) {
			tabs[STAGE_3].issues.push("Notification date is missing!");
			stage3Error = true;
		}
		if (!festivalData.festival_start || !festivalData.festival_end) {
			tabs[STAGE_3].issues.push(
				"Festival start and end dates are required!"
			);
			stage3Error = true;
		}
		// }
		if (stage3Error === false) {
			tabs[STAGE_3].completed = true;
		}

		// Stage 4 Check | Category
		let stage4Error = false;
		if (festivalData?.festival_category_id) {
			const categoryQuery = `select count(distinct(fdd.id)) fdd_count, count(distinct(fcf.festival_date_deadline_id)) fcf_count 
			from festival_date_deadlines fdd 
			left join festival_category_fees fcf on fcf.festival_date_deadline_id = fdd.id
			where fdd.festival_date_id = (select
						fd.id
					  from festivals f
			      left join festival_dates fd on fd.festival_id = f.id
					  where user_id = $1
			      order by fd.opening_date desc
			      limit 1)`;
			const categoryResponse = await sequelize.query(categoryQuery, {
				bind: [userId],
				type: QueryTypes.SELECT,
			});
			const countData = categoryResponse?.[0];
			if (!countData || countData.fdd_count !== countData.fcf_count) {
				tabs[STAGE_4].issues.push(
					"Festival entry fee is not updated for all categories"
				);
				stage4Error = true;
			}
		} else {
			tabs[STAGE_4].issues.push(
				"Atleast one festival category is required"
			);
			stage4Error = true;
		}
		if (stage4Error === false) {
			tabs[STAGE_4].completed = true;
		}

		// Stage 5 Check | Category
		let stage5Error = false;
		if (!festivalData.listing_url) {
			tabs[STAGE_5].issues.push(
				"Listing url is missing, make your custom festival url"
			);
			stage5Error = true;
		}
		if (stage5Error === false) {
			tabs[STAGE_5].completed = true;
		}

		return {
			success: true,
			data: {
				tabs,
				festivalId: festivalData.id,
				verified: festivalData?.verified || false,
				published: festivalData?.published || false,
			},
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getStageWiseData = async ({ festivalId, stageId }) => {
	try {
		if (!validation.validId(festivalId)) {
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
			const festivalData = await Models.Festivals.findOne({
				where: {
					id: festivalId,
				},
				attributes: [
					"id",
					"name",
					"festivalType",
					"yearsRunning",
					"description",
					"awards",
					"terms",
					"coverUrl",
					"coverHash",
					"logoUrl",
					"logoHash",
				],
				include: [
					{
						as: "festivalOrganizers",
						model: Models.FestivalOrganizers,
					},
				],
				order: [["festivalOrganizers", "relativeOrder", "asc"]],
			});
			if (!festivalData) {
				return {
					success: true,
					data: {},
				};
			}
			finalData = festivalData.toJSON();
		} else if (STAGE_2 === stageId) {
			const festivalData = await Models.Festivals.findOne({
				where: {
					id: festivalId,
				},
				attributes: [
					"id",
					"email",
					"phone",
					"address",
					"city",
					"state",
					"postalCode",
					"facebook",
					"instagram",
					"twitter",
					"website",
					"userId",
				],
				include: [
					{
						as: "festivalVenues",
						model: Models.FestivalVenues,
					},
				],
				order: [["festivalVenues", "relativeOrder", "asc"]],
			});
			if (!festivalData) {
				return {
					success: true,
					data: {},
				};
			}
			const user = await Models.Users.findOne({
				where: {
					id: festivalData.userId,
				},
				attributes: ["countryCode"],
			});
			finalData = festivalData.toJSON();
			finalData.country = user.countryCode;
			if (!finalData.email) {
				finalData.email = user.email;
			}
		} else if (STAGE_3 === stageId) {
			finalData = await deadlineHandler.getDeadlineForForm(festivalId);
		} else if (STAGE_4 === stageId) {
			const festivalData = await Models.Festivals.findOne({
				where: {
					id: festivalId,
				},
				attributes: ["id"],
				include: [
					{
						as: "festivalCategories",
						model: Models.FestivalCategories,
					},
				],
				order: [["festivalCategories", "relativeOrder", "asc"]],
			});
			if (!festivalData) {
				return {
					success: true,
					data: {},
				};
			}
			finalData = festivalData.toJSON();
		} else if (STAGE_5 === stageId) {
			const festivalData = await Models.Festivals.findOne({
				where: {
					id: festivalId,
				},
				attributes: [
					"id",
					"minimumRuntime",
					"maximumRuntime",
					"acceptsAllLength",
					"trackingPrefix",
					"startingNumber",
				],
				include: [
					{
						as: "festivalTags",
						model: Models.FestivalTags,
					},
					{
						as: "festivalFocus",
						model: Models.FestivalFocus,
					},
				],
			});
			if (!festivalData) {
				return {
					success: true,
					data: {},
				};
			}
			finalData = festivalData.toJSON();
			const festivalTags = (festivalData.festivalTags || []).map(
				(t) => t.festivalTagId
			);
			const festivalFocus = (festivalData.festivalFocus || []).map(
				(t) => t.festivalFocusId
			);
			finalData.festivalTags = festivalTags;
			finalData.festivalFocus = festivalFocus;
			if (finalData?.acceptsAllLength === null) {
				finalData.acceptsAllLength = true;
			}
			if (finalData?.minimumRuntime === null) {
				finalData.minimumRuntime = "";
			}
			if (finalData?.maximumRuntime === null) {
				finalData.maximumRuntime = "";
			}
			if (!festivalData?.listingUrl?.length) {
				const userName = await getUniqueUserNameForFestival(festivalId);
				finalData.listingUrl = userName;
			}
			if (!festivalData?.startingNumber) {
				finalData.startingNumber = "1001";
			}
			if (!festivalData?.trackingPrefix) {
				finalData.trackingPrefix = "FST";
			}
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

const uploadFestivalLogo = async (params = {}, logoFile) => {
	let transaction = null;
	const LOGO_MIN_REQUIRED_SIZE = 100;
	try {
		let { userId, festivalId: mFestivalId } = params;
		const festivalId = parseInt(mFestivalId, 10);
		let festival = {};
		if (
			!validation.validId(parseInt(festivalId)) &&
			!validation.validId(userId)
		) {
			return {
				message: err.invalid_request,
			};
		}
		if (!logoFile) {
			return {
				message: "Logo image is required",
			};
		}
		const imageSize = await sharp(logoFile.buffer).metadata();
		if (
			imageSize.width < LOGO_MIN_REQUIRED_SIZE ||
			imageSize.height < LOGO_MIN_REQUIRED_SIZE
		) {
			return {
				message: "Logo Size is too small",
			};
		}
		if (festivalId) {
			festival = {
				id: festivalId,
			};
		} else {
			transaction = await sequelize.transaction();
			festival = await Models.Festivals.create(
				{
					userId,
					name: "",
				},
				{ transaction }
			);
		}
		const { data, info } = await sharp(logoFile.buffer)
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
			{ file, name: `${festival.id}-logo.png` },
			aws.FESTIVAL_IMAGES_BUCKET
		);
		const logoHash = await blur(data);
		const currentStamp = moment().unix();
		const logoUrl = `${logoPath}?t=${currentStamp}`;
		await Models.Festivals.update(
			{
				logoUrl,
				logoHash,
			},
			{
				transaction,
				where: {
					id: festival.id,
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
				id: festival.id,
				logoUrl,
				logoHash,
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

const uploadFestivalCover = async (params, coverFile) => {
	let transaction = null;
	const COVER_MIN_REQUIRED_WIDTH = 200;
	const COVER_MIN_REQUIRED_HEIGHT = 67; //Based on 1/3 Aspect Ratio
	try {
		let { userId, festivalId: mFestivalId } = params;
		const festivalId = parseInt(mFestivalId, 10);
		let festival = {};
		if (
			!validation.validId(parseInt(festivalId)) &&
			!validation.validId(userId)
		) {
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
		if (festivalId) {
			festival = {
				id: festivalId,
			};
		} else {
			transaction = await sequelize.transaction();
			festival = await Models.Festivals.create(
				{
					userId,
					name: "",
				},
				{ transaction }
			);
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
			{ file, name: `${festival.id}-cover.jpeg` },
			aws.FESTIVAL_IMAGES_BUCKET
		);
		const coverHash = await blur(data);
		const currentStamp = moment().unix();
		const coverUrl = `${coverPath}?t=${currentStamp}`;
		await Models.Festivals.update(
			{
				coverUrl,
				coverHash,
			},
			{
				transaction,
				where: {
					id: festival.id,
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
				id: festival.id,
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

const getFestivalData = async ({ festivalId }) => {
	let festivalData = await Models.Festivals.findOne({
		where: {
			id: festivalId,
		},
		include: [
			{
				as: "festivalOrganizers",
				model: Models.FestivalOrganizers,
			},
			{
				as: "festivalVenues",
				model: Models.FestivalVenues,
			},
			{
				as: "festivalTags",
				model: Models.FestivalTags,
			},
			{
				as: "festivalFocus",
				model: Models.FestivalFocus,
			},
			{
				as: "festivalCategories",
				model: Models.FestivalCategories,
			},
		],
		order: [
			["festivalOrganizers", "relativeOrder", "asc"],
			["festivalVenues", "relativeOrder", "asc"],
			["festivalCategories", "relativeOrder", "asc"],
		],
	});
	if (!festivalData) {
		return {
			message: err.festival_not_found,
		};
	}
	const user = await Models.Users.findOne({
		where: {
			id: festivalData.userId,
		},
		attributes: ["countryCode", "email"],
	});
	const festivalDate = await deadlineHandler.getDeadlineForForm(festivalId);
	const finalData = festivalData.toJSON();
	const festivalTags = (festivalData.festivalTags || []).map(
		(t) => t.festivalTagId
	);
	const festivalFocus = (festivalData.festivalFocus || []).map(
		(t) => t.festivalFocusId
	);
	finalData.festivalTags = festivalTags;
	finalData.festivalFocus = festivalFocus;
	finalData.country = user.countryCode;
	if (!finalData.email) {
		finalData.email = user.email;
	}
	finalData.festivalDate = festivalDate;

	if (!festivalData?.listingUrl?.length) {
		const userName = await getUniqueUserNameForFestival(festivalId);
		finalData.listingUrl = userName;
	}
	if (!festivalData?.startingNumber) {
		finalData.startingNumber = "1001";
	}

	return {
		success: true,
		data: finalData,
	};
};

const getFestivalCategoryData = async ({ festivalId, festivalCategoryId }) => {
	//Category Data
	if (!festivalId && !festivalCategoryId) {
		return {
			message: err.bad_request,
		};
	}
	try {
		const festivalCategoryFees = [];
		let categoryEmptyData = {
			name: "",
			description: "",
			festivalId,
			runtimeValue: "",
			projectOrigins: [],
			runtimeType: global.FESTIVAL_RUNTIMES.ANY,
		};
		let categoryData = null;
		if (festivalCategoryId) {
			categoryData = await Models.FestivalCategories.findOne({
				where: {
					id: festivalCategoryId,
				},
				include: {
					as: "festivalCategoryFees",
					model: Models.FestivalCategoryFees,
				},
			});
		}
		const currentFestivalDates = await Models.FestivalDates.findOne({
			where: {
				festivalId,
			},
			include: {
				as: "festivalDateDeadlines",
				model: Models.FestivalDateDeadlines,
			},
			order: [["festivalDateDeadlines", "date", "asc"]],
		});

		const categoryFeeMap = {};
		if (
			festivalCategoryId &&
			categoryData?.festivalCategoryFees?.length > 0
		) {
			categoryData?.festivalCategoryFees.forEach((categoryFee) => {
				categoryFeeMap[categoryFee.festivalDateDeadlineId] =
					categoryFee;
			});
		}
		const deadlines = currentFestivalDates?.festivalDateDeadlines || [];
		for (const deadline of deadlines) {
			const categoryFeeFilled = categoryFeeMap[deadline.id] || {};
			const id = categoryFeeFilled?.id;
			const standardFee = categoryFeeFilled?.standardFee;
			const goldFee = categoryFeeFilled?.goldFee;
			const enabled =
				categoryFeeFilled?.enabled === undefined
					? true
					: categoryFeeFilled.enabled;
			const categoryFee = {
				id, //Can be undefined
				festivalCategoryId, //Can be undefined
				enabled,
				festivalDeadlineName: deadline.name,
				festivalDateDeadlineId: deadline.id,
				standardFee,
				goldFee,
			};
			festivalCategoryFees.push(categoryFee);
		}

		let finalData = null;
		if (festivalCategoryId) {
			finalData = categoryData.toJSON();
		} else {
			finalData = categoryEmptyData;
		}

		return {
			success: true,
			data: {
				...finalData,
				festivalCategoryFees,
			},
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getFestivalSubmissionCategory = async ({ festivalId, filmId }) => {
	const currentDeadline = await deadlineHandler.getFestivalCurrentDeadline(
		festivalId
	);
	if (!currentDeadline) {
		return {
			message: err.all_deadline,
		};
	}
	const festivalDate = await Models.FestivalDates.findOne({
		attributes: [],
		where: {
			id: currentDeadline.festivalDateId,
		},
		include: {
			as: "currency",
			model: Models.Currencies,
		},
	});
	if (!festivalDate) {
		return {
			message: err.festival_not_found,
		};
	}
	const filmData = await Models.Films.findOne({
		attributes: ["id"],
		where: {
			id: filmId,
		},
		include: {
			as: "user",
			model: Models.Users,
			attributes: ["id"],
			include: {
				as: "currency",
				model: Models.Currencies,
			},
		},
	});
	if (!filmData) {
		return {
			message: err.film_not_found,
		};
	}
	const isGoldMember = await membershipHandler.isGoldMember(filmData.user.id);
	const categoryFeeQuery = `select
		fcf.*,
		fc.name,
		exists(
			select 
				ct.id
			from cart ct where 
			ct.film_id = ${filmData.id} and 
			ct.festival_category_fee_id = fcf.id
		) already_added_to_cart,
		exists(
			select 
				fs.id
			from festival_submissions fs where
			fs.film_id = ${filmData.id} and fs.festival_category_fee_id = fcf.id
		) already_submitted
		from festival_category_fees as fcf
	join festival_categories as fc on fc.id = fcf.festival_category_id
	where fcf.festival_date_deadline_id = ${currentDeadline.id}
	order by fc.relative_order asc`;
	const festivalCategoryFees = await sequelize.query(categoryFeeQuery, {
		type: QueryTypes.SELECT,
	});
	const finalCategoryFees = [];
	for (let festivalCategoryFee of festivalCategoryFees) {
		const festivalCurrency = festivalDate.currency;
		const filmCurrency = filmData.user.currency;
		const mGoldFee = await currencyHandler.getVisibleCurrency(
			festivalCategoryFee.gold_fee,
			filmCurrency,
			festivalCurrency
		);
		const mStandardFee = await currencyHandler.getVisibleCurrency(
			festivalCategoryFee.standard_fee,
			filmCurrency,
			festivalCurrency
		);
		if (!mGoldFee || !mStandardFee) {
			continue;
		}
		const category = {
			id: festivalCategoryFee.id,
			name: festivalCategoryFee.name,
			enabled: festivalCategoryFee.enabled,
			goldFee: mGoldFee.amount,
			standardFee: mStandardFee.amount,
			alreadyAddedToCart: festivalCategoryFee.already_added_to_cart,
			festivalCategoryId: festivalCategoryFee.festival_category_id,
			festivalDateDeadlineId:
				festivalCategoryFee.festival_date_deadline_id,
			isGoldMember,
			currency: {
				symbol: filmCurrency.symbol,
			},
		};
		finalCategoryFees.push(category);
	}

	return {
		data: finalCategoryFees,
		success: true,
	};
};

const getFestivalTypes = async ({ uiFriendly = true }) => {
	const festivalTypes = await Models.FestivalTypes.findAll({
		where: {
			status: 1,
		},
		raw: true,
	});
	if (uiFriendly) {
		const formatted = festivalTypes.map((festival) => ({
			value: festival.id,
			label: festival.title,
		}));
		return {
			success: true,
			data: formatted,
		};
	}
	return {
		success: false,
		data: festivalTypes,
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
		  f.id,
		  f.name title, 
		  f.logo_url "logoUrl", 
		  f.logo_hash "logoHash",
		  f.published "isPublished",
		  f.verified "isVerified",
		  c.symbol "currency",
		  c.code "currencyCode",
		  count((select id from cart where user_id = f.user_id)) "cartCount",
		  tc.config "tinodeData"
		from festivals f
		  join users u on u.id = f.user_id
		  left join tinode_config tc on tc.festival_id = f.id
		  join currencies c on c.id = u.currency_id
		where f.user_id = $userId
		group by f.id, c.symbol, c.code, tc.config
		limit 1`;
		const result = await sequelize.query(query, {
			bind: {
				userId,
			},
			type: QueryTypes.SELECT,
		});
		const response = {
			success: true,
			data: null,
		};
		const festivalData = result?.[0];
		const seasonData = await deadlineHandler.getCurrentSession(userId);
		let hasAnySeason = false;
		let seasonText = "";
		let seasonDateText = "";
		let salesSummary = null;
		let payoutSummary = null;
		let submissions = [];
		let hasMoreSubmissions = false;
		let submissionAgg = {};
		const currentMoment = moment();
		let isSeasonEnded = false;
		if (seasonData) {
			const seasonStartMoment = moment(seasonData.opening_date);
			const seasonEndMoment = moment(seasonData.festival_end);
			isSeasonEnded = currentMoment > seasonEndMoment;
			seasonText = isSeasonEnded ? "Previous Season" : "Current Season";
			seasonDateText =
				seasonStartMoment.format("MMM YYYY") +
				" to " +
				seasonEndMoment.format("MMM YYYY");
			hasAnySeason = true;
			salesSummary = await festivalHandler.getFestivalSalesSummary({
				festivalDateId: seasonData.id,
			});
			payoutSummary = await festivalHandler.getFestivalPayoutSummary(
				seasonData.id
			);
		}

		if (hasAnySeason && !isSeasonEnded) {
			const submissionData = await getSubmissions({
				festivalDateId: seasonData.id,
				limit: 3,
			});
			if (submissionData?.success) {
				hasMoreSubmissions = submissionData.data?.length > 2;
				submissions = submissionData.data.slice(0, 2);
			}
		}

		if (hasAnySeason && isSeasonEnded) {
			submissionAgg = await festivalHandler.getSubmissionAgg(
				seasonData.id
			);
		}

		if (festivalData) {
			const tempData = {
				...festivalData,
				hasAnySeason,
				seasonText,
				seasonDateText,
				salesSummary,
				payoutSummary,
				submissions,
				isSeasonEnded,
				hasMoreSubmissions,
				submissionAgg,
			};
			response.data = tempData;
		}
		return response;
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getFestivalViewData = async (params) => {
	try {
		let { userId, festivalId } = params;
		let isOwner = false;
		if (!festivalId) {
			isOwner = true;
			const currentFestival = await Models.Festivals.findOne({
				where: {
					userId,
				},
				attributes: ["id"],
			});
			festivalId = currentFestival.id;
		}
		const query = `select 
		  f.id,
		  f.name, 
		  f.awards,
		  f.terms,
		  f.description,
		  f.logo_url "logoUrl", 
		  f.logo_hash "logoHash",
		  f.cover_url "coverUrl", 
		  f.cover_hash "coverHash",
		  c.symbol "currency",
		  c.code "currencyCode",
		  fo.organizers,
		  ph.photos,
		  exists(select id from user_likes ulk where ulk.festival_id = f.id and ulk.user_id = $userId limit 1) "isLiked",
		  (select tc.config from tinode_config tc where tc.festival_id = f.id) "tinodeData",
		  (select round(avg(fr.overall_rating), 1) from festival_reviews fr where fr.festival_id = $id) rating,
		  exists(
		    select id from festival_dates fd where fd.festival_id = f.id and fd.festival_end > now() limit 1
		  ) "entriesActive"
		  from festivals f
			join users u on u.id = f.user_id
		    join currencies c on c.id = u.currency_id
		    left join lateral (
		     select  json_agg(
		       og_list.*
		     ) organizers from (
		        select id, name, designation
		       	from festival_organizers
		       	where festival_id = $id
		        order by relative_order asc
		     ) og_list
		    ) fo on true
		  	left join lateral (
		     select  json_agg(
		       photo_list.*
		     ) photos from (
		       select 
		       	id, url, hash, thumb_url, width, height, format
		       	from festival_photos 
		       	where festival_id = $id 
		       	order by relative_order asc 
		       	limit 5
		     ) photo_list
		  	) ph on true
			where f.id = $id`;
		const result = await sequelize.query(query, {
			type: QueryTypes.SELECT,
			bind: {
				id: festivalId,
				userId,
			},
		});
		const data = result?.[0];
		if (!data) {
			throw new Error(err.festival_not_found);
		}
		data.isOwner = isOwner;
		const currentUserData = await Models.Users.findOne({
			where: {
				id: userId,
			},
		});
		data.workType = currentUserData.workType;
		const category = await getCategoryWithDeadlines({
			userId,
			festivalId: festivalId,
		});
		if (category.success) {
			data.festivalFeeCategories = category.data;
		} else {
			data.festivalFeeCategories = [];
		}
		const timeline = await getFestivalDateTimeline({
			festivalId: festivalId,
		});
		if (timeline.success) {
			data.festivalDateDeadlines = timeline.data;
		} else {
			data.festivalDateDeadlines = [];
		}
		if (data.photos === null) {
			data.photos = [];
		}
		return {
			success: true,
			data,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getContactAndVenue = async ({ festivalId }) => {
	try {
		const response = await Models.Festivals.findOne({
			where: {
				id: festivalId,
			},
			attributes: [
				"id",
				"email",
				"country",
				"address",
				"city",
				"state",
				"postalCode",
				"facebook",
				"instagram",
				"twitter",
			],
			include: {
				as: "festivalVenues",
				model: Models.FestivalVenues,
				required: false,
			},
		});
		return {
			success: true,
			data: response,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getFestivalListingUrl = async ({ userId, festivalId }) => {
	if (!userId && !festivalId) {
		return {
			message: err.festival_not_found,
		};
	}
	let where = {};
	if (festivalId) {
		where.id = festivalId;
	} else if (userId) {
		where.userId = userId;
	}
	const festivalData = await Models.Festivals.findOne({
		attributes: ["id", "listingUrl"],
		where,
	});
	if (!festivalData) {
		return {
			message: err.festival_not_found,
		};
	}
	return {
		success: true,
		data: {
			id: festivalData.id,
			listingUrl: festivalData.listingUrl,
		},
	};
};

const getButtonAndLogo = async (params) => {
	const response = await getFestivalListingUrl(params);
	if (!response.success) {
		return response;
	}
	const festivalData = {
		logoImage: "defaultimages/logo.png",
		backgroundImage: "defaultimages/submit-Button.png",
		listingUrl: response.data.listingUrl,
		festivalId: response.data.id,
		submitButtons: [
			{
				id: 1,
				background: ["#3FAEFF", "#6D6FFE"],
			},
			{
				id: 2,
				background: ["#563FFF", "#B52AC9"],
			},
			{
				id: 3,
				background: ["#77CBA2", "#48A259"],
			},
			{
				id: 4,
				background: ["#FF7F3F", "#B52AC9"],
			},
			{
				id: 5,
				background: ["#000000", "#434343"],
			},
		],
	};
	return {
		success: true,
		data: festivalData,
	};
};

const getFestivalFlags = async ({ festivalId }) => {
	if (!festivalId) {
		return {
			message: err.festival_not_found,
		};
	}
	const flags = await sequelize.query(
		`select 
			fg.id, 
			fg.title, 
			fg.color, 
			fg.festival_id "festivalId", 
			(case 
				when (select true from festival_submissions where flag_id = fg.id limit 1) = true 
				then true 
				else false end 
			) "isUsed" 
		from festival_flags fg where fg.festival_id = $1`,
		{
			bind: [festivalId],
			type: QueryTypes.SELECT,
		}
	);
	return {
		success: true,
		data: flags,
	};
};

const createDefaultFlag = async ({ festivalId }) => {
	const created = await festivalHandler.createDefaultFestivalFlags(
		festivalId
	);
	if (!created) {
		return {
			message: "Unable to create or already created",
		};
	}
	return {
		success: true,
		data: "Created",
	};
};

const saveFestivalFlags = async ({ flags = [], festivalId }) => {
	if (!festivalId) {
		return {
			message: err.festival_not_found,
		};
	}
	// Validation
	let flagNameError = 0;
	let flagsToCreate = [];
	let flagsToDelete = [];

	let newFlagSet = new Set();
	let oldFlagSet = new Set();
	let transaction = null;
	try {
		const oldFlagList = await Models.FestivalFlags.findAll({
			attributes: ["id"],
			where: {
				festivalId,
			},
		});

		(oldFlagList || []).forEach((flag) => {
			oldFlagSet.add(flag.id);
		});

		flags.forEach((flag) => {
			if (!validation.validName(flag.title, 1)) {
				flagNameError += 1;
			}
			if (flag.id) {
				newFlagSet.add(flag.id);
			}
		});

		if (oldFlagSet.size) {
			const toBeDeleted = new Set(
				[...oldFlagSet].filter((i) => !newFlagSet.has(i))
			);
			flagsToDelete = Array.from(toBeDeleted);
		}

		if (flagNameError) {
			return {
				message:
					flagNameError +
					`flag${flagNameError > 1 ? "s" : ""} don't have name`,
			};
		}

		flags.forEach((flag) => {
			if (flag.id) {
				Models.FestivalFlags.update(
					{ color: flag.color, title: flag.title },
					{
						where: {
							id: flag.id,
						},
					}
				);
			} else {
				flagsToCreate.push({
					color: flag.color,
					title: flag.title,
					festivalId,
				});
			}
		});

		if (flagsToCreate.length) {
			Models.FestivalFlags.bulkCreate(flagsToCreate);
		}

		if (flagsToDelete.length) {
			transaction = await sequelize.transaction();
			await Models.FestivalSubmissions.update(
				{ flagId: null },
				{
					where: {
						flagId: flagsToDelete,
					},
					transaction,
				}
			);

			await Models.FestivalFlags.destroy({
				where: {
					id: flagsToDelete,
				},
				transaction,
			});
		}

		if (transaction) {
			transaction.commit();
		}
		return {
			success: true,
			data: "Updated!",
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

const createFestivalJudge = async ({
	id,
	email,
	festivalId,
	permissions = [],
}) => {
	if (!permissions.length) {
		return {
			message: "Atleast one permission is required",
		};
	}

	if (!id) {
		if (!festivalId) {
			return {
				message: err.festival_not_found,
			};
		}
		const festivalData = await Models.Festivals.findOne({
			where: {
				id: festivalId,
			},
			attributes: ["id", "userId"],
		});
		if (!festivalData) {
			return {
				message: err.festival_not_found,
			};
		}
		if (!validation.validateEmail(email)) {
			return {
				message: err.invalid_email,
			};
		}
		const userData = await Models.Users.findOne({
			where: {
				email,
			},
			attributes: ["id", "firstName", "lastName"],
		});
		if (festivalData.userId === userData.id) {
			return {
				message: "You cannot assign festival owner as judge",
			};
		}

		if (!userData) {
			return {
				message:
					"User is not registered, please ask judge to create account of FilmFestBook",
			};
		}

		const alreadyCreated = await Models.FestivalJudges.findOne({
			userId: userData.id,
			festivalId: festivalData.id,
		});

		if (alreadyCreated) {
			return {
				message: "Judge Already Added",
			};
		}

		const created = await Models.FestivalJudges.create({
			userId: userData.id,
			festivalId: festivalData.id,
			permissions,
		});
		return {
			success: true,
			data: {
				...created.toJSON(),
				firstName: userData.firstName,
				lastName: userData.lastName,
				email,
			},
		};
	}

	await Models.FestivalJudges.update(
		{ permissions },
		{
			where: {
				id: id,
			},
		}
	);
	return {
		success: true,
		data: {
			id,
			permissions,
		},
	};
};

const deleteFestivalJudge = async ({ festivalJudgeId }) => {
	await Models.FestivalJudges.destroy({
		where: {
			id: festivalJudgeId,
		},
	});
	return {
		success: true,
		data: "Deleted!",
	};
};

const getFestivalJudges = async ({ festivalId }) => {
	if (!festivalId) {
		return {
			message: err.festival_not_found,
		};
	}
	const judges = await sequelize.query(
		`select j.id, u.first_name "firstName", u.last_name "lastName", u.email, j.permissions from festival_judges j
	join users u on u.id = j.user_id
	where j.festival_id = $1`,
		{
			bind: [festivalId],
			type: QueryTypes.SELECT,
		}
	);
	return {
		success: true,
		data: judges || [],
	};
};

const updateNotificationPreference = async (params = {}) => {
	const { festivalId, notifyPerf = "default" } = params;
	if (ALLOWED_NOTIFY_PERF.indexOf(notifyPerf) === -1) {
		return {
			message: "Unknown notify perference",
		};
	}
	await Models.Festivals.update(
		{
			notifyPerf,
		},
		{
			where: {
				id: festivalId,
			},
		}
	);
	return {
		success: true,
		data: "Updated!",
	};
};

const getNotificationPerf = async ({ festivalId }) => {
	if (!festivalId) {
		return {
			message: err.festival_not_found,
		};
	}
	const festivalData = await Models.Festivals.findOne({
		where: {
			id: festivalId,
		},
		attributes: ["notifyPerf"],
	});
	if (!festivalData) {
		return {
			message: err.festival_not_found,
		};
	}
	return {
		success: true,
		data: {
			notifyPerf: festivalData.notifyPerf,
		},
	};
};

// TODO: Modify to do every thing on server
const getSubmissions = async ({ festivalDateId, limit, offset }) => {
	try {
		let limitOffset = "";
		if (limit) {
			limitOffset += `limit ${limit}`;
		}
		if (offset) {
			limitOffset += `offset ${offset}`;
		}
		const query = `with category_ids as (
		  select fcf.id as fcf_id from festival_dates fd
		  join festival_date_deadlines fdd on fdd.festival_date_id = fd.id
		  join festival_category_fees fcf on fcf.festival_date_deadline_id = fdd.id
		  where fd.id = $1
		)
		select
			fs.id,
			fm.title,
			to_char(interval '1 second' * fm.runtime_seconds, 'HH24:MI:SS') as runtime,
			fc.name category,
			fm.country_of_orgin origin,
			to_char(fs.created_at, 'Mon DD, YYYY') date,
			fs.status,
			fs.tracking_id "trackingId",
			fs.judging_status "judgingStatus",
			json_build_object(
			    'id', fg.id,
			    'title', fg.title,
			    'color', fg.color
			) flag
		from festival_submissions fs
		join films fm on fm.id = fs.id
		join festival_category_fees fcf on fcf.id = fs.festival_category_fee_id
		join festival_categories fc on fc.id = fcf.festival_category_id
		left join festival_flags fg on fg.id = fs.festival_flag_id
		where fs.festival_category_fee_id in (
		  select fcf_id from category_ids
		)
		order by created_at desc
		${limitOffset}`;

		console.log(query);
		const submissions = await sequelize.query(query, {
			bind: [festivalDateId],
			type: QueryTypes.SELECT,
		});
		return {
			success: true,
			data: submissions,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getFestivalSeasons = async ({ festivalId }) => {
	try {
		const query = `select
			id,
			notification_date "notificationDate",
			opening_date "openingDate",
			festival_start "festivalStart",
			festival_end "festivalEnd"
		from festival_dates where festival_id = $1 and is_active = true`;
		const submissions = await sequelize.query(query, {
			bind: [festivalId],
			type: QueryTypes.SELECT,
		});
		return {
			success: true,
			data: submissions,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getSubmissionFilters = async (params) => {
	try {
		const { festivalId } = params;
		if (!festivalId) {
			return {
				message: err.festival_not_found,
			};
		}
		const flags = await Models.FestivalFlags.findAll({
			where: {
				festivalId,
			},
		});
		const seasons = await getFestivalSeasons(params);
		if (!seasons.success) {
			return seasons;
		}

		const festivalCategories = await Models.FestivalCategories.findAll({
			where: {
				festivalId,
			},
		});

		return {
			success: true,
			data: {
				flags,
				seasons: seasons.data,
				categories: festivalCategories,
			},
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const filterFestivals = async (filterParams = {}) => {
	try {
		const {
			name = "",
			entryType = "",
			festivalTags = [],
			festivalFocus = [],
			country,
			feeRange = [0, 100],
			yearRange = [0, 30],
			limit,
			offset,
		} = filterParams;

		let whereFilters = "";
		let outerWhereFilters = "";
		let joinFilters = "";

		if (name?.length) {
			whereFilters += ` and fs.name ilike '%${name}%' `;
		}

		if (typeof entryType === "string" && entryType.length) {
			// TODO: entry open explicit column in festivals table
			if (entryType === "open") {
				outerWhereFilters += " and fsd.is_entry_opened is not null  ";
			} else if (entryType === "close") {
				outerWhereFilters += " and fsd.is_entry_opened is null  ";
			}
		}

		if (festivalTags.length) {
			joinFilters +=
				" join festival_tags ft on ft.festival_id = fs.id and ft.festival_tag_id in $festivalTags ";
		}

		if (festivalFocus.length) {
			joinFilters +=
				" join festival_focus fc on fc.festival_id = fs.id and fc.festival_focus_id in $festivalFocus ";
		}

		if (country) {
			whereFilters += ` and country = ${country} `;
		}

		if (yearRange?.length === 2) {
			const startYear = yearRange[0];
			const endYear = yearRange[1];

			const defaultYearRange = [0, 30];
			if (
				startYear !== defaultYearRange[0] ||
				endYear !== defaultYearRange[1]
			) {
				whereFilters += ` and years_running between ${startYear} and ${endYear} `;
			}
		}

		let feeRangeDataQuery = ["", ""];
		if (feeRange?.length === 2) {
			const startFee = feeRange[0];
			const endFee = feeRange[1];

			const defaultFeeRange = [0, 100];
			const isNotDefault =
				startFee !== defaultFeeRange[0] ||
				endFee !== defaultFeeRange[1];
			if (isNotDefault) {
				feeRangeDataQuery[0] = `,
				fee_range_data as (
				  select festival_data.id, min(fcf.standard_fee) fee_min, max(fcf.standard_fee) fee_max from festival_dates fd
				  join festival_data on fd.festival_id = festival_data.id
				  join festival_date_deadlines fdd on fdd.festival_date_id = fd.id
				  join festival_category_fees fcf on fcf.festival_date_deadline_id = fdd.id
				  group by fd.id, festival_data.id
				  order by fd.opening_date desc
				  limit 1
				)`;

				feeRangeDataQuery[1] =
					" left join fee_range_data frd on frd.id = fsd.id ";

				if (endFee === defaultFeeRange[1]) {
					outerWhereFilters += ` and frd.fee_min >= ${startFee} `;
				} else {
					outerWhereFilters += ` and ${startFee} >= frd.fee_min and frd.fee_max <= ${endFee}`;
				}
			}
		}

		outerWhereFilters = outerWhereFilters.slice(4);

		let limitOffset = "";

		if (limit) {
			limitOffset += ` limit ${limit}`;
		}

		if (offset) {
			limitOffset += ` offset ${offset}`;
		}

		const query = `with festival_data as (
		   select 
		    distinct(fs.id),
		    fs.name,
		    fs.logo_url "logoUrl",
		    fs.logo_hash "logoHash",
		    fs.cover_url "coverUrl",
		    fs.cover_hash "coverHash",
		    fs.address,
		    fs.country,
		    fs.city,
		    fs.state,
		    fs.years_running "yearsRunning",
		    (select fdd.date from festival_dates fd
		      join festival_date_deadlines fdd on fdd.festival_date_id = fd.id and fdd.date >= now()
		      where fd.festival_id = fs.id		      
		      order by fdd.date asc
		      limit 1
		    ) is_entry_opened
		  from festivals fs  
		  ${joinFilters}
		  where fs.published = true ${whereFilters}
		)
		${feeRangeDataQuery[0]}
		select fsd.* from festival_data fsd
		${feeRangeDataQuery[1]}
		${outerWhereFilters.length ? "where " + outerWhereFilters : ""}
		order by fsd.is_entry_opened asc
		${limitOffset}`;

		const festivals = await sequelize.query(query, {
			bind: {
				festivalTags,
				festivalFocus,
			},
			type: QueryTypes.SELECT,
		});
		return {
			success: true,
			data: festivals,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getCategoryWithDeadlines = async ({ userId, festivalId }) => {
	if (!festivalId) {
		return {
			message: err.festival_not_found,
		};
	}
	const viewerId = userId;
	const query = `select 
		fc.id,
	  fc.name "categoryName",
	  fdd.id "deadlineDateId",
	  fdd.date "deadlineDate",
	  fdd.name "deadlineName",
	  fcf.enabled "feeEnabled",
	  fcf.standard_fee "standardFee",
	  fcf.gold_fee "goldFee",
	  (select cr.code from festivals fs
	   join users u on u.id = fs.user_id
	   join currencies cr on cr.id = u.currency_id 
	   where fs.id = $1
	  ) "currencyCode",
	  (select cr.symbol from festivals fs
	   join users u on u.id = fs.user_id
	   join currencies cr on cr.id = u.currency_id 
	   where fs.id = $1) "currencySymbol"
	from festival_categories fc
	join festival_category_fees fcf on fcf.festival_category_id = fc.id
	join festival_date_deadlines fdd on fdd.id = fcf.festival_date_deadline_id
	where fc.festival_id = $1
	order by fc.relative_order asc, fdd.date asc`;
	try {
		const records = await sequelize.query(query, {
			bind: [festivalId],
			type: QueryTypes.SELECT,
		});
		const viewerData = await Models.Users.findOne({
			where: {
				id: viewerId,
			},
			attributes: [],
			include: {
				model: Models.Currencies,
				as: "currency",
				attributes: ["code"],
			},
		});
		const updatedRecords = [];

		// Update record with currency values
		const deadlineDateCurrentMap = new Map();
		const currentMoment = moment();
		for (const record of records) {
			const festivalCurrency = record.currencyCode;
			const viewerCurrency = viewerData.currency.code;
			const mGoldFee = await currencyHandler.getVisibleCurrency(
				record.goldFee,
				viewerCurrency,
				festivalCurrency
			);
			const mStandardFee = await currencyHandler.getVisibleCurrency(
				record.standardFee,
				viewerCurrency,
				festivalCurrency
			);
			record.goldFee = mGoldFee;
			record.standardFee = mStandardFee;

			const deadlineDateMoment = moment(record.deadlineDate);
			if (deadlineDateMoment >= currentMoment) {
				if (deadlineDateCurrentMap.has(record.id)) {
					const previous = deadlineDateCurrentMap.get(record.id);
					const previousMoment = moment(previous.deadlineDate);
					if (deadlineDateMoment < previousMoment) {
						deadlineDateCurrentMap.set(record.id, {
							id: record.deadlineDateId,
							date: record.deadlineDate,
						});
					}
				} else {
					deadlineDateCurrentMap.set(record.id, {
						id: record.deadlineDateId,
						date: record.deadlineDate,
					});
				}
			}
			updatedRecords.push(record);
		}

		const categories = [];
		const categoryIdxMap = new Map();
		let idx = 0;
		// Category with deadlines
		for (const record of updatedRecords) {
			if (!categoryIdxMap.has(record.id)) {
				categoryIdxMap.set(record.id, idx++);
			}

			const categoryIndex = categoryIdxMap.get(record.id);

			if (!categories[categoryIndex]) {
				categories[categoryIndex] = {
					id: record.id,
					name: record.categoryName,
					deadlines: [],
				};
			}

			let isCurrent = false;
			const currentDeadlineId = deadlineDateCurrentMap.get(record.id);
			if (
				currentDeadlineId &&
				currentDeadlineId.id === record.deadlineDateId
			) {
				isCurrent = true;
			}
			const formattedDate = moment(record.deadlineDate).format(
				global.DDMMMYYYY
			);
			categories[categoryIndex].deadlines.push({
				id: record.deadlineDateId,
				date: record.deadlineDate,
				dateFormatted: formattedDate,
				name: record.deadlineName,
				currencyCode: record.currencyCode,
				currencySymbol: record.currencySymbol,
				goldFee: record.goldFee.amount,
				standardFee: record.standardFee.amount,
				isCurrent,
			});
		}

		return {
			success: true,
			data: categories,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getFestivalDateTimeline = async ({ festivalId }) => {
	const fd = (d) => {
		return moment(d).format(global.MMMMDDYYYY);
	};
	const currentMoment = moment();
	const isExpired = (d) => {
		const dMoment = moment(d);
		return dMoment < currentMoment;
	};
	const currentSeason = await deadlineHandler.getCurrentSession(
		null,
		festivalId
	);
	if (!currentSeason) {
		return {
			message: err.no_festival_season,
		};
	}

	let currentDeadlineFound = false;
	const festivalTimeline = [
		{
			id: "od",
			name: "Opening Date",
			date: currentSeason.opening_date,
			formattedDate: fd(currentSeason.opening_date),
			isCurrent: false,
			isExpired: isExpired(currentSeason.opening_date),
		},
	];
	const deadlines = await Models.FestivalDateDeadlines.findAll({
		where: {
			festivalDateId: currentSeason.id,
		},
		order: [["date", "asc"]],
	});
	for (const deadline of deadlines) {
		let current = false;
		let expired = false;
		const deadlineMoment = moment(deadline.date);
		if (!currentDeadlineFound) {
			if (deadlineMoment >= currentMoment) {
				currentDeadlineFound = true;
				current = true;
			}
		}
		if (deadlineMoment < currentMoment) {
			expired = true;
		}
		festivalTimeline.push({
			id: deadline.id,
			name: deadline.name,
			date: deadline.date,
			formattedDate: fd(deadline.date),
			isCurrent: current,
			isExpired: expired,
		});
	}
	festivalTimeline.push({
		id: "nd",
		name: "Notification Date",
		date: currentSeason.notification_date,
		formattedDate: fd(currentSeason.notification_date),
		isCurrent: false,
		isExpired: isExpired(currentSeason.notification_date),
	});

	let festivalDateFormatted = "";
	const festivalStartMoment = moment(currentSeason.festival_start);
	const festivalEndMoment = moment(currentSeason.festival_end);
	if (
		festivalStartMoment.format("MM-YYYY") ===
		festivalEndMoment.format("MM-YYYY")
	) {
		const month = festivalStartMoment.format("MMMM");
		const startDate = festivalStartMoment.format("DD");
		const endDate = festivalEndMoment.format("DD");
		const year = festivalStartMoment.format("YYYY");
		festivalDateFormatted = `${month} ${startDate} - ${endDate}, ${year}`;
	} else {
		const startMonth = festivalStartMoment.format("MMM");
		const endMonth = festivalEndMoment.format("MMM");

		const startYear = festivalStartMoment.format("YYYY");
		const endYear = festivalEndMoment.format("YYYY");

		const startDate = festivalStartMoment.format("DD");
		const endDate = festivalEndMoment.format("DD");

		if (startYear === endYear) {
			festivalDateFormatted = `${startMonth} ${startDate} - ${endMonth} ${endDate}, ${endYear}`;
		} else {
			festivalDateFormatted = `${startMonth} ${startDate} ${startYear} - ${endMonth} ${endDate} ${endYear}`;
		}
	}
	festivalTimeline.push({
		id: "fd",
		name: "Festival Date",
		startDate: currentSeason.festival_start,
		endDate: currentSeason.festival_end,
		formattedDate: festivalDateFormatted,
		isCurrent: false,
		isExpired: isExpired(currentSeason.festival_start),
	});

	return {
		success: true,
		data: festivalTimeline,
	};
};

const publishFestival = async (params) => {
	try {
		const stageData = await generateFestivalStages(params);
		if (stageData.success && stageData.data?.festivalId) {
			let allIssues = [];
			stageData.data.tabs.forEach(({ issues }) => {
				allIssues = [...allIssues, ...issues];
			});
			if (allIssues.length) {
				return {
					message:
						"Please fill all necessary details of festival to publish",
				};
			}
		} else {
			return {
				message: err.festival_not_found,
			};
		}
		await Models.Festivals.update(
			{
				published: true,
			},
			{
				where: {
					id: stageData.data.festivalId,
				},
			}
		);
		return {
			success: true,
			message: "Published successfully!",
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const updateLikeState = async ({ festivalId, userId, isLiked = true }) => {
	try {
		console.log({ festivalId, userId, isLiked });
		if (!festivalId) {
			return {
				message: err.bad_request,
			};
		}

		const currentLikeObject = await Models.UserLikes.findOne({
			where: {
				userId,
				festivalId,
			},
		});
		const addedResponse = {
			success: true,
			data: "Festival added to favorites",
		};
		const removedResponse = {
			success: true,
			data: "Festival removed to favorites",
		};
		if (currentLikeObject?.userId && isLiked) {
			return addedResponse;
		} else if (!currentLikeObject?.userId && !isLiked) {
			return removedResponse;
		} else if (!currentLikeObject?.userId && isLiked) {
			await Models.UserLikes.create({
				festivalId,
				userId,
			});
			return addedResponse;
		} else {
			await Models.UserLikes.destroy({
				where: {
					festivalId,
					userId,
				},
			});
			return removedResponse;
		}
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

module.exports = {
	getFestivalTypes,
	getFestivalData,
	getFestivalCategoryData,
	getFestivalSubmissionCategory,

	updateFestivalDetails,
	updateFestivalContactDetails,
	updateFestivalDeadlineDetails,
	updateFestivalCategoryDetails,
	updateCategoryRelativeOrder,
	deleteFestivalCategory,
	updateFestivalListingDetails,

	createUpdateRequest,
	generateFestivalStages,
	getStageWiseData,

	uploadFestivalLogo,
	uploadFestivalCover,

	getHome,
	getFestivalViewData,
	getContactAndVenue,
	getFestivalListingUrl,
	getButtonAndLogo,

	getFestivalFlags,
	createDefaultFlag,
	saveFestivalFlags,

	createFestivalJudge,
	deleteFestivalJudge,
	getFestivalJudges,

	updateNotificationPreference,
	getNotificationPerf,

	getSubmissions,
	getFestivalSeasons,
	getSubmissionFilters,

	filterFestivals,
	getCategoryWithDeadlines,
	getFestivalDateTimeline,

	publishFestival,
	updateLikeState,
};