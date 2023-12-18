const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Cart', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
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
    feeInCurrency: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      field: 'fee_in_currency'
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    userCurrencyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'currencies',
        key: 'id'
      },
      field: 'user_currency_id'
    },
    productId: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      field: 'product_id'
    }
  }, {
    sequelize,
    tableName: 'cart',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "cart_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
