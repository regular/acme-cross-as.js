var as = require('../acme');
var fs = require('fs');
var test = require('tape');
var source = fs.readFileSync(__dirname + '/../acme091/examples/ddrv.a', 'utf8');
var bc = fs.readFileSync(__dirname + '/../acme091/examples/ddrv64.exp');

test('nested calls should be possible', function(t) {
    as('\nSyntaxerror\n', function(err, data, messages, pm) {
        t.ok(err, 'should have error');
        t.notOk(data, 'should not have data');
        t.equal(pm.length, 1, 'should have one message');
        t.equal(pm[0].line, 2, 'at line 2');
        t.equal(pm[0].severity, 'error', 'of severity "error"');

        as(source, '--format', 'cbm', function(err, data, messages, parsedMessages) {
            t.notOk(err, 'should have no error');
            t.ok(data, 'should have data');
            t.equal(messages.length, 0, 'should have no messages');
            t.equal(parsedMessages.length, 0, 'should have no parsed messages');
            t.deepEqual(data, bc);
            t.end();
        });
    });
});
