var fs     = require('fs')
  , xml2js = require('xml2js')
  , parser;

module.exports = { parse: 
  function parseXML(xml,callback) {
    parser = new xml2js.Parser();
    parser.addListener('end', function(result) { callback(null,result); });
    parser.addListener('error', function(err) { callback(err); });
    try { parser.parseString(xml); } catch(err) { callback(err); }
  } 
}