const common = require("#utils/common");
const constants = require("#utils/constants");
const fetch = require("node-fetch");

const { razorpayXAPIKey, razorpayXSecret, razorpayXIdentifier } = constants;
const baseURL = "https://api.razorpay.com/v1/";
const generateAccessToken = () => {
    const auth = Buffer.from(razorpayXAPIKey + ":" + razorpayXSecret).toString(
        "base64"
    );
    return auth;
};

const makeRequest = async (entity, payload) => {
    const accessToken = generateAccessToken();
    const response = await fetch(baseURL + entity, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${accessToken}`,
        },
        method: "POST",
        body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
};

const createContact = async (name, email, userId) => {
    const entity = "contacts";
    const data = await makeRequest(entity, {
        name,
        email,
        type: "customer",
        reference_id: `${userId}`,
    });
    return data.id;
};

const createFundAccount = async (contactId, vpaAddress) => {
    const entity = "fund_accounts";
    const data = await makeRequest(entity, {
        contact_id: contactId,
        account_type: "vpa",
        vpa: {
            address: vpaAddress,
        },
    });
    console.log(data);
    return data.id;
};

const createPayout = async (
    { email, userId, firstName, lastName, upiAddress }, // User Details
    amount, // Payout Amount in Rupees
    payoutId // Payout Id
) => {
    const entity = "payouts";
    const name = `${firstName} ${lastName}`;
    const contactId = await createContact(name, email, userId);
    const fundAccountId = await createFundAccount(contactId, upiAddress);
    const data = await makeRequest(entity, {
        account_number: razorpayXIdentifier,
        fund_account_id: fundAccountId,
        amount: parseInt(common.toPaise(amount), 10),
        currency: "INR",
        mode: "UPI",
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: `${payoutId}`,
    });
    return data;
};

const getAmount = (grossSales) => {
    let nationalFee = grossSales * constants.RAZORPAY_FEE_PERCENT;

    let nationalNetSales = grossSales - nationalFee;

    if (nationalNetSales < 0) {
        nationalNetSales = 0;
    }

    return {
        netAmount: nationalNetSales,
        paymentFee: nationalFee,
    };
};

module.exports = {
    getAmount,
    createPayout
};