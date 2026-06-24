import { useEffect, useMemo, useState } from 'react'
import { PanelLeftClose, PanelLeftOpen, Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const compactWhiteButtonClass = '!h-8 rounded-lg !border-2 !border-[#cfd4dc] !bg-white px-4 text-sm font-semibold !text-black shadow-[0_1px_0_rgba(255,255,255,0.55)_inset] hover:!border-[#b9c0ca] hover:!bg-white hover:!text-black [&_svg]:!text-black'
const compactDeleteButtonClass = '!h-8 rounded-lg !border-2 !border-[#ff747a] !bg-[#d94c51] px-4 text-sm font-semibold !text-white shadow-[0_1px_0_rgba(255,255,255,0.28)_inset] hover:!border-[#ff8c91] hover:!bg-[#ef5a60] hover:!text-white [&_svg]:!text-white'

const blankTemplate = () => ({
  id: null,
  name: 'New cold email',
  subject: 'Quick note for {{company}}',
  body: 'Hi {{name}},\n\n',
})

export default function ColdEmailDrafts() {
  const [templates, setTemplates] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(blankTemplate())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draftSidebarOpen, setDraftSidebarOpen] = useState(true)

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId),
    [templates, selectedId]
  )

  useEffect(() => {
    api.listTemplates()
      .then(({ templates }) => {
        setTemplates(templates)
        if (templates[0]) {
          setSelectedId(templates[0].id)
          setDraft(templates[0])
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedTemplate) setDraft(selectedTemplate)
  }, [selectedTemplate])

  const insertPlaceholder = (placeholder) => {
    setDraft((current) => ({
      ...current,
      body: `${current.body}${current.body.endsWith(' ') || current.body.endsWith('\n') ? '' : ' '}{{${placeholder}}}`,
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      if (draft.id) {
        const { template } = await api.updateTemplate(draft.id, draft)
        setTemplates((items) => items.map((item) => item.id === template.id ? template : item))
        toast.success('Draft template saved')
      } else {
        const { template } = await api.createTemplate(draft)
        setTemplates((items) => [template, ...items])
        setSelectedId(template.id)
        setDraft(template)
        toast.success('Draft template created')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!draft.id) {
      setDraft(blankTemplate())
      return
    }

    try {
      await api.deleteTemplate(draft.id)
      const remaining = templates.filter((template) => template.id !== draft.id)
      setTemplates(remaining)
      setSelectedId(remaining[0]?.id || null)
      setDraft(remaining[0] || blankTemplate())
      toast.success('Draft template deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Create Drafts</h1>
        </div>
        <Button variant="ghost" onClick={() => { setSelectedId(null); setDraft(blankTemplate()) }} className={compactWhiteButtonClass}>
          <Plus className="size-4" />
          New draft
        </Button>
      </div>

      <SidebarProvider
        open={draftSidebarOpen}
        onOpenChange={setDraftSidebarOpen}
        className="!min-h-0 h-full !bg-transparent"
      >
        <div
          className="grid min-h-0 w-full flex-1 overflow-hidden rounded-md border bg-background/20 transition-[grid-template-columns] duration-200"
          style={{ gridTemplateColumns: draftSidebarOpen ? '280px minmax(0, 1fr)' : '52px minmax(0, 1fr)' }}
        >
          <aside
            className={cn(
              'flex min-h-0 flex-col overflow-hidden border-r bg-sidebar/20 text-sidebar-foreground',
              !draftSidebarOpen && 'items-center'
            )}
          >
            <div className="flex h-10 shrink-0 items-center justify-between border-b px-2">
              {draftSidebarOpen ? (
                <span className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Saved drafts
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setDraftSidebarOpen((open) => !open)}
                className="inline-flex size-8 items-center justify-center rounded-md text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                aria-label={draftSidebarOpen ? 'Collapse saved drafts' : 'Open saved drafts'}
              >
                {draftSidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
              </button>
            </div>

            {draftSidebarOpen ? (
              <SidebarContent className="bg-transparent">
                <SidebarGroup>
                  <SidebarGroupLabel className="sr-only">Saved drafts</SidebarGroupLabel>
                  <SidebarGroupContent>
                    {loading ? <p className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</p> : null}
                    {!loading && templates.length === 0 ? <p className="px-2 py-1.5 text-sm text-muted-foreground">No drafts yet.</p> : null}
                    <SidebarMenu>
                      {templates.map((template) => (
                        <SidebarMenuItem key={template.id}>
                          <SidebarMenuButton
                            isActive={template.id === selectedId}
                            onClick={() => setSelectedId(template.id)}
                            className="font-medium"
                          >
                            <span>{template.name}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            ) : null}
          </aside>

          <div className="flex min-h-0 flex-col gap-4 p-4">
            <div className="grid gap-2">
              <Label htmlFor="template-name">Template name</Label>
              <Input id="template-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template-subject">Subject</Label>
              <Input id="template-subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
            </div>
            <div className="flex flex-wrap gap-2">
              {['name', 'company', 'email'].map((placeholder) => (
                <Button key={placeholder} type="button" variant="outline" size="sm" onClick={() => insertPlaceholder(placeholder)}>
                  {'{{'}{placeholder}{'}}'}
                </Button>
              ))}
            </div>
            <div className="grid min-h-0 flex-1 gap-2">
              <Label htmlFor="template-body">Body</Label>
              <Textarea
                id="template-body"
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                className="min-h-[320px] flex-1 resize-none"
              />
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="ghost" onClick={remove} className={compactDeleteButtonClass}>
                <Trash2 className="size-4" />
                Delete
              </Button>
              <Button variant="ghost" onClick={save} disabled={saving || !draft.name.trim() || !draft.subject.trim() || !draft.body.trim()} className={compactWhiteButtonClass}>
                <Save className="size-4" />
                Save draft
              </Button>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}
