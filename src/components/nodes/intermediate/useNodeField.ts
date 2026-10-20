import { useCallback, useState } from 'react'
import { useReactFlow } from '@xyflow/react'

/**
 * Local state that is also written back to the React Flow node's `data`,
 * so edits survive saves/reloads and reach the workflow executor.
 */
export function useNodeField<T>(nodeId: string, key: string, initial: T): [T, (value: T) => void] {
  const { updateNodeData } = useReactFlow()
  const [value, setValue] = useState<T>(initial)
  const set = useCallback(
    (next: T) => {
      setValue(next)
      updateNodeData(nodeId, { [key]: next })
    },
    [nodeId, key, updateNodeData],
  )
  return [value, set]
}
