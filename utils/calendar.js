const moment = require("moment");

const JAN = 0;
const FEB = 1;
const MAR = 2;
const APRIL = 3;
const MAY = 4;
const JUN = 5;
const JULY = 6;
const AUG = 7;
const SEP = 8;
const OCT = 9;
const NOV = 10;
const DEC = 11;

const monthList = [
	"Jan",
	"Feb",
	"Mar",
	"April",
	"May",
	"Jun",
	"July",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

const getDaysOfMonth = (month, year) => {
	const m = moment().month(month);
	if (year) {
		m.year(year);
	}
	const days = [];
	for (let i = 1; i < m.endOf("month").date(); i++) {
		days.push(i);
	}
	return days;
};

module.exports = {
	JAN,
	FEB,
	MAR,
	APRIL,
	MAY,
	JUN,
	JULY,
	AUG,
	SEP,
	OCT,
	NOV,
	DEC,
	monthList,
	getDaysOfMonth,
};