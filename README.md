# acme-cross-assembler.js
6502 assembler ported to JavaScript using emscripten.

_From [Acme's homepage](https://web.archive.org/web/20150520143433/https://www.esw-heim.tu-clausthal.de/~marco/smorbrod/acme/)_

> [ACME](https://web.archive.org/web/20150520143433/https://www.esw-heim.tu-clausthal.de/~marco/smorbrod/acme/) is a free crossassembler, released under the GNU General Public License. The current version can produce code for the 6502, 65c02 and 65816 processors. It also supports some of the undocumented ("illegal") opcodes of the 6502.

Acme was written by Marco Baye an is maintained by Krzysztof Dabrowski.

acme's source was taken from here:
https://www.mirrorservice.org/sites/ftp.cs.vu.nl/pub/minix/distfiles/backup/acme091src.tar.gz

## Install

    npm i acme-cross-assembler

## Usage

    var as = require('acme');
    var fs = require('fs');

    var source = fs.readFileSync(__dirname + '/../acme091/examples/ddrv.a', 'utf8');

    as(source, '--format', 'cbm', function(err, data, messages, parsedMessages) {
        ...
    });

See tests for details.
