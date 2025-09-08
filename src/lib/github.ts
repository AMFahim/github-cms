import { Octokit } from '@octokit/rest';

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
  branch?: string;
}

export interface GitHubFile {
  name: string;
  content: string;
  sha?: string;
}

export class GitHubService {
  private octokit: Octokit;
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
    this.octokit = new Octokit({
      auth: config.token,
    });
  }

  /**
   * Fetch a markdown file from GitHub repository
   */
  async fetchMarkdownFile(filePath: string): Promise<string> {
    try {
      const response = await this.octokit.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        ref: this.config.branch || 'main',
      });

      if ('content' in response.data && !Array.isArray(response.data)) {
        const content = Buffer.from(response.data.content, 'base64').toString('utf8');
        return content;
      }

      throw new Error('File not found or is not a file');
    } catch (error) {
      console.error('Error fetching file from GitHub:', error);
      throw new Error(`Failed to fetch file: ${filePath}`);
    }
  }

  /**
   * Get file SHA for updates (needed for GitHub API)
   */
  private async getFileSha(filePath: string): Promise<string | undefined> {
    try {
      const response = await this.octokit.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        ref: this.config.branch || 'main',
      });

      if ('sha' in response.data && !Array.isArray(response.data)) {
        return response.data.sha;
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Commit a single file to GitHub repository
   */
  async commitFile(filePath: string, content: string, message: string): Promise<void> {
    try {
      const existingSha = await this.getFileSha(filePath);

      await this.octokit.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        message,
        content: Buffer.from(content, 'utf8').toString('base64'),
        branch: this.config.branch || 'main',
        ...(existingSha && { sha: existingSha }),
      });
    } catch (error) {
      console.error('Error committing file to GitHub:', error);
      throw new Error(`Failed to commit file: ${filePath}`);
    }
  }

  /**
   * Commit multiple files at once
   */
  async commitMultipleFiles(files: GitHubFile[], message: string): Promise<void> {
    try {
      const { data: ref } = await this.octokit.git.getRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${this.config.branch || 'main'}`,
      });

      const { data: commit } = await this.octokit.git.getCommit({
        owner: this.config.owner,
        repo: this.config.repo,
        commit_sha: ref.object.sha,
      });

      const blobs = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await this.octokit.git.createBlob({
            owner: this.config.owner,
            repo: this.config.repo,
            content: Buffer.from(file.content, 'utf8').toString('base64'),
            encoding: 'base64',
          });
          return {
            path: file.name,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blob.sha,
          };
        })
      );

      const { data: tree } = await this.octokit.git.createTree({
        owner: this.config.owner,
        repo: this.config.repo,
        base_tree: commit.tree.sha,
        tree: blobs,
      });

      const { data: newCommit } = await this.octokit.git.createCommit({
        owner: this.config.owner,
        repo: this.config.repo,
        message,
        tree: tree.sha,
        parents: [commit.sha],
      });

      await this.octokit.git.updateRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${this.config.branch || 'main'}`,
        sha: newCommit.sha,
      });
    } catch (error) {
      console.error('Error committing multiple files to GitHub:', error);
      throw new Error('Failed to commit multiple files');
    }
  }

  /**
   * List markdown files in the repository
   */
  async listMarkdownFiles(directory: string = ''): Promise<string[]> {
    try {
      const response = await this.octokit.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: directory,
        ref: this.config.branch || 'main',
      });

      if (Array.isArray(response.data)) {
        return response.data
          .filter(item => item.type === 'file' && item.name.endsWith('.md'))
          .map(item => item.path);
      }

      return [];
    } catch (error) {
      console.error('Error listing files from GitHub:', error);
      return [];
    }
  }
}

export function createGitHubService(config: GitHubConfig): GitHubService {
  return new GitHubService(config);
}
