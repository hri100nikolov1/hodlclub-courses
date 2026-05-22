'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: `Здравей! Аз съм **AI Анализатор на HODLClub** 🔍

Анализирам криптовалутни проекти по **5-стълбовата методология** на HODLClub с **100-точкова scoring система**:

| Стълб | Точки |
|-------|-------|
| 🏛️ Фундаментален анализ | /30 |
| 💰 Токеномика | /20 |
| 🔗 On-Chain анализ | /20 |
| 🤝 Репутация и партньорства | /30 |

**Какво мога да правя:**
- Пълен структуриран анализ на всеки крипто проект
- Оценка на Bitcoin пазарните индикатори (Rainbow Chart, MVRV, NUPL и др.)
- Идентифициране на red flags
- Отговори на въпроси по крипто анализ

**Как да започнем:**
Напиши просто "Анализирай [проект]" — например:
- *"Анализирай Chainlink"*
- *"Анализирай Solana"*
- *"Какво показва MVRV за Bitcoin?"*

⚠️ Всички анализи са с образователна цел и не представляват финансов съвет.`,
}

function MessageContent({ content }: { content: string }) {
  // Simple markdown renderer for bold, tables, lists, headers
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Table detection
    if (line.includes('|') && lines[i + 1]?.includes('|---')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i])
        i++
      }
      const headers = tableLines[0].split('|').filter(Boolean).map(h => h.trim())
      const rows = tableLines.slice(2).map(r => r.split('|').filter(Boolean).map(c => c.trim()))
      elements.push(
        <div key={i} className="overflow-x-auto my-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-600">
                {headers.map((h, j) => (
                  <th key={j} className="text-left py-2 px-3 text-yellow-400 font-semibold">{renderInline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, j) => (
                <tr key={j} className="border-b border-gray-700/50">
                  {row.map((cell, k) => (
                    <td key={k} className="py-2 px-3 text-gray-200">{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    // H2
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-lg font-bold text-yellow-400 mt-4 mb-2">{renderInline(line.slice(3))}</h2>)
    }
    // H3
    else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-base font-bold text-indigo-300 mt-3 mb-1">{renderInline(line.slice(4))}</h3>)
    }
    // HR
    else if (line === '---') {
      elements.push(<hr key={i} className="border-gray-600 my-3" />)
    }
    // List item
    else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <div key={i} className="flex gap-2 my-0.5">
          <span className="text-yellow-500 mt-1 flex-shrink-0">•</span>
          <span className="text-gray-200 text-sm">{renderInline(line.slice(2))}</span>
        </div>
      )
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />)
    }
    // Normal paragraph
    else {
      elements.push(<p key={i} className="text-gray-200 text-sm leading-relaxed">{renderInline(line)}</p>)
    }
    i++
  }
  return <div className="space-y-0.5">{elements}</div>
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="text-gray-300 italic">{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-gray-700 px-1 rounded text-yellow-300 text-xs">{part.slice(1, -1)}</code>
    }
    return part
  })
}

const SUGGESTIONS = [
  'Анализирай Chainlink',
  'Анализирай Solana',
  'Анализирай Ethereum',
  'Какво показва MVRV за Bitcoin?',
  'Обясни ми Fear & Greed Index',
  'Какви са 10-те red flags?',
]

export default function AnalyzePage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg: Message = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.filter(m => m.role !== 'assistant' || m !== WELCOME_MESSAGE),
        }),
      })
      const data = await res.json()
      if (data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error ?? 'Грешка. Опитай отново.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Грешка при свързване. Опитай отново.' }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center shadow-lg flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Анализатор</h1>
          <p className="text-sm text-gray-500">Анализ по методологията на HODLClub • 5 стълба • 100 точки</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto bg-gray-900 rounded-2xl p-4 space-y-4 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-sm'
                : 'bg-gray-800 rounded-tl-sm'
            }`}>
              {msg.role === 'user'
                ? <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                : <MessageContent content={msg.content} />
              }
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-6">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions (shown only at start) */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напиши проект за анализ или задай въпрос... (Enter за изпращане)"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent max-h-32"
          style={{ minHeight: '48px' }}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-gray-400 text-center mt-2">
        ⚠️ Анализите са с образователна цел и не представляват финансов съвет
      </p>
    </div>
  )
}
