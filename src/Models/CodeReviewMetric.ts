import axios from 'axios';

import { Metric } from './Metric'; // Assuming Metric is in a separate file named Metric.ts

export class CodeReviewMetric extends Metric {
    public weight: number;

    constructor(url: string, weight: number = 1) {
        super(url);
        this.weight = weight;
    }

    async calculateScoreGithub(): Promise<void> {
        const { totalCommits, reviewedCommits } = await this.fetchCommitData();
        if (totalCommits === 0) {
            this.score = 1.0; // No commits mean a perfect score.
            return;
        }

        this.score = reviewedCommits / totalCommits;
    }

    async calculateScoreNPM(): Promise<void> {
        throw new Error("This metric is not applicable to npm packages.");
    }

    private async fetchCommitData(): Promise<{ totalCommits: number; reviewedCommits: number }> {
        if (!this.url.includes("github.com")) {
            throw new Error("Unsupported URL format. This metric only supports GitHub repositories.");
        }

        try {
            const repoPath = this.url.replace("https://github.com/", "");
            const apiUrl = `https://api.github.com/repos/${repoPath}/pulls?state=closed&per_page=100`;
            const headers = { Authorization: `Bearer ${this.token}` };

            let page = 1;
            let totalCommits = 0;
            let reviewedCommits = 0;

            while (true) {
                const response = await axios.get(`${apiUrl}&page=${page}`, { headers });
                const pullRequests = response.data;

                if (pullRequests.length === 0) {
                    break;
                }

                for (const pr of pullRequests) {
                    if (pr.merged_at && pr.requested_reviewers.length > 0) {
                        const commitsUrl = pr.commits_url;
                        const commitsResponse = await axios.get(commitsUrl, { headers });
                        const commits = commitsResponse.data;
                        reviewedCommits += commits.length;
                    }
                }

                totalCommits += pullRequests.reduce((sum, pr) => sum + pr.commits, 0);
                page++;
            }

            return { totalCommits, reviewedCommits };
        } catch (error) {
            console.error("Error fetching commit data from GitHub:", error.message);
            return { totalCommits: 0, reviewedCommits: 0 };
        }
    }

    getScore(): number {
        console.log(`Score for URL ${this.url}: ${this.score}`);
        return this.score;
    }
}
