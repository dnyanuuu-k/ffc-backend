/************************************
 *               @RLVU               *
 *   Resumable Large Video Uploader  *
 *************************************/

//Models
const Models = require("#models");

//Constants
const sequelize = require("#utils/dbConnection");
const err = require("#utils/errors");
//Helper Functions
const onehealthCapture = require("#utils/oneHealthCapture");
const validation = require("#utils/validation");
const constants = require("#utils/constants");
const aws = require("#utils/aws");

const { Op } = require("sequelize");
//Third Party Functions

const CHUNK_NUMBER = "uploader-chunk-number";
const CHUNK_TOTAL = "uploader-chunks-total";
const CHUNK_FILE_ID = "uploader-file-id";

// Helper Functions
const getVideoExtension = (mimetype) => {
    switch (mimetype) {
        case constants.SUPPORTED_MIME_TYPES[0]:
            return "mp4";
        case constants.SUPPORTED_MIME_TYPES[1]:
            return "mov";
        case constants.SUPPORTED_MIME_TYPES[2]:
            return "avi";
        case constants.SUPPORTED_MIME_TYPES[3]:
            return "wmv";
        default:
            return "";
    }
};

const abortS3Upload = async (abortParams) => {
    await aws.config.abortMultipartUpload(abortParams).promise();
};


/************************************
 *              Step: 1             *
 ************************************
 * Create a record that will store  *
 * current state for default values *
 ************************************/

/**
 * Record | Film Video
 * id
 * film_id
 * s3_upload_id
 * size_in_mb
 * current_chunk
 * total_chunks
 * video_state - [Created | Uploading | Uploaded | Transcoding | Ready]
 * mimetype
 * stream_url
 * video_url
 * hls_variants [ hls_2M, hls_1M, hls_600K ]
 * s3_etags json []
 * thumbnail_url
 * thumbnail_hash
 * created_at
 **/

const createFilmRecord = async (params) => {
    try {
        const { filmId } = params;
        const fileMetaData = new Map(Object.entries(params));
        const videoState = constants.VIDEO_STATES.CREATED;
        if (!validation.validId(filmId)) {
            return {
                message: err.film_not_found,
            };
        }
        if (!fileMetaData.has("sizeInMb")) {
            return {
                message: "File Size is required",
            };
        }
        if (!fileMetaData.has("mimetype")) {
            return {
                message: "File Type is required",
            };
        }
        if (constants.SUPPORTED_MIME_TYPES.indexOf(fileMetaData.get("mimetype")) === -1) {
            return {
                message: "Video Type not supported",
            };
        }
        const alreadyCreated = await Models.FilmVideos.findOne({
            where: {
                filmId,
                totalChunks: {
                    [Op.not]: null,
                },
            },
        });
        if (alreadyCreated) {
            return {
                success: true,
                data: alreadyCreated,
            };
        }
        // Initiate the multipart upload
        const ext = getVideoExtension(fileMetaData.get("mimetype"));
        const videoUrl = `${filmId}/video.${ext}`;
        const uploadParams = {
            Bucket: aws.FILM_VIDEOS,
            Key: videoUrl
        };
        const uploadData = await aws.config.createMultipartUpload(uploadParams).promise();
        const s3UploadId = uploadData.UploadId;        
        const creatableRecord = {
            filmId,
            videoState,
            videoUrl,
            s3UploadId,
            totalChunks: fileMetaData.get("totalChunks"),
            sizeInMb: fileMetaData.get("sizeInMb"),
            mimetype: fileMetaData.get("mimetype"),
        };
        const filmVideo = await Models.FilmVideos.create(creatableRecord);
        if (filmVideo) {
            return {
                success: true,
                data: filmVideo,
            };
        } else {
            return {
                message: "Unable to create video record",
            };
        }
    } catch (tryErr) {
        onehealthCapture.catchError(tryErr);
        return {
            message: err.server_error,
        };
    }
};

/************************************
 *              Step: 2             *
 ************************************
 * Upload video chunk, and update   *
 * record as well in database       *
 ************************************/

const uploadVideoPart = async (params, headers, file) => {
    // const { } = params || {};
    let transaction = null;
    let abortParams = {};
    try {    
        console.log(headers);    
        const s3UploadId = headers[CHUNK_FILE_ID];
        const currentChunk = parseInt(headers[CHUNK_NUMBER]);
        const totalChunks = parseInt(headers[CHUNK_TOTAL]);
        // const isFirst = currentChunk === 0;
        const isLast = (currentChunk + 1) === totalChunks;
        const filmVideo = await Models.FilmVideos.findOne({
            where: {
                s3UploadId
            }
        });
        if (currentChunk < filmVideo.currentChunk) {
            // Abort Upload...
            console.log("ABROT HERRE 1", currentChunk < filmVideo.currentChunk, currentChunk , filmVideo.currentChunk);
            return {
                message: err.something,
            };
        }
        if (totalChunks !== filmVideo.totalChunks) {
            // Abort Upload...
            console.log("ABROT HERRE 2", totalChunks !== filmVideo.totalChunks, totalChunks, filmVideo.totalChunks);
            return {
                success: true,
                message: err.something,
            };
        }
        if(!filmVideo){
            return {
                message: err.film_video_not_found
            };
        }
        // Create a new part
        const partNumber = currentChunk + 1;
        const partParams = {
            Body: file.buffer,
            Bucket: aws.FILM_VIDEOS,
            Key: filmVideo.videoUrl,
            PartNumber: partNumber,
            UploadId: s3UploadId,
        };
        abortParams = {
            Bucket: aws.FILM_VIDEOS,
            Key: filmVideo.videoUrl,
            UploadId: s3UploadId,
        };
        let transaction = await sequelize.transaction();
        const partData = await aws.config.uploadPart(partParams).promise();
        // Add the ETag of the uploaded part to the array
        const etags = filmVideo.s3Etags || [];        
        etags.push({
            PartNumber: partNumber,
            ETag: partData.ETag,
        });
        let updateParams = {
            currentChunk,
            s3Etags: etags
        };
        if(isLast){
            const completeParams = {
              Bucket: aws.FILM_VIDEOS,
              Key: filmVideo.videoUrl,
              UploadId: s3UploadId,
              MultipartUpload: {
                Parts: etags
              }
            };
            await aws.config.completeMultipartUpload(completeParams).promise();
            updateParams.videoState = constants.VIDEO_STATES.UPLOADED;
        }else{
            updateParams.videoState = constants.VIDEO_STATES.UPLOADING;
        }

        await Models.FilmVideos.update(updateParams, { where: {
            id: filmVideo.id
        }, transaction });

        await transaction.commit();

        return {
            success: true,
            data: filmVideo,
        };
    } catch (tryErr) {
        onehealthCapture.catchError(tryErr);
        if(transaction){
            transaction.rollback();
            abortS3Upload(abortParams);
        }
        return {
            message: "Unable to upload video"
        };
    }
};

const getVideoRecord = async (filmId) => {
    const filmData = await Models.FilmVideos.findOne({
        where: {
            filmId
        },
    });
    if (filmData) {
        return {
            success: true,
            data: filmData,
        };
    }
    return {
        message: err.server_error
    };
};

module.exports = {
    createFilmRecord,
    uploadVideoPart,
    getVideoRecord
};