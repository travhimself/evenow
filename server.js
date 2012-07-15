// import modules
var http = require("http");
var moment = require("moment");

// set up a node server on port 8000 with the connect module
var connect = require("connect");
connect(connect.static(__dirname + "/")).listen(8000);

// create a socket.io server on port 1111
var io = require("socket.io").listen(1111);

// set up vars
var newtime;

// listen for websocket connections from a client
io.sockets.on("connection", function (socket) {

    // listen for timeupdate event from the client
    socket.on("timeupdate", function (data) {
        // retrieve time from timeapi.org
        http.get("http://www.timeapi.org/utc/now.json", function(res) {
            // set the response to a utf8 string instead of a buffer
            res.setEncoding("utf8");
            res.on("data", function (chunk) {
                // if the response isn't the expected json string...
                if ( chunk.split(":")[0] != '{"dateString"') {
                    // ...fall back to server time
                    newtime = {
                        "dateString": new Date().toString(),
                        "warning": "Warning: EVE TIME may not be accurate."
                    };
                } else {
                    // convert chunk string to json object
                    newtime = JSON.parse(chunk);
                }
                // publish updatetime event to the client
                socket.emit("updatetime", newtime);
            });
        }).on("error", function (e) {
            // if the request fails, fall back to server time
            newtime = {
                "dateString": new Date().toString(),
                "warning": "Warning: EVE TIME may not be accurate."
            };
        });
    });

});