const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FestivalSubmissions', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    festivalCategoryFeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'festival_category_fees',
        key: 'id'
      },
      field: 'festival_category_fee_id'
    },
    filmId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'films',
        key: 'id'
      },
      field: 'film_id'
    },
    festivalFlagId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'festival_flags',
        key: 'id'
      },
      field: 'festival_flag_id'
    },
    judgingStatus: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 0,
      field: 'judging_status'
    },
    orderItemId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'cart_order_items',
        key: 'id'
      },
      field: 'order_item_id'
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0
    },
    paymentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'payments',
        key: 'id'
      },
      field: 'payment_id'
    },
    trackingId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'tracking_id'
    },
    feeType: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0,
      field: 'fee_type'
    }
  }, {
    sequelize,
    tableName: 'festival_submissions',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "submissions_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
