"use strict";
/* Rama Abuhijleh
* Name: Responsive Maintainer Metric
* Desc: calculate the average completion time for all the closed issues
To do so we subtract the Completion Date of the Issue with the Opened Date
*/
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
exports.ResponsiveMaintainer = void 0;
const Metric_1 = require("./Metric");
const axios_1 = __importDefault(require("axios"));
// Responsive Maintainer Metric Class for evaluating responsiveness based on GitHub issues and NPM package data.
class ResponsiveMaintainer extends Metric_1.Metric {
    constructor(url) {
        super(url); //pass null as the second argument
        // The weight was assigned
        this.weight = 0.25;
        this.owner = '';
        this.repo = '';
        this.packageName = '';
        // Determine if the provided URL corresponds to a GitHub repository or an NPM package
        if (url.includes('github.com')) {
            const parts = url.split('/');
            this.owner = parts[3];
            this.repo = parts[4];
        }
        else if (url.includes('npmjs.com')) {
            const parts = url.split('/');
            this.packageName = parts[4];
        }
    }
    getPackageName() {
        return this.packageName;
    }
    //PURPOSE: Fetch all closed issues from the GitHub repository using the GitHub API
    //EXPECTED OUTPUT: Returns a promise that resolves with the closed issues of the repository
    getClosedIssues(owner, repo) {
        const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=closed`;
        return axios_1.default.get(url, {
            headers: {
                'User-Agent': 'node.js',
                'Accept': 'application/vnd.github.v3+json',
            }
        })
            .then(response => response.data)
            .catch(error => {
            throw new Error(`Something went wrong! ${error.message}`);
        });
    }
    //Calculate the average time taken to close an issue in the repository
    //EXPECTED OUTPUT: Returns the average completion time in days as a number
    calculateAverageCompletionTime(owner, repo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const issues = yield this.getClosedIssues(owner, repo);
                let totalDays = 0;
                let count = 0;
                issues.forEach((issue) => {
                    const openedDate = new Date(issue.created_at); // Get the date when the issue was opened
                    const closedDate = new Date(issue.closed_at); // Get the date when the issue was closed
                    const completionTime = (closedDate.getTime() - openedDate.getTime()) / (1000 * 60 * 60 * 24); // Calculate time to close in days
                    totalDays += completionTime;
                    count++;
                });
                return count > 0 ? totalDays / count : 0;
            }
            catch (error) {
                console.error('Error fetching issues: ', error);
                return 0;
            }
        });
    }
    // Calculate a score for the repository based on the average time to close issues (GitHub-specific)
    calculateScoreGithub() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Calculating ResponsiveMaintainer for GitHub");
            const start = performance.now();
            const avgCompletionTime = yield this.calculateAverageCompletionTime(this.owner, this.repo);
            let score = 0; // Initialize score
            // Determine score based on average completion time
            if (avgCompletionTime === 0) {
                score = 0; // No score if no issues
            }
            else if (avgCompletionTime < 7) {
                score = 1.0; // Excellent responsiveness
            }
            else if (avgCompletionTime >= 7 && avgCompletionTime < 14) {
                score = 0.8; // Good responsiveness
            }
            else if (avgCompletionTime >= 14 && avgCompletionTime < 28) {
                score = 0.4; // Fair responsiveness
            }
            else {
                score = 0; // Poor responsiveness
            }
            this.score = score;
            const end = performance.now();
            this.latency = end - start;
        });
    }
    // Calculate the score for NPM packages based on GitHub issues' responsiveness
    calculateScoreNPM() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Calculating NPM ResponsiveMaintainer for NPM");
            const start = performance.now();
            try {
                // Fetch the NPM package metadata
                const npmUrl = `https://registry.npmjs.org/${this.packageName}`;
                const npmData = yield axios_1.default.get(npmUrl).then(response => response.data);
                // Extract GitHub repository details from the NPM metadata
                if (npmData.repository && npmData.repository.type === 'git' && npmData.repository.url.includes('github.com')) {
                    // Extract GitHub owner and repo from the repository URL
                    const repoUrl = npmData.repository.url.replace(/(^git\+|\.git$)/g, ''); // clean up git URL
                    const [owner, repo] = repoUrl.split('github.com/')[1].split('/');
                    // Calculate average completion time using GitHub data
                    const avgCompletionTime = yield this.calculateAverageCompletionTime(owner, repo);
                    // Calculate score based on average completion time (same logic as GitHub)
                    let score = 0;
                    if (avgCompletionTime === 0) {
                        score = 0;
                    }
                    else if (avgCompletionTime < 7) {
                        score = 1.0;
                    }
                    else if (avgCompletionTime >= 7 && avgCompletionTime < 14) {
                        score = 0.8;
                    }
                    else if (avgCompletionTime >= 14 && avgCompletionTime < 28) {
                        score = 0.4;
                    }
                    else {
                        score = 0;
                    }
                    this.score = score;
                }
                else {
                    // If no valid GitHub repository is found, assign a default low score
                    this.score = 0.1;
                }
            }
            catch (error) {
                console.error('Error calculating NPM score: ', error);
                this.score = 0.1; // Default score if there's an error or no GitHub repo
            }
            const end = performance.now();
            this.latency = end - start;
        });
    }
}
exports.ResponsiveMaintainer = ResponsiveMaintainer;
