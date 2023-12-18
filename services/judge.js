/**
 * @Page: Judge Services
 * @Description: Create judgement related functions here
 */

//Models
const Models = require("#models");

//Constants
// const sequelize = require("#utils/dbConnection");
// const common = require("#utils/common");
const err = require("#utils/errors");

//Helper Functions
const onehealthCapture = require("#utils/oneHealthCapture");
// const validation = require("#utils/validation");
// const { Op } = require("sequelize");
//Third Party Functions
// const moment = require("moment");

const updateInvitation = async ({ festivalJudgeId = null, accepted = true }) => {
	try {
		if (!festivalJudgeId) {
			return {
				message: err.server_error
			};
		}
		const festivalJudge = await Models.FestivalJudges.findOne({
			where: {
				id: festivalJudgeId
			},
			attributes: ["accepted"]
		});
		if (festivalJudge && festivalJudge.accepted) {
			return {
				success: true,
				message: "Already accepted!"
			};
		}

		if (accepted) {
			await Models.FestivalJudges.update({ accepted: true }, {
				where: {
					id: festivalJudgeId
				}
			});
		} else {
			await Models.FestivalJudges.destroy({
				where: {
					id: festivalJudgeId
				}
			});
		}
		
		return {
			success: true,
			data: "Updated!"
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

module.exports = {
	updateInvitation
};
