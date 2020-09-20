Re-Readable Stream
--------------------

The module exposes a Writable stream that you can replay at any given moment to any number of Writable outputs. Think of
it as a DVR feature for Node.js streams - one stream can start playing, but others may want to join in at any given
point in time and start reading from the begining.

Usage:

```js
const {ReReadable} = require("rereadable-stream");

let rereadable = fs.createReadStream("myfile")
    .pipe(new ReReadable(options));

srv.on("connection", (sock) => sock.pipe(rereadable.rewind()));
```

The module exposes a simple API on as an extension a standard Writable stream:

 * tail(count) - the last number of stream chunks will be pushed and then rest of it.
 * rewind() - this will stream from the begining of the buffer.

The options are:

 * length - 1 million items as standard
 * standard Writable stream options

If one of readable stream cannot cope with the speed of other streams `drop` events will be emitted to inform about it.

```js
rewound.on("drop", (count) => console.log(`dropped ${count} items`));
```

**Notice:** For version 1.0.0 only object streams are well tested. There's no reason why buffer stream should not work, but they won't
follow any sensible limits. This will be fixed in 1.2.0.

License
--------

See LICENSE (MIT).

For other licensing options please open an issue or contact the author at opensource (at) signicode.com
