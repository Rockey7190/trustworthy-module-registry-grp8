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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyPinningMetric = void 0;
const axios_1 = __importDefault(require("axios"));
const Metric_1 = require("./Metric");
class DependencyPinningMetric extends Metric_1.Metric {
    constructor(url, weight = 1) {
        super(url);
        this.weight = weight;
    }
    calculateScoreGithub() {
        return __awaiter(this, void 0, void 0, function* () {
            const dependencies = yield this.fetchDependenciesFromGithub();
            if (dependencies.length === 0) {
                this.score = 1.0; // No dependencies mean a perfect score.
                return;
            }
            const pinnedCount = dependencies.filter((dep) => this.isPinned(dep)).length;
            this.score = pinnedCount / dependencies.length;
        });
    }
    calculateScoreNPM() {
        return __awaiter(this, void 0, void 0, function* () {
            const dependencies = yield this.fetchDependenciesFromNpm();
            if (dependencies.length === 0) {
                this.score = 1.0; // No dependencies mean a perfect score.
                return;
            }
            const pinnedCount = dependencies.filter((dep) => this.isPinned(dep)).length;
            this.score = pinnedCount / dependencies.length;
        });
    }
    fetchDependenciesFromGithub() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const repoPath = this.url.replace("https://github.com/", "");
                const apiUrl = `https://api.github.com/repos/${repoPath}/contents/package.json`;
                const headers = { Authorization: `Bearer ${this.token}` };
                const response = yield axios_1.default.get(apiUrl, { headers });
                const packageJson = Buffer.from(response.data.content, 'base64').toString('utf-8');
                const parsedPackageJson = JSON.parse(packageJson);
                return Object.keys(parsedPackageJson.dependencies || {});
            }
            catch (error) {
                console.error("Error fetching dependencies from GitHub:", error.message);
                return [];
            }
        });
    }
    fetchDependenciesFromNpm() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`${this.url}/package.json`);
                const packageJson = response.data;
                return Object.keys(packageJson.dependencies || {});
            }
            catch (error) {
                console.error("Error fetching dependencies from npm:", error.message);
                return [];
            }
        });
    }
    isPinned(dependency) {
        // Example of version pinning check: "2.3.x", "^2.3.0", etc.
        const versionRegex = /^\d+\.\d+/; // Matches a major.minor version
        const version = dependency.split('@')[1]; // Extract version if formatted as "name@version"
        return versionRegex.test(version || '');
    }
    getScore() {
        console.log(`Score for URL ${this.url}: ${this.score}`);
        return this.score;
    }
}
exports.DependencyPinningMetric = DependencyPinningMetric;
