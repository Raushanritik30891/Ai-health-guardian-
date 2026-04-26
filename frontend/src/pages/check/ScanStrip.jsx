import React, { useState, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { Camera, Upload, RefreshCw, ShieldCheck, AlertCircle, ChevronRight, X, FileImage, AlertTriangle } from 'lucide-react'

export default function ScanStrip() {
  const { setActivePage, profile, setAnalysis } = useStore()
  const isHindi = profile?.language === 'hi'

  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [ocrResult, setOcrResult] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!allowed.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
      setError(isHindi ? 'कृपया JPG, PNG या HEIC फाइल अपलोड करें।' : 'Please upload a JPG, PNG, or HEIC image.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => { setImage(e.target.result); setOcrResult(null); setError('') }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  const runOCR = async () => {
    if (!image) return
    setLoading(true)
    setError('')
    try {
      const file = fileInputRef.current?.files[0] || cameraInputRef.current?.files[0]
      if (!file && image) {
        // If image state exists but files ref is empty (e.g. from drag/drop), 
        // we convert the dataURI back to file or use a fallback.
        // For simplicity in this fix, we ensure handleFile stores the raw file.
      }

      const formData = new FormData()
      // We need the raw file. Let's ensure handleFile saves it.
      // But for a quick fix, if we have the 'image' (dataURL), we can fetch it back to a blob
      const blob = await fetch(image).then(r => r.blob())
      formData.append('file', blob, 'strip.jpg')

      const res = await fetch('/api/scanner/strip', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) throw new Error('OCR failed')
      const data = await res.json()

      if (!data.success || !data.medicine_found) {
        setError(isHindi
          ? 'दवा की जानकारी नहीं मिली। कृपया फोटो साफ लें।'
          : 'Medicine not found. Please take a clearer photo.')
        setLoading(false)
        return
      }

      const med = data.medicine_data || {}
      setOcrResult({
        brandName: med.brandName || med.brand_name || data.ocr_text || '',
        genericName: med.genericName || med.generic_name || '',
        expiryDate: data.ocr_extracted?.expiry_date || '',
        isExpired: data.ocr_extracted?.isExpired || false,
        notForSaleDetected: data.ocr_extracted?.notForSaleDetected || false,
        confidence: data.confidence || 0.85
      })
    } catch (err) {
      console.error('OCR Error:', err)
      setError(isHindi ? 'OCR विफल रहा। कृपया पुनः प्रयास करें।' : 'OCR failed. Please try again.')
    }
    setLoading(false)
  }

  const confirmAndProceed = () => {
    if (!ocrResult?.brandName) return
    const defaultSchedule = [{ medicine: ocrResult.brandName, time: '08:00', dose_mg: 500 }]
    setAnalysis({
      medicines: [ocrResult.brandName],
      medicationSchedule: defaultSchedule,
      ocrData: ocrResult,
      isAnalyzing: true
    })
    setActivePage('analyzing')
  }

  const reset = () => { setImage(null); setOcrResult(null); setError('') }

  return (
    <div className="page">
      <button onClick={() => setActivePage('dashboard')} className="text-sm text-slate-400 hover:text-slate-600 font-semibold mb-4 flex items-center gap-1 group">
        <span className="group-hover:-translate-x-1 transition-transform">←</span>
        {isHindi ? 'वापस' : 'Back'}
      </button>

      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Camera className="w-7 h-7 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{isHindi ? 'दवा स्ट्रिप स्कैन करें' : 'Scan Medicine Strip'}</h1>
        <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto leading-relaxed">
          {isHindi ? 'दवा के पत्ते या डिब्बे की साफ तस्वीर लें। AI उसे पढ़कर सुरक्षा जांच करेगा।' : 'Take a clear photo of the medicine strip or box. Our AI will extract the medicine details.'}
        </p>
      </div>

      {!image ? (
        /* Upload Zone */
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center bg-white hover:bg-slate-50 hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="font-bold text-slate-700 mb-1">{isHindi ? 'फोटो अपलोड करें' : 'Upload or Drop Image'}</h3>
          <p className="text-slate-400 text-sm mb-4">{isHindi ? 'या यहाँ खींच कर छोड़ें' : 'or drag and drop here'}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={e => { e.stopPropagation(); cameraInputRef.current?.click() }}
              className="btn-secondary text-sm min-h-[40px] px-4"
            >
              <Camera className="w-4 h-4" /> {isHindi ? 'कैमरा खोलें' : 'Open Camera'}
            </button>
            <span className="text-slate-300 text-sm self-center">or</span>
            <span className="btn-secondary text-sm min-h-[40px] px-4 pointer-events-none">
              <FileImage className="w-4 h-4" /> JPG / PNG
            </span>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          {/* Image Preview */}
          <div className="relative bg-black h-56">
            <img src={image} alt="Strip" className="w-full h-full object-contain" />
            <button
              onClick={reset}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="alert alert-caution mb-4 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!ocrResult && !loading && (
              <button onClick={runOCR} className="btn-primary w-full btn-lg">
                <FileImage className="w-5 h-5" />
                {isHindi ? 'दवा पढ़ें (Read Strip)' : 'Read This Strip'}
              </button>
            )}

            {loading && (
              <div className="flex flex-col items-center py-8 text-slate-500">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="font-semibold text-sm">{isHindi ? 'दवा का पत्ता पढ़ा जा रहा है...' : 'Reading your medicine strip...'}</p>
              </div>
            )}

            {ocrResult && (
              <div className="animate-slide-up space-y-4">
                <div className="flex items-center justify-between">
                  <span className="section-label">{isHindi ? 'निकाली गई जानकारी' : 'Extracted Information'}</span>
                  <span className={`badge ${ocrResult.confidence > 0.75 ? 'badge-green' : 'badge-amber'}`}>
                    <ShieldCheck className="w-3 h-3" />
                    {ocrResult.confidence > 0.75 ? (isHindi ? 'उच्च विश्वास' : 'High Confidence') : (isHindi ? 'मध्यम विश्वास' : 'Medium Confidence')}
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { label: isHindi ? 'दवा का नाम' : 'Brand Name', key: 'brandName' },
                    { label: isHindi ? 'जेनेरिक / सॉल्ट' : 'Generic Name', key: 'genericName' },
                    { label: isHindi ? 'एक्सपायरी डेट' : 'Expiry Date', key: 'expiryDate' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="lbl">{label}</label>
                      <input
                        type="text" className="inp"
                        value={ocrResult[key] || ''}
                        onChange={e => setOcrResult({ ...ocrResult, [key]: e.target.value })}
                        placeholder={isHindi ? 'यहाँ संपादित करें...' : 'Edit if needed...'}
                      />
                    </div>
                  ))}
                </div>

                {ocrResult.isExpired && (
                  <div className="alert alert-danger text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{isHindi ? 'यह दवा एक्सपायर हो चुकी है!' : 'This medicine has expired!'}</span>
                  </div>
                )}
                {ocrResult.notForSaleDetected && (
                  <div className="alert alert-caution text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{isHindi ? 'पत्ते पर NOT FOR SALE लिखा है — सरकारी दवा।' : 'NOT FOR SALE detected — this is a government-supply medicine.'}</span>
                  </div>
                )}

                <button
                  onClick={confirmAndProceed}
                  disabled={!ocrResult.brandName}
                  className="btn-safe w-full btn-lg"
                >
                  <ShieldCheck className="w-5 h-5" />
                  {isHindi ? 'पुष्टि करें और सुरक्षा जांचें' : 'Confirm & Check Safety'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
