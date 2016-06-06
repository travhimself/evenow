// settings
var s = {
    nodeport: 3001,
    ioport: 3002,
    routeoptions: {
        root: __dirname + '/static/views/',
        dotfiles: 'ignore'
    },
    crestcallinterval: 60000, // interval between data fetches (1min)
    evecentralcallinterval: 300000, // interval between data fetches (5min)
    sockettransmissioninteral: 60000, // interval between broadcast to clients (1min)
    marketsystem: 30000142, // jita
    marketwindow: 8, // window for eve-central searches, in hours
    marketdatamaxentries: 12 // number of history entries to show for each market item
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
        {'typeid': 29668, 'typename': 'plex', 'volume': 0, 'avgchange': 0, 'avghistory': []}
        // {'typeid': 32792, 'typename': '100 aurum token', 'volume': 0, 'avgchange': 0, 'avghistory': []},
        // {'typeid': 40519, 'typename': 'skill extractor', 'volume': 0, 'avgchange': 0, 'avghistory': []},
        // {'typeid': 40520, 'typename': 'skill injector', 'volume': 0, 'avgchange': 0, 'avghistory': []}
    ],
    apistatusserver: true,
    apistatusmarket: true
};

var emitworlddata = function() {
    io.emit('updateworlddata', worlddata);
};


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
            var outputjson = JSON.parse(output);
            worlddata.serverstatus = outputjson.serviceStatus.eve;
            worlddata.playersonline = outputjson.userCounts.eve;
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
                var outputjson = JSON.parse(output);

                // set volume
                item.volume = outputjson[0].sell.volume;

                // add new entry to the front of the array
                item.avghistory.unshift(outputjson[0].sell.fivePercent.toFixed(2)*100);

                // calculate change over the last hour if we have enough data
                if ( item.avghistory.length >= s.marketdatamaxentries ) {
                    item.avgchange = item.avghistory[0] - item.avghistory[s.marketdatamaxentries-1];
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

};
