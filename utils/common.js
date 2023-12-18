const constants = require("./constants");
const jwt = require("jsonwebtoken");
const moment = require("moment");

//Server Responses
const ERROR_RES_CODE = 400;
const SUCCESS_RES_CODE = 200;
const SERVER_ERR_RES_CODE = 500;
const dateMinObj = { hours: 0, minutes: 0, milliseconds: 0, seconds: 0 };
//Common Functions
const guid = () => {
	function _p8(s) {
		var p = (Math.random().toString(16) + "000000000").substr(2, 8);
		return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
	}
	return _p8() + _p8(true) + _p8(true) + _p8();
};

function titleCase(str) {
	if (!str) return "";
	var splitStr = str.toLowerCase().split(" ");
	for (var i = 0; i < splitStr.length; i++) {
		// You do not need to check if i is larger than splitStr length, as your for does that for you
		// Assign it back to the array
		splitStr[i] =
			splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
	}
	// Directly return the joined string
	return splitStr.join(" ");
}

const getQtyList = (dateStamp, qty) => {
	const weekday = moment.unix(dateStamp).format("ddd").toLowerCase();
	console.log(dateStamp, weekday, qty);
	const qtyList = { sun: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 };
	qtyList[weekday] = qty;
	return qtyList;
};

const toPaise = (amount) => (amount > 0 ? amount * 100 : 0);

const timeSince = (timestamp) => {
	var seconds = timestamp;

	var interval = seconds / 31536000;

	if (interval > 1) {
		return Math.floor(interval) + " years";
	}
	interval = seconds / 2592000;
	if (interval > 1) {
		return Math.floor(interval) + " months";
	}
	interval = seconds / 86400;
	if (interval > 1) {
		return Math.floor(interval) + " days";
	}
	interval = seconds / 3600;
	if (interval > 1) {
		return Math.floor(interval) + " hours";
	}
	interval = seconds / 60;
	if (interval > 1) {
		return Math.floor(interval) + " minutes";
	}
	return Math.floor(seconds) + " seconds";
};

const timeAgo = (t) => timeSince(t) + " ago";

const splitFullName = (fullName) => {
	const spilttedInput = fullName?.split(" ");
	let names = [];
	spilttedInput.forEach((inp) => {
		if (inp.trim().length > 0) {
			names.push(inp.trim());
		}
	});

	const [firstName, ...middle_last] = names;
	const lastName = middle_last.pop() || "";

	let middleName = "";
	middle_last.forEach((mid_name) => {
		middleName += mid_name.trim() + " " || "";
	});
	middleName = middleName.trim();
	return { firstName, middleName, lastName };
};

//Reponses
function errorRes(res, message, code = false) {
	let extra = code ? { code } : {};
	res.status(ERROR_RES_CODE).send({
		success: false,
		message,
		...extra,
	});
}

function successRes(res, data) {
	res.status(SUCCESS_RES_CODE).send({
		success: true,
		data,
	});
}

function serverError(res) {
	res.status(SERVER_ERR_RES_CODE).send({
		success: false,
		message: "Server Error",
	});
}

const countryCode = () => "+91";
const currencyCode = () => "INR";
const currencySymbol = () => "₹";

function createUid(length) {
	var result = "";
	var characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(
			Math.floor(Math.random() * charactersLength)
		);
	}
	return result;
}

const getWeekDay = (weekday) => {
	switch (weekday) {
		case 0:
			return "Sun";
		case 1:
			return "Mon";
		case 2:
			return "Tue";
		case 3:
			return "Wed";
		case 4:
			return "Thu";
		case 5:
			return "Fri";
		case 6:
			return "Sat";
		default:
			return "";
	}
};
const getWeekDayFull = (weekday) => {
	switch (weekday) {
		case 0:
			return "Sunday";
		case 1:
			return "Monday";
		case 2:
			return "Tuesday";
		case 3:
			return "Wednesday";
		case 4:
			return "Thursday";
		case 5:
			return "Friday";
		case 6:
			return "Saturday";
		default:
			return "";
	}
};

const getMonth = (month) => {
	switch (month) {
		case 1:
			return "Jan";
		case 2:
			return "Feb";
		case 3:
			return "March";
		case 4:
			return "April";
		case 5:
			return "May";
		case 6:
			return "June";
		case 7:
			return "July";
		case 8:
			return "Aug";
		case 9:
			return "Sep";
		case 10:
			return "Oct";
		case 11:
			return "Nov";
		case 12:
			return "Dec";
		default:
			return "";
	}
};

const numberWithCommas = (x, optional = 0) => {
	return (
		`${x === 0 ? 0 : x || ""}`
			?.toString()
			?.replace(/\B(?=(\d{3})+(?!\d))/g, ",") || optional
	);
};

const generateOTP = (length = 4) => {
	let otp = "";
	for (let i = 0; i < length; i++) {
		otp += Math.floor(Math.random() * 10);
	}
	return otp;
};

const signToken = (id) => {
	return jwt.sign({ id: id }, constants.authSecret, { expiresIn: "42h" });
};

const verifyToken = (id, otp) => {
	return jwt.sign({ id, otp }, constants.verifySecret, { expiresIn: "8m" });
};

const bytesToKb = (bytes) => {
	return bytes / 1024;
};

/**
 * Conserve aspect ratio of the original region. Useful when shrinking/enlarging
 * images to fit into a certain area.
 *
 * @param {Number} srcWidth width of source image
 * @param {Number} srcHeight height of source image
 * @param {Number} maxWidth maximum available width
 * @param {Number} maxHeight maximum available height
 * @return {Object} { width, height }
 */
const calculateAspectRatioFit = (srcWidth, srcHeight, maxWidth, maxHeight) => {
	var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
	return {
		width: parseInt(srcWidth * ratio),
		height: parseInt(srcHeight * ratio),
	};
};

const uniqueId = () => {
	//TODO: Not Sure that it garuntees duplicate
	const currentStampMilliSeconds = new Date().getTime();
	return currentStampMilliSeconds;
};

const guid2 = () => {
	const id = (
		Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
	).toUpperCase();
	return id;
};

function objectNumberLocale(obj) {
	for (const key in obj) {
		// eslint-disable-next-line no-prototype-builtins
		if (obj.hasOwnProperty(key)) {
			const value = obj[key];

			if (typeof value === "number") {
				// Use toLocaleString to format the number with commas
				obj[key] = value.toLocaleString(undefined, { maximumFractionDigits: 2 });
			} else if (typeof value === "object") {
				// If the value is an object, recursively call the function
				obj[key] = objectNumberLocale(value);
			}
		}
	}

	return obj;
}

const getFullName = (firstName, middleName, lastName) => {
    const wS = (name) => (typeof name === "string" ? ` ${name}`.trimEnd() : "");
    return `${wS(firstName || "")}${wS(middleName || "")}${wS(
        lastName || ""
    )}`.trim();
};

module.exports = {
	toPaise,
	timeAgo,
	titleCase,
	timeSince,
	splitFullName,
	getFullName,

	errorRes,
	successRes,
	serverError,

	countryCode,
	currencyCode,
	currencySymbol,

	createUid,
	uniqueId,
	guid,
	guid2,

	getWeekDayFull,
	getWeekDay,
	getMonth,

	numberWithCommas,
	generateOTP,
	dateMinObj,
	getQtyList,
	signToken,
	verifyToken,
	bytesToKb,
	calculateAspectRatioFit,
	objectNumberLocale
};