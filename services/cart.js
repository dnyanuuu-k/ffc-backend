/**
 * @Page: Account Services
 * @Description: Create user related functions here
 */

//Models
const Models = require("#models");

//Handlers
const deadlineHandler = require("#handler/deadline/");
const currencyHandler = require("#handler/currency/");
const membershipHandler = require("#handler/membership/");
const cartHandler = require("#handler/cart/");

//Constants
const err = require("#utils/errors");
const { MONTHLY_GOLD_MEMBERSHIP, PRODUCT_LIST } = require("#utils/products");
const { QueryTypes } = require("sequelize");

//Helper Functions
const sequelize = require("#utils/dbConnection");
const onehealthCapture = require("#utils/oneHealthCapture");
const validation = require("#utils/validation");
const moment = require("moment");

const addFilmToCart = async ({ userId, filmId, festivalCategoryFeeId }) => {
	try {
		if (!validation.validId(userId)) {
			return {
				message: err.user_not_found,
			};
		}
		if (!validation.validId(filmId)) {
			return {
				message: err.film_not_found,
			};
		}
		if (!validation.validId(festivalCategoryFeeId)) {
			return {
				message: err.bad_request,
			};
		}
		const alreadyAddedToCard = await Models.Cart.count({
			where: {
				filmId,
				festivalCategoryFeeId,
			},
			limit: 1,
		});
		if (alreadyAddedToCard) {
			return {
				message: err.film_already_cart,
			};
		}
		// TODO: Already Submission Created

		// const filmAreadySubmitted = await Models.Submissions.count({
		// 	where: {
		// 		filmId,
		// 		festivalCategoryFeeId
		// 	}
		// });
		// if(filmAreadySubmitted){
		// 	return {
		// 		message: err.film_submitted
		// 	};
		// }

		const filmExists = await Models.Films.count({
			where: {
				id: filmId,
			},
			limit: 1,
		});
		if (!filmExists) {
			return {
				message: err.film_not_found,
			};
		}
		const festivalData = await Models.FestivalCategoryFees.findOne({
			where: {
				id: festivalCategoryFeeId,
				enabled: true,
			},
			attributes: ["standardFee", "goldFee"],
			include: {
				as: "festivalDateDeadline",
				model: Models.FestivalDateDeadlines,
				attributes: ["id"],
				required: true,
				include: {
					as: "festivalDate",
					model: Models.FestivalDates,
					attributes: ["id"],
					include: {
						as: "currency",
						model: Models.Currencies,
						attributes: ["code"],
					},
					required: true,
				},
			},
		});
		if (!festivalData) {
			return {
				message: err.bad_request,
			};
		}
		const userData = await Models.Users.findOne({
			where: {
				id: userId,
			},
			attributes: [],
			include: {
				as: "currency",
				model: Models.Currencies,
				attributes: ["code"],
			},
		});
		if (!userData) {
			return {
				message: err.user_not_found,
			};
		}

		const festivalCurrency =
			festivalData.festivalDateDeadline.festivalDate.currency;

		const standardFee = festivalData.standardFee;
		const goldFee = festivalData.goldFee;
		const isGoldMember = await membershipHandler.isGoldMember(userId);
		const feeInCurrency = await currencyHandler.getVisibleCurrency(
			isGoldMember ? goldFee : standardFee,
			userData.currency,
			festivalCurrency
		);
		if (!feeInCurrency) {
			return {
				message: err.server_error,
			};
		}
		const cartItem = await Models.Cart.create({
			feeInCurrency: feeInCurrency.amount,
			exchRate: feeInCurrency.exchRate,
			userId,
			filmId,
			festivalCategoryFeeId,
			userCurrencyId: userData.currency.id,
		});
		return {
			success: true,
			data: cartItem,
		};
	} catch (tryErr) {
		onehealthCapture.catchError(tryErr);
		return {
			message: err.server_error,
		};
	}
};

const addFilmToMulitpleCategory = async ({
	userId,
	filmId,
	festivalCategoryFeeIds,
	includeGoldMembership,
}) => {
	let transaction = null;
	try {
		if (!validation.validId(userId)) {
			return {
				message: err.user_not_found,
			};
		}
		if (!validation.validId(filmId)) {
			return {
				message: err.film_not_found,
			};
		}
		if (!validation.validArray(festivalCategoryFeeIds)) {
			return {
				message: err.bad_request,
			};
		}
		// We ensure in frontend not to show already selected
		const alreadyAddedToCard = await Models.Cart.count({
			where: {
				filmId,
				festivalCategoryFeeId: festivalCategoryFeeIds,
			},
			limit: 1,
		});
		if (alreadyAddedToCard) {
			return {
				message: err.film_already_cart,
			};
		}
		// TODO: Already Submission Created
		// Update: Make sure we don't let this situtation occur

		// const filmAreadySubmitted = await Models.Submissions.count({
		// 	where: {
		// 		filmId,
		// 		festivalCategoryFeeId
		// 	}
		// });
		// if(filmAreadySubmitted){
		// 	return {
		// 		message: err.film_submitted
		// 	};
		// }

		const filmExists = await Models.Films.count({
			where: {
				id: filmId,
			},
			limit: 1,
		});
		if (!filmExists) {
			return {
				message: err.film_not_found,
			};
		}
		const festivalList = await Models.FestivalCategoryFees.findAll({
			where: {
				id: festivalCategoryFeeIds,
				enabled: true,
			},
			attributes: ["id", "standardFee", "goldFee"],
			include: {
				as: "festivalDateDeadline",
				model: Models.FestivalDateDeadlines,
				attributes: ["id"],
				required: true,
				include: {
					as: "festivalDate",
					model: Models.FestivalDates,
					attributes: ["id"],
					include: {
						as: "currency",
						model: Models.Currencies,
						attributes: ["code"],
					},
					required: true,
				},
			},
		});
		if (!festivalList) {
			return {
				message: err.bad_request,
			};
		}
		const userData = await Models.Users.findOne({
			where: {
				id: userId,
			},
			attributes: [],
			include: {
				as: "currency",
				model: Models.Currencies,
				attributes: ["code"],
			},
		});
		if (!userData) {
			return {
				message: err.user_not_found,
			};
		}

		transaction = await sequelize.transaction();
		const isGoldMember = await membershipHandler.isGoldMember(userId);
		for (const festivalData of festivalList) {
			const festivalCurrency =
				festivalData.festivalDateDeadline.festivalDate.currency;
			const standardFee = festivalData.standardFee;
			const goldFee = festivalData.goldFee;
			const feeInCurrency = await currencyHandler.getVisibleCurrency(
				isGoldMember ? goldFee : standardFee,
				userData.currency,
				festivalCurrency
			);
			if (!feeInCurrency) {
				transaction.rollback();
				return {
					message: err.server_error,
				};
			}
			await Models.Cart.create(
				{
					feeInCurrency: feeInCurrency.amount,
					userId,
					filmId,
					festivalCategoryFeeId: festivalData.id,
					userCurrencyId: userData.currency.id,
				},
				{ transaction }
			);
		}
		if (includeGoldMembership && !isGoldMember && festivalList?.length) {
			const feeInCurrency = await currencyHandler.getVisibleCurrency(
				MONTHLY_GOLD_MEMBERSHIP.fee,
				userData.currency,
				{ code: MONTHLY_GOLD_MEMBERSHIP.feeCurrency }
			);
			if (!feeInCurrency.amount) {
				transaction.rollback();
				return {
					message: "currency error",
				};
			}
			await Models.Cart.create(
				{
					feeInCurrency: feeInCurrency.amount,
					userId,
					filmId: null,
					festivalCategoryFeeId: null,
					userCurrencyId: userData.currency.id,
					productId: MONTHLY_GOLD_MEMBERSHIP.id,
				},
				{ transaction }
			);
		}
		await transaction.commit();
		return {
			success: true,
			data: festivalCategoryFeeIds,
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

const addMembershipToCart = async ({ userId, productId }) => {
	let transaction = null;
	try {
		const currentProduct = PRODUCT_LIST.find(
			(p) => p.id === parseInt(productId, 10)
		);
		if (!currentProduct) {
			return {
				message: "Product not found!",
			};
		}
		const userData = await Models.Users.findOne({
			where: {
				id: userId,
			},
			include: {
				as: "currency",
				model: Models.Currencies,
				attributes: ["id", "code", "symbol"],
			},
		});
		if (!userData) {
			return {
				message: "User not found",
			};
		}
		const alreadyAdded = await sequelize.query(
			"select id from cart where user_id = $1 and product_id is not null",
			{
				bind: [userData.id],
				type: QueryTypes.SELECT,
			}
		);
		transaction = await sequelize.transaction();
		if (alreadyAdded.length) {
			await Models.Cart.destroy({
				where: {
					id: alreadyAdded[0].id,
				},
				transaction,
			});
		}
		const feeInCurrency = await currencyHandler.getVisibleCurrency(
			currentProduct.fee,
			userData.currency,
			{ code: currentProduct.feeCurrency }
		);
		if (!feeInCurrency?.amount) {
			return {
				message: "currency error",
			};
		}
		const cartItem = await Models.Cart.create(
			{
				feeInCurrency: feeInCurrency.amount,
				userId,
				filmId: null,
				festivalCategoryFeeId: null,
				userCurrencyId: userData.currency.id,
				productId: MONTHLY_GOLD_MEMBERSHIP.id,
			},
			{ transaction }
		);
		await transaction.commit();
		return {
			success: true,
			data: cartItem,
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

const removeItemFromCart = async ({ cartId }) => {
	if (!validation.validId(cartId)) {
		return {
			message: err.product_not_in_cart,
		};
	}
	await Models.Cart.destroy({
		where: {
			id: cartId,
		},
	});
	return {
		success: true,
		data: "Deleted!",
	};
};

/**
 * @Important while updating this make sure 
 * you also make changes to handler/cart/index.js
 */
const generateCartSummary = async ({ userId }) => {
	let transaction = null;
	const CURRENCY_CHANGE = 1;
	const GOLD_MEMBER = 1;
	let subTotal = 0;
	if (!validation.validId(userId)) {
		return {
			message: err.user_not_found,
		};
	}
	const userData = await Models.Users.findOne({
		where: {
			id: userId,
		},
		include: {
			as: "currency",
			model: Models.Currencies,
			attributes: ["code", "symbol"],
		},
		attributes: ["currencyId"],
	});
	if (!userData) {
		return {
			message: err.user_not_found,
		};
	}
	try {
		const isGoldMember = await membershipHandler.isGoldMember(userId);
		const changesReason = [];
		// const finalCartItems = [];
		const festivalMap = new Map();
		const singleChanges = new Set();
		const cartItems = await Models.Cart.findAll({
			where: {
				userId,
			},
			include: [
				{
					as: "festivalCategoryFee",
					model: Models.FestivalCategoryFees,
					attributes: [
						"standardFee",
						"goldFee",
						"festivalDateDeadlineId",
					],
					include: [
						{
							as: "festivalCategory",
							model: Models.FestivalCategories,
							attributes: ["name"],
							include: {
								as: "festival",
								model: Models.Festivals,
								attributes: [
									"id",
									"logoUrl",
									"logoHash",
									"name",
								],
							},
						},
						{
							as: "festivalDateDeadline",
							model: Models.FestivalDateDeadlines,
							attributes: ["name", "date", "festivalDateId"],
						},
					],
				},
				{
					as: "film",
					attributes: ["title", "id"],
					model: Models.Films,
				},
			],
		});
		const todayDate = moment();
		if (cartItems.length > 0) {
			transaction = await sequelize.transaction();
		}
		let totalItems = 0;
		let otherFinalItems = [];
		let goldMemberInCart = false;
		if (!isGoldMember) {
			cartItems.forEach((ci) => {
				if (ci.productId) {
					const currentProduct = PRODUCT_LIST.find(
						(p) => p.id === parseInt(ci.productId, 10)
					);
					if (currentProduct) {
						goldMemberInCart = true;
						return true;
					}
				}
			});
		}
		const applyGoldFeeOnly = isGoldMember || goldMemberInCart;
		let goldSubscriptionSavings = 0;
		for (let cartItem of cartItems) {
			if (cartItem.productId) {
				const currentProduct = PRODUCT_LIST.find(
					(p) => p.id === parseInt(cartItem.productId, 10)
				);
				if (!currentProduct) {
					continue;
				}
				const pFeeInCurrency = await currencyHandler.getVisibleCurrency(
					currentProduct.fee,
					userData.currency,
					{ code: currentProduct.feeCurrency }
				);
				subTotal += pFeeInCurrency.amount;				
				otherFinalItems.push({
					name: "Subscriptions",
					total: cartItem.feeInCurrency,
					items: [
						{
							id: cartItem.id,
							feeInCurrency: cartItem.feeInCurrency,
							userCurrencyId: userData.currencyId,
							product: currentProduct,
							type: "product",
							planName: currentProduct.planName,
							title: currentProduct.title,
						},
					],
				});
				continue;
			}

			const deadlineDate = moment(
				cartItem.festivalCategoryFee.festivalDateDeadline.date
			);
			const festivalDate = await Models.FestivalDates.findOne({
				attributes: ["id", "currencyId"],
				include: {
					as: "currency",
					model: Models.Currencies,
					attributes: ["code"],
				},
				where: {
					id: cartItem.festivalCategoryFee.festivalDateDeadline
						.festivalDateId,
				},
			});
			const standardFee = cartItem.festivalCategoryFee.standardFee;
			const goldFee = cartItem.festivalCategoryFee.goldFee;
			const feeInCurrency = await currencyHandler.getVisibleCurrency(
				applyGoldFeeOnly ? goldFee : standardFee,
				userData.currency,
				festivalDate.currency
			);
			if (!feeInCurrency) {
				transaction.rollback();
				return {
					message: err.server_error,
				};
			}

			const festivalCurrencyId = festivalDate.currencyId;
			const festivalCurrencyCode = festivalDate.currency.code;

			const categoryName =
				cartItem.festivalCategoryFee.festivalCategory.name;
			const festival =
				cartItem.festivalCategoryFee.festivalCategory.festival;
			let festivalItems = [];
			let festivalTotal = 0;
			if (festivalMap.has(festival.id)) {
				const data = festivalMap.get(festival.id);
				festivalItems = data.items;
				festivalTotal = data.total;
			} else {
				festivalMap.set(festival.id, {
					...festival.toJSON(),
					items: [],
					total: 0,
				});
			}

			let deadlineName =
				cartItem.festivalCategoryFee.festivalDateDeadline.name;

			let reasonAdded = false;

			// 5. Current Deadline Expired
			if (todayDate > deadlineDate) {
				const nextDeadlineDate = await deadlineHandler.getNextDeadline(
					todayDate,
					cartItem.festivalCategoryFee.festivalDateDeadlineId
				);
				if (nextDeadlineDate) {
					const newFeeInCurrency =
						await currencyHandler.getVisibleCurrency(
							applyGoldFeeOnly
								? nextDeadlineDate.goldFee
								: nextDeadlineDate.standardFee,
							userData.currency,
							festivalDate.currency
						);
					await Models.Cart.update(
						{
							festivalCategoryFeeId:
								nextDeadlineDate.festivalCategoryFeeId,
							feeInCurrency: newFeeInCurrency.amount,
							userCurrencyId: userData.currencyId,
						},
						{
							where: {
								id: cartItem.id,
							},
							transaction,
						}
					);
					const pushObject = {
						id: cartItem.id,
						feeInCurrency: newFeeInCurrency.amount,
						festivalCategoryFeeId:
							nextDeadlineDate.festivalCategoryFeeId,
						userCurrencyId: userData.currencyId,
						film: cartItem.film,
						categoryName,
						deadlineName,
						festivalCurrencyCode,
						type: "film",
					};
					subTotal += newFeeInCurrency.amount;
					festivalTotal += newFeeInCurrency.amount;
					changesReason.push(
						`${categoryName} deadline changed from ${deadlineName} to ${nextDeadlineDate.name}`
					);
					festivalItems.push(pushObject);
					totalItems += 1;
					// Gold Subscription Saving
					{
						const standardCurrency =
							await currencyHandler.getVisibleCurrency(
								applyGoldFeeOnly
									? nextDeadlineDate.standardFee
									: nextDeadlineDate.goldFee,
								userData.currency,
								festivalDate.currency
							);
						goldSubscriptionSavings += Math.abs(
							standardCurrency.amount - newFeeInCurrency.amount
						);
					}
					// finalCartItems.push(pushObject);
					continue;
				}
				// 6. No Next Deadline
				await Models.Cart.destroy({
					where: {
						id: cartItem.id,
					},
					transaction,
				});
				changesReason.push(
					`${categoryName} removed as all deadline expired`
				);
				continue;
			}

			// 1. User Currency != Cart User Currency
			if (userData.currencyId !== cartItem.userCurrencyId) {
				singleChanges.add(CURRENCY_CHANGE);
				reasonAdded = true;
			}

			// 2. Fee Amount != Cart Amount | Cart Amount == Standart Fee
			if (
				cartItem.feeInCurrency != feeInCurrency.amount &&
				cartItem.feeInCurrency == standardFee
			) {
				singleChanges.add(GOLD_MEMBER);
				reasonAdded = true;
			}

			// 3. Fee Amount != Cart Amount && User Currency !== Festival Currency
			if (
				feeInCurrency.amount !== cartItem.feeInCurrency &&
				userData.currencyId !== festivalCurrencyId
			) {
				if (!reasonAdded) {
					reasonAdded = true;
					changesReason.push(
						`${categoryName} Updated due to currency rate changes`
					);
				}
			}

			// 4. Fee Amount != Cart Amount && User Currency !== Festival Currency
			if (
				feeInCurrency.amount != cartItem.feeInCurrency &&
				userData.currencyId === festivalCurrencyId
			) {
				if (!reasonAdded) {
					reasonAdded = true;
					changesReason.push(`${categoryName} fee was updated`);
				}
			}

			if (reasonAdded) {
				await Models.Cart.update(
					{
						userCurrencyId: userData.currencyId,
						feeInCurrency: feeInCurrency.amount,
					},
					{
						where: {
							id: cartItem.id,
						},
						transaction,
					}
				);
			}
			const pushObject = {
				id: cartItem.id,
				feeInCurrency: feeInCurrency.amount,
				festivalCategoryFeeId: cartItem.festivalCategoryFeeId,
				userCurrencyId: userData.currencyId,
				film: cartItem.film,
				categoryName,
				deadlineName,
				festivalCurrencyCode,
				type: "film",
			};
			subTotal += feeInCurrency.amount;
			festivalTotal += feeInCurrency.amount;
			festivalItems.push(pushObject);
			// Gold Subscription Savings
			{
				const standardCurrency =
					await currencyHandler.getVisibleCurrency(
						applyGoldFeeOnly ? standardFee : goldFee,
						userData.currency,
						festivalDate.currency
					);
				goldSubscriptionSavings += Math.abs(
					standardCurrency.amount - feeInCurrency.amount
				);
			}
			totalItems += 1;

			const finalFestivalData = festivalMap.get(festival.id);
			finalFestivalData.items = festivalItems;
			finalFestivalData.total = festivalTotal;
			festivalMap.set(festival.id, finalFestivalData);
		}

		const festivalCartItems = [];
		const festivalIt = festivalMap.keys();
		let data = festivalIt.next();
		while (data.value) {
			festivalCartItems.push(festivalMap.get(data.value));
			data = festivalIt.next();
		}

		let serviceFee = cartHandler.getFilmMakerServiceFee();

		if (singleChanges.has(CURRENCY_CHANGE)) {
			changesReason.push("Currency Change");
		}

		if (singleChanges.has(GOLD_MEMBER)) {
			changesReason.push("Upgraded to gold member");
		}

		if (transaction) {
			await transaction.commit();
		}

		const methods = {
			paypal: userData.currency.code !== global.NATIONAL_CURRENCY,
			razorpay: userData.currency.code === global.NATIONAL_CURRENCY,
		};
		const termDescription =
			"By clicking 'Pay and Complete Order,' you agree to the FilmFestBook Gold Terms and Conditions. Your subscription will automatically renew at the end of each billing period unless canceled. You may cancel your membership at any time.";
		const finalCartItems = [...festivalCartItems, ...otherFinalItems];

		let membershipData = await membershipHandler.getMembershipData(
			userData.currency
		);

		if (applyGoldFeeOnly) {
			subTotal -= goldSubscriptionSavings;
		}

		return {
			success: true,
			data: {
				cartItems: finalCartItems,
				currency: userData.currency,
				goldMembershipAdded: applyGoldFeeOnly,
				goldSubscriptionSavings,
				serviceFee,
				subTotal,
				methods,
				changesReason,
				totalItems,
				termDescription,
				membershipData,
			},
		};
	} catch (tryErr) {
		if (transaction) {
			transaction.rollback();
		}
		return {
			message: err.server_error
		};
	}
};

module.exports = {
	addFilmToCart,
	removeItemFromCart,
	generateCartSummary,
	addFilmToMulitpleCategory,
	addMembershipToCart,
};