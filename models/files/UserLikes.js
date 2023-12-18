const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UserLikes', {
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
      field: 'user_id'
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
    festivalId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'festivals',
        key: 'id'
      },
      field: 'festival_id'
    }
  }, {
    sequelize,
    tableName: 'user_likes',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "user_likes_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
