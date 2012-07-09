// import the http module
var http = require('http');

// import util for working with paths
var path = require('path');

// import util for accessing the file system
var fs = require('fs');

// create the server
http.createServer(function (req, res) {

    // look for filename in the url, or if none exists, default to index.html
    var filename = path.basename(req.url) || 'index.html';
    var ext = path.extname(filename);
    var localpath = __dirname + "/";

    if (ext == '.html') {
        localpath += filename;

        // confirm file exists and serve, or return 404
        fs.exists(localpath, function (exists) {
            if (exists) {
                getFile(localpath, res);
            } else {
                res.writeHead(404);
                res.end();
            }
        });
    }

}).listen(8000, '127.0.0.1');

function getFile(localpath, res) {
    // read and return the file, or 500
    fs.readFile(localpath, function(err, contents) {
        if (!err) {
            res.end(contents);
        } else {
            res.writeHead(500);
            res.end();
        }
    });
}