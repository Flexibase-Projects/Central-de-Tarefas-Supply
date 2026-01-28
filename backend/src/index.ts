// IMPORTANT: Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory (try multiple locations)
const backendEnvPath = path.resolve(__dirname, '../.env');
const backendEnvLocalPath = path.resolve(__dirname, '../.env.local');
const rootEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvLocalPath = path.resolve(__dirname, '../../.env.local');

// Try to load from backend directory first, then root
let loadedFile = '';
if (existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
  loadedFile = 'backend/.env';
} else if (existsSync(backendEnvLocalPath)) {
  dotenv.config({ path: backendEnvLocalPath });
  loadedFile = 'backend/.env.local';
} else if (existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
  loadedFile = '.env (root)';
} else if (existsSync(rootEnvLocalPath)) {
  dotenv.config({ path: rootEnvLocalPath });
  loadedFile = '.env.local (root)';
} else {
  // Fallback to default behavior (current directory)
  dotenv.config();
  loadedFile = 'default location';
}

console.log(`📄 Loaded: ${loadedFile}`);

// Now import other modules (they will have access to process.env)
import express from 'express';
import cors from 'cors';
import projectsRoutes from './routes/projects.js';
import tasksRoutes from './routes/tasks.js';
import activitiesRoutes from './routes/activities.js';
import githubRoutes from './routes/github.js';
import todosRoutes from './routes/todos.js';
import projectCommentsRoutes from './routes/project-comments.js';
import permissionsRoutes from './routes/permissions.js';
import rolesRoutes from './routes/roles.js';
import usersRoutes from './routes/users.js';
import notificationsRoutes from './routes/notifications.js';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3003',
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/todos', todosRoutes);
app.use('/api/project-comments', projectCommentsRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT} (temporary port)`);
  
  const hasSupabase = process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
  if (hasSupabase) {
    console.log('✅ Supabase configured - database operations enabled');
    console.log(`   URL: ${process.env.SUPABASE_URL?.substring(0, 30)}...`);
    console.log(`   Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON'} key set`);
  } else {
    console.warn('⚠️  Supabase not configured - database operations will fail');
    console.warn('⚠️  Create backend/.env.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
    console.log('   Current env vars:');
    console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
  }

  // GitHub token status
  const hasGitHubToken = process.env.GITHUB_TOKEN;
  if (hasGitHubToken) {
    console.log('✅ GitHub token configured - GitHub API operations enabled');
    console.log(`   Token: ${process.env.GITHUB_TOKEN.substring(0, 7)}...${process.env.GITHUB_TOKEN.substring(process.env.GITHUB_TOKEN.length - 4)}`);
  } else {
    console.warn('⚠️  GitHub token not configured - GitHub API operations will be limited');
    console.warn('⚠️  Add GITHUB_TOKEN to backend/.env.local to enable full GitHub integration');
  }
});
