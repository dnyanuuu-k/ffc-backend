const countryList = require("./dataList");
const { PhoneNumberUtil } = require("google-libphonenumber");
const phoneUtil = PhoneNumberUtil.getInstance();
const countryObject = {};

countryList.forEach((country) => {
	countryObject[country.code] = country;
});

const getNumberForCountry = (phoneNumber, countryCode) => {
	const invalidPhone = "Invalid phone number";
	const mm = countryObject[countryCode];
	if (mm) {		
		const isValdPhoneNumber = phoneUtil.isValidNumberForRegion(
			phoneUtil.parse(phoneNumber, countryCode),
			countryCode
		);
		if (isValdPhoneNumber === false) {
			return {
				message: invalidPhone,
			};
		}
		const parsedNumber = phoneUtil.parseAndKeepRawInput(`${phoneNumber}`, countryCode);
		if (!parsedNumber) {
			return { message: invalidPhone };
		}
		const dailCode = "+" + parsedNumber.values_["1"];
		return {
			success: true,
			data: dailCode + parsedNumber.values_["2"],
		};
	}
	return {
		message: "Invalid country code",
	};
};

const isValidCountry = (countryCode) => countryObject[countryCode] ? true : false;
const getCountry = (countryCode) => countryObject[countryCode];

const getCountryList = () => {
	return countryList;
};

module.exports = {
	getNumberForCountry,
	getCountryList,
	isValidCountry,
	getCountry
};