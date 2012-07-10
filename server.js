// import the http module
var http = require('http');

// import util for working with paths
var path = require('path');

// import util for accessing the file system
var fs = require('fs');

extensions = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.less': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.jpg': 'image/jpeg',
    '.woff': 'font/woff'
};

// create the server
http.createServer(function (req, res) {

    // look for filename in the url, or if none exists, default to index.html
    var filename = path.basename(req.url) || 'index.html';
    var ext = path.extname(filename);
    var dir = path.dirname(req.url).substring(1);
    var localpath = __dirname + "/";

    if (extensions[ext]) { // this will either contain a mimetype or will be undefined, in which case it will jump out
        localpath += (dir ? dir + '/' : '') + filename;

        // confirm file exists and serve, or return 404
        fs.exists(localpath, function (exists) {
            if (exists) {
                getFile(localpath, extensions[ext], res);
            } else {
                res.writeHead(404);
                res.end();
            }
        });
    }

}).listen(8000, '127.0.0.1');

function getFile(localpath, mimetype, res) {
    // read and return the file, or 500
    fs.readFile(localpath, function(err, contents) {
        if (!err) {
            res.writeHead(200, {
                'Content-Type': mimetype,
                'Content-Length': contents.length
            });
            res.end(contents);
        } else {
            res.writeHead(500);
            res.end();
        }
    });
}