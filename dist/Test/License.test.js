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
const License_1 = require("../Models/License");
describe('License', () => {
    let licenseGithub;
    let licenseNPM;
    jest.setTimeout(15000);
    beforeEach(() => {
        licenseGithub = new License_1.License('https://github.com/cloudinary/cloudinary_npm');
        licenseNPM = new License_1.License('https://www.npmjs.com/package/bootstrap');
    });
    // GitHub License Tests
    describe('GitHub', () => {
        it('should calculate the License score', () => __awaiter(void 0, void 0, void 0, function* () {
            yield licenseGithub.calculateScoreGithub();
            (0, chai_1.expect)(licenseGithub.getScore()).to.be.within(0, 1);
        }));
        it('should calculate the latency for License', () => __awaiter(void 0, void 0, void 0, function* () {
            yield licenseGithub.calculateScoreGithub();
            (0, chai_1.expect)(licenseGithub.getLatency()).to.be.a('number');
        }));
        it('should have a calculateScoreGithub method', () => {
            (0, chai_1.expect)(licenseGithub.calculateScoreGithub).to.be.a('function');
        });
        it('should return a score between 0 and 1 after calculation', () => __awaiter(void 0, void 0, void 0, function* () {
            yield licenseGithub.calculateScoreGithub();
            const score = licenseGithub.getScore();
            (0, chai_1.expect)(score).to.be.a('number');
            (0, chai_1.expect)(score).to.be.at.least(0);
            (0, chai_1.expect)(score).to.be.at.most(1);
        }));
        it('should list files in the GitHub repository', () => __awaiter(void 0, void 0, void 0, function* () {
            const files = yield licenseGithub.listRepoFiles('cloudinary', 'cloudinary_npm');
            (0, chai_1.expect)(files).to.be.an('array');
            (0, chai_1.expect)(files.length).to.be.greaterThan(0);
        }));
        it('should return an empty array if the GitHub repository does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
            const files = yield licenseGithub.listRepoFiles('invalid-owner', 'invalid-repo');
            (0, chai_1.expect)(files).to.be.an('array').that.is.empty;
        }));
        it('should get a specific file from the GitHub repository', () => __awaiter(void 0, void 0, void 0, function* () {
            const fileData = yield licenseGithub.getFile('cloudinary', 'cloudinary_npm', 'README.md');
            (0, chai_1.expect)(fileData).to.have.property('content');
        }));
        it('should return null for a non-existent file in the GitHub repository', () => __awaiter(void 0, void 0, void 0, function* () {
            const fileData = yield licenseGithub.getFile('cloudinary', 'cloudinary_npm', 'non-existent-file.txt');
            (0, chai_1.expect)(fileData).to.be.null;
        }));
        it('should decode a base64 string to utf-8', () => {
            const encoded = Buffer.from('Hello, World!').toString('base64');
            const decoded = licenseGithub.decodeFile(encoded);
            (0, chai_1.expect)(decoded).to.equal('Hello, World!');
        });
        it('should parse the license field from a package.json string', () => {
            const jsonString = JSON.stringify({ license: 'MIT' });
            const licenseType = licenseGithub.parseJSON(jsonString);
            (0, chai_1.expect)(licenseType).to.equal('MIT');
        });
        it('should return null for an invalid JSON string', () => {
            const invalidJSONString = "{ license: 'MIT'";
            const licenseType = licenseGithub.parseJSON(invalidJSONString);
            (0, chai_1.expect)(licenseType).to.be.null;
        });
        it('should identify an MIT license in a file content', () => {
            const licenseContent = 'Permission is hereby granted... MIT License...';
            const licenseType = licenseGithub.parseFile(licenseContent);
            (0, chai_1.expect)(licenseType).to.equal('MIT');
        });
        it('should return null if no known license is found in the file content', () => {
            const licenseContent = 'Some random text without a license mention';
            const licenseType = licenseGithub.parseFile(licenseContent);
            (0, chai_1.expect)(licenseType).to.be.null;
        });
        it('should find a valid license from the GitHub repository', () => __awaiter(void 0, void 0, void 0, function* () {
            const licenseType = yield licenseGithub.findLicense('cloudinary', 'cloudinary_npm');
            (0, chai_1.expect)(licenseType).to.be.a('string');
        }));
    });
    // NPM License Tests
    describe('NPM', () => {
        it('should calculate the License score for NPM', () => __awaiter(void 0, void 0, void 0, function* () {
            yield licenseNPM.calculateScoreNPM();
            (0, chai_1.expect)(licenseNPM.getScore()).to.be.within(0, 1);
        }));
        it('should calculate the latency for License NPM', () => __awaiter(void 0, void 0, void 0, function* () {
            yield licenseNPM.calculateScoreNPM();
            (0, chai_1.expect)(licenseNPM.getLatency()).to.be.a('number');
        }));
        it('should have a calculateScoreNPM method', () => {
            (0, chai_1.expect)(licenseNPM.calculateScoreNPM).to.be.a('function');
        });
        it('should return a score between 0 and 1 after NPM calculation', () => __awaiter(void 0, void 0, void 0, function* () {
            yield licenseNPM.calculateScoreNPM();
            const score = licenseNPM.getScore();
            (0, chai_1.expect)(score).to.be.a('number');
            (0, chai_1.expect)(score).to.be.at.least(0);
            (0, chai_1.expect)(score).to.be.at.most(1);
        }));
        it('should find a valid license from the NPM package metadata', () => __awaiter(void 0, void 0, void 0, function* () {
            const licenseType = yield licenseNPM.findNPMLicense();
            (0, chai_1.expect)(licenseType).to.be.a('string');
        }));
    });
    // License Rating Tests
    describe('License Rating', () => {
        it('should return a score of 1.0 for MIT, LGPL, or BSD licenses', () => {
            (0, chai_1.expect)(licenseGithub.rateLicense('MIT')).to.equal(1.0);
            (0, chai_1.expect)(licenseGithub.rateLicense('LGPL')).to.equal(1.0);
            (0, chai_1.expect)(licenseGithub.rateLicense('BSD')).to.equal(1.0);
        });
        it('should return a score of 0.5 for Apache licenses', () => {
            (0, chai_1.expect)(licenseGithub.rateLicense('APACHE')).to.equal(0.5);
            (0, chai_1.expect)(licenseGithub.rateLicense('APACHE-2.0')).to.equal(0.5);
        });
        it('should return a score of 0.2 for GPL licenses', () => {
            (0, chai_1.expect)(licenseGithub.rateLicense('GPL')).to.equal(0.2);
        });
        it('should return a score of 0 for unknown licenses', () => {
            (0, chai_1.expect)(licenseGithub.rateLicense('Unknown')).to.equal(0);
        });
    });
    // General Tests
    it('should be an instance of License', () => {
        (0, chai_1.expect)(licenseGithub).to.be.an.instanceOf(License_1.License);
        (0, chai_1.expect)(licenseNPM).to.be.an.instanceOf(License_1.License);
    });
});
