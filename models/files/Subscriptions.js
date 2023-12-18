const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Subscriptions', {
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
    orderItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cart_order_items',
        key: 'id'
      },
      field: 'order_item_id'
    },
    productId: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      field: 'product_id'
    },
    fromDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'from_date'
    },
    toDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'to_date'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    tableName: 'subscriptions',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "subscriptions_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
