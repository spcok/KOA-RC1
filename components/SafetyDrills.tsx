
import React, { useState, useMemo } from 'react';
import { SiteLogEntry } from '@/types';
import { ShieldAlert, Plus, Clock, Users, Timer, X, Trash2, UserCheck, Check, Loader2, Search, Filter, Siren } from 'lucide-react';
import { useSafetyDrillData } from '@/src/hooks/useSafetyDrillData';

const SafetyDrills: React.FC = () => {
  const { 
    drills, 
    isLoading, 
    searchTerm, 
    setSearchTerm, 
    filterType, 
    setFilterType, 
    getOnSitePersonnel, 
    addDrillLog, 
    deleteDrillLog 
  } = useSafetyDrillData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingDrill, setViewingDrill] = useState<SiteLogEntry | null>(null);
  
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [drillType, setDrillType] = useState('Fire');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [verifiedUserIds, setVerifiedUserIds] = useState<Set<string>>(new Set());

  const currentOnSite = useMemo(() => getOnSitePersonnel(date, time), [date, time, getOnSitePersonnel]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const toggleVerification = (userId: string) => {
      setVerifiedUserIds(prev => {
          const next = new Set(prev);
          if (next.has(userId)) next.delete(userId);
          else next.add(userId);
          return next;
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const verifiedList = currentOnSite.filter(p => verifiedUserIds.has(p.userId)).map(p => p.userName).join(', ');
      const missingList = currentOnSite.filter(p => !verifiedUserIds.has(p.userId)).map(p => p.userName).join(', ');

      await addDrillLog({
          date,
          title: `${drillType} Drill`,
          location: 'Site Wide',
          priority: 'High',
          status: 'Completed',
          description: JSON.stringify({
              time: time,
              duration: duration,
              totalOnSite: currentOnSite.length,
              verifiedNames: verifiedList,
              missingNames: missingList,
              performanceNotes: notes
          }),
          timestamp: new Date(`${date}T${time}`).getTime()
      });

      setIsModalOpen(false);
      setDuration('');
      setNotes('');
      setVerifiedUserIds(new Set());
  };

  const parseDrillDesc = (desc: string) => {
      try { return JSON.parse(desc); } catch (e) { return { performanceNotes: desc, verifiedNames: '', totalOnSite: 0, time: '00:00', duration: '0' }; }
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-400";

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-4 -mt-4 border-b border-slate-200">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                    <Siren className="text-emerald-600" size={28} /> Emergency Readiness Log
                </h1>
                <p className="text-slate-500 text-sm font-medium">Statutory readiness audits and cross-referenced roll calls.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search drills..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all shadow-sm"
                    />
                </div>
                <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-emerald-500 focus:outline-none transition-all shadow-sm"
                >
                    <option value="ALL">All Types</option>
                    <option value="Fire">Fire</option>
                    <option value="Escape">Escape</option>
                    <option value="Intruder">Intruder</option>
                    <option value="Power">Power</option>
                </select>
                <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:bg-black transition-all active:scale-95 font-black uppercase text-xs tracking-widest shrink-0">
                    <Plus size={18}/> Log Drill Event
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {drills.map(log => {
                const data = parseDrillDesc(log.description);
                const verifiedCount = data.verifiedNames ? data.verifiedNames.split(',').filter(Boolean).length : 0;
                const isFullyAccounted = verifiedCount >= data.totalOnSite && data.totalOnSite > 0;
                
                return (
                    <div key={log.id} className="bg-white rounded-2xl border-2 border-slate-200 p-6 hover:border-emerald-500 transition-all group shadow-sm hover:shadow-md">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${isFullyAccounted ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    <ShieldAlert size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">{log.title}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                            isFullyAccounted ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200'
                                        }`}>
                                            {isFullyAccounted ? 'Accounted' : 'Discrepancy'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span className="flex items-center gap-1"><Clock size={12}/> {new Date(log.date).toLocaleDateString('en-GB')} @ {data.time}</span>
                                        <span className="flex items-center gap-1"><Timer size={12}/> {data.duration}m Duration</span>
                                        <span className="flex items-center gap-1"><Users size={12}/> {verifiedCount} / {data.totalOnSite} Cleared</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 max-w-xl">
                                <p className="text-sm text-slate-600 font-medium leading-relaxed italic border-l-4 border-slate-100 pl-4">
                                    {data.performanceNotes || "No performance notes recorded for this audit."}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 self-end md:self-center">
                                <button onClick={() => setViewingDrill(log)} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg border border-slate-200 transition-all">
                                    <UserCheck size={14}/> Roll Call
                                </button>
                                <button onClick={() => { if(window.confirm("Purge drill audit?")) deleteDrillLog(log.id) }} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-200 transition-all">
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {drills.length === 0 && (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-24 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Nil Statutory Drill History</p>
                </div>
            )}
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-0 animate-in zoom-in-95 border-2 border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50 shadow-sm">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Log Readiness Drill</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Statutory Safety Audit</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1"><X size={24}/></button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                        <div className="bg-slate-50 p-6 rounded-2xl shadow-inner border-2 border-slate-200 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Event Date</label><input type="date" required value={date} onChange={e => setDate(e.target.value)} className={inputClass}/></div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Alarm Trigger Time</label><input type="time" required value={time} onChange={e => setTime(e.target.value)} className={inputClass}/></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Drill Classification</label>
                                    <select value={drillType} onChange={e => setDrillType(e.target.value)} className={inputClass}>
                                        <option value="Fire">Fire Evacuation</option>
                                        <option value="Escape">Animal Escape Protocol</option>
                                        <option value="Intruder">Security / Lockdown</option>
                                        <option value="Power">Critical Utility Failure</option>
                                    </select>
                                </div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Evac Duration (Mins)</label><input type="number" required value={duration} onChange={e => setDuration(e.target.value)} className={inputClass}/></div>
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Users size={14}/> Active Staff Roll Call</h3>
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-900 text-white shadow-sm">{verifiedUserIds.size} / {currentOnSite.length} Present</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {currentOnSite.map((p) => (
                                    <button key={p.id} type="button" onClick={() => toggleVerification(p.userId)} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${verifiedUserIds.has(p.userId) ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                                        <span className="text-xs font-bold">{p.userName}</span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${verifiedUserIds.has(p.userId) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>{verifiedUserIds.has(p.userId) && <Check size={12}/>}</div>
                                    </button>
                                ))}
                                {currentOnSite.length === 0 && (
                                     <div className="col-span-2 py-6 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">No personnel clocked-in at this timestamp.</p>
                                     </div>
                                )}
                            </div>
                        </div>

                        <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Performance Observations</label><textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inputClass} resize-none h-24 font-medium`} placeholder="Record readiness speed, compliance errors, or equipment issues..."/></div>
                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-[0.98]">Commit & Seal Audit</button>
                    </form>
                </div>
            </div>
        )}

        {viewingDrill && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-0 animate-in zoom-in-95 border-2 border-slate-300 overflow-hidden">
                    <div className="p-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50 shadow-sm">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Audit Details</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel Verification Report</p>
                        </div>
                        <button onClick={() => setViewingDrill(null)} className="text-slate-400 hover:text-slate-900 p-1"><X size={24}/></button>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Accounted Personnel</h3>
                            <div className="flex flex-wrap gap-2">
                                {parseDrillDesc(viewingDrill.description).verifiedNames.split(',').filter(Boolean).map((name: string) => (
                                    <span key={name} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100 uppercase tracking-tight">{name}</span>
                                ))}
                                {!parseDrillDesc(viewingDrill.description).verifiedNames && <span className="text-xs text-slate-400 italic">None recorded</span>}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Missing / Unaccounted</h3>
                            <div className="flex flex-wrap gap-2">
                                {parseDrillDesc(viewingDrill.description).missingNames.split(',').filter(Boolean).map((name: string) => (
                                    <span key={name} className="px-3 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-100 uppercase tracking-tight">{name}</span>
                                ))}
                                {!parseDrillDesc(viewingDrill.description).missingNames && <span className="text-xs text-slate-400 italic">None recorded</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SafetyDrills;

