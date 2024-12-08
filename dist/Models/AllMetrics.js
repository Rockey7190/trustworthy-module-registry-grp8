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
exports.AllMetrics = void 0;
const BusFactor_1 = require("./BusFactor");
const Correctness_1 = require("./Correctness");
const ResponsiveMaintainer_1 = require("./ResponsiveMaintainer");
const RampUp_1 = require("./RampUp");
const License_1 = require("./License");
const DependencyPinningMetric_1 = require("./DependencyPinningMetric");
const CodeReviewMetric_1 = require("./CodeReviewMetric");
class AllMetrics {
    constructor(url) {
        // make an array of all metrics
        this.metrics = [];
        this.netScore = 0;
        this.netScoreLatency = 0;
        this.url = "";
        this.metrics.push(new BusFactor_1.BusFactor(url));
        this.metrics.push(new Correctness_1.Correctness(url));
        this.metrics.push(new ResponsiveMaintainer_1.ResponsiveMaintainer(url));
        this.metrics.push(new RampUp_1.RampUp(url));
        this.metrics.push(new License_1.License(url));
        this.metrics.push(new DependencyPinningMetric_1.DependencyPinningMetric(url));
        this.metrics.push(new CodeReviewMetric_1.CodeReviewMetric(url));
        this.url = url;
    }
    calculateNetScore() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.checkUrlType(this.url) === 'npm') {
                yield Promise.all(this.metrics.map(metric => metric.calculateScoreNPM()));
                this.metrics.forEach(metric => {
                    // console.log(metric.constructor.name);
                    // console.log("Score: " + metric.getScore());
                    // console.log("Weight: " + metric.weight);
                    this.netScore += metric.getScore() * metric.weight;
                    this.netScoreLatency += metric.getLatency();
                });
            }
            else {
                yield Promise.all(this.metrics.map(metric => metric.calculateScoreGithub()));
                this.metrics.forEach(metric => {
                    // console.log(metric.constructor.name);
                    // console.log("Score: " + metric.getScore());
                    // console.log("Weight: " + metric.weight);
                    this.netScore += metric.getScore() * metric.weight;
                    this.netScoreLatency += metric.getLatency();
                });
            }
            return this.netScore;
        });
    }
    getNetScoreLatency() {
        return this.netScoreLatency;
    }
    getNetScore() {
        return this.netScore;
    }
    checkUrlType(url) {
        const npmRegex = /^(https?:\/\/)?(www\.)?npmjs\.com/i;
        const githubRegex = /^(https?:\/\/)?(www\.)?github\.com/i;
        if (npmRegex.test(url)) {
            return 'npm';
        }
        else if (githubRegex.test(url)) {
            return 'github';
        }
        else {
            return 'unknown';
        }
    }
}
exports.AllMetrics = AllMetrics;
