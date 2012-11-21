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

// data point vars
var data_tranquilitystatus;
var data_playersonline;
var data_totalkills;
var data_mostkillssystem;
var data_mostkillssystemcount;
var data_pricetritanium;
var data_priceisogen;
var data_pricemegacyte;
var data_pricetechnetium;
var data_priceliquidozone;
var data_pricedrake;

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
            // update the server status and player count vars
            if ( tqresponseparsed.result.serverOpen == 'True' ) {
                data_tranquilitystatus = 'Online';
            } else {
                data_tranquilitystatus = 'Offline';
            }
            data_playersonline = tqresponseparsed.result.onlinePlayers;
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

    // listen for timeupdate event from the client
    socket.on("timeupdate", function (data) {
        // hitapitime(data);
    });

    // listen for tranquility status update from the client
    socket.on("tranquilityupdate", function (data) {
        // hitapiserverstatus(data);
    });

    // listen for kill counts status update from the client
    socket.on("killcountupdate", function (data) {
        // hitapikillcount(data);
    });

    // listen for system name lookup request from the client
    socket.on("systemnamelookup", function (data) {
        // hitapisystemname(data);
    });

    // listen for market data update from the client
    socket.on("marketdataupdate", function (data) {
        // hitapievecentral(data);
    });

});