import { Octokit } from '@octokit/rest';

const githubToken = process.env.GITHUB_TOKEN;

// Initialize Octokit only if token is provided
export const octokit = githubToken ? new Octokit({ auth: githubToken }) : null;

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  updated_at: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
}

export interface GitHubContributor {
  login: string;
  avatar_url: string;
  contributions: number;
}

/**
 * Get repository information from GitHub
 * @param owner Repository owner
 * @param repo Repository name
 */
export async function getRepositoryInfo(owner: string, repo: string): Promise<GitHubRepository | null> {
  if (!octokit) {
    console.warn('GitHub token not configured. Please set GITHUB_TOKEN in .env');
    return null;
  }

  try {
    const { data } = await octokit.repos.get({ owner, repo });
    return {
      id: data.id,
      name: data.name,
      full_name: data.full_name,
      description: data.description,
      html_url: data.html_url,
      language: data.language,
      stargazers_count: data.stargazers_count,
      forks_count: data.forks_count,
      open_issues_count: data.open_issues_count,
      default_branch: data.default_branch,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('Error fetching repository info:', error);
    return null;
  }
}

/**
 * Get recent commits from a repository
 * @param owner Repository owner
 * @param repo Repository name
 * @param limit Number of commits to fetch (default: 10)
 */
export async function getRecentCommits(
  owner: string,
  repo: string,
  limit: number = 10
): Promise<GitHubCommit[]> {
  if (!octokit) {
    console.warn('GitHub token not configured. Please set GITHUB_TOKEN in .env');
    return [];
  }

  try {
    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: limit,
    });

    return data.map((commit) => ({
      sha: commit.sha,
      commit: {
        message: commit.commit.message,
        author: {
          name: commit.commit.author?.name || 'Unknown',
          email: commit.commit.author?.email || '',
          date: commit.commit.author?.date || '',
        },
      },
      author: commit.author ? {
        login: commit.author.login,
        avatar_url: commit.author.avatar_url,
      } : null,
      html_url: commit.html_url,
    }));
  } catch (error) {
    console.error('Error fetching commits:', error);
    return [];
  }
}

/**
 * Get repository contributors
 * @param owner Repository owner
 * @param repo Repository name
 */
export async function getContributors(owner: string, repo: string): Promise<GitHubContributor[]> {
  if (!octokit) {
    console.warn('GitHub token not configured. Please set GITHUB_TOKEN in .env');
    return [];
  }

  try {
    const { data } = await octokit.repos.listContributors({ owner, repo });
    return data.map((contributor) => ({
      login: contributor.login,
      avatar_url: contributor.avatar_url,
      contributions: contributor.contributions,
    }));
  } catch (error) {
    console.error('Error fetching contributors:', error);
    return [];
  }
}

/**
 * Parse GitHub URL to extract owner and repo
 * @param url GitHub repository URL
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
      };
    }
    return null;
  } catch {
    return null;
  }
}
