const constants = require("./constants");
const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (authHeader) {
		const token = authHeader.split(" ")[1];
		jwt.verify(token, constants.authSecret, (err, user) => {
			if (err) {
				return res.sendStatus(403);
			}
			let userId = user.id;
			if(typeof userId === "string")userId = parseInt(userId, 10);
			if(Number.isNaN(userId)) userId = 0;
			if(req.body){
				req.body.userId = userId;
			}else{
				req.body = { userId };
			}
			next();
		});
	} else {
		res.sendStatus(401);
	}
};

const verifyJWT = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (authHeader) {
		const token = authHeader.split(" ")[1];
		jwt.verify(token, constants.verifySecret, (err, user) => {
			if (err) {
				return res.sendStatus(403);
			}
			if(req.body){
				req.body.userId = user.id;
				req.body.authOTP = user.otp;
			}else{
				req.body = { userId: user.id, authOTP: user.otp };
			}
			next();
		});
	} else {
		res.sendStatus(401);
	}
};

module.exports = {
	authenticateJWT,
	verifyJWT
};