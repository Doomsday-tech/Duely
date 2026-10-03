import {
  User,
  Thing,
  DashboardSummary,
  Category,
  DocumentRecord,
  ReminderRecord,
  ActionRecord,
  SearchResult,
} from './types';

const TOKEN_KEY = 'duely_auth_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Do not set Content-Type if uploading FormData (browser handles boundary automatically)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg =
      isJson && data?.error
        ? data.error
        : `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: { email: string; password: string; name: string }) =>
    request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  logout: () =>
    request<{ message: string }>('/api/auth/logout', { method: 'POST' }),

  resetPassword: (email: string) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Things
  getDashboardSummary: () =>
    request<DashboardSummary>('/api/things/dashboard/summary'),

  getThings: (params?: { category?: string; status?: string; search?: string; sort?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    if (params?.sort) qs.set('sort', params.sort);
    return request<Thing[]>(`/api/things?${qs.toString()}`);
  },

  getThing: (id: string) => request<Thing>(`/api/things/${id}`),

  createThing: (body: any) =>
    request<Thing>('/api/things', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateThing: (id: string, body: any) =>
    request<Thing>(`/api/things/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteThing: (id: string) =>
    request<{ success: boolean }>(`/api/things/${id}`, {
      method: 'DELETE',
    }),

  renewThing: (id: string, body: { newExpiryDate: string; renewalDate?: string; cost?: number; notes?: string }) =>
    request<Thing>(`/api/things/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Categories
  getCategories: () => request<Category[]>('/api/categories'),

  createCategory: (body: { name: string; color?: string }) =>
    request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Documents
  getDocuments: (thingId?: string) => {
    const qs = thingId ? `?thingId=${thingId}` : '';
    return request<DocumentRecord[]>(`/api/documents${qs}`);
  },

  uploadDocument: (formData: FormData) =>
    request<{ document: DocumentRecord; suggestedExtraction: any }>('/api/documents/upload', {
      method: 'POST',
      body: formData,
    }),

  confirmExtraction: (
    documentId: string,
    body: {
      expiryDate?: string;
      issueDate?: string;
      documentType?: string;
      identifier?: string;
      syncToThing?: boolean;
    }
  ) =>
    request<{ success: boolean; document: DocumentRecord }>(
      `/api/documents/${documentId}/confirm-extraction`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    ),

  deleteDocument: (id: string) =>
    request<{ success: boolean }>(`/api/documents/${id}`, {
      method: 'DELETE',
    }),

  getDocumentDownloadUrl: (id: string) => `/api/documents/${id}/download`,

  // Reminders
  getReminders: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<ReminderRecord[]>(`/api/reminders${qs}`);
  },

  addReminder: (thingId: string, body: { daysBefore: number; channel?: string; customDate?: string }) =>
    request<ReminderRecord>(`/api/reminders/thing/${thingId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateReminder: (id: string, body: any) =>
    request<ReminderRecord>(`/api/reminders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteReminder: (id: string) =>
    request<{ success: boolean }>(`/api/reminders/${id}`, {
      method: 'DELETE',
    }),

  dismissReminder: (id: string) =>
    request<ReminderRecord>(`/api/reminders/${id}/dismiss`, {
      method: 'POST',
    }),

  // Actions
  addAction: (thingId: string, body: { title: string; actionUrl?: string; notes?: string }) =>
    request<ActionRecord>(`/api/actions/thing/${thingId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateAction: (id: string, body: { completed?: boolean; title?: string; actionUrl?: string; notes?: string }) =>
    request<ActionRecord>(`/api/actions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteAction: (id: string) =>
    request<{ success: boolean }>(`/api/actions/${id}`, {
      method: 'DELETE',
    }),

  // Search
  search: (q: string) => request<SearchResult>(`/api/search?q=${encodeURIComponent(q)}`),

  // Run reminder background check manually
  runRemindersJob: () =>
    request<{ message: string; stats: any }>('/api/jobs/run-reminders', {
      method: 'POST',
    }),
};
