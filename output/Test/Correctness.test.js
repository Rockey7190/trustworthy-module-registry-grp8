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
const Correctness_1 = require("../Models/Correctness");
describe('Correctness', () => {
    let correctnessGithub;
    let correctnessNPM;
    beforeEach(() => {
        correctnessGithub = new Correctness_1.Correctness('https://github.com/cloudinary/cloudinary_npm');
        correctnessNPM = new Correctness_1.Correctness('https://www.npmjs.com/package/bootstrap');
    });
    describe('GitHub', () => {
        it('should calculate the Correctness score', () => __awaiter(void 0, void 0, void 0, function* () {
            yield correctnessGithub.calculateScoreGithub();
            (0, chai_1.expect)(correctnessGithub.getScore()).to.be.within(0, 1);
        }));
        it('should calculate the latency for Correctness', () => __awaiter(void 0, void 0, void 0, function* () {
            yield correctnessGithub.calculateScoreGithub();
            (0, chai_1.expect)(correctnessGithub.getLatency()).to.be.a('number');
        }));
        it('should have a calculateScoreGithub method', () => {
            (0, chai_1.expect)(correctnessGithub.calculateScoreGithub).to.be.a('function');
        });
        it('should return a score between 0 and 1 after calculation', () => __awaiter(void 0, void 0, void 0, function* () {
            yield correctnessGithub.calculateScoreGithub();
            const score = correctnessGithub.getScore();
            (0, chai_1.expect)(score).to.be.a('number');
            (0, chai_1.expect)(score).to.be.at.least(0);
            (0, chai_1.expect)(score).to.be.at.most(1);
        }));
    });
    describe('NPM', () => {
        it('should calculate the Correctness score for NPM', () => __awaiter(void 0, void 0, void 0, function* () {
            yield correctnessNPM.calculateScoreNPM();
            (0, chai_1.expect)(correctnessNPM.getScore()).to.be.within(0, 1);
        }));
        it('should calculate the latency for Correctness NPM', () => __awaiter(void 0, void 0, void 0, function* () {
            yield correctnessNPM.calculateScoreNPM();
            (0, chai_1.expect)(correctnessNPM.getLatency()).to.be.a('number');
        }));
        it('should have a calculateScoreNPM method', () => {
            (0, chai_1.expect)(correctnessNPM.calculateScoreNPM).to.be.a('function');
        });
        it('should return a score between 0 and 1 after NPM calculation', () => __awaiter(void 0, void 0, void 0, function* () {
            yield correctnessNPM.calculateScoreNPM();
            const score = correctnessNPM.getScore();
            (0, chai_1.expect)(score).to.be.a('number');
            (0, chai_1.expect)(score).to.be.at.least(0);
            (0, chai_1.expect)(score).to.be.at.most(1);
        }));
    });
    it('should be an instance of Correctness', () => {
        (0, chai_1.expect)(correctnessGithub).to.be.an.instanceOf(Correctness_1.Correctness);
        (0, chai_1.expect)(correctnessNPM).to.be.an.instanceOf(Correctness_1.Correctness);
    });
});
