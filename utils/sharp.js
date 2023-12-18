const sharp = require("sharp");

const avatar = async (buffer) => {
	const data = await sharp(buffer)
		.png({
			compressionLevel: 6,
			quality: 95,
			adaptiveFiltering: true,
			force: true,
		})
		.resize(global.LOGO_SIZE.w, global.LOGO_SIZE.h)
		.toBuffer({ resolveWithObject: true });
	return data;
};

module.exports = {
	avatar,
};