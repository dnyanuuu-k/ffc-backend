const axios = require("axios");
const FormData = require("form-data");

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

	findVideoByTag = (tagId) => {
		const headers = {
			Authorization: this.basicAuth,
		};
		const statusUrl = `${this.endpoint}/videos`;
		return axios.get(statusUrl, {
			headers,
			params: {
				tags: [tagId],
			},
		});
	};

	deleteVideo = (videoId) => {
		const headers = {
			Authorization: this.basicAuth,
		};
		const deleteUrl = `${this.endpoint}/videos/${videoId}`;
		console.log(deleteUrl);
		return axios.delete(deleteUrl, {
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

	uploadPart = (videoId, fileStream, contentRange) => {
		const uploadUrl = `${this.endpoint}/videos/${videoId}/source`;
		const headers = {};
		headers["Content-Range"] = contentRange;
		headers["Authorization"] = this.basicAuth;
		const formData = new FormData();
		// const tempStream = fs.createReadStream("./test.mp4");
		formData.append("file", fileStream);
		return axios.post(uploadUrl, formData, {
			headers,
		});
	};

	createVideo({ title, tags, metadata }) {
		const uploadUrl = `${this.endpoint}/videos`;
		const data = { title, tags, metadata };
		const headers = {};
		headers["Content-Type"] = "application/json";
		headers["Authorization"] = this.basicAuth;
		return axios.post(uploadUrl, data, {
			headers,
		});
	}
}

module.exports = ApiVideo;