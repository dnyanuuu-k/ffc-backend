const onehealthCapture = require("./onehealthCapture");
const S3 = require("aws-sdk/clients/s3");
const constants = require("./constants");

const AWS_REGION = "us-east-1";
const config = new S3({
	region: AWS_REGION,
	endpoint: constants.s3URL, // for docker, http://minio:9000
	credentials: {
		accessKeyId: constants.s3User, // MINIO_ROOT_USER
		secretAccessKey: constants.s3Pass, // MINIO_ROOT_PASSWORD
	},
	s3ForcePathStyle: true, // important
});

//BUCKETS
const FESTIVAL_IMAGES_BUCKET = "festivalimages"; // For Festival Logo and Cover
const FESTIVAL_GALLERY_BUCKET = "festivalgallery"; // Festival Photos
const FILM_GALLERY_BUCKET = "filmgallery"; // Film Photos
const FILM_IMAGES_BUCKET = "filmimages"; // For Film Poster and thumbnail
const PROFILE_IMAGES_BUCKET = "profileimages";
const SUBMISSION_MAP_BUCKET = "submissionmap"; // For storing submission map
const FILM_VIDEOS = "filmvideos";
const TEMP_BUCKET = "temp"; // Data in this bucket will be deleted periodically

const addFileToBucket = async ({ name, file }, Bucket) => {
	try {
		let params = {
			Bucket,
			Body: file.buffer,
			Key: name,
			ContentType: file.mimetype,
			ContentLength: file.size,
		};
		await config.putObject(params).promise();
		const path = `${Bucket}/${name}`;
		return [false, path];
	} catch (err) {
		onehealthCapture.catchError(err);
		return [true, false];
	}
};

const deleteFileFromBucket = async (Key, Bucket) => {
	try {
		let params = {
			Bucket,
			Key,
		};
		await config.deleteObject(params).promise();
		return [false, true];
	} catch (err) {
		console.log(err);
		onehealthCapture.catchError(err);
		return [true, false];
	}
};

const moveToBucket = async (currentFile, Bucket) => {
	try {
		const parts = (currentFile || "").split("/");
		const currentBucketName = parts?.[0];
		const currentKey = parts?.[1];
		await config
			.copyObject({
				CopySource: `${currentBucketName}/${currentKey}`, // old file Key
				Bucket,
				Key: currentKey,
			})
			.promise();

		await config
			.deleteObject({
				Bucket: currentBucketName,
				Key: currentKey,
			})
			.promise();

		const path = `${Bucket}/${currentKey}`;
		return [false, path];
	} catch (err) {
		onehealthCapture.catchError(err);
		return [true, false];
	}
};

module.exports = {
	addFileToBucket,
	deleteFileFromBucket,
	moveToBucket,
	FESTIVAL_IMAGES_BUCKET,
	FESTIVAL_GALLERY_BUCKET,
	FILM_GALLERY_BUCKET,
	FILM_IMAGES_BUCKET,
	PROFILE_IMAGES_BUCKET,
	SUBMISSION_MAP_BUCKET,
	TEMP_BUCKET,
	FILM_VIDEOS,
	AWS_REGION,
	config
};