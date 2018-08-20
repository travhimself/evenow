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
    sockettransmissioninteral: 1200000, // interval between broadcast to clients (rec: 1200000) (2min)
    datawriteinterval: 3600000, // how often data is logged to data.json (rec: 3600000) (1hour)
    apicallinterval_status: 600000, // interval between status data fetches (rec: 600000) (10min)
    apicallinterval_market: 86400000, // interval between market data fetches (rec: 14400000) (24hours)
    apicallinterval_incursions: 600000, // interval between incursion data fetches (rec: 600000) (10min)
    apicallinterval_systemkills: 3600000, // interval between market data fetches (rec: 3600000) (1hour)
    apicallinterval_systemjumps: 3600000, // interval between market data fetches (rec: 3600000) (1hour)
    apicallinterval_factionwarfare: 21600000, // interval between faction warfare data fetches (rec: 3600000) (6hours)
    marketdatamaxentries: 21 // number of history entries to show for each market item (dependent on apicallinterval_market)
};


// include modules and start app
var https = require('https');
var jsonfile = require('jsonfile');
var _ = require('underscore');
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
            setInterval(getmarketdata, s.apicallinterval_market);

            getincursions();
            setInterval(getincursions, s.apicallinterval_incursions);

            getsystemkills();
            setInterval(getsystemkills, s.apicallinterval_systemkills);

            getsystemjumps();
            setInterval(getsystemjumps, s.apicallinterval_systemjumps);

            getfactionwarfare();
            setInterval(getfactionwarfare, s.apicallinterval_factionwarfare);

            emitworlddata();
            setInterval(emitworlddata, s.sockettransmissioninteral);

            // NOTE: uncomment only if we want to do a write on initial server start; this should usually be commented out
            // writeworlddata();
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
    let d = new Date();
    console.log('Writing data at ' + d.toTimeString());
    jsonfile.writeFile(s.datafile, worlddata);
};


// safe json parser (won't crash the app if we get a bad response, which sometimes happens)
var jsonsafeparse = function(json) {
    try {
        return JSON.parse(json);
    } catch(ex) {
        return null;
    }
};


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
            
            try {
                var outputjson = jsonsafeparse(output);

                worlddata.playersonline = parseInt(outputjson.players);

                if (worlddata.playersonline > 0) {
                    worlddata.serverstatus = 'Online';
                } else {
                    worlddata.serverstatus = 'Offline';
                }
            } catch(e) {
                console.log(e);
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
            
            try {
                var outputjson = jsonsafeparse(output);

                worlddata.commodities.concat(worlddata.rmtitems).forEach(function(el, i) {
                    let typeobj = outputjson.find(function(prop) {
                        return prop.type_id === el.typeid;
                    });

                    // set average price as an integer (including hundreths places)
                    el.avgprice = Math.round(typeobj.average_price * 100);

                    // add new history entry to the end of the array
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
            } catch(e) {
                console.log(e);
            }
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
            
            try {
                var outputjson = jsonsafeparse(output);

                worlddata.incursions = [];

                outputjson.forEach(async function(el, i) {
                    worlddata.incursions.push({
                        'state': el.state,
                        'constellation' : await getnamefromid('constellations', el.constellation_id),
                        'staging': await getnamefromid('systems', el.staging_solar_system_id),
                        'boss': el.has_boss
                    });
                });
            } catch(e) {
                console.log(e);
            }
        });

    }).on('error', function(err) {
        console.error(err);
        worlddata.apistatusserver = false;
    });
};


// CORE: system kills
var getsystemkills = function() {

    var options = {
        host: s.esihost,
        path: '/latest/universe/system_kills'
    };

    https.get(options, function(res) {

        var output = '';

        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            output += chunk;
        });
        res.addListener('end', function() {
            
            try {
                var outputjson = jsonsafeparse(output);
                var outputjsonsorted = _.sortBy(outputjson, "ship_kills");
                var outputjsonsortedrev = outputjsonsorted.reverse();
                var shortlist = outputjsonsortedrev.slice(0, 3);

                worlddata.systemkills = [];

                async function buildsystemkills() {
                    for (let system of shortlist) {
                        worlddata.systemkills.push({
                            'name': await getnamefromid('systems', system.system_id),
                            'ships': system.ship_kills,
                            'ships_percent': Math.round(system.ship_kills / shortlist[0].ship_kills * 100),
                            'pods': system.pod_kills,
                            'pods_percent': Math.round(system.pod_kills / shortlist[0].ship_kills * 100) // intentionally based on ships
                        });
                    }
                };

                buildsystemkills();
            } catch(e) {
                console.log(e);
            }
        });

    }).on('error', function(err) {
        console.error(err);
        worlddata.apistatusserver = false;
    });
};


// CORE: system jumps
var getsystemjumps = function() {

    var options = {
        host: s.esihost,
        path: '/latest/universe/system_jumps'
    };

    https.get(options, function(res) {

        var output = '';

        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            output += chunk;
        });
        res.addListener('end', function() {
            
            try {
                var outputjson = jsonsafeparse(output);
                var outputjsonsorted = _.sortBy(outputjson, "ship_jumps");
                var outputjsonsortedrev = outputjsonsorted.reverse();
                var shortlist = outputjsonsortedrev  .slice(0, 3);

                worlddata.systemjumps = [];

                async function buildsystemjumps() {
                    for (let system of shortlist) {
                        worlddata.systemjumps.push({
                            'name': await getnamefromid('systems', system.system_id),
                            'jumps': system.ship_jumps,
                            'percent': Math.round(system.ship_jumps / shortlist[0].ship_jumps * 100)
                        });
                    }
                };

                buildsystemjumps();
            } catch(e) {
                console.log(e);
            }
        });

    }).on('error', function(err) {
        console.error(err);
        worlddata.apistatusserver = false;
    });
};


// CORE: faction warfare
var getfactionwarfare = function() {

    var options = {
        host: s.esihost,
        path: '/latest/fw/stats'
    };

    https.get(options, function(res) {

        var output = '';

        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            output += chunk;
        });
        res.addListener('end', function() {
            
            try {
                var outputjson = jsonsafeparse(output);
                var outputjsonsorted = _.sortBy(outputjson, "systems_controlled");
                var outputjsonsortedrev = outputjsonsorted.reverse();

                worlddata.factions.forEach(function(el, i) {
                    let factionobj = outputjson.find(function(prop) {
                        return prop.faction_id === el.id;
                    });

                    el.systemscontrolled = factionobj.systems_controlled;
                    el.systemscontrolled_percent = Math.round(factionobj.systems_controlled / outputjsonsortedrev[0].systems_controlled * 100);
                    el.killsyesterday = factionobj.kills.yesterday;
                    el.killsyesterday_percent = Math.round(factionobj.kills.yesterday / outputjsonsortedrev[0].kills.yesterday * 100);
                });
            } catch(e) {
                console.log(e);
            }
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
                
                try {
                    var outputjson = jsonsafeparse(output);
                    resolve(outputjson.name);
                } catch(e) {
                    console.log(e);
                }
            });

        }).on('error', function(err) {
            let errormsg = new Error('Error getting name from ID');
            reject(errormsg);
        });
    });
};