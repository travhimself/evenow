$(document).ready( function() {

    // TIME

    // set up socket.io connection
    var socket = io.connect("http://localhost:1111");

    // listen for updatetime event from the server
    socket.on("updatetime", function (data) {
        alert(data.time);
    });

    // ask node server for an updated time every x seconds
    var askfortimeupdate = socket.emit("timeupdate");
    setInterval(askfortimeupdate, 5000);

    // create a new moment
    // var now = moment.utc();

    // update date and time
    // var timehours = $('.time .hours span');
    // var timeminutes = $('.time .minutes span');
    // var timeseconds = $('.time .seconds span');
    // var timemonth = $('.date .month span');
    // var timedate = $('.date .day span');
    // var timeyear = $('.date .year span');
    // var rendertime = function() {
    //     now.add('s', 1);
    //     timehours.text( now.format('HH') );
    //     timeminutes.text( now.format('mm') );
    //     timeseconds.text( now.format('ss') );
    //     timemonth.text( now.format('MMM') );
    //     timedate.text( now.format('DD') );
    //     timeyear.text( now.format('YYYY') );
    // };

    // set initial time
    // rendertime();

    // update time every 1 second
    // setInterval(rendertime, 1000);










    //////////////////////////////////////////////////

    // dynamically scale type to fit containers
    // var scaletypeall = function() {
    //     $('.scaletype').each( function(i) {
    //         $(this).typescale();
    //     });
    // };
    
    // scaletypeall();

    // $(window).resize(function() {
    //     scaletypeall();
    // });

});