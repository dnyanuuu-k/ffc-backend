const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('CartOrderItems', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    cartOrderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cart_orders',
        key: 'id'
      },
      field: 'cart_order_id'
    },
    festivalCategoryFeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'festival_category_fees',
        key: 'id'
      },
      field: 'festival_category_fee_id'
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: 0
    },
    filmId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'films',
        key: 'id'
      },
      field: 'film_id'
    },
    exchRate: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 1,
      field: 'exch_rate'
    },
    festivalAmount: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      field: 'festival_amount'
    },
    festivalCurrencyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'currencies',
        key: 'id'
      },
      field: 'festival_currency_id'
    },
    paymentFee: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0,
      field: 'payment_fee'
    },
    netAmount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0,
      field: 'net_amount'
    },
    platformFee: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0,
      field: 'platform_fee'
    },
    payoutId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'payouts',
        key: 'id'
      },
      field: 'payout_id'
    },
    payoutStatus: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 0,
      field: 'payout_status'
    },
    productId: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      field: 'product_id'
    }
  }, {
    sequelize,
    tableName: 'cart_order_items',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "cart_order_items_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
