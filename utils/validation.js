const moment = require("moment");

const validArray = (data) => {
	return Array.isArray(data);
};

const validPhoneNumber = (number) => {
	if (typeof number === "number") {
		const numstring = `${number}`;
		if (numstring.length > 7 && numstring.length < 16) {
			return numstring;
		}
	} else if (
		typeof number === "string" &&
		number.length > 7 &&
		number.length < 16 &&
		typeof parseInt(number) === "number"
	) {
		return number;
	}
	return false;
};

const validateEmail = (email) => {
	if (typeof email !== "string") {
		return false;
	}
	const lemail = email.toLowerCase();
	const passed = lemail.match(
		/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	);
	if (passed) return lemail;
	return false;
};

const validString = (str) => {
	if (typeof str != "string") {
		return false;
	}
	str = str.trimStart();
	str = str.trimEnd();
	if (str?.length > 0) {
		return str;
	}
	return false;
};

const validName = (str, validLength = 2) => {
	const str2 = validString(str);
	if (str2 && str2.length >= validLength) {
		return str;
	}
	return false;
};

const validBoolean = (bool) => typeof bool == "boolean";

const validNumber = (num) => {
	if (isNaN(num)) {
		return false;
	}
	return typeof num == "number";
};

const validTaxNumber = (g) => {
	if (typeof g === "string" && g.length === 15) {
		let regTest = /\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/.test(
			g
		);
		if (regTest) {
			let a = 65,
				b = 55,
				c = 36;
			return Array["from"](g).reduce((i, j, k) => {
				let p =
					(p =
						(j.charCodeAt(0) < a ? parseInt(j) : j.charCodeAt(0) - b) *
						((k % 2) + 1)) > c
						? 1 + (p - c)
						: p;
				return k < 14
					? i + p
					: j == ((c = c - (i % c)) < 10 ? c : String.fromCharCode(c + b));
			}, 0);
		}
		return regTest;
	}
	return false;
};

const validDate = (date) => {
	return moment.isMoment(date);
};

const validAgentPasscode = (passcode) => {
	return (
		typeof passcode === "string" && passcode?.length === global.AGENT_PC_LENGTH
	);
};

const mathRound = (value, decimals = 2) => {
	return isNaN(value)
		? 0
		: Number(Math.round(value + "e" + decimals) + "e-" + decimals);
};

const validId = (id) =>
	typeof id === "number" && id != 0 && Number.isNaN(id) === false;

const validGender = (gender) => {
	return global.GENDER_LIST.indexOf(gender) !== -1;
};

const onlyAlpha = (str) => {
	return /^[a-zA-Z]+$/.test(str);
};

const onlyAlphaNumber = (str) => {
	return /^[a-zA-Z0-9]+$/.test(str);
};

const validFacebookUrl = (url) => {
	// eslint-disable-next-line no-useless-escape
	var pattern =
		/^(?:(?:http|https):\/\/)?(?:www.)?facebook.com\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[?\w\-]*\/)?(?:profile.php\?id=(?=\d.*))?([\w\-]*)?$/;
	return pattern.test(url);
};

const validInstagramUrl = (url) => {
	// eslint-disable-next-line no-useless-escape
	var pattern =
		/(?:(?:http|https):\/\/)?(?:www.)?(?:instagram.com|instagr.am|instagr.com)\/(\w+)/gim;
	return pattern.test(url);
};

const validTwitterUrl = (url) => {
	// eslint-disable-next-line no-useless-escape
	var pattern =
		/^(http\:\/\/|https\:\/\/)?(?:www\.)?twitter\.com\/(?:#!\/)?@?([^\?#]*)(?:[?#].*)?$/i;
	return pattern.test(url);
};

const validLinkedinUrl = (url) => {
	// eslint-disable-next-line no-useless-escape
	var pattern =
		/^((https?:\/\/)?((www|\w\w)\.)?linkedin\.com\/)((([\w]{2,3})?)|([^\/]+\/(([\w|\d-&#?=])+\/?){1,}))$/gm;
	return pattern.test(url);
};

const validUrl = (url) => {
	var pattern = new RegExp(
		"^(https?:\\/\\/)?" + // protocol
			"((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
			"((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
			"(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
			"(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
			"(\\#[-a-z\\d_]*)?$",
		"i"
	); // fragment locator
	return !!pattern?.test(url);
};

module.exports = {
	validAgentPasscode,
	validInstagramUrl,
	validLinkedinUrl,
	validFacebookUrl,
	validTwitterUrl,
	validPhoneNumber,
	validTaxNumber,
	validateEmail,
	validBoolean,
	validGender,
	validArray,
	validNumber,
	validString,
	validDate,
	validName,
	validUrl,
	validId,

	mathRound,
	onlyAlpha,
	onlyAlphaNumber
};