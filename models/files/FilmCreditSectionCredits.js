const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FilmCreditSectionCredits', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    filmCreditSectionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'film_credit_sections',
        key: 'id'
      },
      field: 'film_credit_section_id'
    },
    firstName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'first_name'
    },
    middleName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'middle_name'
    },
    lastName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'last_name'
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'avatar_url'
    },
    avatarHash: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'avatar_hash'
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
    relativeOrder: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 1,
      field: 'relative_order'
    }
  }, {
    sequelize,
    tableName: 'film_credit_section_credits',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "film_credit_section_credits_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
