import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Bot,
  Check,
  ChevronDown,
  File,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  Save,
  Trash,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const AI_MODELS = ['Claude 4.5 Sonnet', 'GPT-5-mini', 'GPT-5-1', 'Gemini 3']
const MAX_TOTAL_ATTACHMENT_BYTES = 7 * 1024 * 1024

const OPENAI_SVG = (
  <svg height="1em" viewBox="0 0 256 260" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
    <path fill="currentColor" d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Z" />
  </svg>
)

const MODEL_ICONS = {
  'Claude 4.5 Sonnet': (
    <svg fill="currentColor" fillRule="evenodd" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
      <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
    </svg>
  ),
  'GPT-5-mini': OPENAI_SVG,
  'GPT-5-1': OPENAI_SVG,
  'Gemini 3': (
    <svg height="1em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="draft-gemini-grad" x1="0%" x2="68.73%" y1="100%" y2="30.395%">
          <stop offset="0%" stopColor="#1C7DFF" />
          <stop offset="100%" stopColor="#F0DCD6" />
        </linearGradient>
      </defs>
      <path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12" fill="url(#draft-gemini-grad)" />
    </svg>
  ),
}

const compactWhiteButtonClass = '!h-8 rounded-lg !border-2 !border-[#cfd4dc] !bg-white px-4 text-sm font-semibold !text-black shadow-[0_1px_0_rgba(255,255,255,0.55)_inset] hover:!border-[#b9c0ca] hover:!bg-white hover:!text-black [&_svg]:!text-black'
const compactDeleteButtonClass = '!h-8 rounded-lg !border-2 !border-[#ff747a] !bg-[#d94c51] px-4 text-sm font-semibold !text-white shadow-[0_1px_0_rgba(255,255,255,0.28)_inset] hover:!border-[#ff8c91] hover:!bg-[#ef5a60] hover:!text-white [&_svg]:!text-white'
const placeholderButtonClass = 'h-7 rounded-md border border-white/15 bg-transparent px-3 text-xs font-semibold text-foreground shadow-none hover:bg-white/10 hover:text-foreground'
const rowClass = 'flex items-center gap-4 border-b border-border px-4 py-2.5'
const labelClass = 'w-20 shrink-0 text-xs font-medium uppercase tracking-widest text-muted-foreground'
const inputClass = 'min-w-0 flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40'

const blankTemplate = () => ({
  id: null,
  name: 'New cold email',
  subject: 'Quick note for {{company}}',
  body: 'Hi {{name}},\n\n',
  attachments: [],
})

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function readFileAsAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const content = String(reader.result || '').split(',')[1] || ''
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        content,
      })
    }
    reader.onerror = () => reject(reader.error || new Error('Failed to read attachment.'))
    reader.readAsDataURL(file)
  })
}

export default function ColdEmailDrafts() {
  const [templates, setTemplates] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(blankTemplate())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedModel, setSelectedModel] = useState('Claude 4.5 Sonnet')
  const [editingTemplateId, setEditingTemplateId] = useState(null)
  const [editingTemplateName, setEditingTemplateName] = useState('')
  const fileInputRef = useRef(null)

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
          setDraft({ ...templates[0], attachments: templates[0].attachments || [] })
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedTemplate) setDraft({ ...selectedTemplate, attachments: selectedTemplate.attachments || [] })
  }, [selectedTemplate])

  const setDraftName = async (template, name) => {
    const trimmedName = name.trim() || template.name
    setTemplates((items) => items.map((item) => item.id === template.id ? { ...item, name: trimmedName } : item))
    if (draft.id === template.id) setDraft((current) => ({ ...current, name: trimmedName }))
    setEditingTemplateId(null)

    try {
      const { template: saved } = await api.updateTemplate(template.id, { name: trimmedName })
      setTemplates((items) => items.map((item) => item.id === saved.id ? saved : item))
      if (draft.id === saved.id) setDraft({ ...saved, attachments: saved.attachments || [] })
    } catch (err) {
      toast.error(err.message)
    }
  }

  const createNewDraft = () => {
    setSelectedId(null)
    setDraft(blankTemplate())
  }

  const insertPlaceholder = (placeholder) => {
    setDraft((current) => ({
      ...current,
      body: `${current.body}${current.body.endsWith(' ') || current.body.endsWith('\n') ? '' : ' '}{{${placeholder}}}`,
    }))
  }

  const attachFiles = async (files) => {
    const incomingFiles = [...files]
    if (!incomingFiles.length) return

    const currentSize = (draft.attachments || []).reduce((total, attachment) => total + Number(attachment.size || 0), 0)
    const incomingSize = incomingFiles.reduce((total, file) => total + file.size, 0)
    if (currentSize + incomingSize > MAX_TOTAL_ATTACHMENT_BYTES) {
      toast.error('Attachments must be under 7 MB total')
      return
    }

    try {
      const attachments = await Promise.all(incomingFiles.map(readFileAsAttachment))
      setDraft((current) => ({
        ...current,
        attachments: [...(current.attachments || []), ...attachments],
      }))
      toast.success(incomingFiles.length === 1 ? 'Attachment added' : 'Attachments added')
    } catch (err) {
      toast.error(err.message || 'Failed to attach file')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (attachmentId) => {
    setDraft((current) => ({
      ...current,
      attachments: (current.attachments || []).filter((attachment) => attachment.id !== attachmentId),
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      if (draft.id) {
        const { template } = await api.updateTemplate(draft.id, draft)
        setTemplates((items) => items.map((item) => item.id === template.id ? template : item))
        setDraft({ ...template, attachments: template.attachments || [] })
        toast.success('Draft saved')
      } else {
        const { template } = await api.createTemplate(draft)
        setTemplates((items) => [template, ...items])
        setSelectedId(template.id)
        setDraft({ ...template, attachments: template.attachments || [] })
        toast.success('Draft created')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (template = draft) => {
    if (!template.id) {
      setDraft(blankTemplate())
      return
    }

    try {
      await api.deleteTemplate(template.id)
      const remaining = templates.filter((item) => item.id !== template.id)
      setTemplates(remaining)
      if (draft.id === template.id) {
        setSelectedId(remaining[0]?.id || null)
        setDraft(remaining[0] ? { ...remaining[0], attachments: remaining[0].attachments || [] } : blankTemplate())
      }
      toast.success('Draft deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <SidebarProvider
      style={{ '--sidebar-width': '240px' }}
      className="!min-h-0 h-full !bg-transparent"
    >
      <Sidebar collapsible="none" className="cadence-sidebar border-r border-border !bg-transparent">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Saved drafts</SidebarGroupLabel>
            <SidebarGroupContent>
              {loading ? <p className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</p> : null}
              {!loading && templates.length === 0 ? <p className="px-2 py-1.5 text-sm text-muted-foreground">No drafts yet.</p> : null}
              <SidebarMenu>
                {templates.map((template) => (
                  <SidebarMenuItem key={template.id}>
                    {editingTemplateId === template.id ? (
                      <input
                        className="w-full rounded-md bg-transparent px-2 py-1.5 text-sm text-sidebar-foreground outline-none ring-1 ring-sidebar-ring"
                        value={editingTemplateName}
                        onChange={(event) => setEditingTemplateName(event.target.value)}
                        onBlur={() => setDraftName(template, editingTemplateName)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') event.currentTarget.blur()
                          if (event.key === 'Escape') setEditingTemplateId(null)
                        }}
                        autoFocus
                      />
                    ) : (
                      <SidebarMenuButton
                        isActive={template.id === selectedId}
                        onClick={() => setSelectedId(template.id)}
                      >
                        <span>{template.name}</span>
                      </SidebarMenuButton>
                    )}
                    <SidebarMenuAction
                      showOnHover
                      onClick={(event) => {
                        event.stopPropagation()
                        setEditingTemplateId(template.id)
                        setEditingTemplateName(template.name)
                      }}
                      style={{ right: '24px' }}
                    >
                      <Pencil className="size-3" />
                    </SidebarMenuAction>
                    <SidebarMenuAction
                      showOnHover
                      onClick={(event) => {
                        event.stopPropagation()
                        remove(template)
                      }}
                    >
                      <Trash className="size-3" />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-border p-3">
          <Button variant="outline" size="sm" onClick={createNewDraft} className="h-8 justify-center gap-2">
            <Plus className="size-4" />
            New Draft
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0">
        <div className="flex h-full min-h-0 flex-col gap-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-semibold tracking-tight">Create Drafts</h1>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border bg-background/20">
            <div className={rowClass}>
              <span className={labelClass}>Subject</span>
              <input
                value={draft.subject}
                onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
                placeholder="Email subject..."
                className={inputClass}
              />
            </div>

            <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
              {['name', 'company', 'email'].map((placeholder) => (
                <Button
                  key={placeholder}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertPlaceholder(placeholder)}
                  className={placeholderButtonClass}
                >
                  {'{{'}{placeholder}{'}}'}
                </Button>
              ))}
            </div>

            <Textarea
              value={draft.body}
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              placeholder="Write your email..."
              className={cn(
                'min-h-0 flex-1 resize-none rounded-none border-none bg-transparent px-5 py-4 text-sm text-foreground',
                'placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 [field-sizing:fixed]'
              )}
            />

            {(draft.attachments || []).length ? (
              <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2">
                {(draft.attachments || []).map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex max-w-[260px] items-center gap-2 rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-xs text-muted-foreground"
                  >
                    <File className="size-3.5 shrink-0 text-foreground" />
                    <span className="truncate text-foreground">{attachment.name}</span>
                    <span className="shrink-0">{formatBytes(attachment.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="shrink-0 rounded-sm p-0.5 hover:bg-white/10 hover:text-foreground"
                      aria-label={`Remove ${attachment.name}`}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex shrink-0 items-center justify-between border-t border-border px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedModel}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.12 }}
                          className="flex items-center gap-1.5"
                        >
                          {MODEL_ICONS[selectedModel] || <Bot className="h-4 w-4 opacity-50" />}
                          <span>{selectedModel}</span>
                          <span className="rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Coming Soon!
                          </span>
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </motion.div>
                      </AnimatePresence>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-[10rem] border-border bg-popover">
                    {AI_MODELS.map((model) => (
                      <DropdownMenuItem
                        key={model}
                        className="flex items-center justify-between gap-2"
                        onSelect={() => setSelectedModel(model)}
                      >
                        <div className="flex items-center gap-2">
                          {MODEL_ICONS[model] || <Bot className="h-4 w-4 opacity-50" />}
                          <span>{model}</span>
                        </div>
                        {selectedModel === model && <Check className="h-3.5 w-3.5 text-blue-500" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-4 w-px bg-border" />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                  aria-label="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  multiple
                  onChange={(event) => attachFiles(event.target.files || [])}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => remove()} className={compactDeleteButtonClass}>
                  <Trash2 className="size-4" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  onClick={save}
                  disabled={saving || !draft.name.trim() || !draft.subject.trim() || !draft.body.trim()}
                  className={compactWhiteButtonClass}
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save draft
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
