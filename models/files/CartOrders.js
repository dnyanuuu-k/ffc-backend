const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('CartOrders', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    gatewayOrderId: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'gateway_order_id'
    },
    gatewayCode: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      field: 'gateway_code'
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    currencyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'currencies',
        key: 'id'
      },
      field: 'currency_id'
    },
    saving: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'cart_orders',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "cart_orders_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
