import { useState, useCallback } from 'react'
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
import { Minus, Plus, ArrowRight, Maximize, Play, Loader2 } from 'lucide-react'

import CadenceNode from '@/components/flow/CadenceNode'
import DelayNode from '@/components/flow/DelayNode'
import CadenceEdge from '@/components/flow/CadenceEdge'

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
  { id: '1', name: 'Welcome Sequence',  steps: 3 },
  { id: '2', name: 'Cold Outreach',     steps: 5 },
  { id: '3', name: 'Follow-up Series',  steps: 4 },
  { id: '4', name: 'Re-engagement',     steps: 2 },
]

const nodeTypes = { cadence: CadenceNode, delay: DelayNode }
const edgeTypes = { cadence: CadenceEdge }
const defaultEdgeOptions = { type: 'cadence', markerEnd: 'cadence-edge-circle' }

const initialNodes = [
  {
    id: 'n1',
    type: 'cadence',
    position: { x: 250, y: 40 },
    data: { title: 'Initial Email', subtitle: 'Introduce yourself' },
  },
  {
    id: 'n2',
    type: 'delay',
    position: { x: 270, y: 160 },
    data: { title: 'Wait 3 days' },
  },
  {
    id: 'n3',
    type: 'cadence',
    position: { x: 250, y: 270 },
    data: { title: 'Follow-up', subtitle: 'Check in on previous email' },
  },
  {
    id: 'n4',
    type: 'delay',
    position: { x: 270, y: 390 },
    data: { title: 'Wait 5 days' },
  },
  {
    id: 'n5',
    type: 'cadence',
    position: { x: 250, y: 500 },
    data: { title: 'Final Email', subtitle: 'Last chance to connect' },
  },
]

const initialEdges = [
  { id: 'e1-2', source: 'n1', target: 'n2' },
  { id: 'e2-3', source: 'n2', target: 'n3' },
  { id: 'e3-4', source: 'n3', target: 'n4' },
  { id: 'e4-5', source: 'n4', target: 'n5' },
]

const zoomSelector = (s) => Math.round(s.transform[2] * 100)

function ZoomSlider() {
  const { zoomTo, fitView } = useReactFlow()
  const zoom = useStore(zoomSelector)

  const handleZoomChange = useCallback((value) => {
    zoomTo(value[0] / 100)
  }, [zoomTo])

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
        <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
        <div className="w-px h-4 bg-border" />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => fitView()}
        >
          <Maximize className="size-3.5" />
        </Button>
      </div>
    </Panel>
  )
}

function TestWorkflowButton() {
  const [running, setRunning] = useState(false)

  const handleTest = useCallback(() => {
    setRunning(true)
    setTimeout(() => setRunning(false), 3000)
  }, [])

  return (
    <Panel position="top-right">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={handleTest} disabled={running}>
              {running ? (
                <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
              ) : (
                <Play className="size-4" data-icon="inline-start" />
              )}
              {running ? 'Running...' : 'Test Workflow'}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Test the workflow by sending emails to yourself
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Panel>
  )
}

function CreateCadencesInner() {
  const [activeCadence, setActiveCadence] = useState(cadences[0])
  const [nodes, setNodes] = useState(initialNodes)
  const [edges, setEdges] = useState(initialEdges)

  const onNodesChange = useCallback(
    changes => setNodes(n => applyNodeChanges(changes, n)), []
  )
  const onEdgesChange = useCallback(
    changes => setEdges(e => applyEdgeChanges(changes, e)), []
  )
  const onConnect = useCallback(
    params => setEdges(e => addEdge(params, e)), []
  )

  return (
    <SidebarProvider style={{ '--sidebar-width': '220px' }} className="!min-h-0 h-full !bg-transparent">
      <Sidebar collapsible="none" className="cadence-sidebar border-r border-border !bg-transparent">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Cadences</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {cadences.map(c => (
                  <SidebarMenuItem key={c.id}>
                    <SidebarMenuButton
                      isActive={activeCadence.id === c.id}
                      onClick={() => setActiveCadence(c)}
                    >
                      <span>{c.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{c.steps} steps</span>
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
          <h1 className="text-sm font-medium text-foreground">{activeCadence.name}</h1>
          <span className="text-xs text-muted-foreground">{activeCadence.steps} steps</span>
        </div>
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
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
            <Background color="rgba(255,255,255,0.15)" variant="dots" gap={20} size={1.5} />
            <TestWorkflowButton />
            <ZoomSlider />
            <svg>
              <defs>
                <linearGradient id="cadence-edge-gradient">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#2a8af6" />
                </linearGradient>
                <marker
                  id="cadence-edge-circle"
                  viewBox="-5 -5 10 10"
                  refX="0"
                  refY="0"
                  markerUnits="strokeWidth"
                  markerWidth="10"
                  markerHeight="10"
                  orient="auto"
                >
                  <circle stroke="#2a8af6" strokeOpacity="0.75" r="2" cx="0" cy="0" />
                </marker>
              </defs>
            </svg>
          </ReactFlow>
        </div>
      </SidebarInset>
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
