const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Payments', {
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
    gatewayTxnId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'gateway_txn_id'
    }
  }, {
    sequelize,
    tableName: 'payments',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "payments_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
