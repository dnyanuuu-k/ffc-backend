const { Sequelize } = require("sequelize");
const constants = require("./constants");
module.exports = new Sequelize(constants.dbUrl, {
	logging: (str) => {
		if (constants.environment == "dev") {
			// console.log(str);
		}
	},
});