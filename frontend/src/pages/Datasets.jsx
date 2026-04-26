import React from 'react'
import { useStore } from '../store/useStore'

const DATASETS = [
  { name:'WHO Essential Medicines List 2023', org:'World Health Organization', url:'https://www.who.int/publications/i/item/WHO-MHP-HPS-EML-2023.02', type:'PDF/Excel', size:'460+ medicines', free:true, desc:'Global gold standard for essential medicines' },
  { name:'OpenFDA Drug Labels API', org:'US Food & Drug Administration', url:'https://open.fda.gov/apis/drug/label/', type:'JSON API (no key)', size:'100k+ drugs', free:true, desc:'Machine-readable drug label data' },
  { name:'Jan Aushadhi Product List', org:'Bureau of Pharma PSUs of India', url:'https://janaushadhi.gov.in/data/productlist', type:'Excel', size:'1,700+ products', free:true, desc:'Official govt. generic medicine prices' },
  { name:'NPPA Drug Price Ceiling', org:'National Pharma Pricing Authority', url:'https://www.nppaindia.nic.in/drug-price-ceiling/', type:'Excel', size:'All scheduled drugs', free:true, desc:'Govt. maximum retail price database' },
  { name:'Indian Medicines Dataset', org:'Kaggle (community)', url:'https://www.kaggle.com/datasets/shudhanshusingh/indian-medicines-unique-dataset', type:'CSV', size:'15k+ medicines', free:true, desc:'Indian pharmaceutical database' },
  { name:'Disease-Symptom Dataset', org:'Kaggle (research)', url:'https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset', type:'CSV', size:'4,920 records', free:true, desc:'Symptom to disease mapping' },
  { name:'DrugBank Open Data', org:'DrugBank (Canada)', url:'https://go.drugbank.com/releases/latest', type:'XML/CSV (free reg.)', size:'14k+ drugs', free:true, desc:'Comprehensive drug interactions database' },
  { name:'BNF Drug Interactions', org:'NHS / NICE (UK)', url:'https://bnf.nice.org.uk/interactions/', type:'Web/API', size:'10k+ pairs', free:true, desc:'British National Formulary — clinical interactions' },
  { name:'PubMed Central (PMC)', org:'NIH / NLM (USA)', url:'https://www.ncbi.nlm.nih.gov/pmc/', type:'API (free)', size:'5M+ articles', free:true, desc:'Free access to biomedical literature' },
  { name:'Cochrane Library', org:'Cochrane Collaboration', url:'https://www.cochranelibrary.com', type:'Web', size:'Evidence reviews', free:false, desc:'Gold standard systematic reviews — evidence for remedies' },
  { name:'Indian Pharmacopoeia 2022', org:'Indian Pharmacopoeia Commission', url:'https://www.ipc.gov.in', type:'PDF (purchase)', size:'5000+ monographs', free:false, desc:'Official Indian drug standards' },
  { name:'MedlinePlus Drug Info', org:'US National Library of Medicine', url:'https://medlineplus.gov/druginformation.html', type:'HTML/API', size:'1000+ drugs', free:true, desc:'Patient-friendly drug information' },
]

export default function Datasets() {
  const { profile } = useStore()
  const isHindi = profile.language === 'hi'
  const T = (en, hi) => isHindi ? hi : en

  return (
    <div className="page" style={{ paddingTop: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className="badge badge-emerald">
            {isHindi ? "📚 डेटा सोर्सिंग" : "📚 Clinical Data Sourcing"}
          </div>
        </div>
        <h1 className="section-title">
          {isHindi ? 'डेटा स्रोत और रिपॉजिटरी' : 'Knowledge Repository'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 16, maxWidth: 600, lineHeight: 1.5 }}>
          {isHindi 
            ? 'इस ऐप में मौजूद सभी मेडिकल जानकारी आधिकारिक स्रोतों से ली गई है।' 
            : 'All clinical intelligence in this terminal is derived from the following authenticated global medical repositories and regulatory datasets.'}
        </p>
      </div>

      {/* Integrity Statement */}
      <div className="card-premium" style={{ 
        marginBottom: 32, padding: 24, background: '#f8fafc', 
        border: '1px solid #e2e8f0', display: 'flex', gap: 16, alignItems: 'center' 
      }}>
        <div style={{ fontSize: 24 }}>🛡️</div>
        <div style={{ fontSize: 13, color: '#475569', fontWeight: 600, lineHeight: 1.5 }}>
          <strong>{T('Integrity Protocol:', 'सत्यनिष्ठा प्रोटोकॉल:')}</strong> {T(
            'This application utilizes ZERO hallucinated AI data. All drug interactions, pharmacology monographs, and pricing ceilings are audited against verified repositories.',
            'यह एप्लिकेशन शून्य भ्रामक AI डेटा का उपयोग करता है। सभी दवा इंटरैक्शन और मूल्य सीमाओं का सत्यापन आधिकारिक रिपॉजिटरी से किया जाता है।'
          )}
        </div>
      </div>

      {/* Dataset Grid */}
      <div style={{ display: 'grid', gap: 16, marginBottom: 40 }}>
        {DATASETS.map((d, i) => (
          <div key={i} className="card-premium card-hover" style={{ background: '#fff' }}>
            <div style={{ display:'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>{d.name}</h3>
                  <div className={`badge ${d.free ? 'badge-emerald' : 'badge-indigo'}`} style={{ fontSize: 9 }}>
                    {d.free ? T('OPEN', 'मुफ्त') : T('PRIVATE', 'सशुल्क')}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {d.org}
                </div>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px 0', fontWeight: 500 }}>{d.desc}</p>
                <div style={{ display:'flex', gap: 12 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>📁 {d.type}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>📊 {d.size.toUpperCase()}</div>
                </div>
              </div>
              <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ 
                padding: '10px 16px', borderRadius: 12, background: '#f1f5f9', color: '#0f172a',
                fontSize: 11, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap'
              }}>
                ACCESS ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* AI Developer Support Section */}
      <div style={{ marginBottom: 20 }}>
         <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
           🤖 {isHindi ? 'AI मॉडल प्रशिक्षण गाइड' : 'Clinical Model Training'}
         </h2>
      </div>

      <div className="card-premium" style={{ background: '#0f172a', border: 'none', padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
           <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
           <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
           <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
           <div style={{ marginLeft: 12, fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>terminal — ahg-v3/training-protocols</div>
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8 }}>
          <div style={{ color: '#10b981', marginBottom: 8 }}># 1. Download Neural-Ready Datasets</div>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, marginBottom: 24, color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: '#94a3b8' }}>$</span> pip install kaggle<br/>
            <span style={{ color: '#94a3b8' }}>$</span> kaggle datasets download indian-medicines-dataset<br/>
            <span style={{ color: '#94a3b8' }}>$</span> kaggle datasets download disease-symptom-map
          </div>

          <div style={{ color: '#3b82f6', marginBottom: 8 }}># 2. Recommended SOTA Architectures</div>
          <div style={{ display: 'grid', gap: 12 }}>
             {[
               { name: 'google/gemma-2-9b-it', desc: 'Superior multilingual clinical reasoning' },
               { name: 'BioMistral-7B', desc: 'Medical domain specialized pre-training' },
               { name: 'microsoft/BioGPT', desc: 'Optimized for biomedical text synthesis' }
             ].map((m, idx) => (
               <div key={idx} style={{ 
                 display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                 padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                 border: '1px solid rgba(255,255,255,0.05)'
               }}>
                  <div style={{ color: '#f8fafc', fontWeight: 700 }}>{m.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: 11 }}>{m.desc}</div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  )
}
