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
const RampUp_1 = require("../Models/RampUp");
describe('RampUp', () => {
    let rampUpGithub;
    let rampUpNPM;
    beforeEach(() => {
        rampUpGithub = new RampUp_1.RampUp('https://github.com/cloudinary/cloudinary_npm');
        rampUpNPM = new RampUp_1.RampUp('https://www.npmjs.com/package/bootstrap');
    });
    describe('GitHub', () => {
        it('should calculate the RampUp score', () => __awaiter(void 0, void 0, void 0, function* () {
            yield rampUpGithub.calculateScoreGithub();
            (0, chai_1.expect)(rampUpGithub.getScore()).to.be.within(0, 1);
        }));
        it('should calculate the latency for RampUp', () => __awaiter(void 0, void 0, void 0, function* () {
            yield rampUpGithub.calculateScoreGithub();
            (0, chai_1.expect)(rampUpGithub.getLatency()).to.be.a('number');
        }));
        it('should return a score of 0 for an invalid GitHub URL', () => __awaiter(void 0, void 0, void 0, function* () {
            yield rampUpGithub.calculateScoreGithub();
            (0, chai_1.expect)(rampUpGithub.getScore()).to.be.within(0, 1);
        }));
        it('should return null if unable to fetch repository files', () => __awaiter(void 0, void 0, void 0, function* () {
            const repoFiles = yield rampUpGithub.listRepoFiles();
            (0, chai_1.expect)(repoFiles).to.be.an('array');
        }));
        it('should return null if unable to fetch a README file', () => __awaiter(void 0, void 0, void 0, function* () {
            const readme = new RampUp_1.RampUp('www.github.com');
            const readmeContent = yield readme.findREADME();
            (0, chai_1.expect)(readmeContent).to.equal('');
        }));
    });
    describe('NPM', () => {
        it('should calculate the RampUp score for NPM', () => __awaiter(void 0, void 0, void 0, function* () {
            yield rampUpNPM.calculateScoreNPM();
            (0, chai_1.expect)(rampUpNPM.getScore()).to.be.within(0, 1);
        }));
        it('should calculate the latency for RampUp NPM', () => __awaiter(void 0, void 0, void 0, function* () {
            yield rampUpNPM.calculateScoreNPM();
            (0, chai_1.expect)(rampUpNPM.getLatency()).to.be.a('number');
        }));
        it('should return a score of 0 when no README is found on NPM', () => __awaiter(void 0, void 0, void 0, function* () {
            yield rampUpNPM.calculateScoreNPM();
            // should be between 0 and 1
            (0, chai_1.expect)(rampUpNPM.getScore()).to.be.within(0, 1);
        }));
        it('should handle an NPM package without README gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            const readmeNPM = new RampUp_1.RampUp('www.github.com');
            const readmeContent = yield readmeNPM.findNPMREADME();
            (0, chai_1.expect)(readmeContent).to.equal('');
        }));
        it('should return a score of 0 for an invalid NPM package URL', () => __awaiter(void 0, void 0, void 0, function* () {
            yield rampUpNPM.calculateScoreNPM();
            (0, chai_1.expect)(rampUpNPM.getScore()).to.be.within(0, 1);
        }));
    });
    describe('General', () => {
        it('should be an instance of RampUp', () => {
            (0, chai_1.expect)(rampUpGithub).to.be.an.instanceOf(RampUp_1.RampUp);
            (0, chai_1.expect)(rampUpNPM).to.be.an.instanceOf(RampUp_1.RampUp);
        });
        it('should have a delay method', () => {
            (0, chai_1.expect)(rampUpGithub.delay).to.be.a('function');
        });
        it('should delay the process by a specified time', () => __awaiter(void 0, void 0, void 0, function* () {
            const start = Date.now();
            yield rampUpGithub.delay(1000);
            const end = Date.now();
            (0, chai_1.expect)(end - start).to.be.gte(1000);
        }));
        it('should handle OpenAI API response parsing failures gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Assuming the OpenAI API call returns a malformed JSON
            const invalidResponse = '{ ramp_up_score: }'; // Invalid JSON
            const parsedScore = yield rampUpGithub.rateREADME(invalidResponse);
            (0, chai_1.expect)(parsedScore).to.be.a('number');
        }));
    });
});
