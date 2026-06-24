import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Bot, Check, ChevronDown, Paperclip, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Anthropic from '@/components/kokonutui/anthropic'
import AnthropicDark from '@/components/kokonutui/anthropic-dark'
import { cn } from '@/lib/utils'
import { getGoogleAuthUrl, checkAuthStatus, sendEmail } from '@/lib/gmail'

const OPENAI_SVG = (
  <svg height="1em" viewBox="0 0 256 260" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
    <path fill="currentColor" d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Z" />
  </svg>
)

const AI_MODELS = ['Claude 4.5 Sonnet', 'GPT-5-mini', 'GPT-5-1', 'Gemini 3']

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
        <linearGradient id="gemini-grad" x1="0%" x2="68.73%" y1="100%" y2="30.395%">
          <stop offset="0%" stopColor="#1C7DFF" />
          <stop offset="100%" stopColor="#F0DCD6" />
        </linearGradient>
      </defs>
      <path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12" fill="url(#gemini-grad)" />
    </svg>
  ),
}

const ROW = 'flex items-center px-4 py-2.5 gap-4 border-b border-border'
const LABEL = 'text-xs font-medium text-muted-foreground w-16 shrink-0 uppercase tracking-widest'
const INPUT = 'flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border-none min-w-0'

export default function CreateDraft() {
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [selectedModel, setSelectedModel] = useState('Claude 4.5 Sonnet')

  const [authedEmail, setAuthedEmail] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState(null)

  useEffect(() => {
    checkAuthStatus().then(data => {
      if (data.authenticated) setAuthedEmail(data.email)
    }).catch(() => {})
  }, [])

  const handleSend = async () => {
    if (!authedEmail) {
      window.location.href = await getGoogleAuthUrl()
      return
    }
    setSending(true)
    setSendStatus(null)
    try {
      const result = await sendEmail({ to, cc: cc || undefined, bcc: bcc || undefined, subject, body })
      if (result.success) {
        setSendStatus('sent')
        setTo(''); setCc(''); setBcc(''); setSubject(''); setBody('')
        setShowCc(false); setShowBcc(false)
        setTimeout(() => setSendStatus(null), 3000)
      } else {
        setSendStatus('error')
        setTimeout(() => setSendStatus(null), 3000)
      }
    } catch {
      setSendStatus('error')
      setTimeout(() => setSendStatus(null), 3000)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-full w-full flex flex-col px-6 py-6 gap-4">
      <h1 className="text-lg font-semibold text-foreground tracking-tight shrink-0">Compose Draft</h1>

      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border overflow-hidden">

        {/* To */}
        <div className={ROW}>
          <span className={LABEL}>To</span>
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="recipient@example.com" className={INPUT} />
          <div className="flex items-center gap-1 shrink-0">
            {!showCc && (
              <button onClick={() => setShowCc(true)} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-white/5">
                CC
              </button>
            )}
            {!showBcc && (
              <button onClick={() => setShowBcc(true)} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-white/5">
                BCC
              </button>
            )}
          </div>
        </div>

        {/* CC */}
        <AnimatePresence>
          {showCc && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className={ROW}>
                <span className={LABEL}>CC</span>
                <input value={cc} onChange={e => setCc(e.target.value)} placeholder="cc@example.com" className={INPUT} autoFocus />
                <button onClick={() => { setShowCc(false); setCc('') }} className="text-xs text-muted-foreground hover:text-foreground px-1 shrink-0">✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BCC */}
        <AnimatePresence>
          {showBcc && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className={ROW}>
                <span className={LABEL}>BCC</span>
                <input value={bcc} onChange={e => setBcc(e.target.value)} placeholder="bcc@example.com" className={INPUT} autoFocus />
                <button onClick={() => { setShowBcc(false); setBcc('') }} className="text-xs text-muted-foreground hover:text-foreground px-1 shrink-0">✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subject */}
        <div className={ROW}>
          <span className={LABEL}>Subject</span>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..." className={INPUT} />
        </div>

        {/* Body */}
        <Textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your email..."
          className={cn(
            'flex-1 w-full resize-none rounded-none border-none bg-transparent px-5 py-4',
            'placeholder:text-muted-foreground/40 text-sm text-foreground',
            'focus-visible:ring-0 focus-visible:ring-offset-0 [field-sizing:fixed] min-h-0'
          )}
        />

        {/* Toolbar */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-t border-border">
          <div className="flex items-center gap-2">
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
                      {MODEL_ICONS[selectedModel]}
                      {selectedModel}
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[10rem] border-border bg-popover">
                {AI_MODELS.map(model => (
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

            <div className="w-px h-4 bg-border" />

            <label aria-label="Attach file" className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
              <input className="hidden" type="file" />
              <Paperclip className="h-4 w-4" />
            </label>
          </div>

          <div className="flex items-center gap-3">
            {sendStatus === 'sent' && <span className="text-xs text-green-400">Email sent!</span>}
            {sendStatus === 'error' && <span className="text-xs text-red-400">Failed to send</span>}
            {authedEmail && <span className="text-xs text-muted-foreground">{authedEmail}</span>}
            <button
              onClick={handleSend}
              disabled={sending || (!authedEmail && false) || (!body.trim() && !to.trim())}
              className="glow-cta disabled:opacity-20 disabled:pointer-events-none"
            >
              <span className="glow-cta-text">
                {sending ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> SENDING...</>
                ) : authedEmail ? (
                  <>SEND WITH GMAIL <ArrowRight className="h-3.5 w-3.5" /></>
                ) : (
                  <>CONNECT GMAIL <ArrowRight className="h-3.5 w-3.5" /></>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
