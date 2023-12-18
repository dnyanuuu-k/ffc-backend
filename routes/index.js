/**
 * @Page: Route Index
 * @Description: Import all routes files here
 */

const init = (app, apiVersion) => {
    app.use(`/${apiVersion}/dashboard`, require("./dashboard"));
    app.use(`/${apiVersion}/submission`, require("./submission"));
	app.use(`/${apiVersion}/account`, require("./account"));
    app.use(`/${apiVersion}/country`, require("./country"));
    app.use(`/${apiVersion}/festival`, require("./festival"));
    app.use(`/${apiVersion}/metadata`, require("./metadata"));
    app.use(`/${apiVersion}/tinode`, require("./tinode"));
    app.use(`/${apiVersion}/payment`, require("./payment"));
    app.use(`/${apiVersion}/reviews`, require("./reviews"));
    app.use(`/${apiVersion}/photos`, require("./photos"));    
    app.use(`/${apiVersion}/judge`, require("./judge"));  
    app.use(`/${apiVersion}/film`, require("./films"));    
    app.use(`/${apiVersion}/cart`, require("./cart"));    
    app.use(`/${apiVersion}/tus`, require("./tus"));
};

module.exports = init;