const {ReReadable} = require("../");
const {Readable} = require('stream');

module.exports = {
    test_highWaterMark(test) {
        const writableSide = new ReReadable({objectMode: true, length: 3, highWaterMark: 2});

        let n = 1;

        test.ok(writableSide.write(n++), "writeableSide.write encourages further writing on first write with highWaterMark=2");
        test.ok(writableSide.write(n++), "writeableSide.write encourages further writing on second write with highWaterMark=2");

        const rewound1 = writableSide.rewind();
        const rewound2 = writableSide.rewind();

        test.ok(rewound1 instanceof Readable, "Rewound should be a Readable stream");
        test.notEqual(rewound1, rewound2, "Rewound streams should not be equal");

        test.equals(rewound1.read(), 1, "Rewound1 should read chunk 1");
        test.equals(rewound2.read(), 1, "Rewound2 should read chunk 1 as well");

        test.equals(rewound1.read(), 2, "Rewound1 should read chunk 2");
        test.equals(rewound2.read(), 2, "Rewound2 should read chunk 2");

        while(writableSide.write(n)) n++;

        test.equals(n, 5, "Two items should be pushed to the stream");

        test.equals(rewound1.read(), 3, "Rewound1 should read chunk 3");
        test.equals(rewound1.read(), 4, "Rewound1 should read chunk 4");
        test.equals(rewound1.read(), 5, "Rewound1 should read chunk 5");
        test.equals(rewound1.read(), null, "Rewound1 should not read anything when writableSide is depleted");

        while(writableSide.write(n)) n++;

        test.equals(n, 7, "Three items read so three items wrote");

        test.done();
    }
};
