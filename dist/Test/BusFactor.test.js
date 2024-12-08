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
const BusFactor_1 = require("../Models/BusFactor");
describe('BusFactor', () => {
    it('should calculate the BusFactor score', () => __awaiter(void 0, void 0, void 0, function* () {
        const busFactor = new BusFactor_1.BusFactor('https://github.com/cloudinary/cloudinary_npm');
        yield busFactor.calculateScoreGithub();
        (0, chai_1.expect)(busFactor.getScore()).to.be.within(0, 1);
    }));
    it('should calculate the latency for BusFactor', () => __awaiter(void 0, void 0, void 0, function* () {
        const busFactor = new BusFactor_1.BusFactor('https://github.com/cloudinary/cloudinary_npm');
        yield busFactor.calculateScoreGithub();
        (0, chai_1.expect)(busFactor.getLatency()).to.be.a('number');
    }));
    it('should be an instance of BusFactor', () => {
        const busFactor = new BusFactor_1.BusFactor('https://github.com/cloudinary/cloudinary_npm');
        (0, chai_1.expect)(busFactor).to.be.an.instanceOf(BusFactor_1.BusFactor);
    });
});
