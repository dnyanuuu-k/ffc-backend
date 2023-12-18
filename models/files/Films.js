const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Films', {
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
    title: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    shortSummary: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'short_summary'
    },
    storyline: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    nativeTitle: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'native_title'
    },
    nativeShortSummary: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'native_short_summary'
    },
    nativeStoryline: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'native_storyline'
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
    linkedin: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    submitterState: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'submitter_state'
    },
    submitterCity: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'submitter_city'
    },
    submitterCountry: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'submitter_country'
    },
    submitterAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'submitter_address'
    },
    submitterPostalCode: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'submitter_postal_code'
    },
    submitterGender: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'submitter_gender'
    },
    submitterDob: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'submitter_dob'
    },
    runtimeSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'runtime_seconds'
    },
    completionDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'completion_date'
    },
    productionBudget: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      field: 'production_budget'
    },
    productionBudgetCurrencyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'currencies',
        key: 'id'
      },
      field: 'production_budget_currency_id'
    },
    countryOfOrgin: {
      type: DataTypes.STRING(6),
      allowNull: true,
      field: 'country_of_orgin'
    },
    shootingFormat: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'shooting_format'
    },
    aspectRatio: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'aspect_ratio'
    },
    filmColorId: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      references: {
        model: 'film_colors',
        key: 'id'
      },
      field: 'film_color_id'
    },
    firstTime: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'first_time'
    },
    hasNonEnglishTitle: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'has_non_english_title'
    },
    submitterEmail: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'submitter_email'
    },
    submitterPhone: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'submitter_phone'
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_published'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    thumbHash: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'thumb_hash'
    },
    thumbUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "default_images\/film_thumb.png",
      field: 'thumb_url'
    },
    posterUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'poster_url'
    },
    posterHash: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'poster_hash'
    },
    posterConfig: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'poster_config'
    }
  }, {
    sequelize,
    tableName: 'films',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "films_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
