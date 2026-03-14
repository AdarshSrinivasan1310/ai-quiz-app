/**
 * API client for communicating with the Django backend.
 * All API calls go through this module for consistent error handling
 * and authentication header injection.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ─────────────────────────────────────────────────────────────────────────────
// Token management (localStorage)
// ─────────────────────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

// ─────────────────────────────────────────────────────────────────────────────
// Core fetch wrapper with auth + token refresh
// ─────────────────────────────────────────────────────────────────────────────

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true', // Required to bypass localtunnel reminder page
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401 and we have a refresh token, try to refresh
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(endpoint, options, false); // Retry once
    } else {
      clearTokens();
      // Only redirect if we're in the browser and not already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/login')) {
        window.location.href = '/auth/login';
      }
      throw new Error('Session expired. Please log in again.');
    }
  }

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  let data: unknown;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
    // If it's HTML, it might be an error page or the tunnel reminder
    if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
      if (data.includes('localtunnel')) {
        throw new Error('Tunnel issue: Please ensure the backend is running and the tunnel is active.');
      }
      throw new Error(`Server returned HTML instead of JSON (Status ${response.status}). This often means a 404 or 500 error on the server.`);
    }
  }

  if (!response.ok) {
    const errorData = data as Record<string, unknown>;
    const message = 
      (errorData?.error as string) ||
      (errorData?.message as string) ||
      (errorData?.detail as string) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (data.access) {
      localStorage.setItem('access_token', data.access);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  average_score: number;
  total_quizzes_taken: number;
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: { access: string; refresh: string };
}

export const auth = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name?: string;
    last_name?: string;
  }) => apiRequest<AuthResponse>('/auth/register/', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { username: string; password: string }) =>
    apiRequest<{ access: string; refresh: string; user: User }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () => {
    const refresh = getRefreshToken();
    return apiRequest('/auth/logout/', { method: 'POST', body: JSON.stringify({ refresh }) });
  },

  me: () => apiRequest<User>('/auth/me/'),
};

// ─────────────────────────────────────────────────────────────────────────────
// Quiz API
// ─────────────────────────────────────────────────────────────────────────────

export interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  order: number;
  correct_answer?: string;
  explanation?: string;
}

export interface Quiz {
  id: number;
  topic: string;
  num_questions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
  is_generated: boolean;
  questions?: Question[];
  question_count: number;
  attempt_count: number;
}

export interface QuizAttempt {
  id: number;
  quiz: number;
  quiz_topic: string;
  quiz_difficulty: string;
  started_at: string;
  completed_at: string | null;
  score: number;
  total_questions: number;
  percentage_score: number;
  time_taken: number | null;
  is_completed: boolean;
}

export interface UserAnswer {
  id: number;
  question: number;
  question_text: string;
  selected_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

export interface AttemptResult extends QuizAttempt {
  answers: UserAnswer[];
}

export const quizApi = {
  generate: (data: { topic: string; num_questions: number; difficulty: string }) =>
    apiRequest<{ message: string; quiz: Quiz }>('/quizzes/generate/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: () => apiRequest<Quiz[]>('/quizzes/'),

  get: (id: number) => apiRequest<Quiz>(`/quizzes/${id}/`),

  delete: (id: number) =>
    apiRequest(`/quizzes/${id}/`, { method: 'DELETE' }),

  startAttempt: (quizId: number) =>
    apiRequest<{ message: string; attempt_id: number; quiz: Quiz }>(
      `/quizzes/${quizId}/attempt/`,
      { method: 'POST' }
    ),

  submitAttempt: (
    attemptId: number,
    answers: { question_id: number; selected_answer: string }[]
  ) =>
    apiRequest<{ message: string; attempt_id: number; score: number; total_questions: number; percentage_score: number }>(
      `/attempts/${attemptId}/submit/`,
      { method: 'POST', body: JSON.stringify({ answers }) }
    ),

  getResults: (attemptId: number) =>
    apiRequest<AttemptResult>(`/attempts/${attemptId}/results/`),

  history: () => apiRequest<QuizAttempt[]>('/attempts/history/'),
};
