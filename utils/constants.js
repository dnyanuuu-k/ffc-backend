const constants = {
	projectId: "FFC",
	environment: "dev",
	dbUrl: "postgresql://postgres:Rathod123@localhost:5432/ffc",
	salt: "asasaasdasdsadas",

	paypalClientId:
		"AVZIr1O57PbImINJIypzT8IGNYR_m3jf1ecU6pF6zlq3uK2dQxlbl8-N-RhpJAaL2NYa8TgA86mYtrMs",
	paypalSecret:
		"EOYAGOHQ9D5QS-hrxJ31fccT_FidfP9Yv5BYSDvLePHfy1k9LFIc4uS_UOZ2oKBsPa5NYTUwHT3VgAS4",
	paypalBaseUrl: "https://api-m.sandbox.paypal.com",

	razorpayAPIKey: "rzp_test_Cfu49SWrDfnYz1",
	razorpaySecret: "tQteMWmSjZV7TEODbYKNn2jj",

	razorpayXAPIKey: "rzp_test_9hfScSg6m2Y8Jp",
	razorpayXSecret: "xsKBqCBnmPzrnB4jbFGR4kwN",
	razorpayXIdentifier: "2323230082484755",
	s3User: "minioadmin",
	s3Pass: "minioadmin",
	s3URL: "http://localhost:9000",
	authSecret: "Dsdc3caAxSDBVASDCds33uEEfDcvr2dasu8gJKBFkjf3c8", // Secret for verying every request
	verifySecret: "CNBNiubcveFEFEEAFMM33DDWvBbcu8gJKBFkjf3bc", // Secret for verifying OTP
	XRT: "9#xn$$x1", //Secret for encrypting post values,
	apiVideoKey: "AmlcQtiwKntYrlKoTQ26QbCPH19gpinT3UfRMRBiZEF"
};

// Global Constants
global.STATUS_ACTIVE = 1;
global.STATUS_INACTIVE = 0;
global.STATUS_DELETED = 2;
global.STATUS_BLOCKED = 3;
global.OTP_LENGTH = 4;
global.THUMB_SIZE = { w: 120, h: 120 };
global.LOGO_SIZE = { w: 330, h: 330 };
global.COVER_SIZE = { w: 1500, h: 500 };
global.MAX_IMAGE_WIDTH = 1280;
global.MAX_IMAGE_HEIGHT = 1080;
global.MMMMDDYYYY = "MMMM DD, YYYY";
global.DDMMMYYYY = "DD MMM YYYY";
global.YYYYMMDD = "YYYY-MM-DD";
global.FEATURED_PHOTO_COUNT = 4;
global.MAX_RATING = 5;
global.GENDER_LIST = ["male", "female", "others"];
global.NATIONAL_CURRENCY = "INR";
global.INTERNATIONAL_CURRENCY = "USD";
global.RAZORPAY = 1;
global.PAYPAL = 2;

// RUNTIME TYPES
global.FESTIVAL_RUNTIMES = {
	ANY: "ANY",
	BETWEEN: "BETWEEN",
	OVER: "OVER",
};

global.DEFAULT_ALBUM_THUMB = "companyimages/default_album.jpeg";

// Video State Constants
constants.VIDEO_STATES = {
	CREATED: "created",
	UPLOADING: "uploading",
	UPLOADED: "uploaded",
	TRANSCODING: "transcoding",
	READY: "ready",
};

// Payment Gateway Constants
constants.PAYPAL_FEE_PERCENT_USD = 0.03;
constants.PAYPAL_FEE_AMOUNT_USD = 0.3;
constants.RAZORPAY_FEE_PERCENT = 0.025;
constants.COMMON_PAYMENT_FEE_PERCENT = 0.03;

constants.RAZORPAY_PAYOUT_STATUS = {
	pending: 0,
	rejected: 1,
	cancelled: 2,
	reversed: 3,
	failed: 4,
	processing: 5,
	queued: 6,
	processed: 7,
};

constants.PAYPAL_PAYOUT_STATUS = {
	PENDING: 0,
	BLOCKED: 1,
	RETURNED: 2,
	REFUNDED: 2,
	REVERSED: 3,
	FAILED: 4,
	UNCLAIMED: 6,
	ONHOLD: 6,
	SUCCESS: 7,
};

constants.PAYOUT_STATUS = {
	PENDING: 0,
	PROCESSING: 1,
	COMPLETED: 2,
	FAILED: 3,
};

constants.REQUEST_TYPE = {
	REQUEST_NAME_CHANGE: 0,
};

constants.REQUEST_STATUS = {
	PENDING: 0,
	APPROVED: 1,
	REJECTED: 2,
};

// Submission Status
constants.SUBMISSION = {
	IN_CONSIDERATION: 1,
	INCOMPLETE: 0,
	DISQUALIFIED: 2,
	WITHDRAWN: 3,
};

// Judging Status
constants.JUDGE = {
	// Not Selected
	UNDECIDED: 0,
	NOT_SELECTED: 1,

	// Selected
	SELECTED: 2,
	AWARD_WINNER: 3,
	FINALIST: 4,
	SEMI_FINALIST: 5,
	QUATER_FINALIST: 6,
	NOMINEE: 7,
	HONARABLE_MENTION: 8,
};

constants.SUPPORTED_MIME_TYPES = [
	"video/mp4", // MPEG-4  .mp4
	"video/quicktime", // QuickTime   .mov
	"video/x-msvideo", // A/V Interleave  .avi
	"video/x-ms-wmv", // Windows Media   .wmv
];

constants.JUDGE_PERMISSION_LIST = [
	{
		label: "Judge Submissions",
		value: "judge",
	},
	{
		label: "View submitter contact information",
		value: "judge.contact",
	},
	{
		label: "View submitter details (Synopsis, Digital Press Kit, etc.)",
		value: "judge.details",
	},
	{
		label: "Share ratings with submitter",
		value: "judge.review",
	},
];

constants.DEFAULT_FLAGS = [
	{
		id: 1,
		title: "Blue",
		color: "#65BBFC",
	},
	{
		id: 2,
		title: "Red",
		color: "#FC6265",
	},
	{
		id: 3,
		title: "Yellow",
		color: "#EBCF34",
	},
	{
		id: 4,
		title: "Purple",
		color: "#D381F7",
	},
	{
		id: 5,
		title: "Grey",
		color: "#C8C8C8",
	},
	{
		id: 6,
		title: "Orange",
		color: "#FCB32A",
	},
	{
		id: 7,
		title: "Black",
		color: "#111111",
	},
];

// Work Types
constants.WORK_TYPES = {
	MANAGE_FESTIVAL: 1,
	SUBMIT_WORK: 2,
};

module.exports = constants;