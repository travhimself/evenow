$(document).ready( function() {

    // set up socket.io connection
    var socket = io.connect("http://localhost:1111");

    //////////////////////////////////////////////////////////////////
    // NOTIFICATIONS

    // warning container
    var warningcontainer = $(".warning");
    socket.on("notify", function (data) {
        warningcontainer.text(data);
        warningcontainer.css("visibility", "visible");
    });

    //////////////////////////////////////////////////////////////////
    // TIME

    // vars
    var now;
    var containertimehours = $('.time .hours span');
    var containertimeminutes = $('.time .minutes span');
    var containertimeseconds = $('.time .seconds span');
    var containertimemonth = $('.date .month span');
    var containertimedate = $('.date .day span');
    var containertimeyear = $('.date .year span');

    // listen for updatetime event from the server
    socket.on('updatetime', function (data) {
        // update the moment
        now = moment.utc(data.dateString);
    });

    // ask node server for initial time, then update every hour to stay synced
    var askfortimeupdate = function() {
        socket.emit('timeupdate');
    };
    askfortimeupdate();
    setInterval(askfortimeupdate, 3600000);

    // set date and time in the view
    var rendertime = function() {
        now.add('s', 1);
        containertimehours.text( now.format('HH') );
        containertimeminutes.text( now.format('mm') );
        containertimeseconds.text( now.format('ss') );
        containertimemonth.text( now.format('MMM') );
        containertimedate.text( now.format('DD') );
        containertimeyear.text( now.format('YYYY') );
    };
    setInterval(rendertime, 1000);

    //////////////////////////////////////////////////////////////////
    // TRANQUILITY SERVER STATUS

    // vars
    var tranquilitystatus;
    var playersonline;
    var containertranquilitystatus = $('.serverstatus .value');
    var containerplayersonline = $('.playersonline .value');

    // listen for updatetranquility event from the server
    socket.on('updatetranquility', function (data) {
        // update the server status and player count
        if ( data.result.serverOpen == 'True' ) {
            tranquilitystatus = 'Online';
        } else {
            tranquilitystatus = 'Offline';
        }
        playersonline = data.result.onlinePlayers;
        rendertranquilitystatus();
    });

    // ask node server for initial server satus, then update every 10 minutes
    var askforserverupdate = function() {
        socket.emit('tranquilityupdate');
    };
    askforserverupdate();
    setInterval(askforserverupdate, 300000);

    // set server status and player count in the view
    var rendertranquilitystatus = function() {
        containertranquilitystatus.text(tranquilitystatus);
        containerplayersonline.text(playersonline).digits();
    };

    //////////////////////////////////////////////////////////////////
    // KILL COUNTS

    // vars
    var systemsarray;
    var totalkills = 0;
    var mostkillssystem;
    var mostkillssystemid;
    var mostkillscount = 0;
    var containertotalkills = $('.kills .value');
    var containermostkillssystem = $('.mostkillssystem .value');
    var containermostkillssystemcount = $('.mostkillssystemcount .value');
    var containermostkillssystemlabel = $('.mostkillssystemcount .label span');

    // listen for updatekillcount event from the server
    socket.on('updatekillcount', function (data) {
        // reset totalkills var
        totalkills = 0;

        // count kills
        systemsarray = data.result.rowset.row;
        $.each(systemsarray, function(i, v) {
            // total kills
            totalkills += parseInt(systemsarray[i]['@'].shipKills);

            // system with most kills
            if (parseInt(systemsarray[i]['@'].shipKills) >= mostkillscount) {
                mostkillscount = parseInt(systemsarray[i]['@'].shipKills);
                mostkillssystemid = systemsarray[i]['@'].solarSystemID;
            }
        });
        askforsystemname(mostkillssystemid);
        renderkillcount();
    });

    // listen for system name lookup from the server
    socket.on('lookupsystemname', function (data) {
        mostkillssystem = data.result.rowset.row['@']['name'];
        rendersystemname();
    });

    // ask node server to lookup system name by ID
    var askforsystemname = function (systemid) {
        socket.emit('systemnamelookup', systemid);
    };

    // ask node server for initial kill count, then update every 10 minutes
    var askforkillcountupdate = function() {
        socket.emit('killcountupdate');
    };
    askforkillcountupdate();
    setInterval(askforkillcountupdate, 300000);

    // set kill info in the view
    var renderkillcount = function() {
        containertotalkills.text(totalkills).digits();
        containermostkillssystemcount.text(mostkillscount);
    };

    // set the system kill info in the view
    var rendersystemname = function() {
        containermostkillssystem.text(mostkillssystem);
        containermostkillssystemlabel.text(mostkillssystem);
    };

    //////////////////////////////////////////////////////////////////
    // MARKET DATA

    // vars
    var pricetritanium;
    var priceisogen;
    var pricemegacyte;
    var pricetechnetium;
    var priceliquidozone;
    var pricedrake;
    var containertritanium = $('.price.tritanium .value');
    var containerisogen = $('.price.isogen .value');
    var containermegacyte = $('.price.megacyte .value');
    var containertechnetium = $('.price.technetium .value');
    var containerliquidozone = $('.price.liquidozone .value');
    var containerdrake = $('.price.drake .value');

    // listen for updatemarketdata event from the server
    socket.on('updatemarketdata', function (data) {
        // update the market data
        pricetritanium = data.marketstat.type[0].sell.avg;
        priceisogen = data.marketstat.type[1].sell.avg;
        pricemegacyte = data.marketstat.type[2].sell.avg;
        pricetechnetium = data.marketstat.type[3].sell.avg;
        priceliquidozone = data.marketstat.type[4].sell.avg;
        pricedrake = data.marketstat.type[5].sell.avg;
        rendermarketdata();
    });

    // ask node server for initial market data, then update every 10 minutes
    var askformarketdataupdate = function() {
        socket.emit('marketdataupdate');
    };
    askformarketdataupdate();
    setInterval(askformarketdataupdate, 300000);

    // set market data in the view
    var rendermarketdata = function() {
        containertritanium.text(pricetritanium).digits();
        containerisogen.text(priceisogen).digits();
        containermegacyte.text(pricemegacyte).digits();
        containertechnetium.text(pricetechnetium).digits();
        containerliquidozone.text(priceliquidozone).digits();
        containerdrake.text(pricedrake).digits();
    };

});