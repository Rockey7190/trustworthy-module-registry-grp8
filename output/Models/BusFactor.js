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
exports.BusFactor = void 0;
const Metric_1 = require("./Metric");
const query = `
query($owner: String!, $repo: String!, $cursor: String, $since: GitTimestamp!) {
  repository(owner: $owner, name: $repo) {
    defaultBranchRef {
      name
      target {
        ... on Commit {
          history(first: 100, after: $cursor, since: $since) {
            totalCount
            edges {
              node {
                author {
                  name
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    }
  }
}
`;
class BusFactor extends Metric_1.Metric {
    constructor(url) {
        super(url);
        this.weight = 0.25;
    }
    calculateScoreGithub() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Calculating BusFactor");
            const start = performance.now();
            const url_components = this.analyzeUrl(this.url);
            const result = yield this.fetchGithubData(url_components.owner, url_components.repo);
            const end = performance.now();
            this.latency = end - start;
            this.score = result;
        });
    }
    calculateScoreNPM() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Calculating BusFactor for NPM");
            const start = performance.now();
            const githubUrl = yield this.getGitHubUrl();
            console.log(githubUrl);
            if (githubUrl != null) {
                const url_components = this.analyzeUrl(githubUrl);
                const result = yield this.fetchGithubData(url_components.owner, url_components.repo);
                const end = performance.now();
                this.latency = end - start;
                this.score = result;
            }
            else {
                const end = performance.now();
                this.latency = end - start;
                this.score = 0;
            }
            // console.log(this.latency);
            // console.log(this.score);
        });
    }
    fetchGithubData(owner, repo) {
        return __awaiter(this, void 0, void 0, function* () {
            const commitCounts = {};
            let cursor = null;
            let hasNextPage = true;
            let totalCount = 0;
            let crucialContributors = 0;
            let totalContributors = 0;
            const url = 'https://api.github.com/graphql';
            const since = new Date();
            since.setMonth(since.getMonth() - 1);
            while (hasNextPage) {
                const response = yield fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.token}`,
                    },
                    body: JSON.stringify({ query, variables: { owner, repo, cursor, since: since.toISOString() } }), // Ensure matching variable names
                });
                const result = yield response.json();
                const data = result.data.repository.defaultBranchRef.target.history;
                data.edges.forEach((commit) => {
                    var _a;
                    const authorName = ((_a = commit.node.author) === null || _a === void 0 ? void 0 : _a.name) || "Unknown";
                    if (authorName) {
                        commitCounts[authorName] = (commitCounts[authorName] || 0) + 1;
                    }
                });
                hasNextPage = data.pageInfo.hasNextPage;
                cursor = data.pageInfo.endCursor;
                if (totalCount == 0) {
                    totalCount = result.data.repository.defaultBranchRef.target.history.totalCount;
                }
            }
            for (const key in commitCounts) {
                if (commitCounts[key] > 0.10 * (totalCount)) {
                    crucialContributors++;
                }
                totalContributors++;
            }
            if (crucialContributors == 0) {
                return 1;
            }
            const crucialnessValue = crucialContributors / totalContributors;
            return crucialnessValue;
        });
    }
    analyzeUrl(url) {
        const regex = /https?:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
        const match = url.match(regex);
        if (match) {
            return {
                owner: match[1], // First captured group (owner)
                repo: match[2], // Second captured group (repo)
            };
        }
        return null; // Return null if the URL format is incorrect
    }
    getGitHubUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            // Extract the package name from the URL
            const packageName = this.url.split('/').pop();
            // Fetch the package data from the npm registry
            const response = yield fetch(`https://registry.npmjs.org/${packageName}`);
            const data = yield response.json();
            const repository = data.repository;
            if (repository && repository.url) {
                let gitHubUrl = repository.url;
                // Handle 'git://' and 'git+https://' formats
                if (gitHubUrl.startsWith('git://')) {
                    gitHubUrl = gitHubUrl.replace('git://', 'https://');
                }
                else if (gitHubUrl.startsWith('git+https://')) {
                    gitHubUrl = gitHubUrl.replace('git+https://', 'https://');
                }
                // Remove any trailing '.git' if present
                gitHubUrl = gitHubUrl.replace(/\.git$/, '');
                return gitHubUrl;
            }
        });
    }
}
exports.BusFactor = BusFactor;
