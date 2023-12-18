const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Users', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
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
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: "users_email_key"
    },
    phoneNo: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'phone_no'
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    countryCode: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'country_code'
    },
    workType: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'work_types',
        key: 'id'
      },
      field: 'work_type'
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
    currencyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'currencies',
        key: 'id'
      },
      field: 'currency_id'
    },
    paypalEmail: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'paypal_email'
    },
    upiAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'upi_address'
    },
    coverHash: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'cover_hash'
    },
    coverUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'cover_url'
    },
    fbUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'fb_url'
    },
    instaUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'insta_url'
    },
    linkedinUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'linkedin_url'
    },
    twitterUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'twitter_url'
    }
  }, {
    sequelize,
    tableName: 'users',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "users_email_key",
        unique: true,
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "users_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
