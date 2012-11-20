// import modules
var http = require("http");
var https = require("https");
var xmlsimple = require('xml-simple');

// set up a node server on port 8000 with the express module
// var app = require('express').createServer();
var express = require('express');
var app = express();
app.listen(8000);

// create a socket.io server on port 1111
var io = require("socket.io").listen(1111);

// initialize some vars for later
var newtime;
var options;

// language vars
var notifytimefallback = "Warning: EVE TIME may not be accurate. Refresh to pull time again.";

// listen for websocket connections from the client
io.sockets.on("connection", function (socket) {

    // listen for timeupdate event from the client
    socket.on("timeupdate", function (data) {

        // set up options for the get request
        options = {
            host:'www.timeapi.org',
            path:'/utc/now.json'
        };

        // retrieve time from timeapi.org
        http.get( options, function (res) {
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

        // local vars
        var tqresponsebody;
        var tqresponseparsed;

        // set up options for the get request
        options = {
            host:'api.eveonline.com',
            path:'/server/ServerStatus.xml.aspx'
        };

        // hit the eve API with the options above
        https.get( options, function (res) {
            // build the responsebody string as the data comes in
            res.setEncoding('utf8');
            res.on('data', function (d) {
                tqresponsebody += d;
            });
            res.addListener('end', function() {
                // parse the xml in the responsebody into JSON
                xmlsimple.parse(tqresponsebody, function(e, parsed) {
                    // console.log(parsed);
                    tqresponseparsed = parsed;
                });
                // publish updatetranquility event to the client
                socket.emit("updatetranquility", tqresponseparsed);
            });
        }).on('error', function(err) {
            console.error(err);
        });

    });

    // listen for kill counts status update from the client
    socket.on("killcountupdate", function (data) {

        // local vars
        var kcresponsebody;
        var kcresponseparsed;

        // set up options for the get request
        options = {
            host:'api.eveonline.com',
            path:'/map/Kills.xml.aspx'
        };

        // hit the eve API with the options above
        https.get( options, function (res) {
            // build the responsebody string as the data comes in
            res.setEncoding('utf8');
            res.on('data', function (d) {
                kcresponsebody += d;
            });
            res.addListener('end', function() {
                // parse the xml in the responsebody into JSON
                xmlsimple.parse(kcresponsebody, function(e, parsed) {
                    console.log(parsed);
                    kcresponseparsed = parsed;
                });
                // publish updatekillcount event to the client
                socket.emit("updatekillcount", kcresponseparsed);
            });
        }).on('error', function(err) {
            console.error(err);
        });

    });

    // listen for system name lookup request from the client
    socket.on("systemnamelookup", function (data) {

        // local vars
        var syresponsebody;
        var syresponseparsed;

        // set up options for the get request
        options = {
            host:'api.eveonline.com',
            path:'/eve/CharacterName.xml.aspx?IDs=' + data
        };

        // hit the eve API with the options above
        https.get( options, function (res) {
            // build the responsebody string as the data comes in
            res.setEncoding('utf8');
            res.on('data', function (d) {
                syresponsebody += d;
            });
            res.addListener('end', function() {
                // parse the xml in the responsebody into JSON
                xmlsimple.parse(syresponsebody, function(e, parsed) {
                    console.log(parsed);
                    syresponseparsed = parsed;
                });
                // publish lookupsystemname event to the client
                socket.emit("lookupsystemname", syresponseparsed);
            });
        }).on('error', function(err) {
            console.error(err);
        });

    });

    // listen for market data update from the client
    socket.on("marketdataupdate", function (data) {

        // local vars
        var mkresponsebody;
        var mkresponseparsed;

        // set up options for the get request
        options = {
            host:'api.eve-central.com',
            path:'/api/marketstat?typeid=34&typeid=37&typeid=40&typeid=16649&typeid=16273&typeid=24698',
            port:80
        };

        // hit the eve-central API with the options above
        http.get( options, function (res) {
            // build the responsebody string as the data comes in
            res.setEncoding('utf8');
            res.on('data', function (d) {
                mkresponsebody += d;
            });
            res.addListener('end', function() {
                // parse the xml in the responsebody into JSON
                xmlsimple.parse(mkresponsebody, function(e, parsed) {
                    console.log(parsed);
                    mkresponseparsed = parsed;
                });
                // publish updatekillcount event to the client
                socket.emit("updatemarketdata", mkresponseparsed);
            });
        });

    });

});