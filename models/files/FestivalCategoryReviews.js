const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FestivalCategoryReviews', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    festivalReviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'festival_reviews',
        key: 'id'
      },
      unique: "festival_category_reviews_festival_review_id_festival_revie_key",
      field: 'festival_review_id'
    },
    festivalReviewCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'festival_review_categories',
        key: 'id'
      },
      unique: "festival_category_reviews_festival_review_id_festival_revie_key",
      field: 'festival_review_category_id'
    },
    rating: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 1
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    tableName: 'festival_category_reviews',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "festival_category_rating_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "festival_category_reviews_festival_review_id_festival_revie_key",
        unique: true,
        fields: [
          { name: "festival_review_id" },
          { name: "festival_review_category_id" },
        ]
      },
    ]
  });
};
