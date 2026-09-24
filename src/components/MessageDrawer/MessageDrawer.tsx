import { useEffect, useRef, useState } from 'react'
import { Chip } from '../Chip/Chip'
import { Icon } from '../Icon/Icon'
import { Link } from '../Link/Link'
import { MessageDrawerProps } from './MessageDrawer.types'
import { ArrowLeft, CheckCircle2, ChevronDown, DollarSign, MoreHorizontal, MoreVertical, Paperclip, RotateCcw, Rows3, Smile, Sparkles } from 'lucide-react'

interface Message {
  id: string
  sender: 'patient' | 'agent'
  text: string
  time: string
}

interface ApptCard {
  doctorName: string
  doctorTitle: string
  apptType: string
  datetime: string
  time: string
}

const MOCK_MESSAGES: Message[] = [
  { id: '1', sender: 'patient', text: "Hi, I'd like to book a pediatric dental checkup for my child next week.", time: '09:12 PM' },
  { id: '2', sender: 'agent',   text: "I'd be happy to help. We have an opening with Dr. Tinna Lee on Wednesday at 1:20 PM. Would that work for you?", time: '09:13 PM' },
  { id: '3', sender: 'patient', text: 'Yes, that time works.', time: '09:14 PM' },
  { id: '4', sender: 'agent',   text: "Great! I've booked your appointment.", time: '09:16 PM' },
]

const MOCK_CARD: ApptCard = {
  doctorName: 'Dr. Tinna Lee',
  doctorTitle: 'Pediatric dentist',
  apptType: 'Pediatric Dental Checkup',
  datetime: 'Wed Aug 23, 2023 • 01:20 PM – 02:00 PM IST',
  time: '09:18 PM',
}

const DATE_LABEL = 'Thu • Dec 17'

const CHANNEL_LABEL: Record<'message' | 'email', string> = {
  message: 'Message',
  email: 'Email',
}

export function MessageDrawer({ open, patient, status = 'Unconfirmed', initialChannel = 'email', onClose }: MessageDrawerProps) {
  const [message, setMessage] = useState('')
  const [channel, setChannel] = useState(initialChannel)
  const [channelMenuOpen, setChannelMenuOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setChannel(initialChannel)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, initialChannel])

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-2 top-2 z-[101] flex h-[calc(100%-16px)] w-[650px] flex-col overflow-hidden rounded-2xl bg-surface shadow-modal transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-lg py-md">
          <div className="flex items-center gap-sm">
            <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover">
              <ArrowLeft className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
            </button>
            <span className="text-h3 text-text-primary">{patient}</span>
            <Chip label={status} variant={status === 'Unconfirmed' ? 'warning' : status === 'Cancelled' ? 'danger' : status === 'No-show' ? 'danger' : 'success'} />
          </div>
          <div className="flex items-center gap-sm">
            <button type="button" className="flex h-8 items-center gap-xs rounded-md border border-border-selected bg-surface px-sm text-body text-text-primary hover:bg-surface-hover">
              Unassigned
              <ChevronDown className="size-4 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
            </button>
            <button type="button" className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover">
              <MoreVertical className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col gap-md overflow-y-auto px-lg py-lg">
          {/* Date separator */}
          <div className="flex items-center justify-center">
            <span className="text-small text-text-secondary">{DATE_LABEL}</span>
          </div>

          {MOCK_MESSAGES.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'agent' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[70%] rounded-lg px-md py-sm text-body ${
                  msg.sender === 'agent'
                    ? 'bg-[#dbeafe] text-text-primary'
                    : 'bg-[#f0f0f0] text-text-primary'
                }`}
              >
                {msg.text}
              </div>
              <span className="mt-xs text-small text-text-secondary">{msg.time}</span>
            </div>
          ))}

          {/* Appointment card */}
          <div className="flex flex-col items-end">
            <div className="w-full max-w-[420px] rounded-lg border border-border bg-[#fdf8ee] p-md">
              <div className="mb-sm flex items-center gap-xs">
                <CheckCircle2 className="size-4 text-success" strokeWidth={1.6} absoluteStrokeWidth />
                <span className="text-body text-text-primary">Appointment booked</span>
              </div>
              <div className="mb-sm border-t border-border" />
              <div className="mb-sm flex items-center gap-sm">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#c7d2fe] text-body text-[#4338ca]">
                  TL
                </div>
                <div>
                  <div className="text-body text-text-primary">{MOCK_CARD.doctorName}</div>
                  <div className="text-small text-text-secondary">{MOCK_CARD.doctorTitle}</div>
                </div>
              </div>
              <div className="mb-xs">
                <div className="text-small text-text-secondary">Appointment type</div>
                <div className="text-body text-text-primary">{MOCK_CARD.apptType}</div>
              </div>
              <div className="mb-sm">
                <div className="text-small text-text-secondary">Booking date and time</div>
                <div className="text-body text-text-primary">{MOCK_CARD.datetime}</div>
              </div>
              <div className="flex items-center gap-md">
                <Link as="button" className="flex items-center gap-xs text-small">
                  <RotateCcw className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
                  Reschedule
                </Link>
                <Link as="button" className="text-small">Send reminder</Link>
                <button type="button" className="text-text-icon">
                  <MoreHorizontal className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
                </button>
              </div>
            </div>
            <span className="mt-xs text-small text-text-secondary">{MOCK_CARD.time}</span>
          </div>

          <div ref={bottomRef} />
        </div>

        {/* Footer */}
        <div className="p-2xl">
          {/* Bordered compose box */}
          <div className="rounded-md border border-border p-md">
            {/* Channel selector */}
            <div className="relative mb-sm">
              <button
                type="button"
                onClick={() => setChannelMenuOpen((o) => !o)}
                className="flex items-center gap-xs text-body text-text-action"
              >
                {CHANNEL_LABEL[channel]}
                <Icon name="expand_more" size={16} />
              </button>
              {channelMenuOpen && (
                <div className="absolute left-0 top-full z-10 mt-xs min-w-[140px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
                  {(Object.keys(CHANNEL_LABEL) as Array<'message' | 'email'>).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setChannel(key)
                        setChannelMenuOpen(false)
                      }}
                      className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                    >
                      {CHANNEL_LABEL[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Text input */}
            <div className="mb-md min-h-[48px]">
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message or use a template"
                className="w-full resize-none bg-transparent text-body text-text-primary outline-none placeholder:text-text-secondary"
              />
            </div>

            {/* Toolbar + Send */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-sm text-text-icon">
                <button type="button" className="hover:text-text-primary"><Rows3 className="size-5" strokeWidth={1.6} absoluteStrokeWidth /></button>
                <button type="button" className="hover:text-text-primary"><DollarSign className="size-5" strokeWidth={1.6} absoluteStrokeWidth /></button>
                <button type="button" className="hover:text-text-primary"><Paperclip className="size-5" strokeWidth={1.6} absoluteStrokeWidth /></button>
                <button type="button" className="hover:text-text-primary"><Smile className="size-5" strokeWidth={1.6} absoluteStrokeWidth /></button>
                <button type="button" className="hover:text-text-primary"><Sparkles className="size-5" strokeWidth={1.6} absoluteStrokeWidth /></button>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  className="flex h-9 items-center rounded-l-sm bg-primary px-lg text-body text-white hover:bg-primary-hover"
                >
                  Send
                </button>
                <button
                  type="button"
                  className="flex h-9 items-center justify-center rounded-r-sm border-l border-white/30 bg-primary px-sm text-white hover:bg-primary-hover"
                >
                  <ChevronDown className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
