const { DataStore, Upload, ERRORS } = require("@tus/server");
const ApiVideo = require("./apiVideo");
const API_VIDEO_STORE = "API_VIDEO_STORE: ";
class VideoCacheManager {
  cacheMap = new Map();

  constructor(apiKey) {
    this.client = new ApiVideo(apiKey);
  }

  decodeOffset(parts) {
    if (!parts?.length) {
      return 0;
    }
    const offset = parts[parts.length - 1].to + 1;
    return offset;
  }

  async getVideo(tusTaskId) {
    try {
      const cache = this.cacheMap.get(tusTaskId);
      if (cache) {
        return cache;
      }
      // video value can be null
      const video = await this.client.findVideoByTag(tusTaskId);
      if (!video?.data?.data?.length) {
        return null;
      }
      const videoData = video.data.data[0];
      const mdSize = videoData.metadata.find((md) => md.key == "size");
      const videoStatus = await this.client.videoStatus(videoData.videoId);
      if (!videoStatus?.data?.ingest) {
        return null;
      }
      const hasStatus = videoStatus?.data?.ingest?.status;
      const videoMetaData = {
        id: videoData.videoId,
        size: parseInt(mdSize.value || 0, 10),
        offset: hasStatus
          ? this.decodeOffset(videoStatus.data.ingest.receivedBytes)
          : 0,
      };
      this.cacheMap.set(tusTaskId, videoMetaData);
      return videoMetaData;
    } catch (err) {
      console.log(API_VIDEO_STORE, "getVideo");
      return null;
    }
  }

  async getVideoId(tusTaskId) {
    const video = await this.getVideo(tusTaskId);
    return video ? video.id : null;
  }

  async getCurrentOffset(tusTaskId) {
    const video = await this.getVideo(tusTaskId);
    return video ? video.offset : 0;
  }

  async getVideoSize(tusTaskId) {
    const video = await this.getVideo(tusTaskId);
    return video ? video.size : null;
  }

  async setVideoOffset(tusTaskId, newOffset) {
    const video = await this.getVideo(tusTaskId);
    if (video && newOffset > video.offset) {
      const newData = { ...video };
      newData.offset = newOffset;
      this.cacheMap.set(tusTaskId, newData);
      return true;
    }
    return false;
  }

  async deleteVideo(tusTaskId) {
    try {
      const video = await this.getVideo(tusTaskId);
      if (!video) {
        return true;
      }
      await this.client.deleteVideo(video.id);
      return true;
    } catch (err) {
      // Ignore
    } finally {
      this.cacheMap.set(tusTaskId, null);
    }
    return null;
  }

  async createVideo(tusTaskId, size) {
    try {
      const video = await this.client.createVideo({
        title: tusTaskId,
        tags: [tusTaskId],
        metadata: [{ key: "size", value: size + "" }],
      });
      if (!video) {
        return null;
      }
      const videoData = {
        id: video.data.videoId,
        offset: 0,
        size,
      };
      this.cacheMap.set(tusTaskId, videoData);
      return videoData;
    } catch (err) {
      console.log("createVideo", "error", err);
      return null;
    }
  }

  async uploadVideoPart(tusTaskId, chunkStream, chunkSize) {
    const video = await this.getVideo(tusTaskId);
    if (!video) {
      throw ERRORS.FILE_WRITE_ERROR;
    }
    const fromRange = video.offset;
    const toRange = video.offset + (chunkSize - 1);
    const totalSize = video.size;
    const contetRange = `bytes ${fromRange}-${toRange}/${totalSize}`;
    console.log("UVP1: ", contetRange);
    return new Promise((resolve, reject) => {
      this.client
        .uploadPart(video.id, chunkStream, contetRange)
        .then(() => {
          resolve(true);
        })
        .catch(() => {
          reject(ERRORS.FILE_WRITE_ERROR);
        });
    });
  }
}

class ApiVideoStore extends DataStore {
  constructor(options) {
    super();
    this.extensions = ["creation", "creation-with-upload", "termination"];
    const { partSizeMiB = null, apiKey } = options;
    const validMiB = partSizeMiB < 5 || !partSizeMiB ? 5 : partSizeMiB;
    this.preferredPartSize = ApiVideo.MibToBytes(validMiB);
    this.cacheManager = new VideoCacheManager(apiKey);
  }

  /**
   * Creates a multipart upload on S3 attaching any metadata to it.
   * Also, a `${file_id}.info` file is created which holds some information
   * about the upload itself like: `upload-id`, `upload-length`, etc.
   */
  async create(upload) {
    const video = await this.cacheManager.createVideo(upload.id, upload.size);
    if (!video) {
      throw new Error("Unable to create video");
    }
    console.log(API_VIDEO_STORE, "CREATE_UPLOAD", upload.id, video.id);
    upload.apiVideoId = video.id;
    return upload;
  }

  /**
   * Write to the file, starting at the provided offset
   */
  async write(readable, id, offset) {
    const videoSize = await this.cacheManager.getVideoSize(id);
    // const videoId = await this.cacheManager.getVideoId(id);
    const currentSize = Math.min(this.preferredPartSize, videoSize - offset);
    const newOffset = offset + currentSize;
    if (offset < videoSize) {
      await this.cacheManager.uploadVideoPart(id, readable, currentSize);
    }
    await this.cacheManager.setVideoOffset(id, newOffset);
    return newOffset;
  }

  async getUpload(id) {
    const currentOffset = await this.cacheManager.getCurrentOffset(id);
    if (currentOffset === null) {
      throw ERRORS.FILE_NOT_FOUND;
    }
    const videoSize = await this.cacheManager.getVideoSize(id);
    if (videoSize === null) {
      throw ERRORS.FILE_NOT_FOUND;
    }
    console.log("GU: ", id, currentOffset, videoSize);
    return new Upload({
      id,
      offset: currentOffset,
      size: videoSize, // Total Video Size
      metadata: {},
    });
  }

  async remove(id) {
    try {
      await this.cacheManager.deleteVideo(id);
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = ApiVideoStore;