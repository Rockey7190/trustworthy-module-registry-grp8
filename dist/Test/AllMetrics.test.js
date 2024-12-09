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
const chai_1 = require("chai");
const AllMetrics_1 = require("../Models/AllMetrics");
describe('AllMetrics', () => {
    let allMetrics;
    jest.setTimeout(30000);
    beforeEach(() => {
        allMetrics = new AllMetrics_1.AllMetrics('https://github.com/cloudinary/cloudinary_npm');
    });
    it('should initialize all metrics', () => {
        (0, chai_1.expect)(allMetrics.metrics.length).to.equal(5);
    });
    it('should be an instance of AllMetrics', () => {
        (0, chai_1.expect)(allMetrics).to.be.an.instanceOf(AllMetrics_1.AllMetrics);
    });
    it('should calculate the score for all metrics', () => __awaiter(void 0, void 0, void 0, function* () {
        yield allMetrics.calculateNetScore();
        (0, chai_1.expect)(allMetrics.getNetScore()).to.be.within(0, 1);
    }));
    it('should calculate the latency for all metrics', () => __awaiter(void 0, void 0, void 0, function* () {
        yield allMetrics.calculateNetScore(); // Ensure the score is calculated before checking latency
        (0, chai_1.expect)(allMetrics.getNetScoreLatency()).to.be.a('number');
    }));
    it('should check the url type for github', () => {
        (0, chai_1.expect)(allMetrics.checkUrlType("https://github.com/cloudinary/cloudinary_npm")).to.equal('github');
    });
    it('should check the url type for npm', () => {
        (0, chai_1.expect)(allMetrics.checkUrlType("https://www.npmjs.com/package/bootstrap")).to.equal('npm');
    });
    it('should return null if the url is invalid', () => {
        (0, chai_1.expect)(allMetrics.checkUrlType("www.example.com")).to.equal('unknown');
    });
});
