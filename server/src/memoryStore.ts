import { STANDARD_NODES } from './routes/nodes'

export interface MemoryUser {
  id: string
  email: string
  password: string
  name?: string
  createdAt: Date
  updatedAt: Date
}

export interface MemoryWorkflow {
  id: string
  userId: string
  title: string
  nodes: Array<Record<string, unknown>>
  edges: Array<{ id: string; source: string; dest: string; [key: string]: unknown }>
  createdAt: Date
  updatedAt: Date
}

export interface MemoryCredential {
  id: string
  userId: string
  title: string
  type: string
  credentialType: string
  data: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface MemoryNode {
  id: string
  nodeId: string
  title: string
  desc: string
  type: string
  credentialType?: string | null
  category?: string
  createdAt: Date
}

export interface MemoryExecution {
  id: string
  workflowId: string
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'
  log: Array<Record<string, unknown> | string>
  startTime: Date
  endTime?: Date
  createdAt: Date
}

class InMemoryStore {
  users = new Map<string, MemoryUser>()
  workflows = new Map<string, MemoryWorkflow>()
  credentials = new Map<string, MemoryCredential>()
  nodes = new Map<string, MemoryNode>()
  executions = new Map<string, MemoryExecution>()

  constructor() {
    this.seedDefaultNodes()
  }

  seedDefaultNodes() {
    for (const node of STANDARD_NODES) {
      this.nodes.set(node.nodeId, {
        id: node.nodeId,
        ...node,
        createdAt: new Date(),
      })
    }
  }

  // Users
  findUserByEmail(email: string): MemoryUser | undefined {
    const normalized = email.toLowerCase()
    return Array.from(this.users.values()).find((u) => u.email.toLowerCase() === normalized)
  }

  findUserById(id: string): MemoryUser | undefined {
    return this.users.get(id)
  }

  createUser(user: Omit<MemoryUser, 'id' | 'createdAt' | 'updatedAt'>): MemoryUser {
    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const now = new Date()
    const record: MemoryUser = { id, ...user, createdAt: now, updatedAt: now }
    this.users.set(id, record)
    return record
  }

  // Workflows
  findWorkflowsByUserId(userId: string): MemoryWorkflow[] {
    return Array.from(this.workflows.values()).filter((w) => w.userId === userId)
  }

  findWorkflowById(id: string, userId?: string): MemoryWorkflow | undefined {
    const w = this.workflows.get(id)
    if (!w) return undefined
    if (userId && w.userId !== userId) return undefined
    return w
  }

  createWorkflow(workflow: Omit<MemoryWorkflow, 'id' | 'createdAt' | 'updatedAt'>): MemoryWorkflow {
    const id = `wf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const now = new Date()
    const record: MemoryWorkflow = { id, ...workflow, createdAt: now, updatedAt: now }
    this.workflows.set(id, record)
    return record
  }

  updateWorkflow(id: string, userId: string, updates: Partial<MemoryWorkflow>): MemoryWorkflow | null {
    const existing = this.findWorkflowById(id, userId)
    if (!existing) return null
    const updated: MemoryWorkflow = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    }
    this.workflows.set(id, updated)
    return updated
  }

  deleteWorkflow(id: string, userId: string): boolean {
    const existing = this.findWorkflowById(id, userId)
    if (!existing) return false
    return this.workflows.delete(id)
  }

  // Credentials
  findCredentialsByUserId(userId: string): MemoryCredential[] {
    return Array.from(this.credentials.values()).filter((c) => c.userId === userId)
  }

  createCredential(cred: Omit<MemoryCredential, 'id' | 'createdAt' | 'updatedAt'>): MemoryCredential {
    const id = `cred_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const now = new Date()
    const record: MemoryCredential = { id, ...cred, createdAt: now, updatedAt: now }
    this.credentials.set(id, record)
    return record
  }

  deleteCredential(id: string, userId: string): boolean {
    const existing = this.credentials.get(id)
    if (!existing || existing.userId !== userId) return false
    return this.credentials.delete(id)
  }

  // Nodes
  getAllNodes(): MemoryNode[] {
    return Array.from(this.nodes.values())
  }

  // Executions
  findExecutionsByWorkflowId(workflowId: string): MemoryExecution[] {
    return Array.from(this.executions.values())
      .filter((e) => e.workflowId === workflowId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  findExecutionsByUserWorkflows(workflowIds: string[]): MemoryExecution[] {
    const set = new Set(workflowIds)
    return Array.from(this.executions.values())
      .filter((e) => set.has(e.workflowId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  createExecution(exec: Omit<MemoryExecution, 'id' | 'createdAt'>): MemoryExecution {
    const id = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const record: MemoryExecution = { id, ...exec, createdAt: new Date() }
    this.executions.set(id, record)
    return record
  }
}

export const memoryStore = new InMemoryStore()
