$(document).ready( function() {

    // set up socket.io connection
    var socket = io.connect("http://localhost:1111");

    // nofications

    // warning container
    var warningcontainer = $(".warning");
    socket.on("notify", function (data) {
        warningcontainer.text(data);
        warningcontainer.css("visibility", "visible");
    });

    // time

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
    // setInterval(rendertime, 1000);

    // display/update the data

    // container vars
    var containertranquilitystatus = $('.serverstatus .value');
    var containerplayersonline = $('.playersonline .value');
    var containertotalkills = $('.kills .value');
    var containermostkillssystem = $('.mostkillssystem .value');
    var containermostkillssystemcount = $('.mostkillssystemcount .value');
    var containermostkillssystemlabel = $('.mostkillssystemcount .label span');
    var containertritanium = $('.price.tritanium .value');
    var containerisogen = $('.price.isogen .value');
    var containermegacyte = $('.price.megacyte .value');
    var containertechnetium = $('.price.technetium .value');
    var containerliquidozone = $('.price.liquidozone .value');
    var containerdrake = $('.price.drake .value');

    socket.on('updateall', function (data) {
        // update the view and whatnot
        containertranquilitystatus.text(data.tranquilitystatus);
        containerplayersonline.text(data.playersonline).digits();
        containertotalkills.text(data.totalkills).digits();
        containermostkillssystem.text(data.mostkillssystem);
        containermostkillssystemcount.text(data.mostkillssystemcount).digits();
        containermostkillssystemlabel.text(data.mostkillssystem);
        containertritanium.text(data.pricetritanium).digits();
        containerisogen.text(data.priceisogen).digits();
        containermegacyte.text(data.pricemegacyte).digits();
        containertechnetium.text(data.pricetechnetium).digits();
        containerliquidozone.text(data.priceliquidozone).digits();
        containerdrake.text(data.pricedrake).digits();
    });

    // ask node server for current data, then update every 5 minutes
    var getnewdata = function() {
        socket.emit('getupdates');
    };
    getnewdata();
    setInterval(getnewdata, 300000);

});