const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FestivalDateDeadlines', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    festivalDateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'festival_dates',
        key: 'id'
      },
      field: 'festival_date_id'
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    allCategories: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: 'all_categories'
    }
  }, {
    sequelize,
    tableName: 'festival_date_deadlines',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "festival_date_deadlines_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
