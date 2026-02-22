import { useState } from 'react'
import { Mail, Clock, Plus } from 'lucide-react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export default function AddNodePopover({ onAdd }) {
  const [open, setOpen] = useState(false)

  const handleSelect = (type) => {
    setOpen(false)
    onAdd?.(type)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon-xs"
          className="nodrag nopan rounded-full size-6 border-border bg-card shadow-sm hover:bg-accent"
        >
          <Plus className="size-3 text-muted-foreground" strokeWidth={2.5} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" side="right" align="center">
        <p className="px-2 py-1.5 text-xs font-semibold text-foreground">Add Node</p>
        <button
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
          onClick={() => handleSelect('cadence')}
        >
          <Mail className="size-4 text-muted-foreground" />
          <span>Email Step</span>
        </button>
        <button
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
          onClick={() => handleSelect('delay')}
        >
          <Clock className="size-4 text-muted-foreground" />
          <span>Wait Block</span>
        </button>
      </PopoverContent>
    </Popover>
  )
}
