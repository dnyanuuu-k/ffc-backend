/*
  - Required For Absolute Imports
  - Add any folder to paths
  - why to use # only before name, 
    - to  avoid conflict between node-modules and local folders
*/
require("./ffc-absolute-import");

const constants = require("#utils/constants");
// const socketUtil = require("#utils/socket");
const routes = require("#routes");
const express = require("express");
const http = require("http");
const cors = require("cors");
//HTTP/TCP Connection
const app = express();
const port = process.env.PORT_NODE || 3301;
const apiVersion = process.env.API_VERSION || "v1";
const httpServer = http.createServer(app);

//Basic Initialization
app.use((_, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization, Content-Length, X-Requested-With"
	);
	res.header("Access-Control-Allow-Methods", "PUT, POST, GET, OPTIONS, DELETE");
	next();
});
app.use(
	cors({
		origin: (o, c) => {
			c(null, true);
		},
	})
);
app.use(express.json());

//Routes
routes(app, apiVersion);

//Websocket/Socket.io Connection
// const socketIo = require("socket.io");
// const io = socketIo(httpServer, {
// 	cors: {
// 		origin: "http://localhost:3000",
// 	},
// });
// io.on("connection", (socket) => {
// 	console.log("client connected: ", socket.id);
// 	socket.on("disconnect", (reason) => {
// 		console.log(reason);
// 	});
// });
// socketUtil.setConnection(io);

//Starting Connection
httpServer.listen(port, () => {
	const greeting = `/***************************************/
            ${constants.projectId} & Socket IO
           listening on ${port}
/***************************************/`;
	console.log(greeting);
});