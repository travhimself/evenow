// settings
var s = {
    nodeport: 3001,
    ioport: 3002,
    routeoptions: {
        root: __dirname + '/static/views/',
        dotfiles: 'ignore'
    },
    datafile: 'static/data/data.json', // world data json file; starts with a placeholder object and gets filled over time
    esihost: 'esi.evetech.net', // esi api
    sockettransmissioninteral: 60000, // interval between broadcast to clients (1min)
    datawriteinterval: 3600000, // how often data is logged to data.json (1hour) (rec: 3600000)
    apicallinterval_status: 60000, // interval between status data fetches (1min) (rec: 60000)
    apicallinterval_incursions: 300000, // interval between incursion data fetches (5min) (rec: 300000)
    apicallinterval_market: 3600000, // interval between market data fetches (1hour) (rec: 3600000)
    marketdatamaxentries: 24 // number of history entries to show for each market item (dependent on apicallinterval_market)
};


// include modules and start app
var https = require('https');
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
    var port = server.address().port;
    console.log('Listening on port %s...', port);

    // load saved data
    jsonfile.readFile(s.datafile, function(err, obj) {
        if ( err == null ) {
            worlddata = obj;

            // start running tasks
            getserverstatus();
            setInterval(getserverstatus, s.apicallinterval_status);

            getmarketdata();
            setInterval(getmarketdata, s.apicallinterval_incursions);

            getincursions();
            setInterval(getincursions, s.apicallinterval_market);

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


// CORE: players and server status
var getserverstatus = function() {

    var options = {
        host: s.esihost,
        path: '/latest/status'
    };

    https.get(options, function(res) {

        var output = '';

        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            output += chunk;
        });
        res.addListener('end', function() {
            var outputjson = jsonsafeparse(output);
            worlddata.playersonline = parseInt(outputjson.players);

            if (worlddata.playersonline > 0) {
                worlddata.serverstatus = 'Online';
            } else {
                worlddata.serverstatus = 'Offline';
            }
        });

    }).on('error', function(err) {
        console.error(err);
        worlddata.apistatusserver = false;
    });
};


// CORE: market
var getmarketdata = function() {

    var options = {
        host: s.esihost,
        path: '/latest/markets/prices'
    };

    https.get(options, function(res) {

        var output = '';

        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            output += chunk;
        });
        res.addListener('end', function() {
            var outputjson = jsonsafeparse(output);

            worlddata.commodities.concat(worlddata.rmtitems).forEach(function(el, i) {
                let typeobj = outputjson.find(function(prop) {
                    return prop.type_id === el.typeid;
                });

                // set average price as an integer (including hundreths places)
                el.avgprice = Math.round(typeobj.average_price * 100);

                // add new history entry to the end of the array if we're at a log interval
                el.avghistory.push(el.avgprice);

                // calculate change over the last interval
                if ( el.avghistory.length > 1 ) {
                    el.avgchange = el.avghistory[el.avghistory.length-1] - el.avghistory[el.avghistory.length-2];
                }

                // trim data in excess of the max entries setting
                if (el.avghistory.length > s.marketdatamaxentries) {
                    el.avghistory.pop();
                }
            });
        });

    }).on('error', function(err) {
        console.error(err);
        worlddata.apistatusserver = false;
    });
};


// CORE: incursions
var getincursions = function() {

    var options = {
        host: s.esihost,
        path: '/latest/incursions'
    };

    https.get(options, function(res) {

        var output = '';

        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            output += chunk;
        });
        res.addListener('end', function() {
            var outputjson = jsonsafeparse(output);

            worlddata.incursions = [];

            outputjson.forEach(async function(el, i) {
                let incursion = {
                    'state': el.state,
                    'constellation' : await getnamefromid('constellations', el.constellation_id),
                    'staging': await getnamefromid('systems', el.staging_solar_system_id),
                    'boss': el.has_boss
                };

                worlddata.incursions.push(incursion);
            });
        });

    }).on('error', function(err) {
        console.error(err);
        worlddata.apistatusserver = false;
    });
};


// UTIL: get name from ID
var getnamefromid = function(type, id) {

    // type is one of:
    // "constellations"
    // "systems"
    // "types"

    return new Promise(function(resolve, reject) {

        var output = '';
        var options = {
            host: s.esihost,
            path: '/latest/universe/' + type + '/' + id
        };

        https.get(options, function(res) {

            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                output += chunk;
            });
            res.addListener('end', function() {
                var outputjson = jsonsafeparse(output);
                resolve(outputjson.name);
            });

        }).on('error', function(err) {
            let errormsg = new Error('Error getting name from ID');
            reject(errormsg);
        });
    });
};