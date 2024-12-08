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
exports.Package = void 0;
const AllMetrics_1 = require("./AllMetrics");
class Package {
    constructor(url) {
        this.url = "";
        this.url = url;
        this.packageMetrics = new AllMetrics_1.AllMetrics(url);
    }
    getMetrics() {
        return __awaiter(this, void 0, void 0, function* () {
            // return a json object of all the values of the metrics
            //async call to calculateNetScore
            yield Promise.all([this.packageMetrics.calculateNetScore()]);
            console.log("Getting Metrics");
            return {
                URL: this.url,
                NetScore: this.packageMetrics.getNetScore(),
                NetScore_Latency: this.packageMetrics.getNetScoreLatency(),
                //add other metrics
                BusFactor: this.packageMetrics.metrics[0].getScore(),
                BusFactor_Latency: this.packageMetrics.metrics[0].getLatency(),
                Correctness: this.packageMetrics.metrics[1].getScore(),
                Correctness_Latency: this.packageMetrics.metrics[1].getLatency(),
                ResponsiveMaintainer: this.packageMetrics.metrics[2].getScore(),
                ResponsiveMaintainer_Latency: this.packageMetrics.metrics[2].getLatency(),
                RampUp: this.packageMetrics.metrics[3].getScore(),
                RampUp_Latency: this.packageMetrics.metrics[3].getLatency(),
                License: this.packageMetrics.metrics[4].getScore(),
                License_Latency: this.packageMetrics.metrics[4].getLatency()
            };
        });
    }
}
exports.Package = Package;
