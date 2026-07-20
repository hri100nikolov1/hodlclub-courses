'use client'

import { useEffect, useRef, useState } from 'react'
import type { PageFlip } from 'page-flip'

type Props = {
  /** Gated endpoint that streams the PDF (cookie-authenticated, same-origin). */
  pdfUrl: string
  title: string
}

type Status = 'loading' | 'rendering' | 'ready' | 'error'

/**
 * Renders a gated PDF as a page-turning flipbook (like a real book, flipping
 * sideways) instead of a vertically scrolling document.
 *
 * pdfjs + page-flip are imported lazily inside the effect so nothing touches
 * browser-only globals during SSR.
 */
export default function FlipBook({ pdfUrl, title }: Props) {
  const bookRef = useRef<HTMLDivElement>(null)
  const flipRef = useRef<PageFlip | null>(null)

  const [status, setStatus] = useState<Status>('loading')
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState<string[]>([])
  const [current, setCurrent] = useState(0)

  // 1) Load the PDF and render every page to an image.
  useEffect(() => {
    let cancelled = false
    let worker: Worker | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pdfDoc: any = null

    ;(async () => {
      try {
        // Use the legacy build — it ships the polyfills pdfjs v6 relies on
        // (e.g. Map.prototype.getOrInsertComputed), which the default build
        // assumes the runtime provides.
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
        // Bundler-friendly worker wiring: instantiate the worker ourselves and
        // hand pdfjs the port. (Setting only workerSrc can leave getDocument
        // hanging under Turbopack because the worker never spawns.)
        worker = new Worker(
          new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url),
          { type: 'module' },
        )
        pdfjs.GlobalWorkerOptions.workerPort = worker

        const res = await fetch(pdfUrl, { credentials: 'include' })
        if (!res.ok) throw new Error(`PDF ${res.status}`)
        const data = await res.arrayBuffer()
        if (cancelled) return

        pdfDoc = await pdfjs.getDocument({ data }).promise
        if (cancelled) return
        setTotal(pdfDoc.numPages)
        setStatus('rendering')

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        const imgs: string[] = []

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i)
          const viewport = page.getViewport({ scale: 2 })
          canvas.width = viewport.width
          canvas.height = viewport.height
          await page.render({ canvasContext: ctx, viewport, canvas }).promise
          imgs.push(canvas.toDataURL('image/jpeg', 0.85))
          if (cancelled) return
          setProgress(i)
        }

        setPages(imgs)
        setStatus('ready')
      } catch (err) {
        console.error('FlipBook load error:', err)
        if (!cancelled) setStatus('error')
      }
    })()

    return () => {
      cancelled = true
      try {
        pdfDoc?.destroy()
      } catch {
        /* ignore */
      }
      worker?.terminate()
    }
  }, [pdfUrl])

  // 2) Once the page images are in the DOM, hand them to page-flip.
  useEffect(() => {
    if (status !== 'ready' || !bookRef.current || flipRef.current) return
    let destroyed = false

    ;(async () => {
      const { PageFlip } = await import('page-flip')
      if (destroyed || !bookRef.current) return

      const flip = new PageFlip(bookRef.current, {
        width: 431,
        height: 650,
        size: 'stretch',
        minWidth: 300,
        maxWidth: 620,
        minHeight: 452,
        maxHeight: 935,
        maxShadowOpacity: 0.5,
        showCover: true,
        mobileScrollSupport: true,
        drawShadow: true,
        flippingTime: 700,
        useMouseEvents: true,
      })

      const items = bookRef.current.querySelectorAll<HTMLElement>('.flip-page')
      flip.loadFromHTML(items)

      flip.on('flip', (e) => setCurrent(e.data))
      flipRef.current = flip
    })()

    return () => {
      destroyed = true
      if (flipRef.current) {
        try {
          flipRef.current.destroy()
        } catch {
          /* ignore */
        }
        flipRef.current = null
      }
    }
  }, [status])

  if (status === 'error') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-700 font-medium mb-2">Не успяхме да заредим книгата тук.</p>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-indigo-600 font-medium hover:underline"
        >
          Отвори PDF в нов таб
        </a>
      </div>
    )
  }

  if (status === 'loading' || status === 'rendering') {
    const pct = total ? Math.round((progress / total) * 100) : 0
    return (
      <div className="rounded-2xl border border-gray-200 bg-white/60 dark:bg-white/5 p-12 text-center">
        <svg className="animate-spin w-8 h-8 text-indigo-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-gray-500 text-sm">
          {status === 'loading' ? 'Зареждане на книгата…' : `Подготвяне на страниците… ${progress}/${total}`}
        </p>
        {status === 'rendering' && (
          <div className="mt-3 mx-auto max-w-xs h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="select-none">
      <div className="mx-auto w-full max-w-[1000px]">
        <div ref={bookRef} className="flip-book mx-auto" style={{ touchAction: 'pan-y' }}>
          {pages.map((src, i) => (
            <div key={i} className="flip-page bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${title} — страница ${i + 1}`}
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-5">
        <button
          onClick={() => flipRef.current?.flipPrev()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition disabled:opacity-40"
          aria-label="Предишна страница"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Назад
        </button>
        <span className="text-sm text-gray-500 tabular-nums min-w-[70px] text-center">
          {current + 1} / {pages.length}
        </span>
        <button
          onClick={() => flipRef.current?.flipNext()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition disabled:opacity-40"
          aria-label="Следваща страница"
        >
          Напред
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">Прелисти с плъзгане или със стрелките</p>
    </div>
  )
}
