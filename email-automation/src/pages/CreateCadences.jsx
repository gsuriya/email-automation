import { useState, useCallback } from 'react'
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Plus, ArrowRight } from 'lucide-react'

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

const cadences = [
  { id: '1', name: 'Welcome Sequence',  steps: 3 },
  { id: '2', name: 'Cold Outreach',     steps: 5 },
  { id: '3', name: 'Follow-up Series',  steps: 4 },
  { id: '4', name: 'Re-engagement',     steps: 2 },
]

const defaultNodes = [
  {
    id: 'n1',
    position: { x: 80, y: 80 },
    data: { label: 'Day 0 — Send Email' },
    style: {
      background: '#1e1e2e',
      color: '#e2e8f0',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '13px',
    },
  },
  {
    id: 'n2',
    position: { x: 80, y: 200 },
    data: { label: 'Wait 3 days' },
    style: {
      background: '#16161e',
      color: '#94a3b8',
      border: '1px dashed rgba(255,255,255,0.1)',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '13px',
    },
  },
  {
    id: 'n3',
    position: { x: 80, y: 320 },
    data: { label: 'Day 3 — Follow-up' },
    style: {
      background: '#1e1e2e',
      color: '#e2e8f0',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '13px',
    },
  },
]

const defaultEdges = [
  { id: 'e1-2', source: 'n1', target: 'n2', style: { stroke: 'rgba(255,255,255,0.2)' } },
  { id: 'e2-3', source: 'n2', target: 'n3', style: { stroke: 'rgba(255,255,255,0.2)' } },
]

export default function CreateCadences() {
  const [activeCadence, setActiveCadence] = useState(cadences[0])
  const [nodes, setNodes] = useState(defaultNodes)
  const [edges, setEdges] = useState(defaultEdges)

  const onNodesChange = useCallback(
    changes => setNodes(n => applyNodeChanges(changes, n)), []
  )
  const onEdgesChange = useCallback(
    changes => setEdges(e => applyEdgeChanges(changes, e)), []
  )
  const onConnect = useCallback(
    params => setEdges(e => addEdge({ ...params, style: { stroke: 'rgba(255,255,255,0.2)' } }, e)), []
  )

  return (
    <SidebarProvider style={{ '--sidebar-width': '220px' }} className="!min-h-0 h-full">
      <Sidebar collapsible="none" className="border-r border-border">
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
            colorMode="dark"
            style={{ background: 'transparent' }}
          >
            <Background color="rgba(255,255,255,0.04)" gap={24} />
            <Controls />
            <MiniMap
              nodeColor="#1e1e2e"
              maskColor="rgba(0,0,0,0.4)"
              style={{ background: '#0a0a0f' }}
            />
          </ReactFlow>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
