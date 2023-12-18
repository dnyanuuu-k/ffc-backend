/**
 * @Page: Tinode Services
 * @Description: Create tinode related functions here
 */

//Models
const Models = require("#models");

// Handlers
const TinodeHandler = require("#handler/tinode");

//Constants
const sequelize = require("#utils/dbConnection");
// const common = require("#utils/common");
const constants = require("#utils/constants");
const err = require("#utils/errors");

//Helper Functions
const onehealthCapture = require("#utils/oneHealthCapture");
// const validation = require("#utils/validation");
const logger = require("#utils/logger");
const { QueryTypes } = require("sequelize");
//Third Party Functions
// const moment = require("moment");

const initChat = async ({ userId }) => {
	try {
		if (!userId) {
			return {
				message: err.server_error,
			};
		}
		const query = `with my_festival as (
		  select id, name from festivals where user_id = $1 limit 1
		)
		select 
		  (
		    case when work_type = ${constants.WORK_TYPES.SUBMIT_WORK} then (
		      select config from tinode_config where user_id = u.id limit 1
		    ) when work_type = ${constants.WORK_TYPES.MANAGE_FESTIVAL} then (
		      select config from tinode_config where festival_id = (select id from my_festival) limit 1
		    )
		    else null end
		  ) "tinodeData",
		  u.work_type "workType",
		  u.first_name "firstName",
		  u.last_name  "lastName",
		  u.email,
		  (select id from my_festival) "festivalId",
		  (select name from my_festival) "festivalName"
		from users u where id = $1`;
		const response = await sequelize.query(query, {
			type: QueryTypes.SELECT,
			bind: [userId],
		});
		if (!response?.length) {
			return {
				message: err.user_not_found,
			};
		}
		const userData = response[0];
		if (userData.tinodeData) {
			return {
				success: true,
				data: userData.tinodeData,
			};
		}
		const workType = Number(userData.workType);
		if (workType === constants.WORK_TYPES.SUBMIT_WORK) {
			// General User
			const tinodeData = await TinodeHandler.createAccount({
				id: userId,
				type: TinodeHandler.GENERAL_USER,
				firstName: userData.firstName,
				lastName: userData.lastName,
				email: userData.email,
			});
			if (tinodeData) {
				return {
					success: true,
					data: tinodeData,
				};
			}
			logger.error("Unable to create tinode user for user_id: " + userId);
			return {
				message: err.server_error
			};
		} else if (
			workType === constants.WORK_TYPES.MANAGE_FESTIVAL &&
			userData.festivalId
		) {
			const tinodeData = await TinodeHandler.createAccount({
				id: userData.festivalId,
				type: TinodeHandler.FESTIVAL_USER,
				firstName: userData.festivalName,
			});
			if (tinodeData) {
				return {
					success: true,
					data: tinodeData,
				};
			}
		}
		return {
			success: true,
			data: {
				code: "NO_FESTIVAL",
			},
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const getUserTopic = async ({ userId, festivalId }) => {
	const where = {};
	if (festivalId) {
		where.festivalId = festivalId;
	} else if (userId) {
		where.userId = userId;
	} else {
		return {
			message: err.server_error,
		};
	}
	const tinodeData = await Models.TinodeConfig.findOne({
		where,
		attributes: ["data"],
	});
	if (tinodeData) {
		return {
			success: true,
			data: tinodeData.i,
		};
	}

	return {
		message: "Config not found",
	};
};

module.exports = {
	initChat,
	getUserTopic,
};