import express from 'express';
import { getRepositoryInfo, getRecentCommits, getContributors, parseGitHubUrl } from '../services/github.js';

const router = express.Router();

// Get repository info
router.get('/repo', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'GitHub URL is required' });
    }

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid GitHub URL' });
    }

    const repoInfo = await getRepositoryInfo(parsed.owner, parsed.repo);
    if (!repoInfo) {
      return res.status(404).json({ error: 'Repository not found or GitHub token not configured' });
    }

    res.json(repoInfo);
  } catch (error: any) {
    console.error('Error fetching repository info:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch repository info' });
  }
});

// Get recent commits
router.get('/commits', async (req, res) => {
  try {
    const { url, limit } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'GitHub URL is required' });
    }

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid GitHub URL' });
    }

    const commits = await getRecentCommits(parsed.owner, parsed.repo, limit ? parseInt(limit as string) : 10);
    res.json(commits);
  } catch (error: any) {
    console.error('Error fetching commits:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch commits' });
  }
});

// Get contributors
router.get('/contributors', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'GitHub URL is required' });
    }

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid GitHub URL' });
    }

    const contributors = await getContributors(parsed.owner, parsed.repo);
    res.json(contributors);
  } catch (error: any) {
    console.error('Error fetching contributors:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch contributors' });
  }
});

export default router;
