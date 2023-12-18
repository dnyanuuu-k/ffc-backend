//Models
const Models = require("#models");

const { Server, EVENTS } = require("@tus/server");
const ApiVideoStore = require("#utils/api-video-store");
const express = require("express");
const constants = require("#utils/constants");
// const aws = require("#utils/aws");
const uploadApp = express();
const datastore = new ApiVideoStore({
	apiKey: constants.apiVideoKey,
	partSizeMiB: 5,
});
// datastore.client.config.forcePathStyle = true;
const server = new Server({
	path: "/temp",
	datastore,
	namingFunction: (req) => {
		return req.headers["x-upload-id"];
	},
});

server.on(EVENTS.POST_CREATE, (req, res, upload) => {
	console.log("POST_CREATE: ", upload);
	const uploadId = req.headers["x-upload-id"];
	const filmVideoId = parseInt(uploadId.split("_")[1], 10);
	Models.FilmVideos.update(
		{
			s3FileId: upload.apiVideoId,
			tusTaskId: upload.id,
			status: constants.VIDEO_STATES.UPLOADING,
		},
		{
			where: {
				id: filmVideoId,
			},
		}
	);
});

server.on(EVENTS.POST_RECEIVE, (req, res, upload) => {
	console.log("POST_RECEIVE: ", upload);
	const uploadId = req.headers["x-upload-id"];
	const uploadedBytes = req.headers["upload-offset"];
	const filmVideoId = parseInt(uploadId.split("_")[1], 10);
	Models.FilmVideos.update(
		{
			uploadedBytes,
		},
		{
			where: {
				id: filmVideoId,
			},
		}
	);
});

server.on(EVENTS.POST_FINISH, (req) => {
	console.log("POST_FINISH", req.headers["x-upload-id"]);
	const uploadId = req.headers["x-upload-id"];
	const filmVideoId = parseInt(uploadId.split("_")[1], 10);
	Models.FilmVideos.findOne({
		attributes: ["s3FileId"],
		where: {
			id: filmVideoId,
		},
	}).then((film) => {
		// aws.deleteFileFromBucket(
		// 	film?.s3FileId + ".info",
		// 	aws.FILM_VIDEOS
		// );
	});
	Models.FilmVideos.update(
		{
			status: constants.VIDEO_STATES.READY,
		},
		{
			where: {
				id: filmVideoId,
			},
		}
	);
});

server.on(EVENTS.POST_TERMINATE, (req) => {
	console.log("Terminated: ", req.headers);
});

uploadApp.all("*", server.handle.bind(server));

module.exports = uploadApp;