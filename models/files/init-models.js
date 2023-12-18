var DataTypes = require("sequelize").DataTypes;
var _Cart = require("./Cart");
var _CartOrderItems = require("./CartOrderItems");
var _CartOrders = require("./CartOrders");
var _Currencies = require("./Currencies");
var _FestivalAlbumPhotos = require("./FestivalAlbumPhotos");
var _FestivalAlbums = require("./FestivalAlbums");
var _FestivalCategories = require("./FestivalCategories");
var _FestivalCategoryFees = require("./FestivalCategoryFees");
var _FestivalCategoryReviews = require("./FestivalCategoryReviews");
var _FestivalDateDeadlines = require("./FestivalDateDeadlines");
var _FestivalDates = require("./FestivalDates");
var _FestivalFlags = require("./FestivalFlags");
var _FestivalFocus = require("./FestivalFocus");
var _FestivalFocusList = require("./FestivalFocusList");
var _FestivalJudges = require("./FestivalJudges");
var _FestivalOrganizers = require("./FestivalOrganizers");
var _FestivalPhotos = require("./FestivalPhotos");
var _FestivalReviewCategories = require("./FestivalReviewCategories");
var _FestivalReviews = require("./FestivalReviews");
var _FestivalSubmissions = require("./FestivalSubmissions");
var _FestivalTagList = require("./FestivalTagList");
var _FestivalTags = require("./FestivalTags");
var _FestivalTypes = require("./FestivalTypes");
var _FestivalVenues = require("./FestivalVenues");
var _Festivals = require("./Festivals");
var _FilmColors = require("./FilmColors");
var _FilmCreditSectionCredits = require("./FilmCreditSectionCredits");
var _FilmCreditSections = require("./FilmCreditSections");
var _FilmGenreList = require("./FilmGenreList");
var _FilmGenres = require("./FilmGenres");
var _FilmLanguages = require("./FilmLanguages");
var _FilmPhotos = require("./FilmPhotos");
var _FilmScreenings = require("./FilmScreenings");
var _FilmTypeList = require("./FilmTypeList");
var _FilmTypes = require("./FilmTypes");
var _FilmVideos = require("./FilmVideos");
var _Films = require("./Films");
var _Languages = require("./Languages");
var _Payments = require("./Payments");
var _Payouts = require("./Payouts");
var _ReviewTasks = require("./ReviewTasks");
var _Subscriptions = require("./Subscriptions");
var _TinodeConfig = require("./TinodeConfig");
var _UserLikes = require("./UserLikes");
var _Users = require("./Users");
var _WorkTypes = require("./WorkTypes");

function initModels(sequelize) {
  var Cart = _Cart(sequelize, DataTypes);
  var CartOrderItems = _CartOrderItems(sequelize, DataTypes);
  var CartOrders = _CartOrders(sequelize, DataTypes);
  var Currencies = _Currencies(sequelize, DataTypes);
  var FestivalAlbumPhotos = _FestivalAlbumPhotos(sequelize, DataTypes);
  var FestivalAlbums = _FestivalAlbums(sequelize, DataTypes);
  var FestivalCategories = _FestivalCategories(sequelize, DataTypes);
  var FestivalCategoryFees = _FestivalCategoryFees(sequelize, DataTypes);
  var FestivalCategoryReviews = _FestivalCategoryReviews(sequelize, DataTypes);
  var FestivalDateDeadlines = _FestivalDateDeadlines(sequelize, DataTypes);
  var FestivalDates = _FestivalDates(sequelize, DataTypes);
  var FestivalFlags = _FestivalFlags(sequelize, DataTypes);
  var FestivalFocus = _FestivalFocus(sequelize, DataTypes);
  var FestivalFocusList = _FestivalFocusList(sequelize, DataTypes);
  var FestivalJudges = _FestivalJudges(sequelize, DataTypes);
  var FestivalOrganizers = _FestivalOrganizers(sequelize, DataTypes);
  var FestivalPhotos = _FestivalPhotos(sequelize, DataTypes);
  var FestivalReviewCategories = _FestivalReviewCategories(sequelize, DataTypes);
  var FestivalReviews = _FestivalReviews(sequelize, DataTypes);
  var FestivalSubmissions = _FestivalSubmissions(sequelize, DataTypes);
  var FestivalTagList = _FestivalTagList(sequelize, DataTypes);
  var FestivalTags = _FestivalTags(sequelize, DataTypes);
  var FestivalTypes = _FestivalTypes(sequelize, DataTypes);
  var FestivalVenues = _FestivalVenues(sequelize, DataTypes);
  var Festivals = _Festivals(sequelize, DataTypes);
  var FilmColors = _FilmColors(sequelize, DataTypes);
  var FilmCreditSectionCredits = _FilmCreditSectionCredits(sequelize, DataTypes);
  var FilmCreditSections = _FilmCreditSections(sequelize, DataTypes);
  var FilmGenreList = _FilmGenreList(sequelize, DataTypes);
  var FilmGenres = _FilmGenres(sequelize, DataTypes);
  var FilmLanguages = _FilmLanguages(sequelize, DataTypes);
  var FilmPhotos = _FilmPhotos(sequelize, DataTypes);
  var FilmScreenings = _FilmScreenings(sequelize, DataTypes);
  var FilmTypeList = _FilmTypeList(sequelize, DataTypes);
  var FilmTypes = _FilmTypes(sequelize, DataTypes);
  var FilmVideos = _FilmVideos(sequelize, DataTypes);
  var Films = _Films(sequelize, DataTypes);
  var Languages = _Languages(sequelize, DataTypes);
  var Payments = _Payments(sequelize, DataTypes);
  var Payouts = _Payouts(sequelize, DataTypes);
  var ReviewTasks = _ReviewTasks(sequelize, DataTypes);
  var Subscriptions = _Subscriptions(sequelize, DataTypes);
  var TinodeConfig = _TinodeConfig(sequelize, DataTypes);
  var UserLikes = _UserLikes(sequelize, DataTypes);
  var Users = _Users(sequelize, DataTypes);
  var WorkTypes = _WorkTypes(sequelize, DataTypes);

  FestivalSubmissions.belongsTo(CartOrderItems, { as: "orderItem", foreignKey: "orderItemId"});
  CartOrderItems.hasMany(FestivalSubmissions, { as: "festivalSubmissions", foreignKey: "orderItemId"});
  Subscriptions.belongsTo(CartOrderItems, { as: "orderItem", foreignKey: "orderItemId"});
  CartOrderItems.hasMany(Subscriptions, { as: "subscriptions", foreignKey: "orderItemId"});
  CartOrderItems.belongsTo(CartOrders, { as: "cartOrder", foreignKey: "cartOrderId"});
  CartOrders.hasMany(CartOrderItems, { as: "cartOrderItems", foreignKey: "cartOrderId"});
  Payments.belongsTo(CartOrders, { as: "cartOrder", foreignKey: "cartOrderId"});
  CartOrders.hasMany(Payments, { as: "payments", foreignKey: "cartOrderId"});
  Cart.belongsTo(Currencies, { as: "userCurrency", foreignKey: "userCurrencyId"});
  Currencies.hasMany(Cart, { as: "carts", foreignKey: "userCurrencyId"});
  CartOrderItems.belongsTo(Currencies, { as: "festivalCurrency", foreignKey: "festivalCurrencyId"});
  Currencies.hasMany(CartOrderItems, { as: "cartOrderItems", foreignKey: "festivalCurrencyId"});
  CartOrders.belongsTo(Currencies, { as: "currency", foreignKey: "currencyId"});
  Currencies.hasMany(CartOrders, { as: "cartOrders", foreignKey: "currencyId"});
  FestivalDates.belongsTo(Currencies, { as: "currency", foreignKey: "currencyId"});
  Currencies.hasMany(FestivalDates, { as: "festivalDates", foreignKey: "currencyId"});
  Films.belongsTo(Currencies, { as: "productionBudgetCurrency", foreignKey: "productionBudgetCurrencyId"});
  Currencies.hasMany(Films, { as: "films", foreignKey: "productionBudgetCurrencyId"});
  Payouts.belongsTo(Currencies, { as: "curreny", foreignKey: "currenyId"});
  Currencies.hasMany(Payouts, { as: "payouts", foreignKey: "currenyId"});
  Users.belongsTo(Currencies, { as: "currency", foreignKey: "currencyId"});
  Currencies.hasMany(Users, { as: "users", foreignKey: "currencyId"});
  FestivalAlbumPhotos.belongsTo(FestivalAlbums, { as: "festivalAlbum", foreignKey: "festivalAlbumId"});
  FestivalAlbums.hasMany(FestivalAlbumPhotos, { as: "festivalAlbumPhotos", foreignKey: "festivalAlbumId"});
  FestivalCategoryFees.belongsTo(FestivalCategories, { as: "festivalCategory", foreignKey: "festivalCategoryId"});
  FestivalCategories.hasMany(FestivalCategoryFees, { as: "festivalCategoryFees", foreignKey: "festivalCategoryId"});
  Cart.belongsTo(FestivalCategoryFees, { as: "festivalCategoryFee", foreignKey: "festivalCategoryFeeId"});
  FestivalCategoryFees.hasMany(Cart, { as: "carts", foreignKey: "festivalCategoryFeeId"});
  CartOrderItems.belongsTo(FestivalCategoryFees, { as: "festivalCategoryFee", foreignKey: "festivalCategoryFeeId"});
  FestivalCategoryFees.hasMany(CartOrderItems, { as: "cartOrderItems", foreignKey: "festivalCategoryFeeId"});
  FestivalSubmissions.belongsTo(FestivalCategoryFees, { as: "festivalCategoryFee", foreignKey: "festivalCategoryFeeId"});
  FestivalCategoryFees.hasMany(FestivalSubmissions, { as: "festivalSubmissions", foreignKey: "festivalCategoryFeeId"});
  FestivalCategoryFees.belongsTo(FestivalDateDeadlines, { as: "festivalDateDeadline", foreignKey: "festivalDateDeadlineId"});
  FestivalDateDeadlines.hasMany(FestivalCategoryFees, { as: "festivalCategoryFees", foreignKey: "festivalDateDeadlineId"});
  FestivalDateDeadlines.belongsTo(FestivalDates, { as: "festivalDate", foreignKey: "festivalDateId"});
  FestivalDates.hasMany(FestivalDateDeadlines, { as: "festivalDateDeadlines", foreignKey: "festivalDateId"});
  FestivalSubmissions.belongsTo(FestivalFlags, { as: "festivalFlag", foreignKey: "festivalFlagId"});
  FestivalFlags.hasMany(FestivalSubmissions, { as: "festivalSubmissions", foreignKey: "festivalFlagId"});
  FestivalFocus.belongsTo(FestivalFocusList, { as: "festivalFocu", foreignKey: "festivalFocusId"});
  FestivalFocusList.hasMany(FestivalFocus, { as: "festivalFocus", foreignKey: "festivalFocusId"});
  FestivalAlbumPhotos.belongsTo(FestivalPhotos, { as: "festivalPhoto", foreignKey: "festivalPhotoId"});
  FestivalPhotos.hasMany(FestivalAlbumPhotos, { as: "festivalAlbumPhotos", foreignKey: "festivalPhotoId"});
  FestivalCategoryReviews.belongsTo(FestivalReviewCategories, { as: "festivalReviewCategory", foreignKey: "festivalReviewCategoryId"});
  FestivalReviewCategories.hasMany(FestivalCategoryReviews, { as: "festivalCategoryReviews", foreignKey: "festivalReviewCategoryId"});
  FestivalCategoryReviews.belongsTo(FestivalReviews, { as: "festivalReview", foreignKey: "festivalReviewId"});
  FestivalReviews.hasMany(FestivalCategoryReviews, { as: "festivalCategoryReviews", foreignKey: "festivalReviewId"});
  FestivalTags.belongsTo(FestivalTagList, { as: "festivalTag", foreignKey: "festivalTagId"});
  FestivalTagList.hasMany(FestivalTags, { as: "festivalTags", foreignKey: "festivalTagId"});
  FestivalAlbums.belongsTo(Festivals, { as: "festival", foreignKey: "festivalId"});
  Festivals.hasMany(FestivalAlbums, { as: "festivalAlbums", foreignKey: "festivalId"});
  FestivalCategories.belongsTo(Festivals, { as: "festival", foreignKey: "festivalId"});
  Festivals.hasMany(FestivalCategories, { as: "festivalCategories", foreignKey: "festivalId"});
  FestivalDates.belongsTo(Festivals, { as: "festival", foreignKey: "festivalId"});
  Festivals.hasMany(FestivalDates, { as: "festivalDates", foreignKey: "festivalId"});
  FestivalFlags.belongsTo(Festivals, { as: "festival", foreignKey: "festivalId"});
  Festivals.hasMany(FestivalFlags, { as: "festivalFlags", foreignKey: "festivalId"});
  FestivalFocus.belongsTo(Festivals, { as: "festival", foreignKey: "festivalId"});
  Festivals.hasMany(FestivalFocus, { as: "festivalFocus", foreignKey: "festivalId"});
  FestivalJudges.belongsTo(Festivals, { as: "festival", foreignKey: "festivalId"});
  Festivals.hasMany(FestivalJudges, { as: "festivalJudges", foreignKey: "festivalId"});
  FestivalOrganizers.belongsTo(Festivals, { as: "festival", foreignKey: "festivalId"});
  Festivals.hasMany(FestivalOrganizers, { as: "festivalOrganizers", foreignKey: "festivalId"});
  FestivalPhotos.belongsTo(Festivals, { as: "festival", foreignKey: "festivalId"});
  Festivals.hasMany(FestivalPhotos, { as: "festivalPhotos", foreignKey: "festivalId"});
  FestivalReviews.belongsTo(Festivals, { as: "festival", foreignKey: "festivalId"});
  Festivals.hasMany(FestivalReviews, { as: "festivalReviews", foreignKey: "festivalId"});
  FestivalTags.belongsTo(Festivals, { as: "festival", foreignKey: "festivalId"});
  Festivals.hasMany(FestivalTags, { as: "festivalTags", foreignKey: "festivalId"});
  FestivalVenues.belongsTo(Festivals, { as: "festival", foreignKey: "festivalId"});
  Festivals.hasMany(FestivalVenues, { as: "festivalVenues", foreignKey: "festivalId"});
  Payouts.belongsTo(Festivals, { as: "festival", foreignKey: "festivalId"});
  Festivals.hasMany(Payouts, { as: "payouts", foreignKey: "festivalId"});
  ReviewTasks.belongsTo(Festivals, { as: "festival", foreignKey: "festivalId"});
  Festivals.hasMany(ReviewTasks, { as: "reviewTasks", foreignKey: "festivalId"});
  UserLikes.belongsTo(Festivals, { as: "festival", foreignKey: "festivalId"});
  Festivals.hasMany(UserLikes, { as: "userLikes", foreignKey: "festivalId"});
  Films.belongsTo(FilmColors, { as: "filmColor", foreignKey: "filmColorId"});
  FilmColors.hasMany(Films, { as: "films", foreignKey: "filmColorId"});
  FilmCreditSectionCredits.belongsTo(FilmCreditSections, { as: "filmCreditSection", foreignKey: "filmCreditSectionId"});
  FilmCreditSections.hasMany(FilmCreditSectionCredits, { as: "filmCreditSectionCredits", foreignKey: "filmCreditSectionId"});
  FilmGenres.belongsTo(FilmGenreList, { as: "filmGenre", foreignKey: "filmGenreId"});
  FilmGenreList.hasMany(FilmGenres, { as: "filmGenres", foreignKey: "filmGenreId"});
  Cart.belongsTo(Films, { as: "film", foreignKey: "filmId"});
  Films.hasMany(Cart, { as: "carts", foreignKey: "filmId"});
  CartOrderItems.belongsTo(Films, { as: "film", foreignKey: "filmId"});
  Films.hasMany(CartOrderItems, { as: "cartOrderItems", foreignKey: "filmId"});
  FestivalSubmissions.belongsTo(Films, { as: "film", foreignKey: "filmId"});
  Films.hasMany(FestivalSubmissions, { as: "festivalSubmissions", foreignKey: "filmId"});
  FilmCreditSections.belongsTo(Films, { as: "film", foreignKey: "filmId"});
  Films.hasMany(FilmCreditSections, { as: "filmCreditSections", foreignKey: "filmId"});
  FilmGenres.belongsTo(Films, { as: "film", foreignKey: "filmId"});
  Films.hasMany(FilmGenres, { as: "filmGenres", foreignKey: "filmId"});
  FilmLanguages.belongsTo(Films, { as: "film", foreignKey: "filmId"});
  Films.hasMany(FilmLanguages, { as: "filmLanguages", foreignKey: "filmId"});
  FilmPhotos.belongsTo(Films, { as: "film", foreignKey: "filmId"});
  Films.hasMany(FilmPhotos, { as: "filmPhotos", foreignKey: "filmId"});
  FilmScreenings.belongsTo(Films, { as: "film", foreignKey: "filmId"});
  Films.hasMany(FilmScreenings, { as: "filmScreenings", foreignKey: "filmId"});
  FilmTypes.belongsTo(Films, { as: "film", foreignKey: "filmId"});
  Films.hasMany(FilmTypes, { as: "filmTypes", foreignKey: "filmId"});
  FilmVideos.belongsTo(Films, { as: "film", foreignKey: "filmId"});
  Films.hasOne(FilmVideos, { as: "filmVideo", foreignKey: "filmId"});
  UserLikes.belongsTo(Films, { as: "film", foreignKey: "filmId"});
  Films.hasMany(UserLikes, { as: "userLikes", foreignKey: "filmId"});
  FilmLanguages.belongsTo(Languages, { as: "language", foreignKey: "languageId"});
  Languages.hasMany(FilmLanguages, { as: "filmLanguages", foreignKey: "languageId"});
  FestivalSubmissions.belongsTo(Payments, { as: "payment", foreignKey: "paymentId"});
  Payments.hasMany(FestivalSubmissions, { as: "festivalSubmissions", foreignKey: "paymentId"});
  CartOrderItems.belongsTo(Payouts, { as: "payout", foreignKey: "payoutId"});
  Payouts.hasMany(CartOrderItems, { as: "cartOrderItems", foreignKey: "payoutId"});
  Cart.belongsTo(Users, { as: "user", foreignKey: "userId"});
  Users.hasMany(Cart, { as: "carts", foreignKey: "userId"});
  CartOrders.belongsTo(Users, { as: "user", foreignKey: "userId"});
  Users.hasMany(CartOrders, { as: "cartOrders", foreignKey: "userId"});
  FestivalJudges.belongsTo(Users, { as: "user", foreignKey: "userId"});
  Users.hasMany(FestivalJudges, { as: "festivalJudges", foreignKey: "userId"});
  FestivalReviews.belongsTo(Users, { as: "user", foreignKey: "userId"});
  Users.hasMany(FestivalReviews, { as: "festivalReviews", foreignKey: "userId"});
  Festivals.belongsTo(Users, { as: "user", foreignKey: "userId"});
  Users.hasMany(Festivals, { as: "festivals", foreignKey: "userId"});
  FilmCreditSectionCredits.belongsTo(Users, { as: "user", foreignKey: "userId"});
  Users.hasMany(FilmCreditSectionCredits, { as: "filmCreditSectionCredits", foreignKey: "userId"});
  Films.belongsTo(Users, { as: "user", foreignKey: "userId"});
  Users.hasMany(Films, { as: "films", foreignKey: "userId"});
  Payouts.belongsTo(Users, { as: "user", foreignKey: "userId"});
  Users.hasMany(Payouts, { as: "payouts", foreignKey: "userId"});
  Subscriptions.belongsTo(Users, { as: "user", foreignKey: "userId"});
  Users.hasMany(Subscriptions, { as: "subscriptions", foreignKey: "userId"});
  Users.belongsTo(WorkTypes, { as: "workTypeWorkType", foreignKey: "workType"});
  WorkTypes.hasMany(Users, { as: "users", foreignKey: "workType"});

  return {
    Cart,
    CartOrderItems,
    CartOrders,
    Currencies,
    FestivalAlbumPhotos,
    FestivalAlbums,
    FestivalCategories,
    FestivalCategoryFees,
    FestivalCategoryReviews,
    FestivalDateDeadlines,
    FestivalDates,
    FestivalFlags,
    FestivalFocus,
    FestivalFocusList,
    FestivalJudges,
    FestivalOrganizers,
    FestivalPhotos,
    FestivalReviewCategories,
    FestivalReviews,
    FestivalSubmissions,
    FestivalTagList,
    FestivalTags,
    FestivalTypes,
    FestivalVenues,
    Festivals,
    FilmColors,
    FilmCreditSectionCredits,
    FilmCreditSections,
    FilmGenreList,
    FilmGenres,
    FilmLanguages,
    FilmPhotos,
    FilmScreenings,
    FilmTypeList,
    FilmTypes,
    FilmVideos,
    Films,
    Languages,
    Payments,
    Payouts,
    ReviewTasks,
    Subscriptions,
    TinodeConfig,
    UserLikes,
    Users,
    WorkTypes,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
