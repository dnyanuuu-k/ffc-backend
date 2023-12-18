const { PRODUCT_LIST } = require("#utils/products");
const membershipHandler = require("../membership");
const currencyHandler = require("../currency");
const deadlineHandler = require("../deadline");
const validation = require("#utils/validation");
const Models = require("#models");
const err = require("#utils/errors");
const moment = require("moment");
const sequelize = require("#utils/dbConnection");

const getFilmMakerServiceFee = () => {
	return 0;
};

/**
 * @Important while updating this make sure 
 * you also make changes to services/cart.js
 */
const createOrderSummary = async (userId) => {
	let transaction = null;
	let subTotal = 0;
	if (!validation.validId(userId)) {
		throw new Error(err.user_not_found);
	}
	const userData = await Models.Users.findOne({
		where: {
			id: userId,
		},
		include: {
			as: "currency",
			model: Models.Currencies,
			attributes: ["code", "id"],
		},
		attributes: ["currencyId", "email", "phoneNo", "firstName"],
	});
	if (!userData) {
		return {
			message: err.user_not_found,
		};
	}
	try {
		const isGoldMember = await membershipHandler.isGoldMember(userId);
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
							as: "festivalDateDeadline",
							model: Models.FestivalDateDeadlines,
							attributes: ["date", "festivalDateId"],
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
		const orderItems = [];
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
			let currentItemGoldSaving = 0;
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
				orderItems.push({
					filmId: null,
					productId: currentProduct.id,
					amount: pFeeInCurrency.amount,
					festivalAmount: null,
					festivalDateDeadlineId: null,
					exchRate: pFeeInCurrency.exchRate,
					festivalCategoryFeeId: null,
					festivalCurrencyId: null,
					festivalCurrencyCode: null,
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
			const festivalDateDeadlineId =
				cartItem.festivalCategoryFee.festivalDateDeadlineId;
			const standardFee = cartItem.festivalCategoryFee.standardFee;
			const goldFee = cartItem.festivalCategoryFee.goldFee;

			const festivalFee = applyGoldFeeOnly ? goldFee : standardFee;
			const feeInCurrency = await currencyHandler.getVisibleCurrency(
				festivalFee,
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

			let reasonAdded = false;

			// 5. Current Deadline Expired
			if (todayDate > deadlineDate) {
				const nextDeadlineDate = await deadlineHandler.getNextDeadline(
					todayDate,
					festivalDateDeadlineId
				);
				if (nextDeadlineDate) {
					const nextDeadlineFee = applyGoldFeeOnly
						? nextDeadlineDate.goldFee
						: nextDeadlineDate.standardFee;
					const newFeeInCurrency =
						await currencyHandler.getVisibleCurrency(
							nextDeadlineFee,
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
					subTotal += newFeeInCurrency.amount;


					const standardCurrency =
						await currencyHandler.getVisibleCurrency(
							applyGoldFeeOnly
								? nextDeadlineDate.standardFee
								: nextDeadlineDate.goldFee,
							userData.currency,
							festivalDate.currency
						);
					currentItemGoldSaving = Math.abs(
						standardCurrency.amount - newFeeInCurrency.amount
					);
					goldSubscriptionSavings += currentItemGoldSaving;

					orderItems.push({
						filmId: cartItem.film.id,
						amount: newFeeInCurrency.amount,
						festivalAmount: nextDeadlineFee,
						festivalDateDeadlineId,
						exchRate: newFeeInCurrency.exchRate,
						festivalCategoryFeeId: cartItem.festivalCategoryFeeId,
						festivalCurrencyId,
						festivalCurrencyCode,
						saving: currentItemGoldSaving
					});
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
				continue;
			}

			// 1. User Currency != Cart User Currency
			if (userData.currencyId !== cartItem.userCurrencyId) {
				reasonAdded = true;
			}

			// 2. Fee Amount != Cart Amount | Cart Amount == Standart Fee
			if (
				cartItem.feeInCurrency != feeInCurrency.amount &&
				cartItem.feeInCurrency == standardFee
			) {
				reasonAdded = true;
			}

			// 3. Fee Amount != Cart Amount && User Currency !== Festival Currency
			if (
				feeInCurrency.amount !== cartItem.feeInCurrency &&
				userData.currencyId !== festivalCurrencyId
			) {
				if (!reasonAdded) {
					reasonAdded = true;
				}
			}

			// 4. Fee Amount != Cart Amount && User Currency !== Festival Currency
			if (
				feeInCurrency.amount != cartItem.feeInCurrency &&
				userData.currencyId === festivalCurrencyId
			) {
				if (!reasonAdded) {
					reasonAdded = true;
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
			subTotal += feeInCurrency.amount;
			// Gold Subscription Savings
			const standardCurrency =
				await currencyHandler.getVisibleCurrency(
					applyGoldFeeOnly ? standardFee : goldFee,
					userData.currency,
					festivalDate.currency
				);
			currentItemGoldSaving = Math.abs(
				standardCurrency.amount - feeInCurrency.amount
			);
			goldSubscriptionSavings += currentItemGoldSaving;

			orderItems.push({
				filmId: cartItem.film.id,
				amount: feeInCurrency.amount,
				festivalAmount: festivalFee,
				festivalDateDeadlineId,
				exchRate: feeInCurrency.exchRate,
				festivalCurrencyId,
				festivalCategoryFeeId: cartItem.festivalCategoryFeeId,
				festivalCurrencyCode,
				saving: currentItemGoldSaving,
			});
		}
		await transaction.commit();

		if (applyGoldFeeOnly) {
			subTotal -= goldSubscriptionSavings;
		}

		const serviceFee = getFilmMakerServiceFee();
		const finalAmount = serviceFee + subTotal;
		return {
			amount: finalAmount,
			currency: userData.currency,
			orderItems,
			email: userData.email,
			phoneNo: userData.phoneNo,
			name: userData.firstName,
			goldSubscriptionSavings
		};
	} catch (tryErr) {
		if (transaction) {
			transaction.rollback();
		}
		return null;
	}
};

module.exports = {
	getFilmMakerServiceFee,
	createOrderSummary,
};