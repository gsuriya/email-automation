import { useMemo, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, Search } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const companies = [
  { id: "1", name: "Acme Corp",     company: "Acme Corp",     contact: "tony@acmecorp.com",     cadence: { step: 3, total: 3 } },
  { id: "2", name: "Globex",        company: "Globex",        contact: "zoey@globex.io",        cadence: { step: 1, total: 5 } },
  { id: "3", name: "Initech",       company: "Initech",       contact: "jane@initech.com",      cadence: { step: 0, total: 4 } },
  { id: "4", name: "Umbrella Corp", company: "Umbrella Corp", contact: "william@umbrella.net",  cadence: { step: 5, total: 8 } },
  { id: "5", name: "Stark Ind.",    company: "Stark Ind.",    contact: "pepper@starkindustries.com", cadence: { step: 2, total: 2 } },
  { id: "6", name: "Wayne Ent.",    company: "Wayne Ent.",    contact: "lucius@wayneent.com",   cadence: null },
]

function CadenceBadge({ cadence }) {
  if (!cadence)
    return <span className="text-muted-foreground text-xs">Not started</span>

  if (cadence.step >= cadence.total)
    return <span className="text-emerald-400 text-xs font-medium">Completed</span>

  if (cadence.step === 0)
    return <span className="text-muted-foreground text-xs">Not sent</span>

  return (
    <span className="text-xs">
      <span className="text-foreground font-medium">{cadence.step}/{cadence.total}</span>
      <span className="text-muted-foreground ml-1">sent</span>
    </span>
  )
}

const columns = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-4 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name <ArrowUpDown className="ml-2 size-3" />
      </Button>
    ),
  },
  {
    accessorKey: "company",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-4 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Company <ArrowUpDown className="ml-2 size-3" />
      </Button>
    ),
  },
  {
    accessorKey: "contact",
    header: ({ column }) => (
      <Button variant="ghost" className="-ml-4 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Contact <ArrowUpDown className="ml-2 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("contact")}</span>
    ),
  },
  {
    accessorKey: "cadence",
    header: "Cadence Status",
    cell: ({ row }) => <CadenceBadge cadence={row.getValue("cadence")} />,
    enableSorting: false,
  },
]

export default function Tracker() {
  const [sorting, setSorting]               = useState([])
  const [columnFilters, setColumnFilters]   = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})

  const table = useReactTable({
    data: companies,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnFilters, columnVisibility },
  })

  return (
    <div className="p-6">
      <h1 className="text-lg font-medium text-foreground mb-6">Tracker</h1>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={table.getColumn("name")?.getFilterValue() ?? ""}
            onChange={e => table.getColumn("name")?.setFilterValue(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table.getAllColumns().filter(col => col.getCanHide()).map(col => (
              <DropdownMenuCheckboxItem
                key={col.id}
                className="capitalize"
                checked={col.getIsVisible()}
                onCheckedChange={val => col.toggleVisibility(!!val)}
              >
                {col.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden rounded-md border min-h-[625px]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
    </div>
  )
}
