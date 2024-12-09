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
exports.CodeReviewMetric = void 0;
const axios_1 = __importDefault(require("axios"));
const Metric_1 = require("./Metric");
class CodeReviewMetric extends Metric_1.Metric {
    constructor(url, weight = 1) {
        super(url);
        this.weight = weight;
    }
    calculateScoreGithub() {
        return __awaiter(this, void 0, void 0, function* () {
            const repoPath = this.url.replace("https://github.com/", "");
            const headers = { Authorization: `Bearer ${this.token}` };
            const apiUrl = `https://api.github.com/repos/${repoPath}/pulls?state=all&per_page=100`;
            try {
                const response = yield axios_1.default.get(apiUrl, { headers });
                const pullRequests = response.data;
                let totalCommits = 0;
                let reviewedCommits = 0;
                for (const pr of pullRequests) {
                    // Fetch commit details for the pull request
                    const commitsResponse = yield axios_1.default.get(pr.commits_url, { headers });
                    const commits = commitsResponse.data;
                    totalCommits += commits.length;
                    // Count only commits from PRs with reviews
                    if (pr.merged_at && pr.requested_reviewers.length > 0) {
                        reviewedCommits += commits.length;
                    }
                }
                this.score = totalCommits > 0 ? reviewedCommits / totalCommits : 1.0;
            }
            catch (error) {
                console.error("Error fetching commit data from GitHub:", error.message);
                this.score = 0.0;
            }
        });
    }
    calculateScoreNPM() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("NPM review metrics are not supported.");
        });
    }
    getScore() {
        console.log(`Code Review Metric score for ${this.url}: ${this.score}`);
        return this.score;
    }
}
exports.CodeReviewMetric = CodeReviewMetric;
