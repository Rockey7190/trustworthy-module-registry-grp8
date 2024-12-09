"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetrics = void 0;
const Package_1 = require("../Models/Package");
const getMetrics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { url } = req.query;
    // Print the type of url and version
    console.log('Type of URL:', typeof url);
    console.log('URL:', url);
    if (typeof url !== 'string' || !url) {
        res.status(400).json({ error: 'Invalid or missing URL in query parameters' });
        return;
    }
    try {
        const pkg = new Package_1.Package(url); // Assuming version is optional
        const metrics = yield pkg.getMetrics();
        // Send metrics as JSON
        res.json(metrics);
    }
    catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});
exports.getMetrics = getMetrics;
