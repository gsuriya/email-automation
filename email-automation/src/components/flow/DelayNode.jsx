import { memo } from 'react'
import { Position, useConnection } from '@xyflow/react'
import { Clock, Settings, Trash2, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { BaseHandle } from '@/components/base-handle'
import { ButtonHandle } from '@/components/button-handle'
import AddNodePopover from './AddNodePopover'

const DelayNode = memo(function DelayNode({ data }) {
  const connectionInProgress = useConnection((c) => c.inProgress)

  const statusClass =
    data.status === 'executing'
      ? 'node-executing'
      : data.status === 'complete'
        ? 'node-complete'
        : ''

  return (
    <ButtonHandle></ButtonHandle>
  )
})

export default DelayNode
