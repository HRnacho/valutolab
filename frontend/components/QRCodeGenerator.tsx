'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { X, Download, Copy } from 'lucide-react'

interface QRCodeGeneratorProps {
  profileUrl: string
  userName: string
  onClose: () => void
}

export default function QRCodeGenerator({ profileUrl, userName, onClose }: QRCodeGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)

  useEffect(() => {
    generateQRCode()
  }, [profileUrl])

  const generateQRCode = async () => {
    try {
      setIsGenerating(true)
      const dataUrl = await QRCode.toDataURL(profileUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: '#1C1917',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      })
      setQrDataUrl(dataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.download = `ValutoLab_QR_${userName.replace(/\s+/g, '_')}.png`
    link.href = qrDataUrl
    link.click()
  }

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl)
  }

  return (
    <div className="font-body text-ink-900">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-display text-[20px] font-medium text-ink-900 mb-0.5">
            Condividi con QR Code
          </h2>
          <p className="text-[13px] text-ink-400">
            Scansiona per vedere il profilo di <span className="font-medium text-ink-700">{userName}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-ink-400 hover:text-ink-700 transition-colors mt-0.5"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* QR Code */}
      <div className="bg-paper-100 border border-paper-300 rounded-md p-6 mb-4 flex justify-center">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <span className="w-6 h-6 border-2 border-ink-300 border-t-ink-700 rounded-full animate-spin" />
            <p className="text-[13px] text-ink-400">Generazione QR Code…</p>
          </div>
        ) : (
          <img
            src={qrDataUrl}
            alt="QR Code Profilo ValutoLab"
            className="w-56 h-56 bg-white p-3 border border-paper-200 rounded-sm shadow-sm"
          />
        )}
      </div>

      {/* URL */}
      <div className="bg-paper-100 border border-paper-300 rounded-sm px-4 py-3 mb-5">
        <p className="text-[11px] font-medium text-ink-400 mb-1 uppercase tracking-wide">Link profilo</p>
        <p className="text-[12px] font-mono text-ink-700 truncate">{profileUrl}</p>
      </div>

      {/* Bottoni */}
      <div className="space-y-2">
        <button
          onClick={downloadQRCode}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-ink-900 text-paper-50 text-[14px] font-medium rounded-sm hover:bg-ink-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Scarica QR Code PNG
        </button>

        <button
          onClick={copyLink}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 border border-paper-300 bg-paper-50 text-ink-700 text-[14px] font-medium rounded-sm hover:bg-paper-100 transition-colors"
        >
          <Copy className="w-4 h-4" />
          Copia Link
        </button>
      </div>

      {/* Suggerimento */}
      <div className="mt-5 px-4 py-3 bg-paper-200 border border-paper-300 rounded-sm">
        <p className="text-[12px] text-ink-600">
          <span className="font-semibold">Suggerimento:</span> Usa questo QR code su biglietti da visita, CV cartacei o presentazioni per condividere facilmente il tuo profilo ValutoLab.
        </p>
      </div>

    </div>
  )
}
