// import modules
var http = require("http");
var https = require("https");
var xmlsimple = require('xml-simple');
//var xml2js = require("xml2js");

// set up a node server on port 8000 with the express module
var app = require('express').createServer();
app.listen(8000);

// create a socket.io server on port 1111
var io = require("socket.io").listen(1111);

// initialize some vars for later
var newtime;
var options;
var responsebody;
var responseparsed;

// language vars
var notifytimefallback = "Warning: EVE TIME may not be accurate.";

// listen for websocket connections from the client
io.sockets.on("connection", function (socket) {

    // listen for timeupdate event from the client
    socket.on("timeupdate", function (data) {

        // retrieve time from timeapi.org
        http.get("http://www.timeapi.org/utc/now.json", function (res) {
            // set the response to a utf8 string instead of a buffer
            res.setEncoding("utf8");
            res.on("data", function (chunk) {
                // if the response isn't the expected json string...
                if ( chunk.split(":")[0] != '{"dateString"') {
                    // ...fall back to server time
                    newtime = { "dateString": new Date().toString() };
                    socket.emit("notify", notifytimefallback);
                } else {
                    // convert chunk string to json object
                    newtime = JSON.parse(chunk);
                }
                // publish updatetime event to the client
                socket.emit("updatetime", newtime);
            });
        }).on("error", function (e) {
            // if the request fails, fall back to server time
            newtime = { "dateString": new Date().toString() };
            socket.emit("notify", notifytimefallback);
        });

    });

    // listen for tranquility status update from the client
    socket.on("tranquilityupdate", function (data) {

        // set up options for the get request
        options = {
            host:'api.eveonline.com',
            path:'/server/ServerStatus.xml.aspx',
            port:80
        };

        // hit the eve API with the options above
        http.get( options, function (res) {
            // build the responsebody string as the data comes in
            res.setEncoding('utf8');
            res.on('data', function (d) {
                responsebody += d;
            });
            res.addListener('end', function() {
                // parse the xml in the responsebody into JSON
                xmlsimple.parse(responsebody, function(e, parsed) {
                    console.log(parsed);
                });
            });
            // publish updatetranquility event to the client
            // socket.emit("updatetranquility", responseparsed);
        });

    });

});