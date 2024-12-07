import * as dotenv from 'dotenv';
import axios from 'axios'

import { Metric } from './Metric';

export class DependencyPinningMetric extends Metric {
    public weight: number;

    constructor(url: string, weight: number = 1) {
        super(url);
        this.weight = weight;
    }

    /**
     * This method calculates the fraction of dependencies pinned
     * to at least a specific major+minor version for GitHub repositories.
     */
    calculateScoreGithub(): void {
        const dependencies = this.fetchDependencies(); // Example: Fetch dependencies for GitHub repo.
        if (dependencies.length === 0) {
            this.score = 1.0; // No dependencies means perfect score.
            return;
        }

        const pinnedCount = dependencies.filter((dep) => this.isPinned(dep)).length;
        this.score = pinnedCount / dependencies.length;
    }

    /**
     * This method calculates the fraction of dependencies pinned
     * to at least a specific major+minor version for NPM packages.
     */
    calculateScoreNPM(): void {
        const dependencies = this.fetchDependencies(); // Example: Fetch dependencies for NPM package.
        if (dependencies.length === 0) {
            this.score = 1.0; // No dependencies means perfect score.
            return;
        }

        const pinnedCount = dependencies.filter((dep) => this.isPinned(dep)).length;
        this.score = pinnedCount / dependencies.length;
    }

    /**
     * Function to fetch dependencies from a source.
     */
    private async fetchDependencies(): Promise<Array<string>> {
        if (this.url.includes("github.com")) {
            return await this.fetchFromGitHub();
        } else if (this.url.includes("npmjs.com")) {
            return await this.fetchFromNpm();
        } else {
            throw new Error("Unsupported URL format. Only GitHub and npm URLs are supported.");
        }
    }

    /**
    * Fetch dependencies from a GitHub repository by parsing its package.json file.
    * Assumes the repository has a valid package.json in its root directory.
    */
    private async fetchFromGitHub(): Promise<Array<string>> {
        try {
            const apiUrl = this.url
                .replace("https://github.com", "https://api.github.com/repos")
                .concat("/contents/package.json");
            const headers = { Authorization: `Bearer ${this.token}` };
    
            const response = await axios.get(apiUrl, { headers });
            const packageJsonContent = Buffer.from(response.data.content, "base64").toString("utf8");
            const packageJson = JSON.parse(packageJsonContent);
    
            // Combine dependencies and devDependencies
            const dependencies = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
            };
    
            return Object.entries(dependencies).map(([name, version]) => `${name}@${version}`);
        } catch (error) {
            console.error("Error fetching dependencies from GitHub:", error.message);
            return [];
        }
    }

    /**
    * Fetch dependencies for a package from the npm registry.
    * Assumes the provided URL includes the package name (e.g., https://www.npmjs.com/package/express).
    */
    private async fetchFromNpm(): Promise<Array<string>> {
        try {
            const packageName = this.url.split("/").pop() || "";
            const apiUrl = `https://registry.npmjs.org/${packageName}`;
    
            const response = await axios.get(apiUrl);
            const latestVersion = response.data["dist-tags"].latest;
            const dependencies = response.data.versions[latestVersion].dependencies || {};
    
            return Object.entries(dependencies).map(([name, version]) => `${name}@${version}`);
        } catch (error) {
            console.error("Error fetching dependencies from npm:", error.message);
            return [];
        }
    }

    /**
     * Determines if a dependency is pinned to at least a specific major+minor version.
     * @param dependency A dependency version string (e.g., "dependency1@^2.3.0").
     */
    private isPinned(dependency: string): boolean {
        const versionRegex = /(\d+)\.(\d+)\.x/; // Matches major.minor.x
        const match = dependency.match(versionRegex);
        return match !== null;
    }

    /**
     * Overrides the parent class's getScore method to provide detailed logs.
     */
    getScore(): number {
        console.log(`Score for URL ${this.url}: ${this.score}`);
        return this.score;
    }
}
