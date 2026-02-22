import { memo } from 'react'
import { Position, useConnection } from '@xyflow/react'
import { Mail, Settings, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BaseHandle } from '@/components/base-handle'
import { BaseNode, BaseNodeContent } from '@/components/base-node'
import { ButtonHandle } from '@/components/button-handle'
import AddNodePopover from './AddNodePopover'

const CadenceNode = memo(function CadenceNode({ data }) {
  const connectionInProgress = useConnection((c) => c.inProgress)

  const statusClass =
    data.status === 'executing'
      ? 'node-executing'
      : data.status === 'complete'
        ? 'node-complete'
        : ''

  return (
    <BaseNode className={cn('bg-white text-black border-gray-200 min-w-[220px]', statusClass)}>
      <BaseHandle type="target" position={Position.Top} />
      <BaseNodeContent className="flex-row items-center gap-2 py-2">
        <Mail className="size-4 shrink-0" strokeWidth={2.5} />
        <span className="font-semibold text-sm flex-1">Email</span>
        <button
          className="nodrag nopan p-0.5 rounded hover:bg-gray-100 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            data.onEdit?.(data.nodeId)
          }}
        >
          <Settings className="size-3.5 text-gray-500" strokeWidth={2} />
        </button>
        <button
          className="nodrag nopan p-0.5 rounded hover:bg-red-50 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            data.onDelete?.(data.nodeId)
          }}
        >
          <Trash2 className="size-3.5 text-gray-500 hover:text-red-500" strokeWidth={2} />
        </button>
      </BaseNodeContent>
      {data.hasOutgoingEdge ? (
        <BaseHandle type="source" position={Position.Bottom} />
      ) : (
        <ButtonHandle
          type="source"
          position={Position.Bottom}
          showButton={!connectionInProgress}
        >
          <AddNodePopover onAdd={(type) => data.onAddNode?.(type, data.nodeId)} />
        </ButtonHandle>
      )}
    </BaseNode>
  )
})

export default CadenceNode
