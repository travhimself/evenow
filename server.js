var connect = require("connect");

// create a socket.io server on port 1111
var io = require("socket.io").listen(1111);

// set up a node server on port 8000 with the connect module
connect(connect.static(__dirname + "/")).listen(8000);

// listen for websocket connections from a client
io.sockets.on("connection", function (socket) {

    // listen for timeupdate event from the client
    socket.on("timeupdate", function (data) {
        var newtime = "TIME GOES HERE";

        // publish updatetime event with the new time
        socket.emit("updatetime", {time: newtime});
    });
});