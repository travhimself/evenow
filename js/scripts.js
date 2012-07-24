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
    var timehours = $('.time .hours span');
    var timeminutes = $('.time .minutes span');
    var timeseconds = $('.time .seconds span');
    var timemonth = $('.date .month span');
    var timedate = $('.date .day span');
    var timeyear = $('.date .year span');

    // listen for updatetime event from the server
    socket.on("updatetime", function (data) {
        // update the moment
        now = moment.utc(data.dateString);
    });

    // ask node server for initial time, then update every hour to stay synced
    var askfortimeupdate = function() {
        socket.emit("timeupdate");
    };
    askfortimeupdate();
    setInterval(askfortimeupdate, 3600000);

    // set date and time in the view
    var rendertime = function() {
        now.add('s', 1);
        timehours.text( now.format('HH') );
        timeminutes.text( now.format('mm') );
        timeseconds.text( now.format('ss') );
        timemonth.text( now.format('MMM') );
        timedate.text( now.format('DD') );
        timeyear.text( now.format('YYYY') );
    };
    setInterval(rendertime, 1000);

    //////////////////////////////////////////////////////////////////
    // TRANQUILITY SERVER STATUS    

    // ask node server for initial status
    // socket.emit("tranquilityupdate");

    // listen for updatetranquility event from the server
    // socket.on("updatetranquility", function (data) {
        // update the server status
    //     console.log(data);
    // });

});