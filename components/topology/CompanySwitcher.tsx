'use client';

import { useSearchParams } from 'next/navigation';

const COMPANIES = [
  { 
    id: 'novascale_ai', 
    name: 'NovaScale AI', 
    archetype: 'Lateral Coupling',
  },
  { 
    id: 'helixbank_europe', 
    name: 'HelixBank Europe', 
    archetype: 'Authority Escalation',
  },
  { 
    id: 'medcore_health', 
    name: 'MedCore Health', 
    archetype: 'Distributed Fragmentation',
  },
];

export default function CompanySwitcher() {
  const searchParams = useSearchParams();
  const currentCompany = searchParams.get('company') || 'novascale_ai';
  
  const handleCompanyChange = (companyId: string) => {
    console.log('🔄 Switching to company:', companyId);
    
    // Force HARD navigation - bypasses Next.js router cache
    window.location.href = `/topology?company=${companyId}`;
  };
  
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '12px 20px',
      background: '#FAFAFA',
      borderBottom: '1px solid #E5E7EB',
      alignItems: 'center',
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginRight: '12px',
      }}>
        Archetype:
      </div>
      
      {COMPANIES.map((company) => (
        <button
          key={company.id}
          onClick={() => handleCompanyChange(company.id)}
          style={{
            padding: '6px 12px',
            background: currentCompany === company.id ? '#EEF2FF' : 'white',
            border: currentCompany === company.id 
              ? '2px solid #6366F1' 
              : '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: currentCompany === company.id ? '600' : '500',
            color: currentCompany === company.id ? '#4F46E5' : '#374151',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {company.name}
          <span style={{
            fontSize: '10px',
            color: '#9CA3AF',
            marginLeft: '6px',
          }}>
            · {company.archetype}
          </span>
        </button>
      ))}
    </div>
  );
}
