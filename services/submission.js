/**
 * @Page: Submission Services
 * @Description: Submission management related functions
 */

//Models
const Models = require("#models");

//Handlers
const submissionHandler = require("#handler/submission");

//Constants
const sequelize = require("#utils/dbConnection");
const validation = require("#utils/validation");
const constants = require("#utils/constants");
const err = require("#utils/errors");

//Helper Functions
const onehealthCapture = require("#utils/oneHealthCapture");
const { QueryTypes } = require("sequelize");

//Third Party Functions
// const moment = require("moment");

// Is Festival Owner or Is judge
const isValidJudge = async (userId, submissionId) => {
	const query = `with festival_data as (
	  select fc.festival_id id from festival_submissions fs
	  join festival_category_fees fcf on fcf.id = fs.festival_category_fee_id
		join festival_categories fc on fc.id = fcf.festival_category_id
	  where fs.id = $2
	)
	select id from festivals where user_id = $1 and id = (select id from festival_data)
	union
	select festival_id from festival_judges where user_id = $1 and festival_id = (select id from festival_data)`;

	const result = await sequelize.query(query, {
		type: QueryTypes.SELECT,
		bind: [userId, submissionId],
	});

	return result?.length ? true : false;
};

const updateSubmissionStatus = async ({
	userId,
	submissionId,
	submissionStatusId,
}) => {
	try {
		if (!submissionId || !validation.validNumber(submissionStatusId)) {
			return {
				message: err.submission_not_found,
			};
		}
		const isValid = await isValidJudge(userId, submissionId);
		if (!isValid) {
			return {
				message: err.submission_permission_denied,
			};
		}
		await Models.FestivalSubmissions.update(
			{
				status: submissionStatusId,
			},
			{
				where: {
					id: submissionId,
				},
			}
		);
		return {
			success: true,
			data: {
				submissionId,
				submissionStatusId,
			},
		};
		// @TODO: Notify After Submission
	} catch (err) {
		onehealthCapture.catchError(err);
		return {
			message: err.server_error,
		};
	}
};

const updateSubmissionFlag = async ({
	userId,
	submissionId,
	festivalFlagId,
}) => {
	try {
		if (!submissionId || !festivalFlagId) {
			return {
				message: err.submission_not_found,
			};
		}
		const isValid = await isValidJudge(userId, submissionId);
		if (!isValid) {
			return {
				message: err.submission_permission_denied,
			};
		}
		await Models.FestivalSubmissions.update(
			{
				festivalFlagId: festivalFlagId,
			},
			{
				where: {
					id: submissionId,
				},
			}
		);
		return {
			success: true,
			data: {
				submissionId,
				festivalFlagId,
			},
		};
	} catch (err) {
		onehealthCapture.catchError(err);
		return {
			message: err.server_error,
		};
	}
};

const updateJudgeStatus = async ({ userId, submissionId, judgeStatusId }) => {
	try {
		if (!submissionId) {
			return {
				message: err.submission_not_found,
			};
		}

		if (
			!(
				judgeStatusId >= constants.JUDGE.UNDECIDED &&
				judgeStatusId <= constants.JUDGE.HONARABLE_MENTION
			)
		) {
			return {
				message: "Invalid Judge Status",
			};
		}
		const isValid = await isValidJudge(userId, submissionId);
		if (!isValid) {
			return {
				message: err.submission_permission_denied,
			};
		}
		await Models.FestivalSubmissions.update(
			{
				judgingStatus: judgeStatusId,
			},
			{
				where: {
					id: submissionId,
				},
			}
		);
		return {
			success: true,
			data: {
				submissionId,
				judgeStatusId,
			},
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const withdrawSubmission = async ({ submissionId, userId }) => {
	try {
		const filmOwnerQuery = `select fm.user_id, fs.judging_status from festival_submissions fs
		join films fm on fm.id = fs.film_id
		where fs.id = $1
		`;
		const filmOwner = await sequelize.query(filmOwnerQuery, {
			bind: [submissionId],
			type: QueryTypes.SELECT,
		});
		if (!filmOwner?.length) {
			return {
				message: err.submission_not_found,
			};
		}
		if (parseInt(filmOwner[0].user_id, 10) !== parseInt(userId, 10)) {
			return {
				message: "Only film owner can withdraw submission",
			};
		}

		if (
			submissionHandler.isSelectedStatus(
				parseInt(filmOwner[0].judging_status, 10)
			)
		) {
			return {
				message: "Can not withdraw selected submission",
			};
		}

		await Models.FestivalSubmissions.update(
			{
				status: constants.SUBMISSION.WITHDRAWN,
			},
			{
				where: {
					id: submissionId,
				},
			}
		);
		return {
			success: true,
			data: {
				id: submissionId,
				status: constants.SUBMISSION.WITHDRAWN,
				message: "Submission withdrawn",
			},
		};
		//TODO: Push Notification
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

module.exports = {
	updateSubmissionStatus,
	updateSubmissionFlag,
	updateJudgeStatus,

	withdrawSubmission,
};