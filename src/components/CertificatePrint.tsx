'use client'

import Image from 'next/image'

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
  lessonTitle,
  moduleTitle,
  courseTitle,
  issuedAt,
  certificateId,
}: Props) {
  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate, #certificate * { visibility: visible; }
          #certificate { position: fixed; inset: 0; }
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
        <div
          id="certificate"
          className="bg-white w-full max-w-3xl aspect-[1.414/1] relative overflow-hidden shadow-2xl"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {/* Gold border frame */}
          <div className="absolute inset-3 border-4 border-yellow-500 rounded-sm pointer-events-none" />
          <div className="absolute inset-4 border border-yellow-400/60 rounded-sm pointer-events-none" />

          {/* Corner ornaments */}
          <svg className="absolute top-6 left-6 w-12 h-12 text-yellow-500" viewBox="0 0 50 50" fill="currentColor">
            <path d="M0 0 L20 0 L0 20 Z M25 0 L50 0 L50 25 L25 0 Z M0 25 L0 50 L25 50 L0 25 Z" opacity="0.3" />
            <path d="M5 5 L15 5 L5 15 Z" />
          </svg>
          <svg className="absolute top-6 right-6 w-12 h-12 text-yellow-500 scale-x-[-1]" viewBox="0 0 50 50" fill="currentColor">
            <path d="M0 0 L20 0 L0 20 Z M25 0 L50 0 L50 25 L25 0 Z M0 25 L0 50 L25 50 L0 25 Z" opacity="0.3" />
            <path d="M5 5 L15 5 L5 15 Z" />
          </svg>
          <svg className="absolute bottom-6 left-6 w-12 h-12 text-yellow-500 scale-y-[-1]" viewBox="0 0 50 50" fill="currentColor">
            <path d="M0 0 L20 0 L0 20 Z M25 0 L50 0 L50 25 L25 0 Z M0 25 L0 50 L25 50 L0 25 Z" opacity="0.3" />
            <path d="M5 5 L15 5 L5 15 Z" />
          </svg>
          <svg className="absolute bottom-6 right-6 w-12 h-12 text-yellow-500 scale-[-1]" viewBox="0 0 50 50" fill="currentColor">
            <path d="M0 0 L20 0 L0 20 Z M25 0 L50 0 L50 25 L25 0 Z M0 25 L0 50 L25 50 L0 25 Z" opacity="0.3" />
            <path d="M5 5 L15 5 L5 15 Z" />
          </svg>

          {/* Background watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
            <span className="text-9xl font-black text-indigo-900 rotate-[-30deg]">HODLClub</span>
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-16 py-10 text-center">
            {/* Logo / Brand */}
            <div className="mb-6">
              <Image
                src="/hodlclub_logo.png"
                alt="HODLClub"
                width={100}
                height={100}
                className="h-16 w-auto object-contain mx-auto"
              />
            </div>

            {/* Title */}
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-yellow-600 mb-2">
              Сертификат за отличен резултат
            </p>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent mb-6" />

            {/* Recipient */}
            <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'system-ui, sans-serif' }}>Настоящият сертификат се присъжда на</p>
            <h1 className="text-4xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
              {userName}
            </h1>
            <div className="w-48 h-0.5 bg-gray-300 mb-6 mx-auto" />

            {/* Achievement */}
            <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'system-ui, sans-serif' }}>за постигане на 100% резултат в теста към урок</p>
            <p className="text-xl font-semibold text-indigo-700 mb-1">„{lessonTitle}"</p>
            <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: 'system-ui, sans-serif' }}>
              от курс <span className="font-medium text-gray-700">„{courseTitle}"</span>
            </p>

            {/* Medal icon */}
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg mx-auto">
                <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>

            {/* Date + ID */}
            <div className="flex items-center gap-8 text-xs text-gray-400" style={{ fontFamily: 'system-ui, sans-serif' }}>
              <div className="text-center">
                <p className="font-semibold text-gray-600 text-sm">{issuedAt}</p>
                <p className="uppercase tracking-widest text-[10px]">Дата</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <p className="font-mono text-gray-500 text-xs">{certificateId.slice(0, 8).toUpperCase()}</p>
                <p className="uppercase tracking-widest text-[10px]">Номер</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
