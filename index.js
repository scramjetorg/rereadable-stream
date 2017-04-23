const {Writable, PassThrough} = require('stream');

class ReReadable extends Writable {

    constructor(options) {

        options = Object.assign({
            length: 1e3,
            dropInterval: 1e3,
            highWaterMark: 32
        }, options);

        super(options);

        this._highWaterMark = options.highWaterMark;
        this._bufArrLength = options.length;

        this.bufArr = [];
        this.hiBufCr = 0;
        this.loBufCr = 0;
        this._waiting = null;
    }

    _write(chunk, encoding, callback) {
        this.bufArr.push([chunk, encoding]);
        if (this.bufArr.length > this._bufArrLength) {
            this._waiting = callback;
            this.drop();
        } else {
            callback();
        }
    }

    _writev(chunks, callback) {
        this.bufArr.push(...chunks.map(({chunk, encoding}) => [chunk, encoding]));
        if (this.bufArr.length > this._bufArrLength) {
            this._waiting = callback;
            this.drop();
        } else {
            callback();
        }
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
        if (this.bufArr.length > this._bufArrLength) {
            const dropped = this._bufArrLength.splice(0, this.bufArr.length - this._bufArrLength).length;
            this.emit("drop", dropped);
        }
    }

    rewind() {
        return this.tail(-1);
    }

    tail(count) {
        const ret = new PassThrough({
            read: () => {
                while(
                    ret.bufCr < this.bufArr.length &&          // while there's anything to read
                    ret.push(...this.bufArr[ret.bufCr])        // and there's willing to read more
                ) {
                    ret.bufCr++;                               // go on.
                }

                this.updateBufPosition(ret.bufCr);
            }
        });

        ret.bufCr = count > 0 ? this.bufArr - count : 0;

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

module.exports = ReReadable;
