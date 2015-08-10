var _as = require('./lib/_acme');
var decorate = require('./decorate');
var split = require('split');
var through = require('through');
var bl = require('bl');
var debug = require('debug')('as');

// arguments between the first and the last
// are forwarded to the emscriptified process
module.exports = function(assembly, callback) {
    var args = Array.prototype.slice.call(arguments);
    callback = args[args.length-1];
    args = args.slice(1,args.length-1);
    debug('args', args);
    args = args.concat(['-o', '/dev/output', '/dev/input']);

    var messages = [];
    var parsedMessages = [];

    var input = bl();
    input.append(new Buffer(assembly, 'utf8'));

    var data = bl();

    var as = decorate('acme', _as, [
        { 
            parent: '/dev',
            name: 'input',
            bl: input
        }, {
            parent: '/dev',
            name: 'output',
            bl:  data
        }
    ]);

    as = as.apply(null, args); 
    as.on('close', function(exitCode) {
        var error = null;
        if (exitCode !== 0) {
            error = new Error('acme exited with code' + exitCode);
        }
        if (data.length===0) {
            data = null;
        } else {
            // turn bufferlist into Buffer
            data = data.slice();
        }
        callback(error, data, messages, parsedMessages);
    });
    as.stderr.pipe(split(/\r?\n/, null, {trailing: false})).pipe(through(function(text) {
        debug('line on stderr: %s', text);
        var m = text.match(/(\w+)\s-\sFile\s(.*),\sline\s(\d+).*:\s(.*)/);
        if (m) {
            parsedMessages.push({
                path: m[2],
                line: parseInt(m[3], 10),
                severity: m[1].toLowerCase(),
                text: m[4]
            });
        }
        messages.push(text);
    }));
};
