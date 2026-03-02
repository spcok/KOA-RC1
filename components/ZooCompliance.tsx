
import React, { useState } from 'react';
import { 
  ShieldCheck, AlertCircle, Calendar, FileText, 
  CheckCircle2, Clock, Info, ChevronDown, ChevronUp, 
  ExternalLink, BookOpen, Users, Stethoscope, Lock, Plus,
  ShieldAlert, Loader2, AlertTriangle
} from 'lucide-react';
import { useZooComplianceData } from '@/src/hooks/useZooComplianceData';
import ComplianceLogModal from './ComplianceLogModal';

const ZooCompliance: React.FC = () => {
  const { orgProfile, complianceData, stats, isLoading } = useZooComplianceData();
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Conservation');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const categories = Array.from(new Set(complianceData.map(item => item.category)));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'non-compliant': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Conservation': return <BookOpen size={18} />;
      case 'Animal Welfare': return <Stethoscope size={18} />;
      case 'Public Safety': return <Lock size={18} />;
      case 'Records': return <FileText size={18} />;
      default: return <ShieldCheck size={18} />;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Sticky Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-4 -mt-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
            <ShieldCheck className="text-emerald-600" size={32} />
            Statutory Audit Overview
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Monitoring adherence to the Secretary of State's Standards of Modern Zoo Practice (SSSMZP).
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border-2 border-slate-200 flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">License Status</p>
              <div className="flex items-center gap-2 justify-end">
                <span className={`text-sm font-black uppercase tracking-tight ${stats.isLicenseValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stats.isLicenseValid ? 'Active' : 'Action Required'}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full ${stats.isLicenseValid ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
              </div>
            </div>
            <div className="h-8 w-[2px] bg-slate-100"></div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Inspection</p>
              <p className={`text-sm font-black uppercase tracking-tight ${stats.isInspectionValid ? 'text-slate-700' : 'text-amber-600'}`}>
                {orgProfile?.next_inspection_date ? new Date(orgProfile.next_inspection_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts - High Contrast */}
      {(stats.criticalCount > 0 || !stats.isLicenseValid) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!stats.isLicenseValid && (
            <div className="bg-rose-600 text-white p-5 rounded-3xl shadow-lg shadow-rose-200 flex items-center gap-5 animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <ShieldAlert size={28} />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-widest text-sm">License Expiry Warning</h3>
                <p className="text-xs text-rose-100 font-medium mt-1">The current Zoo License has expired or is missing. Immediate renewal required for legal operation.</p>
              </div>
            </div>
          )}
          {stats.criticalCount > 0 && (
            <div className="bg-amber-500 text-white p-5 rounded-3xl shadow-lg shadow-amber-200 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-widest text-sm">{stats.criticalCount} Critical Non-Compliances</h3>
                <p className="text-xs text-amber-500 font-medium mt-1 bg-white px-2 py-0.5 rounded inline-block">Action Required: SSSMZP Section 4.2</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Overall Compliance', value: `${stats.overallPercentage}%`, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending Actions', value: stats.pendingCount.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Critical Issues', value: stats.criticalCount.toString(), icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Audit Result', value: 'Pass', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Audit</span>
            </div>
            <p className="text-4xl font-black text-slate-900 relative z-10">{stat.value}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2 relative z-10">{stat.label}</p>
            <stat.icon size={80} className={`absolute -right-4 -bottom-4 opacity-5 ${stat.color} group-hover:scale-110 transition-transform`} />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Compliance Checklist */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Compliance Checklist</h2>
            <button className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-2 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
              <ExternalLink size={14} />
              Full SSSMZP Standards
            </button>
          </div>

          <div className="space-y-4">
            {categories.map(category => (
              <div key={category} className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <button 
                  onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                  className={`w-full flex items-center justify-between p-6 transition-colors ${expandedCategory === category ? 'bg-slate-50 border-b-2 border-slate-100' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 shadow-inner">
                      {getCategoryIcon(category)}
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{category}</h3>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">
                        {complianceData.filter(i => i.category === category).length} Statutory Standards
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-1">
                        {complianceData.filter(i => i.category === category && i.status === 'compliant').map((_, idx) => (
                            <div key={idx} className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        ))}
                    </div>
                    {expandedCategory === category ? <ChevronUp size={24} className="text-slate-400" /> : <ChevronDown size={24} className="text-slate-400" />}
                  </div>
                </button>

                {expandedCategory === category && (
                  <div className="divide-y divide-slate-100">
                    {complianceData.filter(item => item.category === category).map(item => (
                      <div key={item.id} className="p-6 hover:bg-slate-50/50 transition-colors group">
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-1 rounded-lg shadow-sm">
                                {item.id}
                              </span>
                              <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">{item.title}</h4>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-6 mt-4">
                              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Calendar size={14} />
                                Last Audit: {item.lastChecked}
                              </div>
                              <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                                <Plus size={14} /> Update Record
                              </button>
                            </div>
                          </div>
                          <div className={`px-4 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(item.status)}`}>
                            {item.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
          {/* License Info */}
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-sm relative overflow-hidden">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tight">
              <FileText size={24} className="text-emerald-600" />
              License Details
            </h3>
            <div className="space-y-6">
              <div className="pb-6 border-b-2 border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">License Number</p>
                <p className="text-sm font-black text-slate-700 uppercase tracking-tight">{orgProfile?.licence_number || 'Not Set'}</p>
              </div>
              <div className="pb-6 border-b-2 border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Local Authority</p>
                <p className="text-sm font-black text-slate-700 uppercase tracking-tight">{orgProfile?.local_authority || 'Not Set'}</p>
              </div>
              <div className="pb-6 border-b-2 border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Expiry Date</p>
                <p className={`text-sm font-black uppercase tracking-tight ${stats.isLicenseValid ? 'text-slate-700' : 'text-rose-600'}`}>
                  {orgProfile?.licence_expiry_date ? new Date(orgProfile.licence_expiry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not Set'}
                </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-100">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Info size={14} /> Compliance Status
                </p>
                <p className="text-xs font-bold text-emerald-600 leading-relaxed uppercase tracking-tight">
                    Compliant with 2024 Secretary of State Revision Standards.
                </p>
              </div>
            </div>
            <FileText size={120} className="absolute -right-8 -bottom-8 text-slate-50 rotate-12" />
          </div>

          {/* Conservation Impact */}
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-300 relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="text-lg font-black mb-6 flex items-center gap-3 uppercase tracking-tight">
                <Users size={24} className="text-emerald-400" />
                Impact Metrics
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed font-medium">
                The Zoo Licensing Act requires active contribution to conservation and public education.
                </p>
                <div className="space-y-5">
                <div className="bg-white/5 p-5 rounded-3xl border-2 border-white/10">
                    <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Education Programs</span>
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">{stats.educationCount} Active</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${stats.educationProgress}%` }}></div>
                    </div>
                </div>
                <div className="bg-white/5 p-5 rounded-3xl border-2 border-white/10">
                    <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Research Projects</span>
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">{stats.conservationCount} Active</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${stats.conservationProgress}%` }}></div>
                    </div>
                </div>
                </div>
                <button 
                onClick={() => setIsLogModalOpen(true)}
                className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 active:scale-95"
                >
                <Plus size={20} />
                Log New Activity
                </button>
            </div>
            <Users size={160} className="absolute -right-12 -bottom-12 text-white/5 rotate-12" />
          </div>
        </div>
      </div>

      <ComplianceLogModal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
      />
    </div>
  );
};

export default ZooCompliance;

