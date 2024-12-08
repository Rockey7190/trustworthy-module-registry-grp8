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
exports.Correctness = void 0;
const Metric_1 = require("./Metric");
const node_fetch_1 = __importDefault(require("node-fetch"));
class Correctness extends Metric_1.Metric {
    constructor(url) {
        super(url);
        this.weight = 0.15;
        this.packageName = '';
        this.owner = '';
        this.repo = '';
        if (url.includes('github.com')) {
            // generic github url is: https://github.com/owner/repo
            const parts = url.split('/');
            this.owner = parts[3];
            this.repo = parts[4];
        }
        else if (url.includes('npmjs.com')) {
            // generic npmjs url is: https://npmjs.com/package/{packageName}
            const parts = url.split('/');
            this.packageName = parts[4];
        }
    }
    // Calculate score based on GitHub test results
    calculateScoreGithub() {
        return __awaiter(this, void 0, void 0, function* () {
            const start = performance.now();
            const testSuccessRate = (yield this.getGithubActionTestSuccessRate()) || 0;
            this.score = testSuccessRate;
            const end = performance.now();
            this.latency = end - start;
        });
    }
    // Helper method to fetch test success rate from GitHub Actions API
    getGithubActionTestSuccessRate() {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log("Owner: ", this.owner);
            // console.log("Repo: ", this.repo);
            const githubUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/actions/runs`;
            try {
                const response = yield (0, node_fetch_1.default)(githubUrl, {
                    headers: {
                        Authorization: `token ${this.token}`, // Ensure the token is valid
                    },
                });
                // Check for non-success HTTP status
                if (!response.ok) {
                    console.error(`GitHub API responded with status: ${response.status}`);
                    return 0; // Return 0 if there's an error
                }
                const data = yield response.json();
                // Log the full data to understand its structure
                //console.log("GitHub API response data:", data);
                // Ensure workflow_runs is defined and is an array
                const runs = data.workflow_runs;
                if (!runs || !Array.isArray(runs)) {
                    console.log("No workflow runs found or invalid response structure.");
                    return 0;
                }
                //console.log("Runs: ", runs);
                if (runs.length === 0) {
                    return 0; // No test runs found
                }
                const successRuns = runs.filter((run) => run.conclusion === 'success').length;
                console.log(`Success runs: ${successRuns}, Total runs: ${runs.length}`);
                const successRate = successRuns / runs.length;
                return successRate;
            }
            catch (error) {
                console.error("Error fetching test results from GitHub Actions:", error);
                return 0; // Return 0 if the request fails
            }
        });
    }
    // Fetch GitHub URL from the NPM registry and calculate score based on that URL
    calculateScoreNPM() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const start = performance.now();
            const npmUrl = `https://registry.npmjs.org/${this.packageName}`;
            try {
                const response = yield (0, node_fetch_1.default)(npmUrl);
                const data = yield response.json();
                // Extract the GitHub URL from the NPM metadata
                const repositoryUrl = (_a = data.repository) === null || _a === void 0 ? void 0 : _a.url;
                if (repositoryUrl && repositoryUrl.includes('github.com')) {
                    // Ensure that the URL is in a proper format (strip any "git+" or ".git" suffixes)
                    const githubUrl = repositoryUrl.replace(/^git\+/, '').replace(/\.git$/, '');
                    // Update the class property `url` with the GitHub URL
                    this.url = githubUrl;
                    // generic npmjs url is: https://npmjs.com/package/{packageName}
                    const parts = this.url.split('/');
                    this.owner = parts[3];
                    this.repo = parts[4];
                    // Call the GitHub score calculation method
                    yield this.calculateScoreGithub();
                }
                else {
                    console.log("GitHub repository URL not found for this package.");
                    this.score = 0; // Set score to 0 if no GitHub URL is found
                }
            }
            catch (error) {
                console.log("Error fetching package info from NPM:", error);
                this.score = 0; // Set score to 0 if the request
            }
            const end = performance.now();
            this.latency = end - start;
        });
    }
}
exports.Correctness = Correctness;
