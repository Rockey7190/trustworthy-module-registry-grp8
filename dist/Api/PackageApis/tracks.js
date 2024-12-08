"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// GET /tracks
router.get('/', (req, res) => {
    try {
        // List of planned tracks
        const plannedTracks = ["Access control track"];
        res.status(200).send({ plannedTracks });
    }
    catch (error) {
        console.error('Error retrieving tracks:', error.message || error);
        res.status(500).send({
            message: 'The system encountered an error while retrieving the student\'s track information.',
            error: error.message || 'Unknown error',
        });
    }
});
exports.default = router;
