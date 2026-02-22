import { useState, useCallback, useRef } from 'react'
import {
  ReactFlow,
  Panel,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  useStore,
  ReactFlowProvider,
  Background,
} from '@xyflow/react'
import '@xyflow/react/dist/base.css'
import { Minus, Plus, ArrowRight, Maximize, Play, Square } from 'lucide-react'

import CadenceNode from '@/components/flow/CadenceNode'
import DelayNode from '@/components/flow/DelayNode'
import CadenceEdge from '@/components/flow/CadenceEdge'
import EmailEditSheet from '@/components/flow/EmailEditSheet'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const cadences = [
  { id: '1', name: 'Welcome Sequence', steps: 3 },
  { id: '2', name: 'Cold Outreach', steps: 5 },
  { id: '3', name: 'Follow-up Series', steps: 4 },
  { id: '4', name: 'Re-engagement', steps: 2 },
]

const nodeTypes = { cadence: CadenceNode, delay: DelayNode }
const edgeTypes = { cadence: CadenceEdge }
const defaultEdgeOptions = { type: 'cadence' }

const initialNodes = [
  {
    id: 'n1',
    type: 'cadence',
    position: { x: 250, y: 40 },
    data: { title: 'Initial Email' },
  },
  {
    id: 'n2',
    type: 'delay',
    position: { x: 270, y: 180 },
    data: { title: 'Wait 3 days' },
  },
  {
    id: 'n3',
    type: 'cadence',
    position: { x: 250, y: 320 },
    data: { title: 'Follow-up' },
  },
  {
    id: 'n4',
    type: 'delay',
    position: { x: 270, y: 460 },
    data: { title: 'Wait 5 days' },
  },
  {
    id: 'n5',
    type: 'cadence',
    position: { x: 250, y: 600 },
    data: { title: 'Final Email' },
  },
]

const initialEdges = [
  { id: 'e1-2', source: 'n1', target: 'n2' },
  { id: 'e2-3', source: 'n2', target: 'n3' },
  { id: 'e3-4', source: 'n3', target: 'n4' },
  { id: 'e4-5', source: 'n4', target: 'n5' },
]

let nodeIdCounter = 10

const zoomSelector = (s) => Math.round(s.transform[2] * 100)

function ZoomSlider() {
  const { zoomTo, fitView } = useReactFlow()
  const zoom = useStore(zoomSelector)

  const handleZoomChange = useCallback(
    (value) => {
      zoomTo(value[0] / 100)
    },
    [zoomTo]
  )

  return (
    <Panel position="bottom-center">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-sidebar px-3 py-2 shadow-md">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => handleZoomChange([Math.max(zoom - 10, 10)])}
        >
          <Minus className="size-3.5" />
        </Button>
        <Slider
          value={[zoom]}
          onValueChange={handleZoomChange}
          min={10}
          max={200}
          step={5}
          className="w-32"
        />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => handleZoomChange([Math.min(zoom + 10, 200)])}
        >
          <Plus className="size-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground w-10 text-center">
          {zoom}%
        </span>
        <div className="w-px h-4 bg-border" />
        <Button variant="ghost" size="icon-xs" onClick={() => fitView()}>
          <Maximize className="size-3.5" />
        </Button>
      </div>
    </Panel>
  )
}

function CreateCadencesInner() {
  const [activeCadence, setActiveCadence] = useState(cadences[0])
  const [nodes, setNodes] = useState(initialNodes)
  const [edges, setEdges] = useState(initialEdges)

  const [editingNodeId, setEditingNodeId] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const [executing, setExecuting] = useState(false)
  const [nodeStatuses, setNodeStatuses] = useState({})
  const skipWaitRef = useRef(false)
  const abortRef = useRef(false)

  const onNodesChange = useCallback(
    (changes) => setNodes((n) => applyNodeChanges(changes, n)),
    []
  )
  const onEdgesChange = useCallback(
    (changes) => setEdges((e) => applyEdgeChanges(changes, e)),
    []
  )
  const onConnect = useCallback(
    (params) => setEdges((e) => addEdge(params, e)),
    []
  )

  const handleDeleteNode = useCallback(
    (nodeId) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId))
      setEdges((prev) => {
        const incoming = prev.find((e) => e.target === nodeId)
        const outgoing = prev.find((e) => e.source === nodeId)
        let updated = prev.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        )
        if (incoming && outgoing) {
          updated = [
            ...updated,
            {
              id: `e${incoming.source}-${outgoing.target}`,
              source: incoming.source,
              target: outgoing.target,
              type: 'cadence',
            },
          ]
        }
        return updated
      })
    },
    []
  )

  const handleEditNode = useCallback((nodeId) => {
    setEditingNodeId(nodeId)
    setSheetOpen(true)
  }, [])

  const handleSaveEmail = useCallback(
    (emailData) => {
      if (!editingNodeId) return
      setNodes((prev) =>
        prev.map((n) =>
          n.id === editingNodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  ...emailData,
                  subtitle: emailData.subject || n.data.subtitle,
                },
              }
            : n
        )
      )
      setEditingNodeId(null)
    },
    [editingNodeId]
  )

  const handleAddNode = useCallback(
    (type, sourceNodeId) => {
      const newId = `n${++nodeIdCounter}`
      const sourceNode = nodes.find((n) => n.id === sourceNodeId)
      if (!sourceNode) return

      const outgoingEdge = edges.find((e) => e.source === sourceNodeId)
      let newY
      if (outgoingEdge) {
        const targetNode = nodes.find((n) => n.id === outgoingEdge.target)
        newY = targetNode
          ? (sourceNode.position.y + targetNode.position.y) / 2
          : sourceNode.position.y + 140
      } else {
        newY = sourceNode.position.y + 140
      }

      const newNode = {
        id: newId,
        type,
        position: { x: sourceNode.position.x, y: newY },
        data:
          type === 'cadence'
            ? { title: 'New Email' }
            : { title: 'Wait 1 day' },
      }

      setNodes((prev) => [...prev, newNode])
      if (outgoingEdge) {
        setEdges((prev) => [
          ...prev.filter((e) => e.id !== outgoingEdge.id),
          { id: `e${sourceNodeId}-${newId}`, source: sourceNodeId, target: newId, type: 'cadence' },
          { id: `e${newId}-${outgoingEdge.target}`, source: newId, target: outgoingEdge.target, type: 'cadence' },
        ])
      } else {
        setEdges((prev) => [
          ...prev,
          { id: `e${sourceNodeId}-${newId}`, source: sourceNodeId, target: newId, type: 'cadence' },
        ])
      }
    },
    [edges, nodes]
  )

  const handleSkipWait = useCallback(() => {
    skipWaitRef.current = true
  }, [])

  const runExecution = useCallback(async () => {
    abortRef.current = false
    setExecuting(true)
    setNodeStatuses({})

    const orderedNodeIds = []
    const edgeMap = {}
    edges.forEach((e) => {
      edgeMap[e.source] = e.target
    })
    const sourceSet = new Set(edges.map((e) => e.source))
    const targetSet = new Set(edges.map((e) => e.target))
    let startId = null
    for (const id of sourceSet) {
      if (!targetSet.has(id)) {
        startId = id
        break
      }
    }
    if (!startId && nodes.length > 0) startId = nodes[0].id

    let current = startId
    while (current) {
      orderedNodeIds.push(current)
      current = edgeMap[current] || null
    }

    for (const nodeId of orderedNodeIds) {
      if (abortRef.current) break

      setNodeStatuses((prev) => ({ ...prev, [nodeId]: 'executing' }))

      const node = nodes.find((n) => n.id === nodeId)
      const isDelay = node?.type === 'delay'
      const waitTime = isDelay ? 2000 : 1500

      skipWaitRef.current = false
      const start = Date.now()
      while (Date.now() - start < waitTime) {
        if (abortRef.current || skipWaitRef.current) break
        await new Promise((r) => setTimeout(r, 100))
      }

      if (abortRef.current) break
      setNodeStatuses((prev) => ({ ...prev, [nodeId]: 'complete' }))
      await new Promise((r) => setTimeout(r, 300))
    }

    setExecuting(false)
    if (!abortRef.current) {
      setTimeout(() => setNodeStatuses({}), 2000)
    } else {
      setNodeStatuses({})
    }
  }, [edges, nodes])

  const stopExecution = useCallback(() => {
    abortRef.current = true
  }, [])

  const enrichedNodes = nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      nodeId: n.id,
      status: nodeStatuses[n.id] || null,
      onEdit: handleEditNode,
      onDelete: handleDeleteNode,
      onRun: () => {},
      onSkipWait: handleSkipWait,
      onAddNode: handleAddNode,
    },
  }))

  const enrichedEdges = edges.map((e) => ({
    ...e,
    type: e.type || 'cadence',
  }))

  const editingNode = nodes.find((n) => n.id === editingNodeId)

  return (
    <SidebarProvider
      style={{ '--sidebar-width': '220px' }}
      className="!min-h-0 h-full !bg-transparent"
    >
      <Sidebar
        collapsible="none"
        className="cadence-sidebar border-r border-border !bg-transparent"
      >
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Cadences</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {cadences.map((c) => (
                  <SidebarMenuItem key={c.id}>
                    <SidebarMenuButton
                      isActive={activeCadence.id === c.id}
                      onClick={() => setActiveCadence(c)}
                    >
                      <span>{c.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {c.steps} steps
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-border p-3">
          <Button variant="outline" size="sm">
            New Cadence <ArrowRight className="size-4" />
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col">
        <div className="flex items-center gap-3 px-4 h-12 border-b border-border shrink-0">
          <h1 className="text-sm font-medium text-foreground">
            {activeCadence.name}
          </h1>
        </div>
        <div className="flex-1">
          <ReactFlow
            nodes={enrichedNodes}
            edges={enrichedEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            colorMode="dark"
            proOptions={{ hideAttribution: true }}
            style={{ background: 'transparent' }}
          >
            <Background
              color="rgba(255,255,255,0.15)"
              variant="dots"
              gap={20}
              size={1.5}
            />
            <Panel position="top-right">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={executing ? stopExecution : runExecution}
                    >
                      {executing ? (
                        <Square className="size-3.5" data-icon="inline-start" />
                      ) : (
                        <Play className="size-3.5" data-icon="inline-start" />
                      )}
                      {executing ? 'Stop Workflow' : 'Test Workflow'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {executing
                      ? 'Stop the current test execution'
                      : 'Test the workflow by sending emails to yourself'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Panel>
            <ZoomSlider />
          </ReactFlow>
        </div>
      </SidebarInset>

      <EmailEditSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        nodeData={editingNode?.data}
        onSave={handleSaveEmail}
      />
    </SidebarProvider>
  )
}

export default function CreateCadences() {
  return (
    <ReactFlowProvider>
      <CreateCadencesInner />
    </ReactFlowProvider>
  )
}
