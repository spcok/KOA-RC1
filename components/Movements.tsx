
import React, { useState } from 'react';
import { Animal, LogType, LogEntry, MovementType } from '@/types';
import { 
    ArrowLeftRight, Edit2, Plus, X, ArrowRight, User as UserIcon, 
    Loader2, Search, Filter, Truck, MapPin, Calendar, History
} from 'lucide-react';
import { useMovementData } from '@/src/hooks/useMovementData';

const Movements: React.FC = () => {
  const { 
    movementLogs, animals, isLoading, filterType, setFilterType, 
    searchTerm, setSearchTerm, addMovement, currentUser 
  } = useMovementData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formAnimalId, setFormAnimalId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formType, setFormType] = useState<MovementType>(MovementType.TRANSFER);
  const [formSource, setFormSource] = useState('');
  const [formDest, setFormDest] = useState('');
  const [formNotes, setFormNotes] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await addMovement({
          animalId: formAnimalId,
          date: formDate,
          type: formType,
          source: formSource,
          destination: formDest,
          notes: formNotes
      });
      setIsModalOpen(false);
      setFormAnimalId('');
      setFormSource('');
      setFormDest('');
      setFormNotes('');
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-400";

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-4 -mt-4 border-b border-slate-200">
             <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                    <Truck className="text-slate-600" size={28} /> Statutory Stock Ledger
                </h1>
                <p className="text-slate-500 text-sm font-medium">Record of collection acquisitions and dispositions (ZLA Section 9).</p>
             </div>
             <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search ledger..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all shadow-sm"
                    />
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)} 
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:bg-black transition-all active:scale-95 font-black uppercase text-xs tracking-widest"
                >
                    <Plus size={18}/> Record Transit
                </button>
             </div>
        </div>

        <div className="flex bg-white p-1 rounded-xl border-2 border-slate-200 shadow-sm overflow-x-auto w-full md:w-auto self-start inline-flex">
            {[
                { id: 'ALL', label: 'All Entries' },
                { id: MovementType.TRANSFER, label: 'Internal' },
                { id: MovementType.ACQUISITION, label: 'Acquisitions' },
                { id: MovementType.DISPOSITION, label: 'Dispositions' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id as any)}
                    className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        filterType === tab.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-1 gap-4">
            {movementLogs.length > 0 ? movementLogs.map(({ log, animal }) => {
                const isAcq = log.movement_type === MovementType.ACQUISITION;
                const isDisp = log.movement_type === MovementType.DISPOSITION;
                const isTransfer = log.movement_type === MovementType.TRANSFER;

                return (
                    <div key={log.id} className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group border-l-4 border-l-transparent hover:border-l-emerald-500">
                        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4 min-w-[200px]">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                    isAcq ? 'bg-emerald-50 text-emerald-600' :
                                    isDisp ? 'bg-rose-50 text-rose-600' :
                                    'bg-blue-50 text-blue-600'
                                }`}>
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 uppercase tracking-tight">{animal?.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{animal?.species}</p>
                                </div>
                            </div>

                            <div className="flex-1 flex items-center justify-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                                <div className="text-center flex-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Origin</p>
                                    <div className="flex items-center justify-center gap-1.5 font-bold text-slate-700 text-sm">
                                        <MapPin size={14} className="text-slate-300" />
                                        {log.source_location || 'Internal'}
                                    </div>
                                </div>
                                <div className="flex flex-col items-center px-4">
                                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border mb-2 ${
                                        isAcq ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                        isDisp ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                        'bg-blue-100 text-blue-700 border-blue-200'
                                    }`}>
                                        {log.movement_type}
                                    </div>
                                    <ArrowRight className="text-slate-300" size={20} />
                                </div>
                                <div className="text-center flex-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                                    <div className="flex items-center justify-center gap-1.5 font-bold text-slate-700 text-sm">
                                        <MapPin size={14} className="text-slate-300" />
                                        {log.destination_location || 'Internal'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 min-w-[150px]">
                                <div className="flex items-center gap-1.5 text-slate-600 font-bold text-sm">
                                    <Calendar size={14} className="text-slate-400" />
                                    {new Date(log.log_date).toLocaleDateString('en-GB')}
                                </div>
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                                    <UserIcon size={10}/> {log.created_by || 'SYS'}
                                </div>
                            </div>
                        </div>
                        {log.notes && (
                            <div className="px-5 pb-5 pt-0">
                                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-xs text-slate-500 italic font-medium">
                                    "{log.notes}"
                                </div>
                            </div>
                        )}
                    </div>
                );
            }) : (
                <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <History size={48} className="mx-auto mb-4 text-slate-100"/>
                    <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">No Transit Records Found</p>
                </div>
            )}
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-0 animate-in zoom-in-95 border-2 border-slate-200 overflow-hidden">
                    <div className="p-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Record Transit</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Stock Ledger Entry</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-900 p-1"><X size={24}/></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Subject Animal</label>
                                <select required value={formAnimalId} onChange={e => setFormAnimalId(e.target.value)} className={inputClass}>
                                    <option value="">-- Choose Subject --</option>
                                    {animals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Event Date</label>
                                    <input type="date" required value={formDate} onChange={e => setFormDate(e.target.value)} className={inputClass}/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Classification</label>
                                    <select value={formType} onChange={e => setFormType(e.target.value as any)} className={inputClass}>
                                        <option value={MovementType.TRANSFER}>Internal Transfer</option>
                                        <option value={MovementType.ACQUISITION}>Acquisition</option>
                                        <option value={MovementType.DISPOSITION}>Disposition</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Origin Point</label>
                                    <input type="text" value={formSource} onChange={e => setFormSource(e.target.value)} className={inputClass} placeholder="e.g. Enclosure A"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Terminal Point</label>
                                    <input type="text" required value={formDest} onChange={e => setFormDest(e.target.value)} className={inputClass} placeholder="e.g. Enclosure B"/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Notes / Reason</label>
                                <textarea 
                                    value={formNotes} 
                                    onChange={e => setFormNotes(e.target.value)} 
                                    className={`${inputClass} h-24 resize-none`} 
                                    placeholder="Reason for movement..."
                                />
                            </div>
                        </div>

                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2">
                            <Truck size={18}/> Commit to Ledger
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Movements;
