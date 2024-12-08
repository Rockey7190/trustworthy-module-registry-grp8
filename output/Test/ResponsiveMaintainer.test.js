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
const ResponsiveMaintainer_1 = require("../Models/ResponsiveMaintainer");
describe('ResponsiveMaintainer', () => {
    let responsiveMaintainerGithub;
    let responsiveMaintainerNPM;
    beforeEach(() => {
        responsiveMaintainerGithub = new ResponsiveMaintainer_1.ResponsiveMaintainer('https://github.com/cloudinary/cloudinary_npm');
        responsiveMaintainerNPM = new ResponsiveMaintainer_1.ResponsiveMaintainer('https://www.npmjs.com/package/bootstrap');
    });
    describe('GitHub', () => {
        it('should calculate the ResponsiveMaintainer score', () => __awaiter(void 0, void 0, void 0, function* () {
            yield responsiveMaintainerGithub.calculateScoreGithub();
            (0, chai_1.expect)(responsiveMaintainerGithub.getScore()).to.be.within(0, 1);
        }));
        it('should calculate the latency for ResponsiveMaintainer', () => __awaiter(void 0, void 0, void 0, function* () {
            yield responsiveMaintainerGithub.calculateScoreGithub();
            (0, chai_1.expect)(responsiveMaintainerGithub.getLatency()).to.be.a('number');
        }));
        it('should have a calculateScoreGithub method', () => {
            (0, chai_1.expect)(responsiveMaintainerGithub.calculateScoreGithub).to.be.a('function');
        });
        it('should return a score between 0 and 1 after calculation', () => __awaiter(void 0, void 0, void 0, function* () {
            yield responsiveMaintainerGithub.calculateScoreGithub();
            const score = responsiveMaintainerGithub.getScore();
            (0, chai_1.expect)(score).to.be.a('number');
            (0, chai_1.expect)(score).to.be.at.least(0);
            (0, chai_1.expect)(score).to.be.at.most(1);
        }));
    });
    describe('NPM', () => {
        it('should calculate the ResponsiveMaintainer score for NPM', () => __awaiter(void 0, void 0, void 0, function* () {
            yield responsiveMaintainerNPM.calculateScoreNPM();
            (0, chai_1.expect)(responsiveMaintainerNPM.getScore()).to.be.within(0, 1);
        }));
        it('should calculate the latency for ResponsiveMaintainer NPM', () => __awaiter(void 0, void 0, void 0, function* () {
            yield responsiveMaintainerNPM.calculateScoreNPM();
            (0, chai_1.expect)(responsiveMaintainerNPM.getLatency()).to.be.a('number');
        }));
    });
}); // Added closing brace for the main describe block
