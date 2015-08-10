var EventEmitter = require('events').EventEmitter;
var extend = require('xtend');
var debug = require('debug')('decorator');
var through = require('through');
var assert = require('assert');
var bl = require('bl');

var createStream = require('./iostreams');
var createFile = require('./file-device');

// returns a function that returns an EventEmitter
// that behaves somewhat similar to Node's child_process.ChildProcess.
// - name: name of the executable
var id = 0;
module.exports = function(name, _em, files) {
    files = files || [];

    var Module = {
        noFSInit: true,
        thisProgram: name,
        id: id++
    };

    return function() {
        debug('calling process with args', arguments);
        var fs_root;
        var ee = new EventEmitter();
        ee.stdin = bl();
        ee.stdout = through();
        ee.stderr = through();
        var myModule = extend(Module, {
            arguments: arguments,
            preRun: function() {
                debug('preRun called on module %d', myModule.id);
                debug('creating devices');
                createStream(myModule, '/dev', 'stdin', ee.stdin, null);
                createStream(myModule, '/dev', 'stdout', null, ee.stdout);
                createStream(myModule, '/dev', 'stderr', null, ee.stderr);

                files.forEach(function(file) {
                    createFile(myModule, file.parent, file.name, file.bl);
                });

                // open default streams for the stdin, stdout and stderr devices
                (function openStandardStreams(FS_open) {
                    var stdin = FS_open('/dev/stdin', 'r');
                    assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');

                    var stdout = FS_open('/dev/stdout', 'w');
                    assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');

                    var stderr = FS_open('/dev/stderr', 'w');
                    assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
                })(myModule.FS_open);
            },
            onExit: function(exitCode) {
                debug('exited module %d with code %d', myModule.id, exitCode);
                ee.stdout.push(null);
                ee.stderr.push(null);
                ee.emit('close', exitCode);
            },
        });
        process.nextTick(function(){
            _em(myModule);
        });
        return ee;
    };
};
