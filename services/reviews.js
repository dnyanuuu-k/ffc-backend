/**
 * @Page: Review Services
 * @Description: Create review related functions here
 */

//Models
const Models = require("#models");

//Constants
const sequelize = require("#utils/dbConnection");
const err = require("#utils/errors");
//Helper Functions
const onehealthCapture = require("#utils/oneHealthCapture");
const validation = require("#utils/validation");
const common = require("#utils/common");
const { Op, QueryTypes } = require("sequelize");
//Third Party Functions
const moment = require("moment");

const getRatingPercent = (rating = 0) => {
	const validRating = Number.isNaN(rating) ? 0 : rating;
	return parseInt((validRating / global.MAX_RATING) * 100, 10);
};

const getFestivalReviewAggregate = async (festivalId) => {
	try {
		let ratings = [];
		const overallRatingQuery = `select 0 as id, 'Overall Rating' as name, 0 as relative_order, avg(overall_rating) as rating,
		count(id)
		from festival_reviews where festival_id = ${festivalId}`;
		let overallRatings = await sequelize.query(overallRatingQuery, {
			type: QueryTypes.SELECT,
		});
		ratings = overallRatings;
		const categoryRatingQuery = `select frc.id, frc.name, frc.relative_order, avg(fcr.rating) as rating, count(fcr.id)
		from festival_review_categories as frc
		left join festival_category_reviews as fcr on fcr.festival_review_category_id = frc.id and 
		fcr.festival_review_id in (select id from festival_reviews where festival_id = ${festivalId}) and fcr.is_active = true
		group by frc.id
		order by frc.relative_order asc`;
		let categoryRatings = await sequelize.query(categoryRatingQuery, {
			type: QueryTypes.SELECT,
		});
		ratings = [...ratings, ...categoryRatings];
		const finalRatings = ratings.map((rating) => ({
			count: rating.count,
			relativeOrder: rating.relative_order,
			categoryName: rating.name,
			rating: rating.rating,
			ratingPercent: getRatingPercent(rating.rating),
			festivalId,
		}));
		return finalRatings;
	} catch (tryErr) {
		return [];
	}
};
/**
 * @Param ID refers to festivalReviewId
 */
const createFestivalReview = async ({
	id,
	festivalId,
	userId,
	review = null,
	overallRating = 1,
	categoryRatings,
}) => {
	let transaction = null;
	try {
		userId = parseInt(userId);
		if (review?.length > 0 && !validation.validName(review)) {
			return {
				message: err.invalid_review,
			};
		}
		if (!validation.validId(festivalId)) {
			return {
				message: err.festival_not_found,
			};
		}
		if (!validation.validId(userId)) {
			return {
				message: err.user_not_found,
			};
		}
		const userData = await Models.Users.findOne({
			where: {
				id: userId,
			},
			attributes: ["avatarUrl", "avatarHash", "firstName", "lastName"],
		});
		let festivalReview = {
			overallRating,
			festivalId,
			review,
			userId,
		};
		transaction = await sequelize.transaction();
		if (id) {
			festivalReview.id = id;
			await Models.FestivalReviews.update(
				{
					overallRating,
					review,
				},
				{
					where: {
						id,
					},
					transaction,
				}
			);
		} else {
			const festivalReviewObject = { ...festivalReview };
			festivalReview = await Models.FestivalReviews.create(
				festivalReviewObject,
				{
					transaction,
				}
			);
		}

		const festivalReviewCategories =
			await Models.FestivalReviewCategories.findAll({
				where: {
					isActive: true,
				},
			});
		const festivalCategoryRatingMap = new Map();
		const festivalRatingToInsert = [];
		categoryRatings.forEach((festivalCategoryRating) => {
			festivalCategoryRatingMap.set(
				festivalCategoryRating.festivalReviewCategoryId,
				festivalCategoryRating
			);
		});

		festivalReviewCategories.forEach((festivalReviewCategory) => {
			let ratingObj = {};
			let insertedObj = festivalCategoryRatingMap.get(
				festivalReviewCategory.id
			);
			ratingObj.festivalReviewCategoryId = festivalReviewCategory.id;
			ratingObj.festivalReviewId = festivalReview.id;
			if (insertedObj) {
				ratingObj.id = insertedObj?.id;
				ratingObj.rating = insertedObj.rating;
				ratingObj.isActive = true;
			} else {
				ratingObj.rating = 0;
				ratingObj.isActive = false;
			}
			festivalRatingToInsert.push(ratingObj);
		});

		for (const ratingObj of festivalRatingToInsert) {
			const query = `INSERT INTO festival_category_reviews (
			  festival_review_id, festival_review_category_id, 
			  rating
			) 
			VALUES 
			  (
			  ${ratingObj.festivalReviewId}, 
			  ${ratingObj.festivalReviewCategoryId},
			  ${ratingObj.rating}) ON CONFLICT (
			    festival_review_id, festival_review_category_id
			  ) DO 
			UPDATE 
			SET 
			  rating = ${ratingObj.rating}`;
			await sequelize.query(query, {
				transaction,
			});
		}
		await transaction.commit();
		const ratings = await getFestivalReviewAggregate(festivalId);
		const date = moment(festivalReview.createdAt).format(global.MMMMDDYYYY);
		const ratingPercent = getRatingPercent(overallRating);
		const finalReview = {
			...festivalReview.dataValues,
			user: userData.dataValues,
			ratingPercent,
			date,
		};
		return {
			success: true,
			data: {
				festivalReview: finalReview,
				ratings,
			},
		};
	} catch (tryErr) {
		if (transaction) {
			// transaction.rollback();
		}
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getFestivalReviews = async ({
	userId,
	festivalId,
	includeAvgRatings,
	limit = 10,
	offset = 0,
}) => {
	try {
		if (!validation.validId(festivalId)) {
			return {
				message: err.festival_not_found,
			};
		}
		const festivalReviews = await Models.FestivalReviews.findAll({
			where: {
				festivalId,
				review: {
					[Op.ne]: null,
				},
			},
			limit,
			offset,
			order: [["created_at", "desc"]],
			include: {
				as: "user",
				model: Models.Users,
				attributes: ["first_name", "last_name", "avatar_url"],
			},
		});
		const currentUserId = parseInt(userId, 10);
		const finalReviews = festivalReviews.map((review) => {
			const obj = review.toJSON();
			obj.isReviewOwner = obj.userId === currentUserId;
			console.log(obj.userId, currentUserId, obj.userId === currentUserId);
			obj.date = moment(obj.createdAt).format(global.MMMMDDYYYY);
			obj.ratingPercent = getRatingPercent(review.overallRating);
			return obj;
		});
		const result = { festivalReviews: finalReviews };
		if (includeAvgRatings) {
			const ratings = await getFestivalReviewAggregate(festivalId);
			result.festivalCategoryRatings = ratings;
		}
		return {
			success: true,
			data: result,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const updateFestivalReviewReply = async ({
	festivalReviewId,
	festivalOrganizerReply = null,
	userId,
}) => {
	const festivalReviewData = await Models.FestivalReviews.findOne({
		where: {
			id: festivalReviewId,
		},
		attributes: ["id"],
		include: {
			as: "festival",
			model: Models.Festivals,
			attributes: ["userId"],
		},
	});
	if (!festivalReviewData) {
		return {
			message: err.festival_review_not_found,
		};
	}
	if (festivalReviewData.festival.userId !== parseInt(userId)) {
		//TODO: May need to update condition if we add team support
		return {
			message: "Only Festival account owner can reply to festival review",
		};
	}
	await Models.FestivalReviews.update(
		{
			festivalOrganizerReply,
		},
		{
			where: {
				id: festivalReviewId,
			},
		}
	);
	return {
		success: true,
		data: "Review Added!",
	};
};

const deleteFestivalReview = async ({ festivalReviewId, userId }) => {
	let transaction = null;
	try {
		const festivalReviewData = await Models.FestivalReviews.findOne({
			where: {
				id: festivalReviewId,
			},
			attributes: ["id", "userId", "festivalId"],
			include: {
				as: "festival",
				model: Models.Festivals,
				attributes: ["userId"],
			},
		});
		if (!festivalReviewData) {
			return {
				message: err.festival_review_not_found,
			};
		}
		if (festivalReviewData.userId !== parseInt(userId)) {
			//TODO: May need to update condition if we add team support
			return {
				message: "Only Review owner can delete festival review",
			};
		}
		transaction = await sequelize.transaction();
		await Models.FestivalCategoryReviews.destroy(
			{
				where: {
					festivalReviewId,
				},
			},
			{ transaction }
		);
		await Models.FestivalReviews.destroy(
			{
				where: {
					id: festivalReviewId,
				},
			},
			{ transaction }
		);

		await transaction.commit();

		const ratings = await getFestivalReviewAggregate(
			festivalReviewData.festivalId
		);

		return {
			success: true,
			data: {
				ratings,
			},
		};
	} catch (tryErr) {
		if (transaction) {
			transaction.rollback();
		}
		return {
			message: err.server_error,
		};
	}
};

const getReviewSubmissionData = async ({
	festivalReviewId,
	festivalId,
	userId,
}) => {
	try {
		let festivalReviewData = festivalReviewId
			? await Models.FestivalReviews.findOne({
					where: {
						id: festivalReviewId,
					},
			  })
			: null;
		if (!festivalReviewData && festivalId) {
			festivalReviewData = await Models.FestivalReviews.findOne({
				where: {
					festivalId,
					userId,
				},
			});
		}
		if (!festivalReviewData) {
			festivalReviewData = {
				overallRating: 0,
				review: "",
			};
		}
		const festivalReviewCategories =
			await Models.FestivalReviewCategories.findAll({
				where: {
					isActive: true,
				},
				order: [
					[ "relative_order", "asc" ]
				]
			});
		const categoryRatings = festivalReviewId
			? await Models.FestivalCategoryReviews.findAll({
					where: {
						festivalReviewId,
						isActive: true,
					},
			})
			: [];
		const festivalCategoryRatingMap = new Map();
		const festivalRatingInserted = [];
		categoryRatings.forEach((festivalCategoryRating) => {
			festivalCategoryRatingMap.set(
				festivalCategoryRating.festivalReviewCategoryId,
				festivalCategoryRating
			);
		});

		festivalReviewCategories.forEach((festivalReviewCategory) => {
			let ratingObj = {};
			let insertedObj = festivalCategoryRatingMap.get(
				festivalReviewCategory.id
			);
			ratingObj.festivalReviewCategoryId = festivalReviewCategory.id;
			ratingObj.festivalReviewId = festivalReviewId;
			ratingObj.name = festivalReviewCategory.name;
			if (insertedObj) {
				ratingObj.id = insertedObj?.id;
				ratingObj.rating = insertedObj.rating;
				ratingObj.isActive = true;
			} else {
				ratingObj.rating = 0;
				ratingObj.isActive = false;
			}
			festivalRatingInserted.push(ratingObj);
		});

		return {
			success: true,
			data: {
				festivalReviewCategories: festivalRatingInserted,
				reviewData: festivalReviewData,
			},
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

module.exports = {
	createFestivalReview,
	getFestivalReviews,
	updateFestivalReviewReply,
	deleteFestivalReview,
	getReviewSubmissionData,
};