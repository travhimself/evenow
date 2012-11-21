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

// data points
var datapoints = {
    tranquilitystatus: 't',
    playersonline: 't',
    totalkills: 't',
    mostkillssystem: 't',
    mostkillssystemcount: 't',
    mostkillssystemlabel: 't',
    pricetritanium: 't',
    priceisogen: 't',
    pricemegacyte: 't',
    pricetechnetium: 't',
    priceliquidozone: 't',
    pricedrake: 't'
};

// Get data points from various APIs
var tranquilityupdate = function(data) {
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
            // update the server status and player count values
            if ( tqresponseparsed.result.serverOpen == 'True' ) {
                datapoints.tranquilitystatus = 'Online';
            } else {
                datapoints.tranquilitystatus = 'Offline';
            }
            datapoints.playersonline = tqresponseparsed.result.onlinePlayers;
        });
    }).on('error', function(err) {
        console.error(err);
    });
};
tranquilityupdate();
setInterval(tranquilityupdate, 300000);

var killcountupdate = function(data) {
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
            // socket.emit("updatekillcount", kcresponseparsed);
        });
    }).on('error', function(err) {
        console.error(err);
    });
};
killcountupdate();
setInterval(killcountupdate, 300000);

var systemnamelookup = function(data) {
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
            // socket.emit("lookupsystemname", syresponseparsed);
        });
    }).on('error', function(err) {
        console.error(err);
    });
};

var marketdataupdate = function(data) {
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
            // socket.emit("updatemarketdata", mkresponseparsed);
        });
    });
};
marketdataupdate();
setInterval(marketdataupdate, 300000);

// listen for websocket connections from the client
io.sockets.on("connection", function (socket) {

    // listen for getupdates event from the client
    socket.on("getupdates", function (data) {
        socket.emit("updateall", datapoints);
    });

});