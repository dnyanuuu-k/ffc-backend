const sequelize = require("#utils/dbConnection");
const initModels = require("./files/init-models");
const models = initModels(sequelize);
module.exports = models;