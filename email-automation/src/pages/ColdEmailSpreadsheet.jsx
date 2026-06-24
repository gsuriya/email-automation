import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Loader2, Plus, Send, Trash } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api'
import { toColdRowPayload } from '@/lib/coldRows'

const emptyRow = {
  name: '',
  company: '',
  email: '',
  draft_template_id: null,
}

function StatusCell({ row }) {
  if (row.error_message || row.status === 'error') {
    return <span className="text-xs text-muted-foreground" title={row.error_message || 'Needs attention'}>Review</span>
  }
  return <span className="text-xs text-muted-foreground">Ready</span>
}

const toolbarButtonClass = '!h-8 rounded-lg !border-2 !border-[#cfd4dc] !bg-white px-4 text-sm font-semibold !text-black shadow-[0_1px_0_rgba(255,255,255,0.55)_inset] hover:!border-[#b9c0ca] hover:!bg-white hover:!text-black [&_svg]:!text-black'
const deleteButtonClass = '!h-8 rounded-lg !border-2 !border-[#ff747a] !bg-[#d94c51] px-4 text-sm font-semibold !text-white shadow-[0_1px_0_rgba(255,255,255,0.28)_inset] hover:!border-[#ff8c91] hover:!bg-[#ef5a60] hover:!text-white [&_svg]:!text-white'
const fieldClass = 'h-7 w-full min-w-0 rounded-sm border border-white/10 bg-white/[0.055] px-3 text-sm shadow-none placeholder:text-muted-foreground/70 focus-visible:border-white/20 focus-visible:ring-0'

export default function ColdEmailSpreadsheet() {
  const [rows, setRows] = useState([])
  const [templates, setTemplates] = useState([])
  const [rowSelection, setRowSelection] = useState({})
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [bulkTemplateId, setBulkTemplateId] = useState('')

  const refresh = async () => {
    const [rowResult, templateResult] = await Promise.all([
      api.listColdRows(),
      api.listTemplates(),
    ])
    setRows(rowResult.rows)
    setTemplates(templateResult.templates)
  }

  useEffect(() => {
    refresh()
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  const updateRow = useCallback(async (id, patch) => {
    setRows((items) => items.map((item) => item.id === id ? { ...item, ...patch, status: 'draft', error_message: null } : item))
    try {
      const { row } = await api.updateColdRow(id, { ...patch, status: 'draft', error_message: null })
      setRows((items) => items.map((item) => item.id === id ? { ...item, ...row } : item))
    } catch (err) {
      toast.error(err.message)
      refresh().catch(() => {})
    }
  }, [])

  const addRow = async () => {
    try {
      const { row } = await api.createColdRow(emptyRow)
      setRows((items) => [...items, row])
    } catch (err) {
      toast.error(err.message)
    }
  }

  const deleteAll = async () => {
    try {
      await api.deleteAllColdRows()
      setRows([])
      setRowSelection({})
      toast.success('Cold email table cleared')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const applyBulkTemplate = async (templateId) => {
    setBulkTemplateId(templateId)
    const selectedIds = Object.keys(rowSelection)
    const targetRows = selectedIds.length
      ? rows.filter((row) => selectedIds.includes(row.id))
      : rows

    try {
      await Promise.all(targetRows.map((row) => api.updateColdRow(row.id, {
        draft_template_id: templateId,
        status: 'draft',
        error_message: null,
      })))
      setRows((items) => items.map((row) => targetRows.some((target) => target.id === row.id)
        ? { ...row, draft_template_id: templateId, status: 'draft', error_message: null }
        : row
      ))
      toast.success(selectedIds.length ? 'Draft applied to selected rows' : 'Draft applied to all rows')
    } catch (err) {
      toast.error(err.message)
      refresh().catch(() => {})
    }
  }

  const sendAll = async () => {
    setSending(true)
    try {
      await Promise.all(rows.map((row) => api.updateColdRow(row.id, toColdRowPayload(row))))
      const result = await api.sendAllColdRows()
      await refresh()
      setRowSelection({})
      if (result.failures.length) {
        toast.warning(`${result.sent.length} sent, ${result.failures.length} need attention`)
      } else {
        toast.success(`${result.sent.length} emails sent`)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all rows"
          className="size-5 rounded-md"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="size-5 rounded-md"
        />
      ),
      enableSorting: false,
      meta: { width: '3.5%' },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Input
          value={row.original.name}
          placeholder="Jane Smith"
          onChange={(e) => setRows((items) => items.map((item) => item.id === row.original.id ? { ...item, name: e.target.value } : item))}
          onBlur={(e) => updateRow(row.original.id, { name: e.target.value })}
          className={fieldClass}
        />
      ),
      meta: { width: '16%' },
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }) => (
        <Input
          value={row.original.company}
          placeholder="Acme"
          onChange={(e) => setRows((items) => items.map((item) => item.id === row.original.id ? { ...item, company: e.target.value } : item))}
          onBlur={(e) => updateRow(row.original.id, { company: e.target.value })}
          className={fieldClass}
        />
      ),
      meta: { width: '16%' },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <Input
          value={row.original.email}
          placeholder="jane@company.com"
          onChange={(e) => setRows((items) => items.map((item) => item.id === row.original.id ? { ...item, email: e.target.value } : item))}
          onBlur={(e) => updateRow(row.original.id, { email: e.target.value })}
          className={fieldClass}
        />
      ),
      meta: { width: '22%' },
    },
    {
      accessorKey: 'draft_template_id',
      header: 'Draft',
      cell: ({ row }) => (
        <Select value={row.original.draft_template_id || ''} onValueChange={(value) => updateRow(row.original.id, { draft_template_id: value })}>
          <SelectTrigger size="sm" className="!h-7 w-full rounded-sm border border-white/10 bg-white/[0.055] px-3 text-sm shadow-none focus-visible:ring-0">
            <SelectValue placeholder="Select draft" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      meta: { width: '22%' },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusCell row={row.original} />,
      meta: { width: '12%' },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={async () => {
            try {
              await api.deleteColdRow(row.original.id)
              setRows((items) => items.filter((item) => item.id !== row.original.id))
            } catch (err) {
              toast.error(err.message)
            }
          }}
          aria-label="Delete row"
          className="text-white hover:bg-[#d94c51]/15 hover:text-[#ff7076]"
        >
          <Trash className="size-4" />
        </Button>
      ),
      meta: { width: '8.5%' },
    },
  ], [templates, updateRow])

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  })

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Stage Emails</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={bulkTemplateId} onValueChange={applyBulkTemplate}>
            <SelectTrigger size="sm" className="!h-8 w-[155px] rounded-lg !border-2 !border-[#cfd4dc] !bg-white px-4 text-sm font-semibold !text-black shadow-[0_1px_0_rgba(255,255,255,0.55)_inset] hover:!border-[#b9c0ca] hover:!bg-white [&_svg]:!text-black/60">
              <SelectValue placeholder="Bulk Assign" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={addRow} className={toolbarButtonClass}>
            <Plus className="size-4" />
            Add row
          </Button>
          <Button variant="ghost" onClick={deleteAll} disabled={!rows.length} className={deleteButtonClass}>
            <Trash className="size-4" />
            Clear
          </Button>
          <Button variant="ghost" onClick={sendAll} disabled={sending || !rows.length} className={toolbarButtonClass}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Send all
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table className="w-full table-fixed">
          <colgroup>
            {table.getAllLeafColumns().map((column) => (
              <col key={column.id} style={{ width: column.columnDef.meta?.width }} />
            ))}
          </colgroup>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="overflow-hidden px-4 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No staged emails. Add a row to start.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

    </div>
  )
}
