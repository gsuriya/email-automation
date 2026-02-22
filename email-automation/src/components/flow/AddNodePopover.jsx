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
        <button
          style={{ background: '#d1d5db', borderColor: '#c0c4ca' }}
          className="nodrag nopan flex items-center justify-center rounded-full size-6 border shadow-sm hover:brightness-95 transition-colors"
        >
          <Plus className="size-3 text-black" strokeWidth={2.5} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 bg-white border-gray-200 shadow-lg" side="right" align="center">
        <p className="px-2 py-1.5 text-xs font-semibold text-black">Add Node</p>
        <button
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-black hover:bg-gray-100 transition-colors"
          onClick={() => handleSelect('cadence')}
        >
          <Mail className="size-4 text-gray-500" />
          <span>Email Step</span>
        </button>
        <button
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-black hover:bg-gray-100 transition-colors"
          onClick={() => handleSelect('delay')}
        >
          <Clock className="size-4 text-gray-500" />
          <span>Wait Block</span>
        </button>
      </PopoverContent>
    </Popover>
  )
}
