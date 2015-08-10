// createDevice from
// https://github.com/kripken/emscripten/blob/1.29.12/src/library_fs.js#L1461

var Path = require('path');
var ERRNO_CODES = require('./errno');
var debug = require('debug')('file-device');

module.exports = function createDevice(m, parent, name, bl) {
    var path = Path.join(typeof parent === 'string' ? parent : m.FS_getPath(parent), name);
    var mode = m.FS_getMode(true, true);
    if (!m.FS_createDevice.major) m.FS_createDevice.major = 64;
    var dev = m.FS_makedev(m.FS_createDevice.major++, 0);

    m.FS_registerDevice(dev, {
        open: function(stream) {
                  stream.seekable = true;
              },
        close: function(stream) {
               },
        read: function(stream, buffer, offset, length, pos) {
            debug('request to read %d bytes from pos %d', length, pos);
            debug('target buffer is %s', typeof buffer);
            // first try to read the desired amount of bytes
            var result = bl.slice(pos, pos + length);
            if (!Buffer.isBuffer(result) && result !== null) {
                debug('received non-buffer');
                throw new Error('must be buffer list');
            }
            if (result === null) {
                debug('return 0');
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
                   debug('writing %d bytes (at %d)', length, pos);
                   buffer = buffer.subarray(offset, offset+length);
                   buffer = new Buffer(buffer);
                   if (pos === bl.length) {
                       debug('appending to bl', buffer);
                       bl.append(buffer);
                   } else {
                       debug('NOT IMPLEMENTED');
                   }
                   if (length) {
                       stream.node.timestamp = Date.now();
                   }
                   return length;
               }
    });
    return m.FS_mkdev(path, mode, dev);
};
