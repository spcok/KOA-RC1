import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { useAppData } from '@/src/context/AppContext';
import { diagnosticsService, DiagnosticIssue } from '@/src/services/diagnosticsService';
import { getLatinName } from '@/src/services/geminiService';
import { Loader2, RefreshCw, ShieldCheck, XCircle, AlertCircle, Wrench, Gavel } from 'lucide-react';
import { UserRole } from '@/types';

const SettingsDiagnostics: React.FC = () => {
  const { animals, updateAnimal, tasks, users, updateUsers } = useAppData();
  
  const [diagnosticIssues, setDiagnosticIssues] = useState<DiagnosticIssue[]>([]);
  const [isPending, startTransition] = useTransition();
  
  // Remediation Modal State
  const [remediationIssue, setRemediationIssue] = useState<DiagnosticIssue | null>(null);
  const [fixForm, setFixForm] = useState<any>({});
  const [isFixing, startFixTransition] = useTransition();

  useEffect(() => {
      handleRunAudit();
  }, []);

  // Pre-fill remediation form when issue selected
  useEffect(() => {
      if (remediationIssue && remediationIssue.subjectId) {
          const animal = (animals || []).find(a => a.id === remediationIssue.subjectId);
          if (animal) {
              if (remediationIssue.id.includes('comp_tax')) {
                  setFixForm({ latin_name: animal.latin_name || '', species: animal.species });
              } else if (remediationIssue.id.includes('comp_id')) {
                  setFixForm({ ring_number: animal.ring_number || '', microchip_id: animal.microchip_id || '', has_no_id: animal.has_no_id || false });
              } else if (remediationIssue.id.includes('comp_orig')) {
                  setFixForm({ acquisition_date: animal.acquisition_date || '', origin: animal.origin || '' });
              }
          }
      } else if (remediationIssue && remediationIssue.id === 'sec_no_admin') {
          setFixForm({ newAdminId: '' });
      }
  }, [remediationIssue, animals]);

  const handleRunAudit = () => {
      startTransition(() => {
          const issues = diagnosticsService.runFullAudit(animals, tasks, users);
          setDiagnosticIssues(issues);
      });
  };

  const handleApplyFix = async () => {
      if (!remediationIssue) return;
      const animal = (animals || []).find(a => a.id === remediationIssue.subjectId);
      
      startFixTransition(async () => {
          if (remediationIssue.id.includes('comp_tax') && animal) {
              await updateAnimal({ ...animal, latin_name: fixForm.latin_name });
          } else if (remediationIssue.id.includes('comp_id') && animal) {
              await updateAnimal({ ...animal, ring_number: fixForm.ring_number, microchip_id: fixForm.microchip_id, has_no_id: fixForm.has_no_id });
          } else if (remediationIssue.id.includes('comp_orig') && animal) {
              await updateAnimal({ ...animal, acquisition_date: fixForm.acquisition_date, origin: fixForm.origin });
          } else if (remediationIssue.id === 'sec_no_admin' && fixForm.newAdminId) {
              const targetUser = (users || []).find(u => u.id === fixForm.newAdminId);
              if (targetUser) {
                  const updatedUsers = users.map(u => u.id === targetUser.id ? { ...u, role: UserRole.ADMIN } : u);
                  updateUsers(updatedUsers);
              }
          }
          setRemediationIssue(null);
          handleRunAudit();
      });
  };

  const handleAiLatinName = async () => {
      if (!fixForm.species) return;
      const latin = await getLatinName(fixForm.species);
      if (latin) setFixForm((prev: any) => ({ ...prev, latin_name: latin }));
  };

  const groupedAuditIssues = useMemo(() => {
      const groups = new Map<string, DiagnosticIssue[]>();
      const system: DiagnosticIssue[] = [];
      diagnosticIssues.forEach(issue => {
          if (issue.subjectId) {
              const current = groups.get(issue.subjectId) || [];
              groups.set(issue.subjectId, [...current, issue]);
          } else { system.push(issue); }
      });
      const sortedIds = Array.from(groups.keys()).sort((a, b) => {
          const issuesA = groups.get(a)!;
          const issuesB = groups.get(b)!;
          return issuesB.filter(i => i.severity === 'Critical').length - issuesA.filter(i => i.severity === 'Critical').length;
      });
      return { system, sortedIds, groups };
  }, [diagnosticIssues]);

  const auditScore = useMemo(() => {
      if (diagnosticIssues.length === 0) return 100;
      const criticals = diagnosticIssues.filter(i => i.severity === 'Critical').length;
      const warnings = diagnosticIssues.filter(i => i.severity === 'Warning').length;
      return Math.max(0, 100 - (criticals * 15) - (warnings * 5));
  }, [diagnosticIssues]);

  const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-300 uppercase tracking-widest";

  return (
    <div className="max-w-6xl space-y-8 animate-in slide-in-from-right-4 duration-300 pb-24">
        <div className="flex justify-between items-center border-b-2 border-slate-200 pb-6">
            <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <Gavel size={28} className="text-slate-800" /> Compliance Dashboard
                </h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Zoo Licensing Act 1981 • Statutory Audit</p>
            </div>
            <button onClick={handleRunAudit} disabled={isPending} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95">
                {isPending ? <Loader2 size={18} className="animate-spin"/> : <RefreshCw size={18}/>} Run Diagnostics
            </button>
        </div>

        <div className={`rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border-4 ${auditScore === 100 ? 'bg-emerald-600 border-emerald-500' : auditScore > 70 ? 'bg-amber-500 border-amber-400' : 'bg-rose-600 border-rose-500'}`}>
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck size={300} />
            </div>
            <div className="relative z-10 flex items-center gap-8">
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-black/20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                        <path className="text-white drop-shadow-md transition-all duration-1000 ease-out" strokeDasharray={`${auditScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                    </svg>
                    <span className="absolute text-3xl font-black">{auditScore}%</span>
                </div>
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-2">
                        {auditScore === 100 ? 'Fully Compliant' : auditScore > 70 ? 'Action Required' : 'Critical Failure'}
                    </h2>
                    <p className="text-sm font-bold uppercase tracking-widest opacity-80 max-w-md leading-relaxed">
                        {auditScore === 100 ? 'All statutory registers satisfy the requirements of the Secretary of State\'s Standards.' : 'Gaps detected in statutory records. Immediate remediation required to satisfy license conditions.'}
                    </p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {groupedAuditIssues.system.map(issue => (
                <div key={issue.id} className="p-4 bg-white rounded-xl shadow-sm border-l-4 border-rose-500">
                    <p className="font-bold text-slate-800">{issue.message}</p>
                    <button onClick={() => setRemediationIssue(issue)} className="text-xs text-emerald-600 font-bold mt-2 hover:underline">Fix Issue</button>
                </div>
            ))}
        </div>

        <div className="space-y-6">
            {groupedAuditIssues.sortedIds.map(animalId => {
                const issues = groupedAuditIssues.groups.get(animalId);
                const animal = animals.find(a => a.id === animalId);
                if (!issues || !animal) return null;

                return (
                    <div key={animalId} className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-4 mb-4 border-b border-slate-100 pb-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden">
                                {animal.image_url && <img src={animal.image_url} alt="" className="w-full h-full object-cover"/>}
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-sm uppercase">{animal.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{animal.species}</p>
                            </div>
                            <div className="ml-auto flex gap-2">
                                {issues.some(i => i.severity === 'Critical') && <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-lg text-[9px] font-black uppercase">Critical</span>}
                                {issues.some(i => i.severity === 'Warning') && <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase">Warning</span>}
                            </div>
                        </div>
                        <div className="space-y-3">
                            {issues.map(issue => (
                                <div key={issue.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    {issue.severity === 'Critical' ? <XCircle size={16} className="text-rose-500 mt-0.5"/> : <AlertCircle size={16} className="text-amber-500 mt-0.5"/>}
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-700">{issue.message}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">{issue.remediation}</p>
                                        {issue.category === 'Compliance' && (
                                            <button onClick={() => setRemediationIssue(issue)} className="text-[10px] font-black text-emerald-600 uppercase mt-2 hover:underline flex items-center gap-1">
                                                <Wrench size={10}/> Auto-Remediate
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Remediation Modal */}
        {remediationIssue && (
            <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900">Remediation Action</h3>
                        <button onClick={() => setRemediationIssue(null)}><XCircle size={20}/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-slate-600 mb-4">{remediationIssue.remediation}</p>
                        
                        {remediationIssue.id.includes('comp_tax') && (
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Latin Name</label>
                                <div className="flex gap-2">
                                    <input type="text" value={fixForm.latin_name || ''} onChange={e => setFixForm({...fixForm, latin_name: e.target.value})} className={inputClass} />
                                    <button onClick={handleAiLatinName} className="bg-purple-100 text-purple-600 p-3 rounded-xl font-bold text-xs">AI</button>
                                </div>
                            </div>
                        )}

                        {remediationIssue.id.includes('comp_id') && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ring Number</label>
                                    <input type="text" value={fixForm.ring_number || ''} onChange={e => setFixForm({...fixForm, ring_number: e.target.value})} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Microchip ID</label>
                                    <input type="text" value={fixForm.microchip_id || ''} onChange={e => setFixForm({...fixForm, microchip_id: e.target.value})} className={inputClass} />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={fixForm.has_no_id || false} onChange={e => setFixForm({...fixForm, has_no_id: e.target.checked})} className="rounded text-emerald-600 focus:ring-emerald-500" />
                                    <span className="text-xs font-bold text-slate-700">Animal has no physical ID (e.g. Amphibian)</span>
                                </label>
                            </div>
                        )}

                        {remediationIssue.id === 'sec_no_admin' && (
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Promote User to Admin</label>
                                <select value={fixForm.newAdminId || ''} onChange={e => setFixForm({...fixForm, newAdminId: e.target.value})} className={inputClass}>
                                    <option value="">Select User...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        )}

                        <button onClick={handleApplyFix} disabled={isFixing} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg mt-2 flex items-center justify-center gap-2">
                            {isFixing ? <Loader2 size={16} className="animate-spin"/> : <Wrench size={16}/>} Apply Fix
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SettingsDiagnostics;
