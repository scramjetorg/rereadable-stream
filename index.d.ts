import { Writable, WritableOptions, Readable } from "stream";

export class ReReadable extends Writable {
    constructor(options?: { length: number } & WritableOptions);
    public tail(count: number): Readable;
    public rewind(): Readable;
}
