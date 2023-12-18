const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FilmVideos', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    filmId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'films',
        key: 'id'
      },
      unique: "film_videos_film_id_key",
      field: 'film_id'
    },
    sizeInMb: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      field: 'size_in_mb'
    },
    totalBytes: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      field: 'total_bytes'
    },
    uploadedBytes: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      field: 'uploaded_bytes'
    },
    mimetype: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    streamUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'stream_url'
    },
    videoUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'video_url'
    },
    hlsVariants: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      field: 'hls_variants'
    },
    s3Etags: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 's3_etags'
    },
    thumbnailUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'thumbnail_url'
    },
    thumbnailHash: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'thumbnail_hash'
    },
    status: {
      type: DataTypes.ENUM("created","uploading","uploaded","transcoding","ready"),
      allowNull: true
    },
    s3FileId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 's3_file_id'
    },
    tusTaskId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'tus_task_id'
    }
  }, {
    sequelize,
    tableName: 'film_videos',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "film_videos_film_id_key",
        unique: true,
        fields: [
          { name: "film_id" },
        ]
      },
      {
        name: "film_videos_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
