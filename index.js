const {Writable, Readable} = require("stream");
const {EventEmitter} = require("events");

class ReReadable extends Writable {

    constructor(options) {

        options = Object.assign({
            length: 1048576,
            highWaterMark: 32,
            dropInterval: 1e3
        }, options);

        super(options);

        this._readableOptions = options;

        this._highWaterMark = options.highWaterMark;
        this._bufArrLength = options.length;

        this._reading = 0;
        this._bufArr = [];
        this.hiBufCr = 0;
        this.loBufCr = 0;
        this._waiting = null;
        this._ended = new Promise((res) => this.on("finish", res));

    }

    _write(chunk, encoding, callback) {
        this._bufArr.push([chunk, encoding]);
        if (this._bufArr.length > this._bufArrLength) {
            this._waiting = callback;
            this.drop();
        } else {
            callback();
        }
        this.emit("wrote");
    }

    _writev(chunks, callback) {
        this._bufArr.push(...chunks.map(({chunk, encoding}) => [chunk, encoding]));
        if (this._bufArr.length > this._bufArrLength) {
            this._waiting = callback;
            this.drop();
        } else {
            callback();
        }
        this.emit("wrote");
    }

    updateBufPosition(bufCr) {
        this.hiBufCr = bufCr > this.hiBufCr ? bufCr : this.hiBufCr;
        this.loBufCr = bufCr > this.loBufCr ? bufCr : this.loBufCr;
        if (this._waiting && this.hiBufCr >= this._bufArrLength - this._highWaterMark) {
            const cb = this._waiting;
            this._waiting = null;
            cb();
        }
    }

    drop() {
        if (this._bufArr.length > this._bufArrLength)
            this.emit("drop", this._bufArr.splice(0, this._bufArr.length - this._bufArrLength).length);
    }

    rewind() {
        return this.tail(-1);
    }

    tail(count) {
        let end = false;
        this._ended.then(() => ret._read(end = true));
        this.setMaxListeners(++this._reading + EventEmitter.defaultMaxListeners);

        const ret = new Readable(Object.assign(this._readableOptions, {
            read: () => {
                if (ret.bufCr < this._bufArr.length) {
                    while(ret.bufCr < this._bufArr.length) {                 // while there's anything to read
                        const resp = ret.push(...this._bufArr[ret.bufCr++]); // push to readable
                        if (!resp && !end) break;                            // until there's not willing to read and we're not ended
                    }
                    this.updateBufPosition(ret.bufCr);
                } else if (!end) {
                    this.once("wrote", ret._read);
                }

                if (end)
                    ret.push(null);
            }
        }));

        ret.bufCr = count < this._bufArr.length && count > 0 ? this._bufArr.length - count : 0;

        this.on("drop", (count) => {
            ret.bufCr -= count;
            if (ret.bufCr < 0) {
                ret.emit("drop", -ret.bufCr);
                ret.bufCr = 0;
            }
        });

        return ret;
    }
}

module.exports = {ReReadable};
