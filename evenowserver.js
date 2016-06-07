// settings
var s = {
    nodeport: 3001,
    ioport: 3002,
    routeoptions: {
        root: __dirname + '/static/views/',
        dotfiles: 'ignore'
    },
    crestcallinterval: 60000, // interval between data fetches (1min)
    evecentralcallinterval: 600000, // interval between data fetches (10min)
    sockettransmissioninteral: 60000, // interval between broadcast to clients (1min)
    marketsystem: 30000142, // jita
    marketwindow: 24, // window for eve-central searches, in hours
    marketloginterval: 6, // log the data every x calls for avghistory (1hour)
    marketdatamaxentries: 16 // number of history entries to show for each market item
};


// include modules and start app
var https = require('https');
var moment = require('moment');
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
var server = evenowexpressapp.listen(s.nodeport, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Listening on port %s...', port);

    getserverstatus();
    setInterval(getserverstatus, s.crestcallinterval);

    getincursions();
    setInterval(getincursions, s.crestcallinterval);

    getmarketdata();
    setInterval(getmarketdata, s.evecentralcallinterval);

    emitworlddata();
    setInterval(emitworlddata, s.sockettransmissioninteral);
});


// send initial data on client connection (regardless of emit interval)
io.on('connection', function(socket) {
    emitworlddata();
});


// world data object
var worlddata = {
    serverstatus: '',
    playersonline: 0,
    incursionstate: '',
    incursionconstellation: '',
    incursionstaging: '',
    commodities: [
        {'typeid': 34, 'typename': 'tritanium', 'volume': 0, 'avgchange': 0, 'avghistory': []},
        {'typeid': 35, 'typename': 'pyerite', 'volume': 0, 'avgchange': 0, 'avghistory': []},
        {'typeid': 36, 'typename': 'mexallon', 'volume': 0, 'avgchange': 0, 'avghistory': []},
        {'typeid': 37, 'typename': 'isogen', 'volume': 0, 'avgchange': 0, 'avghistory': []},
        {'typeid': 38, 'typename': 'nocxium', 'volume': 0, 'avgchange': 0, 'avghistory': []},
        {'typeid': 39, 'typename': 'zydrine', 'volume': 0, 'avgchange': 0, 'avghistory': []},
        {'typeid': 40, 'typename': 'megacyte', 'volume': 0, 'avgchange': 0, 'avghistory': []},
        {'typeid': 16649, 'typename': 'technetium', 'volume': 0, 'avgchange': 0, 'avghistory': []}
        // {'typeid': 16274, 'typename': 'helium iso', 'volume': 0, 'avgchange': 0, 'avghistory': []},
        // {'typeid': 17887, 'typename': 'oxygen iso', 'volume': 0, 'avgchange': 0, 'avghistory': []},
        // {'typeid': 17888, 'typename': 'nitrogen iso', 'volume': 0, 'avgchange': 0, 'avghistory': []},
        // {'typeid': 17889, 'typename': 'hydrogen iso', 'volume': 0, 'avgchange': 0, 'avghistory': []}
    ],
    rmtitems: [
        {'typeid': 29668, 'typename': 'plex', 'volume': 0, 'avgchange': 0, 'avghistory': []},
        // {'typeid': 32792, 'typename': '100 aurum token', 'volume': 0, 'avgchange': 0, 'avghistory': []},
        // {'typeid': 40519, 'typename': 'skill extractor', 'volume': 0, 'avgchange': 0, 'avghistory': []},
        {'typeid': 40520, 'typename': 'skill injector', 'volume': 0, 'avgchange': 0, 'avghistory': []}
    ],
    apistatusserver: true,
    apistatusmarket: true
};

var emitworlddata = function() {
    io.emit('updateworlddata', worlddata);
};

var callcounter = 0;


// safe json parser (won't crash the app if we get a bad response, which sometimes happens)
var jsonsafeparse = function(json) {
    try {
        return JSON.parse(json);
    } catch(ex) {
        return '';
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
            worlddata.serverstatus = outputjson.serviceStatus.eve;
            worlddata.playersonline = outputjson.userCounts.eve;
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
            worlddata.incursionstate = outputjson.items[0].state;
            worlddata.incursionconstellation = outputjson.items[0].constellation.name;
            worlddata.incursionstaging = outputjson.items[0].stagingSolarSystem.name;
        });

    }).on('error', function(err) {
        console.error(err);
        worlddata.apistatusserver = false;
    });

};


// api call: market data
var getmarketdata = function() {

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

                // set volume
                item.volume = outputjson[0].sell.volume;
                item.avgprice = outputjson[0].sell.fivePercent.toFixed(2)*100;

                // if we get a 0 from eve-central (which does happen sometimes), use previous value
                if ( item.avgprice == 0 && item.avghistory.length > 0 ) {
                    item.avgprice = item.avghistory[0];
                }

                // add new history entry to the front of the array if we're at a log interval
                if ( callcounter % s.marketloginterval == 0 ) {
                    item.avghistory.unshift(item.avgprice);
                }

                // calculate change over the last interval
                if ( item.avghistory.length > 1 ) {
                    item.avgchange = item.avghistory[1] - item.avghistory[0];
                }

                // trim data in excess of the max entries setting
                if (item.avghistory.length > s.marketdatamaxentries) {
                    item.avghistory.pop();
                }
            });

        }).on('error', function(err) {
            console.error(err);
            worlddata.apistatusmarket = false;
        });
    });

    // increment call callcounter
    callcounter++;

};
