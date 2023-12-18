/**
 * @Page: Meta Data Services
 * @Description: Create tags, focus list related functions here
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

const getFestivalTagList = async ({ isActive = null }) => {
	try {
		const options = {
			raw: true,
		};
		if (typeof isActive === "boolean") {
			options.where = { isActive };
		}
		const data = await Models.FestivalTagList.findAll(options);
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

const getFestivalFocusList = async ({ isActive = null }) => {
	try {
		const options = {
			raw: true,
		};
		if (typeof isActive === "boolean") {
			options.where = { isActive };
		}
		const data = await Models.FestivalFocusList.findAll(options);
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

const getMetadataList = async ({ isActive = null, uiFriendly = false }) => {
	const options = {
		raw: true,
	};
	if (typeof isActive === "boolean") {
		options.where = { isActive };
	}
	const festivalFocusList = await Models.FestivalFocusList.findAll(options);
	const festivalTagList = await Models.FestivalTagList.findAll(options);
	const result = {
		success: true,
	};
	if(uiFriendly){
		const format = (r) => {
			return {
				label: r.title,
				value: r.id
			};
		};
		const mFestivalFocusList = festivalFocusList.map(format);
		const mFestivalTagList = festivalTagList.map(format);
		result.data = {
			festivalFocusList: mFestivalFocusList,
			festivalTagList: mFestivalTagList
		};
	}else{
		result.data = {
			festivalFocusList,
			festivalTagList
		};
	}
	return result;
};

module.exports = {
	getFestivalTagList,
	getFestivalFocusList,
	getMetadataList,
};