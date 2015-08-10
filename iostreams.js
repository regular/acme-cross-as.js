// createDevice from
// https://github.com/kripken/emscripten/blob/1.29.12/src/library_fs.js#L1461

// in read() we probably have to sleep() to allow
// self.onmessage() to be called by the browser and thus
// receives data from outside the web worker
// https://github.com/kripken/emscripten/blob/1.29.12/src/library_browser.js#L747
var Path = require('path');
var ERRNO_CODES = require('./errno');
var debug = require('debug')('iostreams');

// input is a Readable stream in non-flow mode (see
// https://github.com/joyent/node/blob/v0.10/doc/api/stream.markdown)
// output is a writable stream.
module.exports = function createDevice(m, parent, name, input, output) {
    var path = Path.join(typeof parent === 'string' ? parent : m.FS_getPath(parent), name);
    var mode = m.FS_getMode(!!input, !!output);
    if (!m.FS_createDevice.major) m.FS_createDevice.major = 64;
    var dev = m.FS_makedev(m.FS_createDevice.major++, 0);

    m.FS_registerDevice(dev, {
        open: function(stream) {
                  stream.seekable = false;
                  if (input && !input.readable) {
                    throw new Error('input needs to be areadable stream');
                  }
                  if (output && !output.writable) {
                    throw new Error('output needs to be a writalbe stream');
                  }
              },
        close: function(stream) {
                   // flush any pending line data
                   if (output) {
                       output.emit('end');
                   }
               },
        read: function(stream, buffer, offset, length, pos /* ignored */) {
            debug('request to read %d bytes', length);
            debug('target buffer is %s', typeof buffer);
            // first try to read the desired amount of bytes
            var result = input.read(length);
            if (!Buffer.isBuffer(result) && result !== null) {
                debug('received non-buffer');
                throw new Error('stdin must be a binary stream in non-flowing mode');
            }
            if (result === null) {
                // get as much as we can
                result = input.read();
            }
            if (result === null) {
                debug('throwing EAGAIN');
                // try again later
                //throw new m.FS_ErrnoError(ERRNO_CODES.EAGAIN);
                return 0;
            }
            debug('copying %d bytes', result.length);
            if (ArrayBuffer.isView(result) && ArrayBuffer.isView(buffer) &&
                    result.BYTES_PER_ELEMENT === 1 &&  buffer.BYTES_PER_ELEMENT === 1)
            {
                debug('fast path');
                buffer.set(result, offset);
            } else {
                debug('slow path');
                for(var x=0, i=offset, l = offset + result.length; i<l; ++i, ++x) {
                    buffer[i] = result[x];
                }
            }
            stream.node.timestamp = Date.now();
            return result.length;
        },
        write: function(stream, buffer, offset, length, pos) {
                   debug('writing %d bytes (at %d, pos is ignored)', length, pos);
                   buffer = buffer.subarray(offset, offset+length);
                   buffer = new Buffer(buffer);
                   debug('pushing into outstream', buffer);
                    output.emit('data', buffer);
                   if (length) {
                       stream.node.timestamp = Date.now();
                   }
                   return length;
               }
    });
    return m.FS_mkdev(path, mode, dev);
};
