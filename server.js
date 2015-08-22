// import modules
var http = require('http');
var https = require('https');
var xmlsimple = require('xml-simple');

// set up a node server on port 8000 with the express module
var express = require('express');
var app = express();

// create a socket.io server on port 1111
var io = require('socket.io').listen(1111);

// data points
var datapoints = {
    notifications: new Object(),
    tranquilitystatus: '',
    playersonline: 0,
    totalkills: 0,
    mostkillssystem: '',
    mostkillssystemcount: 0,
    pricetritanium: 0,
    priceisogen: 0,
    pricemegacyte: 0,
    pricetechnetium: 0,
    priceliquidozone: 0,
    pricedrake: 0
};

// Get data points from various APIs
var tranquilityupdate = function(data) {
    // local vars
    var tqresponsebody;
    var tqresponseparsed;

    // set up options for the get request
    var options = {
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
            delete datapoints.notifications['serverstatusapi'];
        });
    }).on('error', function(err) {
        console.error(err);
        datapoints.notifications['serverstatusapi'] = '* There was an error with the EVE Online server status API. Tranquility status may be inaccurate.';
    });
};
// fetch initial results
tranquilityupdate();
// update every 5 minutes
setInterval(tranquilityupdate, 300000);

var killcountupdate = function(data) {
    // local vars
    var kcresponsebody;
    var kcresponseparsed;
    var totalkills;
    var systemsarray;
    var mostkillssystemid;

    // set up options for the get request
    var options = {
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
                // console.log(parsed);
                kcresponseparsed = parsed;
            });
            // update the total kills and single system kills values
            datapoints.totalkills = 0;
            datapoints.mostkillssystemcount = 0;

            // count kills
            systemsarray = kcresponseparsed.result.rowset.row;
            for(i in systemsarray) {
                // total kills
                if (!isNaN(parseInt(systemsarray[i]['@'].shipKills))) {
                    // only add up results that are not NaN (which sometimes happens)...
                    datapoints.totalkills += parseInt(systemsarray[i]['@'].shipKills);
                }

                // system with most kills
                if (parseInt(systemsarray[i]['@'].shipKills) >= datapoints.mostkillssystemcount) {
                    datapoints.mostkillssystemcount = parseInt(systemsarray[i]['@'].shipKills);
                    mostkillssystemid = systemsarray[i]['@'].solarSystemID;
                }
            };
            systemnamelookup(mostkillssystemid);
            delete datapoints.notifications['killsapi'];
        });
    }).on('error', function(err) {
        console.error(err);
        datapoints.notifications['killsapi'] = '* There was an error with the EVE Online kills API. Ships Destroyed may be inaccurate.';
    });
};
// fetch initial results
killcountupdate();
// update every 10 minutes
setInterval(killcountupdate, 600000);

var systemnamelookup = function(data) {
    // local vars
    var syresponsebody;
    var syresponseparsed;

    // set up options for the get request
    var options = {
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
                // console.log(parsed);
                syresponseparsed = parsed;
            });
            // update the most-kills system value
            datapoints.mostkillssystem = syresponseparsed.result.rowset.row['@']['name'];
            delete datapoints.notifications['charactersapi'];
        });
    }).on('error', function(err) {
        console.error(err);
        datapoints.notifications['charactersapi'] = '* There was an error with the EVE Online characters API. Most Ships Destroyed may be inaccurate.';
    });
};

var marketdataupdate = function(data) {
    // local vars
    var mkresponsebody;
    var mkresponseparsed;

    // set up options for the get request
    var options = {
        host:'api.eve-central.com',
        path:'/api/marketstat?typeid=34&typeid=37&typeid=40&typeid=16649&typeid=16273&typeid=24698&regionlimit=10000002&regionlimit=10000043&regionlimit=10000030&regionlimit=10000032&regionlimit=10000042',
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
                // console.log(parsed);
                mkresponseparsed = parsed;
            });
            // update market item values; eve-central API is unreliable, and doesn't always throw us a helpful error if something goes wrong, so we handle timeout things a little differently here
            if (typeof mkresponseparsed === 'undefined') {
                datapoints.notifications['evecentral'] = '* There was an error with the EVE Central markerstat API. Market data may be inaccurate.';
            } else {
                delete datapoints.notifications['evecentral'];
                datapoints.pricetritanium = mkresponseparsed.marketstat.type[0].sell.avg;
                datapoints.priceisogen = mkresponseparsed.marketstat.type[1].sell.avg;
                datapoints.pricemegacyte = mkresponseparsed.marketstat.type[2].sell.avg;
                datapoints.pricetechnetium = mkresponseparsed.marketstat.type[3].sell.avg;
                datapoints.priceliquidozone = mkresponseparsed.marketstat.type[4].sell.avg;
                datapoints.pricedrake = mkresponseparsed.marketstat.type[5].sell.avg.split(".")[0];
            };
        });
    });
};
// fetch initial results
marketdataupdate();
//update every 5 minutes
setInterval(marketdataupdate, 300000);

// listen for websocket connections from the client
io.sockets.on('connection', function (socket) {

    // listen for getupdates event from the client
    socket.on('getupdates', function (data) {
        socket.emit('updateall', datapoints);
    });

});