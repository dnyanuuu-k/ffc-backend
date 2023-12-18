/**
 * @Page: Festival Dashboard Services
 * @Description: Create user related functions here
 */

//Models
// const Models = require("#models");

//Handlers
const deadlineHandler = require("#handler/deadline/");
const currencyHandler = require("#handler/currency/");
const paypalHandler = require("#handler/paypal/");
const razorpayHandler = require("#handler/razorpay/");
const festivalHandler = require("#handler/festival/");
const submissionHandler = require("#handler/submission/");
const CountryMap = require("#handler/map");

//Constants
const aws = require("#utils/aws");
// const constants = require("#utils/constants");
const common = require("#utils/common");
const err = require("#utils/errors");
const { QueryTypes } = require("sequelize");

//Helper Functions
const sequelize = require("#utils/dbConnection");
const onehealthCapture = require("#utils/oneHealthCapture");
const logger = require("#utils/logger");
// const validation = require("#utils/validation");

//Third Party Functions
const moment = require("moment");

// TODO: API is created with assumption that only two currencies are allowed USD and INR
/* const getSalesSummary = async ({ userId, festivalDateId }) => {
    try {        
        if(!festivalDateId){
            const currentFestivalDate = await deadlineHandler.getCurrentSession(userId);
            if(currentFestivalDate){
                festivalDateId = currentFestivalDate.id;
            }else{
                return {
                    success: false,
                    message: err.festival_not_found
                };
            }
        }

        const userData = await Models.Users.findOne({
            where: {
                id: userId
            },
            attributes: [],
            include: {
                as: "currency",
                model: Models.Currencies,
            }
        });

        const sales = await sequelize.query(`select sum(coi.amount) amount, cr.code  from cart_order_items coi
            join payments p on p.cart_order_id = coi.cart_order_id
            left join cart_orders co on co.id = coi.cart_order_id
            left join currencies cr on cr.id = co.currency_id
            where festival_category_fee_id in (
              select fcf.id from festival_date_deadlines fdd 
                left join festival_category_fees fcf on fcf.festival_date_deadline_id = fdd.id
                where fdd.festival_date_id = $1
            )
            group by cr.code`, {
            bind: [festivalDateId],
            type: QueryTypes.SELECT
        });
        let nationalSales = 0; // INR
        let internationalSales = 0; // USD

        let nationalNetSales = 0; // INR
        let internationalNetSales = 0; // USD

        let nationalFee = 0;
        let internationalFee = 0;

        for(const sale of sales){
            if(sale.code === global.NATIONAL_CURRENCY){
                nationalSales += parseFloat(sale.amount);
            }else{
                internationalSales += parseFloat(sale.amount); // USD 
            }
        }
        const userCurrency = userData.currency.code;

        if(userCurrency === global.NATIONAL_CURRENCY && internationalSales > 0){
            const convertedInternational = await currencyHandler.convertAmount(
                internationalSales,
                global.INTERNATIONAL_CURRENCY,
                global.NATIONAL_CURRENCY
            );
            internationalSales = convertedInternational.amount; // INR            
        }        

        if(userCurrency === global.NATIONAL_CURRENCY){
            internationalFee = (internationalSales * constants.PAYPAL_FEE_PERCENT_INR) + constants.PAYPAL_FEE_AMOUNT_INR;
            internationalNetSales = internationalSales - internationalFee;
        }else{
            internationalFee = (internationalSales * constants.PAYPAL_FEE_PERCENT_USD) + constants.PAYPAL_FEE_AMOUNT_USD;
            internationalNetSales = internationalSales - internationalFee;            
        }
        if(internationalNetSales < 0){
            internationalNetSales = 0;
        }

        nationalFee = nationalSales * constants.RAZORPAY_FEE_PERCENT;

        nationalNetSales = nationalSales - nationalFee;

        if(nationalNetSales < 0){
            nationalNetSales = 0;
        }        

        const grossSales = internationalSales + nationalSales;
        const netSales = internationalNetSales + nationalNetSales;        

        return {
            success: true,
            data: {
                grossSales,
                netSales,

                nationalNetSales,
                nationalSales,            
                nationalFee,

                internationalNetSales,
                internationalSales,
                internationalFee,

                nationalPlatformFee: 0,
                internationalPlatformFee: 0,
            }
        };


    } catch (tryErr) {
        onehealthCapture.catchError(tryErr);
        return {
            success: false,
            message: err.server_error
        };
    }
};*/

const getSalesSummary = async ({
    userId,
    festivalDateId,
    numberLocale = false,
}) => {
    try {
        if (!festivalDateId) {
            const currentFestivalDate = await deadlineHandler.getCurrentSession(
                userId
            );
            if (currentFestivalDate) {
                festivalDateId = currentFestivalDate.id;
            } else {
                return {
                    success: false,
                    message: err.festival_not_found,
                };
            }
        }

        // User Currency and User's Festival Currency are always same
        const festivalData = await festivalHandler.getFestivalBasicInfo(
            null,
            userId
        );

        if (!festivalData) {
            return {
                message: err.festival_not_found,
            };
        }

        const currentSeasonSummary =
            await festivalHandler.getFestivalSalesSummary({
                festivalDateId,
            });
        const allTimeSummary = await festivalHandler.getFestivalSalesSummary({
            festivalId: festivalData.id,
        });
        let salesSummary = {
            currentSeason: currentSeasonSummary,
            allTime: allTimeSummary,
        };
        if (numberLocale) {
            salesSummary = common.objectNumberLocale(salesSummary);
        }
        return {
            success: true,
            data: {
                festival: festivalData,
                ...salesSummary,
            },
        };
    } catch (tryErr) {
        onehealthCapture.catchError(tryErr);
        return {
            success: false,
            message: err.server_error,
        };
    }
};

const getPaymentSummary = async ({ userId, festivalDateId }) => {
    try {
        if (!festivalDateId) {
            const currentFestivalDate = await deadlineHandler.getCurrentSession(
                userId
            );
            if (currentFestivalDate) {
                festivalDateId = currentFestivalDate.id;
            } else {
                return {
                    success: false,
                    message: err.festival_not_found,
                };
            }
        }
        const paymentGraph = await festivalHandler.getFestivalPaymentGraph(
            festivalDateId
        );
        const salesSummary = await festivalHandler.getFestivalSalesSummary({
            festivalDateId,
        });
        let payoutSummary = await festivalHandler.getFestivalPayoutSummary(
            festivalDateId
        );
        let paymentList = await festivalHandler.getSubmissionPaymentList({
            limit: 3,
            festivalDateId,
        });
        let payoutList = await festivalHandler.getFestivalPayoutList({
            limit: 3,
            festivalDateId,
        });
        return {
            success: true,
            data: {
                ...salesSummary,
                ...payoutSummary, // Pending
                paymentGraph,
                paymentList,
                payoutList, // Pending
            },
        };
    } catch (tryErr) {
        onehealthCapture.catchError(tryErr);
        return {
            success: false,
            message: err.server_error,
        };
    }
};

const getSubmissionSummary = async ({ userId, festivalDateId }) => {
    try {
        if (!festivalDateId) {
            const currentFestivalDate = await deadlineHandler.getCurrentSession(
                userId
            );
            if (currentFestivalDate) {
                festivalDateId = currentFestivalDate.id;
            } else {
                return {
                    success: false,
                    message: err.festival_not_found,
                };
            }
        }

        const submissionByCountries =
            await submissionHandler.getSubmissionByCountry({
                festivalDateId,
                limit: 3,
            });

        const submissionByCategories =
            await submissionHandler.getSubmissionByCategories({
                festivalDateId,
                limit: 3,
            });

        const currentStamp = moment().unix();
        const fileKey = `festival_map${festivalDateId}.png`;
        const submissionMapUrl = `${aws.SUBMISSION_MAP_BUCKET}/${fileKey}?=${currentStamp}`;
        const countries = await submissionHandler.getDistinctCountries({
            festivalDateId,
        });
        if (countries.length) {
            CountryMap.getHighlited({
                countries,
            })
                .then((buffer) => {
                    aws.addFileToBucket(
                        { file: { buffer }, name: fileKey },
                        aws.SUBMISSION_MAP_BUCKET
                    );
                })
                .catch((err) => {
                    logger.error(err);
                });
        }
        return {
            success: true,
            data: {
                submissionMapUrl,
                submissionByCountries,
                submissionByCategories,
            },
        };
    } catch (tryErr) {
        onehealthCapture.catchError(tryErr);
        return {
            success: false,
            message: err.server_error,
        };
    }
};

// Generate Payload for payout performing payout
const generatePayoutList = async ({ fromDate, toDate }) => {
    try {
        const query = `select
        u.id user_id,
        c.code,
        sum(case when u.currency_id = 15 then coi.amount else 0 end) as inr_amount,
        sum(case when u.currency_id != 15 then coi.amount else 0 end) as usd_amount
        from payments p
        join cart_order_items coi on coi.cart_order_id = p.cart_order_id and coi.film_id is not null
        join cart_orders co on co.id = coi.cart_order_id
        join festival_category_fees fcf on fcf.id = coi.festival_category_fee_id
        join festival_categories fc on fc.id = fcf.festival_category_id
        join festivals f on f.id = fc.festival_id
        join users u on u.id = f.user_id
        join currencies c on c.id = u.currency_id
        where p.created_at between :fromDate and :toDate
        group by u.id, c.code`;

        const userSalesList = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: {
                fromDate,
                toDate,
            },
        });

        const payouts = [];

        for (const userSale of userSalesList) {
            if (
                userSale.code === global.NATIONAL_CURRENCY &&
                userSale.usd_amount > 0
            ) {
                const convertedInternational =
                    await currencyHandler.convertAmount(
                        userSale.usd_amount,
                        global.INTERNATIONAL_CURRENCY,
                        global.NATIONAL_CURRENCY
                    );
                userSale.usd_amount = convertedInternational.amount;
            }
            const usdNet = paypalHandler.getAmount(
                userSale.code,
                parseFloat(userSale.usd_amount)
            );
            const inrNet = razorpayHandler.getAmount(
                parseFloat(userSale.inr_amount)
            );

            let paypal = 0;
            let razorpay = 0;

            if (userSale.code === global.NATIONAL_CURRENCY) {
                razorpay += usdNet + inrNet;
            } else {
                paypal += usdNet + inrNet;
            }

            payouts.push({
                ...userSale,
                razorpay,
                paypal,
            });
        }

        return {
            success: true,
            data: payouts,
        };
    } catch (tryErr) {
        onehealthCapture.catchError(tryErr);
        return {
            success: false,
            message: err.server_error,
        };
    }
};

const filterPayments = async (filter = {}) => {
    if (!filter?.festivalDateId) {
        return {
            success: false,
            message: err.festival_date_not_found,
        };
    }
    let paymentList = await festivalHandler.getSubmissionPaymentList(filter);
    return {
        success: true,
        data: paymentList || [],
    };
};

const filterPayouts = async () => {
    return {
        success: true,
        data: [],
    };
};

const filterSubmissions = async (filters = {}) => {
    if (!filters?.festivalDateId) {
        return {
            success: false,
            message: err.festival_date_not_found,
        };
    }

    let limitOffset = "";

    if (filters.limit) {
        limitOffset += " limit " + filters.limit;
    }

    if (filters.offset) {
        limitOffset += " offset " + filters.offset;
    }

    const query = `select count(*) OVER() "totalCount", * from (
      select 
        distinct on (fs.id) fs.id "submissionId",
        fm.title "filmTitle",
        fcf.id "categoryId",
        fc.name "categoryName",
        to_char(fs.created_at, 'DD Mon YYYY') "createdAt"
      from festival_submissions fs
      join films fm on fm.id = fs.film_id
      join festival_category_fees fcf on fcf.id = fs.festival_category_fee_id
      join festival_categories fc on fc.id = fcf.festival_category_id
      where fs.festival_category_fee_id in (
        select fcf.id from festival_dates fd
        join festival_date_deadlines fdd on fdd.festival_date_id = fd.id
        join festival_category_fees fcf on fcf.festival_date_deadline_id = fdd.id
        where fd.id = $festivalDateId
      )
    ) payments
    order by "createdAt" desc
    ${limitOffset}`;

    const submissions = await sequelize.query(query, {
        type: QueryTypes.SELECT,
        bind: {
            festivalDateId: filters.festivalDateId,
        },
    });

    return {
        success: true,
        data: submissions || [],
    };
};

const filterSubmissionGroup = async (filter = {}) => {
    const { festivalDateId, groupBy = null } = filter;
    if (!festivalDateId) {
        return {
            success: false,
            message: err.festival_date_not_found,
        };
    }
    let list = [];
    if (groupBy === "country") {
        list = await submissionHandler.getSubmissionByCountry(filter);
    } else {
        list = await submissionHandler.getSubmissionByCategories(filter);
    }
    return {
        success: true,
        data: list || [],
    };
};

module.exports = {
    getSubmissionSummary,
    generatePayoutList,
    getPaymentSummary,
    getSalesSummary,

    filterPayments,
    filterPayouts,
    filterSubmissionGroup,
    filterSubmissions,
};