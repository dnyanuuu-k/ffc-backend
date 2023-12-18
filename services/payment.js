/**
 * @Page: Payment Services
 * @Description: Create payment related functions here
 */

//Models
const Models = require("#models");

// Handler
const submissionHandler = require("#handler/submission/");
const paypalHandler = require("#handler/paypal/");
const razorpayHandler = require("#handler/razorpay/");
const cartHandler = require("#handler/cart/");

//Constants
const sequelize = require("#utils/dbConnection");
const constants = require("#utils/constants");
const { QueryTypes } = require("sequelize");
const err = require("#utils/errors");

//Helper Functions
const common = require("#utils/common");
const validation = require("#utils/validation");
const onehealthCapture = require("#utils/oneHealthCapture");

// Third Party Functions
const Razorpay = require("razorpay");

var razorpayInstance = new Razorpay({
  key_id: constants.razorpayAPIKey,
  key_secret: constants.razorpaySecret,
});

const getRazorpayOrder = (options) => {
  return new Promise((resolve, reject) => {
    razorpayInstance.orders.create(options, function (err, order) {
      if (err) {
        reject(err);
        return;
      }
      resolve(order);
    });
  });
};

const createCartOrder = async ({ userId }) => {
  let transaction = null;
  try {
    const cartSummary = await cartHandler.createOrderSummary(userId);
    if (!cartSummary) {
      return {
        message: err.cart_summary,
      };
    }

    const cartAmount = parseFloat(Number(cartSummary.amount).toFixed(2));
    let razorpay = false;
    if (cartSummary.currency.code === global.NATIONAL_CURRENCY) {
      razorpay = true;
    }
    let gatewayOrderId = "";
    let gatewayCode = global.RAZORPAY;
    if (razorpay) {
      var options = {
        amount: common.toPaise(cartAmount),
        currency: cartSummary.currency.code,
      };
      const order = await getRazorpayOrder(options);
      gatewayOrderId = order.id;
    } else {
      const order = await paypalHandler.createOrder(
        cartAmount,
        cartSummary.currency.code
      );
      gatewayOrderId = order.id;
      gatewayCode = global.PAYPAL;
    }
    transaction = await sequelize.transaction();
    const cartOrder = await Models.CartOrders.create(
      {
        userId,
        gatewayOrderId,
        gatewayCode,
        amount: cartSummary.amount,
        currencyId: cartSummary.currency.id,
        saving: cartSummary.goldSubscriptionSavings,
      },
      { transaction }
    );
    const bulkItems = [];
    for (const cartItem of cartSummary.orderItems) {
      const {
        filmId,
        amount,
        festivalCategoryFeeId,
        exchRate,
        festivalCurrencyId,
        festivalCurrencyCode,
        festivalAmount,
        saving = 0,
      } = cartItem;
      const mfestivalAmount = festivalAmount ? parseFloat(festivalAmount) : 0;
      let feeData = null;

      if (
        cartSummary.currency.code !== global.NATIONAL_CURRENCY &&
        festivalCurrencyCode === global.NATIONAL_CURRENCY
      ) {
        const usdAmount = mfestivalAmount * exchRate;
        feeData = paypalHandler.getAmount(usdAmount);
        feeData.netAmount = feeData.netAmount / exchRate;
        feeData.paymentFee = feeData.paymentFee / exchRate;
      } else if (festivalCurrencyCode !== global.NATIONAL_CURRENCY) {
        feeData = paypalHandler.getAmount(mfestivalAmount);
      } else {
        feeData = razorpayHandler.getAmount(mfestivalAmount);
      }
      const { netAmount, paymentFee } = feeData;

      bulkItems.push({
        festivalAmount: mfestivalAmount,
        cartOrderId: cartOrder.id,
        platformFee: 0,

        festivalCategoryFeeId,
        festivalCurrencyId,
        paymentFee,
        netAmount,
        exchRate,
        filmId,
        amount,
        saving,
      });
    }
    await Models.CartOrderItems.bulkCreate(bulkItems, {
      transaction,
    });

    await transaction.commit();
    return {
      success: true,
      data: {
        gatewayOrderId,
        orderId: cartOrder.id,
        email: cartSummary.email,
        phoneNo: cartSummary.phoneNo,
        name: cartSummary.name,
      },
    };
  } catch (tryErr) {
    if (transaction) {
      transaction.rollback();
    }
    onehealthCapture.catchError(tryErr);
    return {
      message: err.server_error,
    };
  }
};

const createPayment = async ({ gatewayTxnId, cartOrderId }) => {
  try {
    const payment = await Models.Payments.create({
      gatewayTxnId,
      cartOrderId,
    });
    return payment;
  } catch (tryErr) {
    onehealthCapture.catchError(tryErr);
    return {
      message: err.server_error,
    };
  }
};

const capturePaypalPayment = async ({ gatewayOrderId, orderId }) => {
  try {
    const paymentDetails = await paypalHandler.capturePayment(gatewayOrderId);
    // Three cases to handle:
    //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
    //   (2) Other non-recoverable errors -> Show a failure message
    //   (3) Successful transaction -> Show confirmation or thank you message

    // This example reads a v2/checkout/orders capture response, propagated from the server
    // You could use a different API or structure for your 'orderData'
    const errorDetail =
      Array.isArray(paymentDetails.details) && paymentDetails.details[0];

    if (errorDetail && errorDetail.issue === "INSTRUMENT_DECLINED") {
      return {
        success: true,
        data: {
          restart: true,
        },
      };
      // https://developer.paypal.com/docs/checkout/integration-features/funding-failure/
    }

    if (errorDetail) {
      let message = "Sorry, your transaction could not be processed.";
      message += errorDetail.description ? " " + errorDetail.description : "";
      message += paymentDetails.debug_id
        ? " (" + paymentDetails.debug_id + ")"
        : "";
      return {
        success: false,
        message,
      };
    }
    // Successful capture!
    const caputure = paymentDetails.purchase_units?.[0].payments.captures?.[0];
    let paymentId = null;
    if (caputure) {
      const paymentRecord = {
        gatewayTxnId: caputure.id,
        cartOrderId: orderId,
      };
      const payment = await createPayment(paymentRecord);
      paymentId = payment.id;
    }
    // Create submission and subscription if any
    submissionHandler.createSubmission(orderId, paymentId);

    return {
      success: true,
      data: {
        status: caputure.status,
        transactionId: caputure.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      err: err.server_error,
    };
  }
};

const captureRazorpayPayment = async ({ gatewayPaymentId, orderId }) => {
  try {
    if (
      !validation.validString(gatewayPaymentId) ||
      !validation.validId(orderId)
    ) {
      return {
        message: err.bad_request,
      };
    }
    const paymentRecord = {
      gatewayTxnId: gatewayPaymentId,
      cartOrderId: orderId,
    };
    const payment = await createPayment(paymentRecord);
    // Create submission and subscription if any
    submissionHandler.createSubmission(orderId, payment.id);

    return {
      success: true,
      data: {
        transactionId: gatewayPaymentId,
      },
    };
  } catch (error) {
    return {
      success: false,
      err: err.server_error,
    };
  }
};

const createPayout = async () => {
  const payoutPendingCount = await Models.Payouts.count({
    where: {
      status: [
        constants.RAZORPAY_PAYOUT_STATUS.pending,
        constants.RAZORPAY_PAYOUT_STATUS.processing,
      ],
    },
  });

  if (payoutPendingCount) {
    return {
      message: "Some payouts are under process",
    };
  }

  const validPayoutStatus = [
    constants.PAYOUT_STATUS.PENDING,
    constants.PAYOUT_STATUS.FAILED,
  ].join(",");

  const payoutQuery = `select
    u.id user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.paypal_email,
    u.upi_address,
    f.id festival_id,
    fcr.code festival_currency,
    sum(coi.net_amount) payout_amount,
    array_agg(coi.id) item_ids
    from payments p        
    join cart_order_items coi on coi.cart_order_id = p.cart_order_id and coi.film_id is not null and coi.payout_status in (${validPayoutStatus})
    join cart_orders co on co.id = coi.cart_order_id
    join currencies fcr on fcr.id = coi.festival_currency_id 

    join festival_category_fees fcf on fcf.id = coi.festival_category_fee_id
    join festival_categories fc on fc.id = fcf.festival_category_id
    join festivals f on f.id = fc.festival_id
    join users u on u.id = f.user_id       

    group by u.id, f.id, fcr.code`;

  const payouts = await sequelize.query(payoutQuery, {
    type: QueryTypes.SELECT,
  });

  if (!payouts.length) {
    return {
      message: "No Payments found!",
    };
  }

  for (const payout of payouts) {
    const isRazorpay = payout.festival_currency === global.NATIONAL_CURRENCY;
    let payoutRecord = {
      userId: payout.user_id,
      festivalId: payout.festival_id,
      amount: payout.payout_amount,
      currenyId: payout.festival_currency_id,
      status: 0, // PENDING
      gatewayCode: isRazorpay ? global.RAZORPAY : global.PAYPAL,
    };
    const amount = parseFloat(Number(payout.payout_amount).toFixed(2));
    Models.Payouts.create(payoutRecord)
      .then((createdPayout) => {
        Models.CartOrderItems.update(
          { payoutId: createdPayout.id },
          { where: { id: payout.item_ids } }
        ).catch((catchErr) => {
          console.log(catchErr);
        });
        if (isRazorpay) {
          razorpayHandler.createPayout(
            {
              email: payout.email,
              userId: payout.user_id,
              firstName: payout.first_name,
              lastName: payout.last_name,
              upiAddress: payout.upi_address,
            },
            amount,
            createdPayout.id
          );
        } else {
          paypalHandler.createPayout(
            payout.paypal_email,
            amount,
            createdPayout.id
          );
        }
      })
      .catch((catchErr) => {
        console.log(catchErr);
      });
  }
  return {
    success: true,
    data: payouts,
  };
};

const getPaypalToken = async () => {
  const token = await paypalHandler.generateAccessToken();
  return {
    success: true,
    data: token,
  };
};

/**
 * @Readme: This function was created for only order owner
 * such that amount in receipt will be based on owner
 * currency id such if owner has USD as currency code than
 * receipt will be in usd only for any other user it will be
 * only aviliable in USD not in their own currency
 */
const generateOrderReceipt = async ({
  cartOrderId = null,
  orderItemId = null,
  submissionId = null
}) => {
  if (!cartOrderId && !orderItemId && !submissionId) {
    return {
      message: err.bad_request,
    };
  }
  let orderQuery = "";
  if (cartOrderId) {
    orderQuery = "$orderId";
  } else if(orderItemId) {
    orderQuery = `(
      select 
        coi2.cart_order_id
      from cart_order_items
      coi2 where coi2.id = $itemId
      limit 1
    )`;
  } else {
    orderQuery = `(
      select 
        coi2.cart_order_id
      from festival_submissions fs1
      join cart_order_items coi2 on coi2.id = fs1.order_item_id 
      where fs1.id = $sbmId
      limit 1
    )`;
  }
  const query = `select 
    co.id order_id,
    coi.id order_item_id,
    (
      case
      when fm.id is not null then fm.title
      when pr.id is not null then pr.plan_name
      else 'Product' end
    ) title,
    (
      case
      when fm.id is not null then 'Submission'
      when pr.id is not null then pr.title
      else 'Item' end
    ) order_type,
    coi.amount,
    coi.platform_fee,
    cr.code currency_code,  
    cr.symbol currency_symbol,
    co.amount total_amount,
    coi.saving,
    co.created_at
  from cart_order_items coi
  join cart_orders co on co.id = coi.cart_order_id
  join currencies cr on cr.id = co.currency_id
  left join films fm on fm.id = coi.film_id
  left join products pr on pr.id = coi.product_id
  where cart_order_id = ${orderQuery}`;
  try {
    const orderItems = await sequelize.query(query, {
      type: QueryTypes.SELECT,
      bind: {
        orderId: cartOrderId,
        itemId: orderItemId,
        sbmId: submissionId
      },
    });

    const finalItems = orderItems || [];
    const items = [];
    let total = 0;
    let saving = 0;
    let currency = null;
    let orderId = null;
    let date = null;

    if (finalItems?.length) {
      orderId = finalItems[0].order_id;
      currency = {
        code: finalItems[0].currency_code,
        symbol: finalItems[0].currency_symbol,
      };
      date = finalItems[0].created_at;
    } else {
      return {
        message: "This order has not items"
      };
    }

    finalItems.forEach((item) => {     
      items.push({
        id: item.order_item_id,
        orderType: item.order_type,
        title: item.title,
        amount: item.amount,
      });
      saving += parseFloat(item.saving);
      total += parseFloat(item.amount);
    });

    return {
      success: true,
      data: {
        saving,
        total,
        currency,
        items,
        orderId,
        date
      },
    };
  } catch (tryErr) {
    onehealthCapture.catchError(tryErr);
    return {
      message: err.server_error,
    };
  }
};

module.exports = {
  createCartOrder,
  capturePaypalPayment,
  captureRazorpayPayment,
  createPayout,
  getPaypalToken,

  generateOrderReceipt,
};