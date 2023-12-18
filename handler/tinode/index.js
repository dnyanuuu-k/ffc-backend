const aws = require("#utils/aws");
const Models = require("#models");
const constants = require("#utils/constants");
const { indexedDB } = require("fake-indexeddb");
const { Tinode } = require("tinode-sdk");
const moment = require("moment");

Tinode.setNetworkProviders(require("ws"), require("xmlhttprequest"));
Tinode.setDatabaseProvider(indexedDB);

const FESTIVAL_USER = constants.WORK_TYPES.MANAGE_FESTIVAL;
const GENERAL_USER = constants.WORK_TYPES.SUBMIT_WORK;
const MAIL_DOMAIN = "@ffb.com";
const RESP_DEFAULT_CODE = "297336";
const TINODE_PASS_SECRET = "&6393n6";
const tinodeClient = new Tinode(
	{
		appName: "node_backend",
		host: "localhost:6060",
		secure: false,
		apiKey: "AQEAAAABAAD_rAp4DJh05a1HAwFT3A6K",
		platform: "ios",
		persist: false,
		transport: "ws",
	},
	() => {
		console.log("Tinode: Init");
		connect();
	}
);

// tinodeClient.enableLogging(true);

tinodeClient.onConnect = () => {
	console.log("Tinode: Connected");
};

tinodeClient.onDisconnect = () => {
	console.log("Tinode: Disconnect");
};

const connect = async () => {
	try {
		await tinodeClient.connect("localhost:6060");
	} catch (err) {
		console.log(err);
	}
};

const generateRandomString = (length = 6) => {
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		result += characters.charAt(randomIndex);
	}

	return result;
};

const createAccount = async ({
	id,
	type = FESTIVAL_USER,
	firstName,
	lastName,
	email,
}) => {
	if (!id) {
		throw new Error("Id and email are required");
	}
	let username = "";
	// let password = generateRandomString(6);
	let password = TINODE_PASS_SECRET;
	let fullName = "";
	let imageBucket = "";
	if (type === FESTIVAL_USER) {
		username = "festuser" + id;
		imageBucket = aws.FESTIVAL_IMAGES_BUCKET;
	} else {
		imageBucket = aws.PROFILE_IMAGES_BUCKET;
		username = "generaluser" + id;
	}
	if (firstName || lastName) {
		if (firstName) {
			fullName += " " + firstName;
		}
		if (lastName) {
			fullName += " " + lastName;
		}
		fullName = fullName.slice(1);
	} else if (email) {
		fullName += email;
	}
	const currentStamp = moment().unix();
	const avatarUrl = `${imageBucket}/${id}-logo?t=${currentStamp}`;
	const credVal = username + MAIL_DOMAIN;
	const cred = Tinode.credential({
		meth: "email",
		val: credVal,
	});
	const configData = {
		u: username,
		p: password,
	};
	try {
		const account = await tinodeClient.createAccountBasic(
			username,
			password,
			{
				public: {
					fn: fullName,
					photo: {
						data: Tinode.DEL_CHAR,
						ref: avatarUrl,
						type: "image/png",
					},
				},
				cred,
				tags: [],
				attachments: [],
			}
		);
		const params = account?.params;		
		if (params) {
			configData.i = params.user;
			const toUpdate = {
				type,
				config: configData,
			};
			if (type === FESTIVAL_USER) {
				toUpdate.festivalId = id;
			} else {
				toUpdate.userId = id;
			}
			Models.TinodeConfig.upsert(toUpdate);
			await verifyAccount(username, true);
		}
		return configData;
	} catch (err) {		
		if (err.message === "duplicate credential (409)") {
			await verifyAccount(username, false);
			return configData;
		}
		return false;
	}
};

const verifyAccount = async (username, isNew = false) => {
	const credentialData = {
		meth: "email",
		val: username + MAIL_DOMAIN,			
	};
	if(isNew) {
		credentialData.resp = RESP_DEFAULT_CODE;
	}
	const loginData = await tinodeClient.loginBasic(
		username,
		TINODE_PASS_SECRET,
		Tinode.credential(credentialData)
	);
	console.log(loginData);
	return loginData;
};

const updateAccount = async (i, u, p, params) => {
	try {
		await tinodeClient.updateAccountBasic(i, u, p, {
			public: {
				fn: params.name,
				photo: {
					data: Tinode.DEL_CHAR,
					ref: params.avatar,
					type: "image/png",
				},
			},
		});
	} catch (err) {
		console.log(err);
	}
};

module.exports = {
	connect,
	createAccount,
	verifyAccount,
	updateAccount,

	FESTIVAL_USER,
	GENERAL_USER,
};