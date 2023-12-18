const axios = require("axios");
const constants = require("./constants");

class ApiVideo {
	static MibToBytes = (mib) => {
		return mib * 1024 * 1024;
	};

	constructor(apiKey, isProd = false) {
		if (typeof apiKey !== "string" || apiKey.length <= 4) {
			throw new Error("Invalid api key");
		}
		this.basicAuth = "Basic " + btoa(`${apiKey}:`);
		this.endpoint = isProd
			? "https://ws.api.video"
			: "https://sandbox.api.video";
	}

	getVideoData = (videoId) => {
		const videoUrl = `${this.endpoint}/videos/${videoId}`;
		const headers = {
			Authorization: this.basicAuth,
		};
		return axios.get(videoUrl, {
			headers,
		});
	};

	videoStatus = (videoId) => {
		const headers = {
			Authorization: this.basicAuth,
		};
		const statusUrl = `${this.endpoint}/videos/${videoId}/status`;
		return axios.get(statusUrl, {
			headers,
		});
	};

	getAssets = (videoId) => {
		return {
			player: `https://embed.api.video/vod/${videoId}`,
			hls: `https://vod.api.video/vod/${videoId}/hls/manifest.m3u8`,
			thumbnail: `https://vod.api.video/vod/${videoId}/thumbnail.jpg`,
		};
	};
}

const apiVideo = new ApiVideo(constants.apiVideoKey);

module.exports = apiVideo;