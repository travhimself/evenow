$(document).ready( function() {

    // TIME
    // create a new moment
    var now = moment.utc();

    // update date and time
    var timehours = $('.time .hours span');
    var timeminutes = $('.time .minutes span');
    var timeseconds = $('.time .seconds span');
    var timemonth = $('.date .month span');
    var timedate = $('.date .date span');
    var timeyear = $('.date .year span');
    var rendertime = function() {
        now.add('s', 1);
        timehours.text( now.format('HH') );
        timeminutes.text( now.format('mm') );
        timeseconds.text( now.format('ss') );
        timemonth.text( now.format('MMM') );
        timedate.text( now.format('DD') );
        timeyear.text( now.format('YYYY') );
    };

    // set initial time
    rendertime();

    // update time every 1 second
    setInterval(rendertime, 1000);

    // VALIGN
    // set up calculations
    var container = $('.container');
    var clockheight;
    var windowheight;
    var offset;
    var verticalalign = function() {
        clockheight = container.height();
        windowheight = $(window).height();
        offset = (windowheight - clockheight) / 2;
        container.css('margin-top', offset + 'px');
    };
    verticalalign();

    // realign on window resize
    $(window).resize(function() {
        verticalalign();
    });

});