import { memo } from 'react'
import { Position, useConnection } from '@xyflow/react'
import { Mail, Play, Settings, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
    <BaseNode className={statusClass}>
      <BaseHandle type="target" position={Position.Top} />
      <BaseNodeContent>
        
        Node with Handle Button


      </BaseNodeContent>
      <ButtonHandle
        type="source"
        position={Position.Bottom}
        showButton={!connectionInProgress}
      >
        <Button
          onClick={() => {}}
          size="sm"
          variant="secondary"
          className="nodrag nopan rounded-full"
        >
          <Plus size={10} />
        </Button>
      </ButtonHandle>
    </BaseNode>
  )
})

export default CadenceNode
