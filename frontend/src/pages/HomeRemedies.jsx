import React, { useState } from 'react'
import { useStore } from '../store/useStore'

// Source: WHO Traditional Medicine, Cochrane Reviews, Ayush Ministry
const REMEDIES = [
  { id:1, condition:'Cold & Flu', condition_hi:'सर्दी-जुकाम', remedy:'Ginger-Honey Tea', remedy_hi:'अदरक-शहद की चाय', steps:['Boil 1 cup water','Add 1 tsp fresh grated ginger','Simmer 5 min, strain','Add 1 tsp honey, drink warm 2-3x/day'], steps_hi:['1 कप पानी उबालें','1 चम्मच ताज़ा अदरक कद्दूकस करके डालें','5 मिनट उबालें, छान लें','1 चम्मच शहद मिलाकर गर्म पियें — दिन में 2-3 बार'], evidence:'Cochrane 2014: Honey effective for cough, especially in children', evidence_hi:'Cochrane 2014: शहद खांसी में असरदार, खासकर बच्चों में', safety:'Safe for adults. Honey NOT for infants <1 year.', safety_hi:'वयस्कों के लिए सुरक्षित। 1 साल से कम बच्चों को शहद नहीं।', grade:'B' },
  { id:2, condition:'Cold & Flu', condition_hi:'सर्दी-जुकाम', remedy:'Steam Inhalation', remedy_hi:'भाप', steps:['Boil water in a vessel','Add 1-2 drops eucalyptus oil (optional)','Cover head with towel, inhale for 10 min','Repeat 2-3x/day'], steps_hi:['पानी उबालें','1-2 बूंद नीलगिरी का तेल डालें (वैकल्पिक)','तौलिया से सिर ढककर 10 मिनट भाप लें','दिन में 2-3 बार करें'], evidence:'Evidence: Relieves nasal congestion. Standard recommendation by AIIMS.', evidence_hi:'प्रमाण: नाक बंद होने में राहत। AIIMS की सिफारिश।', safety:'Keep face 30cm from water to avoid burns.', safety_hi:'जलने से बचने के लिए 30cm की दूरी रखें।', grade:'B' },
  { id:3, condition:'Sore Throat', condition_hi:'गले में खराश', remedy:'Salt Water Gargle', remedy_hi:'नमक के पानी से कुल्ला', steps:['Add 1/2 tsp salt to 250ml warm water','Gargle for 30 seconds','Spit out — do not swallow','Repeat every 2-3 hours'], steps_hi:['250ml गर्म पानी में 1/2 चम्मच नमक','30 सेकंड कुल्ला करें','थूक दें — पियें नहीं','हर 2-3 घंटे करें'], evidence:'WHO recommends for pharyngitis. Reduces inflammation.', evidence_hi:'WHO की सिफारिश। सूजन कम करता है।', safety:'Safe for all ages. Do not swallow.', safety_hi:'सभी उम्र के लिए सुरक्षित। पियें नहीं।', grade:'A' },
  { id:4, condition:'Fever', condition_hi:'बुखार', remedy:'Lukewarm Sponging', remedy_hi:'गुनगुने पानी से पोंछना', steps:['Use lukewarm (not cold) water','Sponge forehead, armpits, neck','Do not use cold water or alcohol','Continue until temperature drops'], steps_hi:['गुनगुने पानी का उपयोग करें (ठंडा नहीं)','माथा, बगल, गर्दन पोंछें','ठंडा पानी या शराब नहीं','तापमान कम होने तक जारी रखें'], evidence:'WHO guideline for fever management without medication.', evidence_hi:'WHO की बुखार management guideline।', safety:'Do not use cold water — may cause shivering and increase fever.', safety_hi:'ठंडा पानी नहीं — कंपन बढ़ सकता है और बुखार बढ़ सकता है।', grade:'A' },
  { id:5, condition:'Stomach Pain / Acidity', condition_hi:'पेट दर्द / एसिडिटी', remedy:'Jeera Water', remedy_hi:'जीरा पानी', steps:['Add 1 tsp cumin seeds to 1 cup water','Boil for 5 minutes','Strain and drink warm','Have after meals for acidity'], steps_hi:['1 कप पानी में 1 चम्मच जीरा','5 मिनट उबालें','छानकर गर्म पियें','एसिडिटी के लिए खाने के बाद पियें'], evidence:'Ayush Ministry: Cumin has carminative properties. Traditional Ayurvedic use.', evidence_hi:'Ayush Ministry: जीरा में carminative गुण हैं।', safety:'Generally safe. Avoid in early pregnancy.', safety_hi:'सामान्यतः सुरक्षित। गर्भावस्था की शुरुआत में नहीं।', grade:'C' },
  { id:6, condition:'Diarrhea / Dehydration', condition_hi:'दस्त / निर्जलीकरण', remedy:'ORS (Oral Rehydration Solution)', remedy_hi:'ORS (मौखिक पुनर्जलीकरण)', steps:['Dissolve 1 ORS sachet in 1 liter clean water','Give small sips frequently','Continue breastfeeding for infants','Seek doctor if no improvement in 24hrs'], steps_hi:['1 ORS sachet को 1 लीटर साफ पानी में घोलें','थोड़ा-थोड़ा करके पिलाएं','शिशु को breastfeeding जारी रखें','24 घंटे में सुधार न हो तो डॉक्टर को दिखाएं'], evidence:'WHO/UNICEF: Gold standard for diarrhea. Reduces child mortality by 93%.', evidence_hi:'WHO/UNICEF: दस्त का सबसे प्रभावी उपचार। बच्चों में 93% मृत्यु रोकता है।', safety:'Safe for all ages. Government provides free at health centers.', safety_hi:'सभी के लिए सुरक्षित। सरकारी स्वास्थ्य केंद्रों पर मुफ्त।', grade:'A' },
  { id:7, condition:'Joint Pain / Arthritis', condition_hi:'जोड़ों का दर्द', remedy:'Turmeric Milk (Golden Milk)', remedy_hi:'हल्दी दूध', steps:['Heat 1 cup milk (dairy or plant-based)','Add 1/2 tsp turmeric powder','Add pinch of black pepper (enhances absorption 2000%)','Drink before bedtime'], steps_hi:['1 कप दूध गर्म करें','1/2 चम्मच हल्दी पाउडर मिलाएं','काली मिर्च की एक चुटकी (absorption 2000% बढ़ाती है)','रात को सोने से पहले पियें'], evidence:'Cochrane: Curcumin showed significant reduction in joint pain vs placebo. Piperine enhances bioavailability.', evidence_hi:'Cochrane: Curcumin ने placebo की तुलना में जोड़ों का दर्द काफी कम किया।', safety:'Safe. High doses may thin blood — caution with warfarin.', safety_hi:'सुरक्षित। ज्यादा मात्रा में खून पतला कर सकता है — warfarin के साथ सावधानी।', grade:'B' },
  { id:8, condition:'Headache', condition_hi:'सिरदर्द', remedy:'Peppermint Oil', remedy_hi:'पेपरमिंट तेल', steps:['Dilute 1-2 drops in carrier oil (coconut)','Apply to temples and forehead','Gently massage in circular motion','Can also apply to back of neck'], steps_hi:['1-2 बूंद नारियल तेल में मिलाएं','कनपटी और माथे पर लगाएं','गोलाकार मालिश करें','गर्दन के पीछे भी लगा सकते हैं'], evidence:'RCT showed peppermint oil as effective as paracetamol for tension headaches (Cephalgia 1996).', evidence_hi:'Randomized trial: tension headache में paracetamol जितना असरदार (Cephalgia 1996)।', safety:'Do not apply near eyes. Avoid in children <2 years.', safety_hi:'आंखों के पास नहीं। 2 साल से कम बच्चों को नहीं।', grade:'A' },
]

const GRADE_INFO = { A:'Strong evidence', B:'Moderate evidence', C:'Traditional use' }
const GRADE_INFO_HI = { A:'मजबूत प्रमाण', B:'मध्यम प्रमाण', C:'पारंपरिक उपयोग' }
const GRADE_COLORS = { A:'#16a34a', B:'#2563eb', C:'#d97706' }

const CATEGORIES_EN = ['All','Cold & Flu','Sore Throat','Fever','Stomach Pain / Acidity','Diarrhea / Dehydration','Joint Pain / Arthritis','Headache']
const CATEGORIES_HI = ['सभी','सर्दी-जुकाम','गले में खराश','बुखार','पेट दर्द / एसिडिटी','दस्त / निर्जलीकरण','जोड़ों का दर्द','सिरदर्द']

export default function HomeRemedies() {
  const { profile } = useStore()
  const isHindi = profile.language === 'hi'
  const [category, setCategory] = useState(0)
  const [expanded, setExpanded] = useState(null)
  const CATS = isHindi ? CATEGORIES_HI : CATEGORIES_EN

  const filtered = category === 0 ? REMEDIES : REMEDIES.filter(r =>
    isHindi ? r.condition_hi === CATS[category] : r.condition === CATS[category]
  )

  return (
    <div className="page" style={{ paddingTop: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className="badge badge-emerald">
            {isHindi ? "🌿 प्राकृतिक विज्ञान" : "🌿 Natural Science"}
          </div>
        </div>
        <h1 className="section-title">
          {isHindi ? 'घरेलू उपचार' : 'Botanical Remedies'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 15, maxWidth: 600 }}>
          {isHindi 
            ? 'Cochrane Reviews और आयुष मंत्रालय द्वारा प्रमाणित साक्ष्य-आधारित घरेलू उपचार।' 
            : 'Access clinical-grade home remedies cross-verified with Cochrane Reviews, WHO Traditional Medicine, and Ministry of AYUSH.'}
        </p>
      </div>

      {/* Grade Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', background: '#f8fafc', padding: '12px 16px', borderRadius: 12, border: '1px solid #f1f5f9' }}>
        {Object.entries(GRADE_INFO).map(([g, v]) => (
          <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#64748b' }}>
            <span style={{ 
              width: 22, height: 22, borderRadius: 6, background: GRADE_COLORS[g], 
              color: 'white', fontSize: 11, fontWeight: 900, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 2px 4px ${GRADE_COLORS[g]}40`
            }}>{g}</span>
            {isHindi ? GRADE_INFO_HI[g] : v}
          </div>
        ))}
      </div>

      {/* Categories */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom: 32 }}>
        {CATS.map((c, i) => (
          <button 
            key={i} 
            onClick={() => setCategory(i)}
            className={`chip ${category === i ? 'chip-active' : ''}`}
            style={{ padding: '8px 16px', fontSize: 13, border: '1px solid #e2e8f0' }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Remedy List */}
      <div style={{ display: 'grid', gap: 16, marginBottom: 40 }}>
        {filtered.map(r => (
          <div 
            key={r.id} 
            className="card-premium animate-fade" 
            style={{ 
              padding: 0, overflow: 'hidden', 
              border: expanded === r.id ? `1px solid ${GRADE_COLORS[r.grade]}40` : '1px solid #f1f5f9' 
            }}
          >
            <div
              style={{ padding: '20px 24px', display:'flex', alignItems:'center', gap:16, cursor:'pointer', background: expanded === r.id ? '#f8fafc' : '#fff' }}
              onClick={() => setExpanded(expanded === r.id ? null : r.id)}
            >
              <div style={{ 
                width: 44, height: 44, borderRadius: 12, 
                background: `${GRADE_COLORS[r.grade]}10`, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: 20, color: GRADE_COLORS[r.grade], fontWeight: 900
              }}>
                {r.grade}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>
                  {isHindi ? r.remedy_hi : r.remedy}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                  {isHindi ? r.condition_hi : r.condition}
                </div>
              </div>
              <div style={{ 
                width: 28, height: 28, borderRadius: '50%', background: '#fff', 
                border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: '#94a3b8', transition: 'all 0.2s',
                transform: expanded === r.id ? 'rotate(180deg)' : 'none'
              }}>
                ▼
              </div>
            </div>

            {expanded === r.id && (
              <div className="animate-fade" style={{ padding: '24px', borderTop: '1px solid #f1f5f9' }}>
                {/* Method */}
                <div style={{ marginBottom: 24 }}>
                  <div className="lbl" style={{ marginBottom: 12 }}>{isHindi ? 'प्रक्रिया (Protocol)' : 'Preparation Protocol'}</div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {(isHindi ? r.steps_hi : r.steps).map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ 
                          width: 24, height: 24, borderRadius: 6, background: '#f1f5f9', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 800, color: '#64748b', flexShrink: 0, marginTop: 2
                        }}>{i+1}</div>
                        <div style={{ fontSize: 13, color: '#334155', fontWeight: 500, lineHeight: 1.5 }}>{s}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evidence & Safety */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  <div style={{ padding: '16px', background: '#eff6ff', borderRadius: 12, border: '1px solid #dbeafe' }}>
                    <div className="lbl" style={{ color: '#1e40af', marginBottom: 6 }}>📑 {isHindi ? 'वैज्ञानिक साक्ष्य' : 'Clinical Evidence'}</div>
                    <div style={{ fontSize: 12, color: '#1e3a8a', fontWeight: 500, lineHeight: 1.4 }}>
                      {isHindi ? r.evidence_hi : r.evidence}
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fef3c7' }}>
                    <div className="lbl" style={{ color: '#92400e', marginBottom: 6 }}>⚠️ {isHindi ? 'सुरक्षा निर्देश' : 'Safety Countermeasures'}</div>
                    <div style={{ fontSize: 12, color: '#78350f', fontWeight: 500, lineHeight: 1.4 }}>
                      {isHindi ? r.safety_hi : r.safety}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '24px 0', borderTop: '1px solid #f1f5f9' }}>
        <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, lineHeight: 1.6 }}>
          📚 {isHindi 
            ? 'स्रोत: WHO Traditional Medicine · Cochrane Reviews · आयुष मंत्रालय भारत · AIIMS गाइडलाइन्स' 
            : 'Integrity Verification: WHO Traditional Medicine · Cochrane Library · Ministry of AYUSH · AIIMS Guidelines'}
        </p>
      </div>
    </div>
  )
}
