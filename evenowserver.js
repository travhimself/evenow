// settings
var s = {
    nodeport: 3001,
    ioport: 3002,
    routeoptions: {
        root: __dirname + '/static/views/',
        dotfiles: 'ignore'
    },
    datafile: 'static/data/data.json', // world data json file; starts with a placeholder object and gets filled over time
    sockettransmissioninteral: 60000, // interval between broadcast to clients (1min)
    datawriteinterval: 3600000, // how often data is logged to data.json (1hour)
    crestcallinterval: 60000, // interval between data fetches (1min)
    evecentralcallinterval: 3600000, // interval between data fetches (1hour)
    marketsystem: 30000142, // jita
    marketwindow: 24, // window for eve-central searches, in hours
    marketloginterval: 4, // log the data every x calls for avghistory (4hours)
    marketdatamaxentries: 18 // number of history entries to show for each market item (3days)
};


// include modules and start app
var https = require('https');
var moment = require('moment');
var jsonfile = require('jsonfile');
var express = require('express');
var evenowexpressapp = express();
var evenowserver = require('http').Server(evenowexpressapp);
var io = require('socket.io')(evenowserver).listen(s.ioport);


// set directory for static files with express.static middleware
evenowexpressapp.use(express.static('static'));


// routes
evenowexpressapp.get('/*', function(req, res) {
    res.sendFile('index.html', s.routeoptions);
});

evenowexpressapp.use(function(req, res) {
    // should never be needed since we wildcard all routes back to index, but just in case
    res.sendFile('404.html', s.routeoptions);
});


// start server
var worlddata;

var server = evenowexpressapp.listen(s.nodeport, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Listening on port %s...', port);

    // load saved data
    jsonfile.readFile(s.datafile, function(err, obj) {
        if ( err == null ) {
            worlddata = obj;

            // start running tasks
            getserverstatus();
            setInterval(getserverstatus, s.crestcallinterval);

            getincursions();
            setInterval(getincursions, s.crestcallinterval);

            getmarketdata();
            setInterval(getmarketdata, s.evecentralcallinterval);

            emitworlddata();
            setInterval(emitworlddata, s.sockettransmissioninteral);

            writeworlddata();
            setInterval(writeworlddata, s.datawriteinterval);
        }
    });
});


// send initial data on client (and only that client) connection (regardless of emit interval)
io.on('connection', function(socket) {
    socket.emit('updateworlddata', worlddata);
});

var emitworlddata = function() {
    io.emit('updateworlddata', worlddata);
};


// data writing
var writeworlddata = function() {
    jsonfile.writeFile(s.datafile, worlddata);
};


// safe json parser (won't crash the app if we get a bad response, which sometimes happens)
var jsonsafeparse = function(json) {
    try {
        return JSON.parse(json);
    } catch(ex) {
        return null;
    }
}


// api call: server status
var getserverstatus = function() {

    var output = '';
    var options = {
        host: 'crest-tq.eveonline.com',
        path: '/'
    };

    https.get(options, function(res) {

        res.setEncoding('utf8');

        res.on('data', function(chunk) {
            output += chunk;
        });

        res.addListener('end', function() {
            var outputjson = jsonsafeparse(output);

            if ( outputjson ) {
                if ( 'serviceStatus' in outputjson ) {
                    worlddata.apistatusserver = true;
                    worlddata.serverstatus = outputjson.serviceStatus.eve;
                } else {
                    worlddata.apistatusserver = false;
                    worlddata.serverstatus = 'Offline';
                }

                if ( 'userCounts' in outputjson ) {
                    worlddata.apistatusserver = true;
                    worlddata.playersonline = outputjson.userCounts.eve;
                } else {
                    worlddata.apistatusserver = false;
                    worlddata.playersonline = 0;
                }
            }
        });

    }).on('error', function(err) {
        console.error(err);
        worlddata.apistatusserver = false;
    });

};


// api call: incursions
var getincursions = function() {

    var output = '';
    var options = {
        host: 'crest-tq.eveonline.com',
        path: '/incursions/'
    };

    https.get(options, function(res) {

        res.setEncoding('utf8');

        res.on('data', function(chunk) {
            output += chunk;
        });

        res.addListener('end', function() {
            var outputjson = jsonsafeparse(output);

            if ( outputjson ) {
                if ( "items" in outputjson ) {
                    worlddata.apistatusserver = true;
                    worlddata.incursionstate = outputjson.items[0].state;
                    worlddata.incursionconstellation = outputjson.items[0].constellation.name;
                    worlddata.incursionstaging = outputjson.items[0].stagingSolarSystem.name;
                } else {
                    worlddata.apistatusserver = false;
                }
            }
        });

    }).on('error', function(err) {
        console.error(err);
        worlddata.apistatusserver = false;
    });

};


// api call: market data
var marketcallcounter = 0;
var currentcallcount = 0;
var getmarketdata = function() {

    // snag current call count before we increment
    currentcallcount = marketcallcounter;

    // increment call marketcallcounter
    marketcallcounter++;

    worlddata.commodities.concat(worlddata.rmtitems).forEach( function(item, index) {
        var output = '';
        var options = {
            host: 'api.eve-central.com',
            path: '/api/marketstat/json?hours=' + s.marketwindow + '&typeid=' + item.typeid + '&usesystem=' + s.marketsystem
        };

        https.get(options, function(res) {

            res.setEncoding('utf8');

            res.on('data', function(chunk) {
                output += chunk;
            });

            res.addListener('end', function() {
                var outputjson = jsonsafeparse(output);

                if ( outputjson ) {
                    if ( outputjson.length > 0 && "sell" in outputjson[0] ) {
                        worlddata.apistatusmarket = true;

                        // set volume
                        item.volume = outputjson[0].sell.volume;

                        // set average price as an integer
                        item.avgprice = Math.round(outputjson[0].sell.fivePercent * 100);

                        // if we get a 0 from eve-central (which does happen sometimes), use previous value
                        if ( item.avgprice == 0 && item.avghistory.length > 0 ) {
                            item.avgprice = item.avghistory[item.avghistory.length-1];
                        }

                        // add new history entry to the end of the array if we're at a log interval
                        if ( currentcallcount % s.marketloginterval == 0 ) {
                            item.avghistory.push(item.avgprice);
                        }

                        // calculate change over the last interval
                        if ( item.avghistory.length > 1 ) {
                            item.avgchange = item.avghistory[item.avghistory.length-1] - item.avghistory[item.avghistory.length-2];
                        }

                        // trim data in excess of the max entries setting
                        if (item.avghistory.length > s.marketdatamaxentries) {
                            item.avghistory.pop();
                        }
                    } else {
                        worlddata.apistatusmarket = false;
                    }
                }
            });

        }).on('error', function(err) {
            console.error(err);
            worlddata.apistatusmarket = false;
        });
    });

};
