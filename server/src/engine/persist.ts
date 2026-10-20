import { Execution } from '../models/Execution'
import { isDBConnected } from '../db'
import { memoryStore } from '../memoryStore'
import type { ExecutionResult } from './executor'

/** Store a finished run in whichever backend is active and return it in API shape. */
export async function saveExecution(workflowId: string, result: ExecutionResult, startTime: Date, endTime: Date) {
  const log = result.logs as unknown as Array<Record<string, unknown>>
  if (isDBConnected()) {
    const e = await Execution.create({ workflowId, status: result.status, log, startTime, endTime })
    return { id: e._id.toString(), workflowId, status: e.status, startTime, endTime, durationMs: endTime.getTime() - startTime.getTime(), log: e.log }
  }
  const e = memoryStore.createExecution({ workflowId, status: result.status, log, startTime, endTime })
  return { id: e.id, workflowId, status: e.status, startTime, endTime, durationMs: endTime.getTime() - startTime.getTime(), log: e.log }
}
