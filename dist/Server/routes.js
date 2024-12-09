"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const metricsController_1 = require("./metricsController");
exports.router = (0, express_1.Router)();
exports.router.get('/metrics', metricsController_1.getMetrics);
