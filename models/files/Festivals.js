const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Festivals', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    yearsRunning: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 0,
      field: 'years_running'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    awards: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isDraft: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: 'is_draft'
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
    terms: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    coverUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'cover_url'
    },
    logoUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'logo_url'
    },
    coverHash: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'cover_hash'
    },
    logoHash: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'logo_hash'
    },
    festivalType: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      field: 'festival_type'
    },
    phone: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(6),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    state: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    postalCode: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'postal_code'
    },
    facebook: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    instagram: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    twitter: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    minimumRuntime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'minimum_runtime'
    },
    maximumRuntime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'maximum_runtime'
    },
    acceptsAllLength: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: 'accepts_all_length'
    },
    listingUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'listing_url'
    },
    trackingPrefix: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'tracking_prefix'
    },
    startingNumber: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "1",
      field: 'starting_number'
    },
    published: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    website: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notifyPerf: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "default",
      field: 'notify_perf'
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'festivals',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "festivals_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
