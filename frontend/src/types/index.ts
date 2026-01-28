export interface Project {
  id: string
  name: string
  description: string | null
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
  github_url: string | null
  github_owner: string | null
  github_repo: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high'
  assigned_to: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface Comment {
  id: string
  project_id: string | null
  task_id: string | null
  content: string
  created_at: string
  created_by: string | null
  author_name?: string | null
  author_email?: string | null
}

export interface ProjectTodo {
  id: string
  project_id: string
  title: string
  completed: boolean
  assigned_to: string | null
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    }
  }
  author: {
    login: string
    avatar_url: string
  } | null
  html_url: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  default_branch: string
  updated_at: string
  created_at: string
  size: number
  watchers_count: number
  license: string | null
  topics: string[]
  archived: boolean
  private: boolean
}

export interface Activity {
  id: string
  name: string
  description: string | null
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
  due_date: string | null
  priority: 'low' | 'medium' | 'high'
  assigned_to: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}
