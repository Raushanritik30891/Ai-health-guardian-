import React, { useState, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { FileText, Upload, RefreshCw, X, ChevronRight, AlertCircle, Plus, CheckCircle2 } from 'lucide-react'

export default function ScanPrescription() {
  const { setActivePage, profile, setAnalysis } = useStore()
  const isHindi = profile?.language === 'hi'

  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [medicines, setMedicines] = useState([])
  const [error, setError] = useState('')
  const [confidence, setConfidence] = useState(null)
  const fileInputRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => { setImage(e.target.result); setMedicines([]); setError('') }
    reader.readAsDataURL(file)
  }

  const runOCR = async () => {
    if (!image) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      const blob = await fetch(image).then(r => r.blob())
      formData.append('file', blob, 'prescription.jpg')

      const res = await fetch('/api/scanner/prescription', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) throw new Error('OCR failed')
      const data = await res.json()

      if (!data.success) {
        setError(data.message || (isHindi ? 'पर्ची नहीं पढ़ी जा सकी।' : 'Prescription could not be read.'))
        setLoading(false)
        return
      }

      const extracted = data.medicines || []
      const conf = data.confidence || 0.8
      setConfidence(conf)

      if (!extracted.length) {
        setError(isHindi ? 'कोई दवा नहीं मिली। साफ फोटो लें।' : 'No medicines found. Please take a clearer photo.')
        setLoading(false)
        return
      }
      setMedicines(extracted)
    } catch (err) {
      console.error('OCR Error:', err)
      setError(isHindi ? 'OCR विफल रहा।' : 'OCR failed.')
    }
    setLoading(false)
  }

  const removeMed = (m) => setMedicines(prev => prev.filter(x => x !== m))

  const proceed = () => {
    if (!medicines.length) return
    const defaultSchedule = medicines.map(m => ({ medicine: m, time: '08:00', dose_mg: 500 }))
    setAnalysis({ medicines, medicationSchedule: defaultSchedule, isAnalyzing: true, ocrData: null })
    setActivePage('analyzing')
  }

  return (
    <div className="page">
      <button onClick={() => setActivePage('dashboard')} className="text-sm text-slate-400 hover:text-slate-600 font-semibold mb-4 flex items-center gap-1 group">
        <span className="group-hover:-translate-x-1 transition-transform">←</span>
        {isHindi ? 'वापस' : 'Back'}
      </button>

      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <FileText className="w-7 h-7 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{isHindi ? 'पर्ची स्कैन करें' : 'Scan Prescription'}</h1>
        <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
          {isHindi ? 'डॉक्टर की पर्ची की फोटो लें। AI सभी दवाएं निकाल देगा।' : 'Upload your doctor\'s prescription — AI will extract all medicines automatically.'}
        </p>
      </div>

      {!image ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center bg-white hover:bg-slate-50 hover:border-purple-400 transition-all cursor-pointer group"
        >
          <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-purple-500" />
          </div>
          <h3 className="font-bold text-slate-700 mb-1">{isHindi ? 'पर्ची की फोटो अपलोड करें' : 'Upload Prescription Image'}</h3>
          <p className="text-slate-400 text-sm">{isHindi ? 'हस्तलिखित या प्रिंटेड — दोनों काम करते हैं' : 'Handwritten or printed — both work'}</p>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="relative bg-slate-900 h-48">
            <img src={image} alt="Prescription" className="w-full h-full object-contain" />
            <button
              onClick={() => { setImage(null); setMedicines([]); setConfidence(null) }}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="alert alert-caution text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!medicines.length && !loading && (
              <button onClick={runOCR} className="btn-primary w-full btn-lg" style={{ background: '#7c3aed' }}>
                <FileText className="w-5 h-5" />
                {isHindi ? 'पर्ची पढ़ें' : 'Read Prescription'}
              </button>
            )}

            {loading && (
              <div className="flex flex-col items-center py-8 text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-500 mb-3" style={{ animationDuration: '1.5s' }} />
                <p className="font-semibold text-sm">{isHindi ? 'पर्ची पढ़ी जा रही है...' : 'Reading prescription...'}</p>
              </div>
            )}

            {medicines.length > 0 && (
              <div className="animate-slide-up">
                <div className="flex items-center justify-between mb-3">
                  <span className="section-label">
                    {medicines.length} {isHindi ? 'दवाएं मिलीं' : 'medicines found'}
                  </span>
                  {confidence && (
                    <span className={`badge ${confidence > 0.75 ? 'badge-green' : 'badge-amber'} text-[10px]`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {Math.round(confidence * 100)}% {isHindi ? 'विश्वास' : 'confidence'}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {medicines.map(m => (
                    <div key={m} className="chip">
                      <span>{m}</span>
                      <button onClick={() => removeMed(m)} className="chip-remove">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {isHindi ? 'गलत दवाएं हटा सकते हैं। फिर आगे बढ़ें।' : 'Remove any incorrectly extracted medicines, then proceed.'}
                </p>

                <button
                  onClick={proceed}
                  disabled={!medicines.length}
                  className="w-full btn-primary btn-lg"
                  style={{ background: '#7c3aed' }}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {isHindi ? 'इन दवाओं की सुरक्षा जांचें' : 'Check These Medicines'} ({medicines.length})
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
