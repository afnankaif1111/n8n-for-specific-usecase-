/**
 * API client helper to communicate with the MongoDB Express backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`)
  }

  return data as T
}

export const api = {
  // Authentication
  auth: {
    async signUp(email: string, password: string, name?: string) {
      const res = await request<{ user: { id: string; email: string; name?: string }; token: string }>(
        '/auth/signup',
        {
          method: 'POST',
          body: JSON.stringify({ email, password, name }),
        }
      )
      if (res.token) {
        localStorage.setItem('auth_token', res.token)
        localStorage.setItem('auth_user', JSON.stringify(res.user))
      }
      return res
    },

    async signIn(email: string, password: string) {
      const res = await request<{ user: { id: string; email: string; name?: string }; token: string }>(
        '/auth/signin',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      )
      if (res.token) {
        localStorage.setItem('auth_token', res.token)
        localStorage.setItem('auth_user', JSON.stringify(res.user))
      }
      return res
    },

    async me() {
      return request<{ user: { id: string; email: string; name?: string } }>('/auth/me')
    },

    signOut() {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    },

    getToken(): string | null {
      return localStorage.getItem('auth_token')
    },

    getUser(): { id: string; email: string; name?: string } | null {
      const raw = localStorage.getItem('auth_user')
      if (!raw) return null
      try {
        return JSON.parse(raw)
      } catch {
        return null
      }
    },
  },

  // Workflows
  workflows: {
    async list() {
      return request<{ workflows: Array<any> }>('/workflows')
    },

    async get(id: string) {
      return request<{ workflow: any }>(`/workflows/${id}`)
    },

    async create(workflow: { title?: string; nodes: any[]; edges: any[] }) {
      return request<{ message: string; workflow: any }>('/workflows', {
        method: 'POST',
        body: JSON.stringify(workflow),
      })
    },

    async update(id: string, workflow: { title?: string; nodes?: any[]; edges?: any[] }) {
      return request<{ message: string; workflow: any }>(`/workflows/${id}`, {
        method: 'PUT',
        body: JSON.stringify(workflow),
      })
    },

    async delete(id: string) {
      return request<{ message: string }>(`/workflows/${id}`, {
        method: 'DELETE',
      })
    },
  },

  // Credentials
  credentials: {
    async list() {
      return request<{ credentials: Array<any> }>('/credentials')
    },

    async create(credential: {
      title: string
      type: string
      credentialType: string
      data: Record<string, unknown>
    }) {
      return request<{ message: string; credential: any }>('/credentials', {
        method: 'POST',
        body: JSON.stringify(credential),
      })
    },

    async delete(id: string) {
      return request<{ message: string }>(`/credentials/${id}`, {
        method: 'DELETE',
      })
    },
  },

  // Node Definitions Catalog
  nodes: {
    async list() {
      return request<{ nodes: Array<any> }>('/nodes')
    },

    async seed() {
      return request<{ message: string; count: number; nodes: any[] }>('/nodes/seed', {
        method: 'POST',
      })
    },
  },

  // Executions
  executions: {
    async list() {
      return request<{ executions: Array<any> }>('/executions')
    },

    async getByWorkflow(workflowId: string) {
      return request<{ executions: Array<any> }>(`/executions/${workflowId}`)
    },

    async run(workflowId: string) {
      return request<{ message: string; execution: any }>(`/executions/run/${workflowId}`, {
        method: 'POST',
      })
    },
  },
}
