// GitHub API wrapper for managing portfolio data
class GitHubStorage {
    constructor(owner, repo, token) {
        this.owner = owner;
        this.repo = repo;
        this.token = token;
        this.apiBase = 'https://api.github.com';
        this.dataPath = 'data/videos.json';
    }

    // Get current data from GitHub
    async getData() {
        try {
            const response = await fetch(
                `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${this.dataPath}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const fileData = await response.json();
            const content = atob(fileData.content);
            const data = JSON.parse(content);

            // Store SHA for updates
            data._sha = fileData.sha;
            return data;
        } catch (error) {
            console.error('Error fetching data from GitHub:', error);
            throw error;
        }
    }

    // Save data to GitHub
    async saveData(data) {
        try {
            const sha = data._sha;
            delete data._sha; // Remove SHA before saving

            const content = btoa(JSON.stringify(data, null, 2));

            const response = await fetch(
                `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${this.dataPath}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: 'Update portfolio data from admin panel',
                        content: content,
                        sha: sha
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const result = await response.json();

            // Restore SHA for continued operations
            data._sha = result.content.sha;

            return result;
        } catch (error) {
            console.error('Error saving data to GitHub:', error);
            throw error;
        }
    }

    // Get data from public URL (no auth needed)
    static async getPublicData(owner, repo, branch = 'main') {
        try {
            const response = await fetch(
                `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/data/videos.json?t=${Date.now()}`
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch public data: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching public data:', error);
            throw error;
        }
    }

    // Test if token has correct permissions
    async testConnection() {
        try {
            const response = await fetch(
                `${this.apiBase}/repos/${this.owner}/${this.repo}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            return response.ok;
        } catch (error) {
            return false;
        }
    }
}
