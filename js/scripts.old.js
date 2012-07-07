$(document).ready( function() {

    var momentdate;

    // grab the time from timeapi.org
    $.ajax({
        url: "http://www.timeapi.org/utc/now.json",
        dataType: "jsonp",
        crossDomain: true,
        success: function(data) {

            // create a moment object of the date
            momentdate = moment(data.dateString);

            // render date and time
            // $(".time .hour").text(parseddate.getMonth());
            // $(".time .minute").text(parseddate.getMonth());
            // $(".time .second").text(parseddate.getMonth());
            // $(".date .month").text(parseddate.getMonth() + 1);
            // $(".date .day").text(parseddate.getDate());
            // $(".date .year").text(parseddate.getFullYear());
        }
    });

});