const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Payouts', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
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
    festivalId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'festivals',
        key: 'id'
      },
      field: 'festival_id'
    },
    currenyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'currencies',
        key: 'id'
      },
      field: 'curreny_id'
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 0
    },
    exchRate: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      field: 'exch_rate'
    },
    gatewayId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'gateway_id'
    },
    gatewayCode: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      field: 'gateway_code'
    },
    orderItemIds: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      field: 'order_item_ids'
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'payouts',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "payouts_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
