import axios from 'axios';
import { Metric } from './Metric';

export class DependencyPinningMetric extends Metric {
    public weight: number;

    constructor(url: string, weight: number = 1) {
        super(url);
        this.weight = weight;
    }

    async calculateScoreGithub(): Promise<void> {
        const dependencies = await this.fetchDependenciesFromGithub();

        if (dependencies.length === 0) {
            this.score = 1.0; // No dependencies mean a perfect score.
            return;
        }

        const pinnedCount = dependencies.filter((dep) => this.isPinned(dep)).length;
        this.score = pinnedCount / dependencies.length;
    }

    async calculateScoreNPM(): Promise<void> {
        const dependencies = await this.fetchDependenciesFromNpm();

        if (dependencies.length === 0) {
            this.score = 1.0; // No dependencies mean a perfect score.
            return;
        }

        const pinnedCount = dependencies.filter((dep) => this.isPinned(dep)).length;
        this.score = pinnedCount / dependencies.length;
    }

    private async fetchDependenciesFromGithub(): Promise<string[]> {
        try {
            const repoPath = this.url.replace("https://github.com/", "");
            const apiUrl = `https://api.github.com/repos/${repoPath}/contents/package.json`;
            const headers = { Authorization: `Bearer ${this.token}` };

            const response = await axios.get(apiUrl, { headers });
            const packageJson = Buffer.from(response.data.content, 'base64').toString('utf-8');
            const parsedPackageJson = JSON.parse(packageJson);

            return Object.keys(parsedPackageJson.dependencies || {});
        } catch (error) {
            console.error("Error fetching dependencies from GitHub:", (error as Error).message);
            return [];
        }
    }

    private async fetchDependenciesFromNpm(): Promise<string[]> {
        try {
            const response = await axios.get(`${this.url}/package.json`);
            const packageJson = response.data;

            return Object.keys(packageJson.dependencies || {});
        } catch (error) {
            console.error("Error fetching dependencies from npm:", (error as Error).message);
            return [];
        }
    }

    private isPinned(dependency: string): boolean {
        // Example of version pinning check: "2.3.x", "^2.3.0", etc.
        const versionRegex = /^\d+\.\d+/; // Matches a major.minor version
        const version = dependency.split('@')[1]; // Extract version if formatted as "name@version"

        return versionRegex.test(version || '');
    }

    getScore(): number {
        console.log(`Score for URL ${this.url}: ${this.score}`);
        return this.score;
    }
}
