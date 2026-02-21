// TODO: Use shadcn Empty component for empty states
// npx shadcn@latest add empty
// import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
// <Empty>
//   <EmptyHeader>
//     <EmptyMedia variant="icon"><Icon /></EmptyMedia>
//     <EmptyTitle>No data</EmptyTitle>
//     <EmptyDescription>No data found</EmptyDescription>
//   </EmptyHeader>
//   <EmptyContent><Button>Add data</Button></EmptyContent>
// </Empty>

import { useMemo, useState } from "react"
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Input, Chip, Pagination, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button,
} from "@heroui/react"
import { Search, ChevronDown } from "lucide-react"

const people = [
  { id: "1", name: "Tony Reichert",  role: "CEO",               status: "Active"   },
  { id: "2", name: "Zoey Lang",      role: "Technical Lead",    status: "Paused"   },
  { id: "3", name: "Jane Fisher",    role: "Senior Developer",  status: "Active"   },
  { id: "4", name: "William Howard", role: "Community Manager", status: "Vacation" },
]

const columns = [
  { key: "name",   label: "NAME",   allowsSorting: true },
  { key: "role",   label: "ROLE",   allowsSorting: true },
  { key: "status", label: "STATUS", allowsSorting: true },
]

const STATUS_OPTIONS = ["Active", "Paused", "Vacation"]

const statusColorMap = {
  Active:   "success",
  Paused:   "warning",
  Vacation: "primary",
}

const ROWS_PER_PAGE = 5

export default function ByPeople() {
  const [filterValue, setFilterValue]         = useState("")
  const [statusFilter, setStatusFilter]       = useState(new Set(["all"]))
  const [sortDescriptor, setSortDescriptor]   = useState({ column: "name", direction: "ascending" })
  const [page, setPage]                       = useState(1)

  const allStatuses = statusFilter.has("all")

  const filtered = useMemo(() => {
    let result = [...people]

    if (filterValue) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        p.role.toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    if (!allStatuses) {
      result = result.filter(p => statusFilter.has(p.status))
    }

    result.sort((a, b) => {
      const valA = a[sortDescriptor.column]
      const valB = b[sortDescriptor.column]
      const cmp  = valA < valB ? -1 : valA > valB ? 1 : 0
      return sortDescriptor.direction === "ascending" ? cmp : -cmp
    })

    return result
  }, [filterValue, statusFilter, sortDescriptor, allStatuses])

  const pages      = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE))
  const paginated  = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)

  const topContent = (
    <div className="flex items-center justify-between gap-3">
      <Input
        isClearable
        className="w-full max-w-sm"
        placeholder="Search by name or role..."
        startContent={<Search className="size-4 text-default-400" />}
        value={filterValue}
        onClear={() => { setFilterValue(""); setPage(1) }}
        onValueChange={v => { setFilterValue(v); setPage(1) }}
      />
      <Dropdown>
        <DropdownTrigger>
          <Button endContent={<ChevronDown className="size-4" />} variant="flat">
            Status
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Filter by status"
          closeOnSelect={false}
          selectedKeys={statusFilter}
          selectionMode="multiple"
          onSelectionChange={keys => {
            const s = new Set(keys)
            setStatusFilter(s.size === 0 ? new Set(["all"]) : s)
            setPage(1)
          }}
        >
          <DropdownItem key="all">All</DropdownItem>
          {STATUS_OPTIONS.map(s => <DropdownItem key={s}>{s}</DropdownItem>)}
        </DropdownMenu>
      </Dropdown>
    </div>
  )

  const bottomContent = (
    <div className="flex justify-center">
      <Pagination
        isCompact
        showControls
        page={page}
        total={pages}
        onChange={setPage}
      />
    </div>
  )

  return (
    <div className="p-6">
      <h1 className="text-lg font-medium text-foreground mb-6">By People</h1>
      <Table
        aria-label="People reachouts table"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        topContent={topContent}
        topContentPlacement="outside"
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        classNames={{ wrapper: "min-h-[620px]" }}
      >
        <TableHeader columns={columns}>
          {col => <TableColumn key={col.key} allowsSorting={col.allowsSorting}>{col.label}</TableColumn>}
        </TableHeader>
        <TableBody items={paginated} emptyContent="No people found.">
          {person => (
            <TableRow key={person.id}>
              <TableCell>{person.name}</TableCell>
              <TableCell>{person.role}</TableCell>
              <TableCell>
                <Chip color={statusColorMap[person.status]} size="sm" variant="flat">
                  {person.status}
                </Chip>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
