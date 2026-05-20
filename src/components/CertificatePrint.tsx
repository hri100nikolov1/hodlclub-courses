'use client'

type Props = {
  userName: string
  lessonTitle: string
  moduleTitle: string
  courseTitle: string
  issuedAt: string
  certificateId: string
}

export default function CertificatePrint({
  userName,
  moduleTitle,
  issuedAt,
  certificateId,
}: Props) {
  // Extract just the module number/short name for the blanks in the template
  // e.g. "Модул 3: Основните играчи" → "3-ти"
  const moduleShort = moduleTitle.match(/Модул\s+(\d+)/i)
    ? (() => {
        const n = parseInt(moduleTitle.match(/Модул\s+(\d+)/i)![1])
        const suffixes: Record<number, string> = { 1: '1-ви', 2: '2-ри', 3: '3-ти', 4: '4-ти', 5: '5-ти', 6: '6-ти', 7: '7-ми' }
        return suffixes[n] ?? `${n}-ти`
      })()
    : moduleTitle

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate, #certificate * { visibility: visible; }
          #certificate { position: fixed; inset: 0; width: 100vw; height: 100vh; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Action bar */}
      <div className="no-print flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <a
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад към таблото
        </a>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Принтирай / Запази като PDF
        </button>
      </div>

      {/* Certificate */}
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div
          id="certificate"
          className="relative w-full shadow-2xl"
          style={{ maxWidth: '900px', aspectRatio: '2752 / 1536' }}
        >
          {/* Template background */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/certificate-template.png"
            alt="Certificate background"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />

          {/* Overlays — all positioned as % of container */}
          <div className="absolute inset-0" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

            {/* Module number in the title line: "СЕРТИФИКАТ ЗА ПРЕМИНАВАНЕ НА ___ МОДУЛ" */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                top: '32%',
                left: '66%',
                width: '13%',
              }}
            >
              <span
                className="font-bold text-center tracking-wide uppercase"
                style={{ color: '#C9A84C', fontSize: 'clamp(10px, 2.2vw, 30px)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
              >
                {moduleShort}
              </span>
            </div>

            {/* User name on the long underline */}
            <div
              className="absolute flex items-end justify-center"
              style={{ top: '45%', left: '50%', transform: 'translateX(-50%)', width: '70%' }}
            >
              <span
                className="font-bold text-center tracking-widest"
                style={{ color: '#ffffff', fontSize: 'clamp(11px, 2.4vw, 34px)', textShadow: '0 1px 6px rgba(0,0,0,0.9)', letterSpacing: '0.08em' }}
              >
                {userName}
              </span>
            </div>

            {/* Module number in the body text: "е успешно завършил/а ___ модул" */}
            <div
              className="absolute flex items-center"
              style={{ top: '55%', left: '34%', width: '12%' }}
            >
              <span
                className="font-semibold text-center w-full"
                style={{ color: '#C9A84C', fontSize: 'clamp(8px, 1.4vw, 20px)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
              >
                {moduleShort}
              </span>
            </div>

            {/* Date value */}
            <div
              className="absolute flex items-center"
              style={{ top: '79%', left: '23%', width: '22%' }}
            >
              <span
                style={{ color: '#C9A84C', fontSize: 'clamp(7px, 1.2vw, 17px)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
              >
                {issuedAt}
              </span>
            </div>

            {/* Certificate number value */}
            <div
              className="absolute flex items-center"
              style={{ top: '85%', left: '29%', width: '22%' }}
            >
              <span
                className="font-mono"
                style={{ color: '#C9A84C', fontSize: 'clamp(7px, 1.1vw, 16px)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
              >
                {certificateId.slice(0, 10).toUpperCase()}
              </span>
            </div>


          </div>
        </div>
      </div>
    </>
  )
}
