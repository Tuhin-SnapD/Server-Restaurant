const cors = require('cors');
const config = require('../config');

const whitelist = config.allowedOrigins;

const corsOptionsDelegate = (req, callback) => {
    const origin = req.header('Origin');
    // Requests without an Origin header (curl, server-to-server) are allowed.
    if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, { origin: true });
    } else {
        callback(null, { origin: false });
    }
};

exports.cors = cors({ origin: whitelist });
exports.corsWithOptions = cors(corsOptionsDelegate);
