class SMSHandler {
	static CUSTOMER_APP = "customer_app";
	static sendOTP = async (otp, type) => {
		console.log("Sending OTP...", otp, "to", type);
	};
}

module.exports = SMSHandler;