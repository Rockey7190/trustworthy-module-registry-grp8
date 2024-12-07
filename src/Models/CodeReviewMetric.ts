import axios from 'axios';
import { Metric } from './Metric';

interface PullRequest {
    commits_url: string;
    merged_at: string | null;
    requested_reviewers: unknown[];
}

export class CodeReviewMetric extends Metric {
    public weight: number;

    constructor(url: string, weight: number = 1) {
        super(url);
        this.weight = weight;
    }

    async calculateScoreGithub(): Promise<void> {
        const repoPath = this.url.replace("https://github.com/", "");
        const headers = { Authorization: `Bearer ${this.token}` };
        const apiUrl = `https://api.github.com/repos/${repoPath}/pulls?state=all&per_page=100`;

        try {
            const response = await axios.get(apiUrl, { headers });
            const pullRequests: PullRequest[] = response.data;

            let totalCommits = 0;
            let reviewedCommits = 0;

            for (const pr of pullRequests) {
                // Fetch commit details for the pull request
                const commitsResponse = await axios.get(pr.commits_url, { headers });
                const commits = commitsResponse.data;

                totalCommits += commits.length;

                // Count only commits from PRs with reviews
                if (pr.merged_at && pr.requested_reviewers.length > 0) {
                    reviewedCommits += commits.length;
                }
            }

            this.score = totalCommits > 0 ? reviewedCommits / totalCommits : 1.0;
        } catch (error) {
            console.error("Error fetching commit data from GitHub:", (error as Error).message);
            this.score = 0.0;
        }
    }

    async calculateScoreNPM(): Promise<void> {
        throw new Error("NPM review metrics are not supported.");
    }

    getScore(): number {
        console.log(`Code Review Metric score for ${this.url}: ${this.score}`);
        return this.score;
    }
}
