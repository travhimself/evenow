$(document).ready( function() {

    // set up socket.io connection
    var socket = io.connect('http://localhost:1111');

    // container vars
    var containernotification = $('.notifications');
    var containertimehours = $('.time .hours span');
    var containertimeminutes = $('.time .minutes span');
    var containertimeseconds = $('.time .seconds span');
    var containertimemonth = $('.date .month span');
    var containertimedate = $('.date .day span');
    var containertimeyear = $('.date .year span');
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

    // time
    // use system time as a default, in case time api fails...
    var now = moment.utc();

    $.ajax({
        url: 'http://timeapi.org/utc/now.json?callback=gettime',
        dataType: 'jsonp',
        success: function(data) {
            // ...reset time based on api response
            now = moment.utc(data.dateString)
        },
        error: function(data) {
            // error handling
        }
    });

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

    // display/update the data
    socket.on('updateall', function (data) {
        // notifications, if any exist
        if (Object.keys(data.notifications).length > 0) {
            containernotification.text('');
            containernotification.show();
            $.each(data.notifications, function(i, v) {
                containernotification.append(v + '<br>');
            });
        } else {
            containernotification.text('');
            containernotification.hide();
        };

        // API data
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

    // alternate themes
    $('.theme-select div').click( function(e) {
        $('body').attr('class', '');
        $('body').addClass($(this).attr('class'));
    })

});