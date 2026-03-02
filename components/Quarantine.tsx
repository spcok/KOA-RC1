
import React, { useState } from 'react';
import { Animal, LogType, LogEntry, HealthRecordType } from '@/types';
import { 
    Biohazard, AlertTriangle, Plus, X, ArrowRight, ShieldCheck, 
    Thermometer, Loader2, Search, ShieldAlert, Calendar, Clock
} from 'lucide-react';
import { useQuarantineData } from '@/src/hooks/useQuarantineData';

const Quarantine: React.FC = () => {
  const { 
    quarantineAnimals, healthyAnimals, isLoading, isolateAnimal, 
    releaseAnimal, getLatestVitals, currentUser 
  } = useQuarantineData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const handleMoveToQuarantine = async (e: React.FormEvent) => {
      e.preventDefault();
      await isolateAnimal(selectedAnimalId, date, reason);
      setIsModalOpen(false);
      setSelectedAnimalId('');
      setReason('');
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-400";

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-4 -mt-4 border-b border-slate-200">
             <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                    <Biohazard className="text-amber-600" size={28} /> Quarantine & Isolation
                </h1>
                <p className="text-slate-500 text-sm font-medium">Manage animals in medical isolation or new arrivals.</p>
             </div>
             <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-amber-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:bg-amber-700 transition-all active:scale-95 font-black uppercase text-xs tracking-widest"
             >
                 <Plus size={18}/> Add to Quarantine
             </button>
        </div>

        {quarantineAnimals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quarantineAnimals.map((animal: Animal) => {
                    const startDate = new Date(animal.quarantine_start_date || Date.now());
                    const daysIn = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    const vitals = getLatestVitals(animal.id);

                    return (
                        <div key={animal.id} className="bg-white border-2 border-amber-200 rounded-3xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-all border-t-8 border-t-amber-500">
                            <div className="p-5 border-b border-amber-100 flex justify-between items-start bg-amber-50/30">
                                <div>
                                    <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg flex items-center gap-2">
                                        {animal.name}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{animal.species}</p>
                                </div>
                                <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <Clock size={12} /> Day {daysIn + 1}
                                </div>
                            </div>
                            
                            <div className="p-5 flex-1 space-y-4">
                                <div>
                                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                        <ShieldAlert size={12} /> Reason for Isolation
                                    </p>
                                    <div className="text-xs text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 italic leading-relaxed">
                                        "{animal.quarantine_reason || "No reason specified."}"
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Temp</p>
                                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                            <Thermometer size={14} className="text-amber-500" />
                                            {vitals.temp}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Weight</p>
                                        <div className="font-bold text-slate-700">
                                            {vitals.weight}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">
                                    <span className="flex items-center gap-1"><Calendar size={12}/> Started:</span>
                                    <span className="text-slate-600">{startDate.toLocaleDateString('en-GB')}</span>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-100">
                                <button 
                                    onClick={() => releaseAnimal(animal.id)}
                                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10 active:scale-[0.98]"
                                >
                                    <ShieldCheck size={16}/> Medical Release
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-300">
                <ShieldCheck size={64} className="mb-4 opacity-20 text-emerald-500" />
                <p className="font-black text-xs uppercase tracking-[0.3em]">Facility Clear</p>
                <p className="text-[10px] font-bold mt-2">No animals currently in isolation.</p>
            </div>
        )}

        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-0 animate-in zoom-in-95 border-2 border-slate-200 overflow-hidden">
                    <div className="p-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Isolate Animal</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Quarantine Registry</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-900 p-1"><X size={24}/></button>
                    </div>
                    <form onSubmit={handleMoveToQuarantine} className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Select Animal</label>
                                <select 
                                    required 
                                    value={selectedAnimalId} 
                                    onChange={e => setSelectedAnimalId(e.target.value)} 
                                    className={inputClass}
                                >
                                    <option value="">-- Choose Subject --</option>
                                    {healthyAnimals.map((a: Animal) => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Isolation Date</label>
                                <input 
                                    type="date" 
                                    required
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Reason / Condition</label>
                                <textarea 
                                    required
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    className={`${inputClass} h-32 resize-none`}
                                    placeholder="e.g. New arrival protocol, Showing signs of Avian Influenza..."
                                />
                            </div>
                        </div>

                        <div className="bg-amber-50 border-2 border-amber-100 rounded-xl p-4 flex gap-3">
                            <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                            <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase">
                                Isolation requires strict adherence to biosecurity protocols. Ensure all staff are notified.
                            </p>
                        </div>

                        <button type="submit" className="w-full py-4 bg-amber-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-700 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2">
                            <Biohazard size={18}/> Confirm Isolation
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Quarantine;
