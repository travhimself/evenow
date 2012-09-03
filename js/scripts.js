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
        containerplayersonline.text(playersonline);
    };

    //////////////////////////////////////////////////////////////////
    // KILL COUNTS    

    // vars
    var totalkills;
    var mostkills;
    var containertotalkills = $('.kills .value');
    var containermostkills = $('.killssystem .value');

    // listen for updatetranquility event from the server
    socket.on('updatekillcounts', function (data) {
        // update the server status and player count
        // playersonline = data.result.onlinePlayers;
        // renderkillcounts();
    });

    // ask node server for initial server satus, then update every 10 minutes
    var askforkillcountsupdate = function() {
        socket.emit('killcountsupdate');
    };
    askforkillcountsupdate();
    setInterval(askforkillcountsupdate, 300000);

    // set server status and player count in the view
    var renderkillcounts = function() {
        // containertranquilitystatus.text(tranquilitystatus);
        // containerplayersonline.text(playersonline);
    };

});