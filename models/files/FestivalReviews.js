const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FestivalReviews', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    festivalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'festivals',
        key: 'id'
      },
      unique: "festival_reviews_festival_id_user_id_key",
      field: 'festival_id'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      unique: "festival_reviews_festival_id_user_id_key",
      field: 'user_id'
    },
    overallRating: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 1,
      field: 'overall_rating'
    },
    festivalOrganizerReply: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'festival_organizer_reply'
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'festival_reviews',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "festival_reviews_festival_id_user_id_key",
        unique: true,
        fields: [
          { name: "festival_id" },
          { name: "user_id" },
        ]
      },
      {
        name: "festival_reviews_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
