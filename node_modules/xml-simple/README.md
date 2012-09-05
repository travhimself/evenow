# Install

    npm install

# Use

    var XML = require('xml-simple');
    XML.parse("<p><b>XML</b></p>", function(e,parsed) { console.log(parsed) })
    > { b: 'XML' }

# More, Bug Reports?

Go to [xml2js][1]. This is just a simple wrapper to avoid the event emitter syntax for simple transforms.

[1]: https://github.com/Leonidas-from-XIV/node-xml2js