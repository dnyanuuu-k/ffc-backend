const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FestivalCategoryFees', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    festivalCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'festival_categories',
        key: 'id'
      },
      unique: "festival_category_fees_festival_category_id_festival_date_d_key",
      field: 'festival_category_id'
    },
    standardFee: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      field: 'standard_fee'
    },
    goldFee: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      field: 'gold_fee'
    },
    festivalDateDeadlineId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'festival_date_deadlines',
        key: 'id'
      },
      unique: "festival_category_fees_festival_category_id_festival_date_d_key",
      field: 'festival_date_deadline_id'
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'festival_category_fees',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "festival_category_fees_festival_category_id_festival_date_d_key",
        unique: true,
        fields: [
          { name: "festival_category_id" },
          { name: "festival_date_deadline_id" },
        ]
      },
      {
        name: "festival_category_fees_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
