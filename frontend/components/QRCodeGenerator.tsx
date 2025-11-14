'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

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
          dark: '#8B5CF6', // Colore brand viola
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // High error correction
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
    <div>
      {/* Header */}
      <div className="text-center mb-6 relative">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-4xl mb-3">📱</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Condividi con QR Code
        </h2>
        <p className="text-gray-600 text-sm">
          Scansiona per vedere il profilo di <span className="font-semibold">{userName}</span>
        </p>
      </div>

      {/* QR Code display */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Generazione QR Code...</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <img 
              src={qrDataUrl} 
              alt="QR Code Profilo ValutoLab"
              className="w-64 h-64 bg-white p-4 rounded-lg shadow-lg"
            />
          </div>
        )}
      </div>

      {/* URL display */}
      <div className="bg-gray-50 rounded-lg p-3 mb-6 border border-gray-200">
        <p className="text-xs text-gray-500 mb-1">Link profilo:</p>
        <p className="text-sm text-gray-700 font-mono truncate">
          {profileUrl}
        </p>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <button
          onClick={downloadQRCode}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          ⬇️ Scarica QR Code PNG
        </button>

        <button
          onClick={copyLink}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border-2 border-gray-300 transition-colors duration-200"
        >
          📋 Copia Link
        </button>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800 text-center">
          💡 <span className="font-semibold">Suggerimento:</span> Usa questo QR code su biglietti da visita, CV cartacei o presentazioni per condividere facilmente il tuo profilo ValutoLab!
        </p>
      </div>
    </div>
  )
}
