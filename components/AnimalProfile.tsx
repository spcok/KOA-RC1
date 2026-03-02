import React, { useState, useMemo } from 'react';
import { LogType, AnimalCategory, HazardRating } from '@/types';
import { 
  ChevronLeft, Scale, Utensils, Printer, Edit, Trash2, 
  AlertTriangle, Plus, Filter, Activity, Archive, Skull, 
  Truck, Loader2, Info, Calendar, MapPin, ShieldCheck,
  History, Heart, Layers, TrendingUp, Thermometer, Droplets,
  CheckCircle2, Clock, User, Fingerprint, ClipboardCheck
} from 'lucide-react';
import { formatWeightDisplay } from '@/src/services/weightUtils';
import AddEntryModal from './AddEntryModal';
import SignGenerator from './SignGenerator';
import { useAuthStore } from '@/src/store/authStore';
import { usePermissions } from '@/src/hooks/usePermissions';
import AnimalFormModal from './AnimalFormModal';
import { IUCNBadge } from './IUCNBadge';
import { useAnimalProfileData } from '@/src/hooks/useAnimalProfileData';
import { DEFAULT_FOOD_OPTIONS, DEFAULT_FEED_METHODS, DEFAULT_EVENT_TYPES } from '@/constants';

interface AnimalProfileProps {
  animalId: string;
  onBack: () => void;
}

const AnimalProfile: React.FC<AnimalProfileProps> = ({ animalId, onBack }) => {
  const { profile: currentUser } = useAuthStore();
  const { isStaff } = usePermissions();
  
  const {
    animal,
    logs,
    tasks,
    orgProfile,
    allAnimals,
    isLoading,
    archiveAnimal
  } = useAnimalProfileData(animalId);

  const [activeTab, setActiveTab] = useState<'Overview' | 'History' | 'Medical' | 'Tasks'>('Overview');
  const [logFilter, setLogFilter] = useState<LogType | 'ALL'>('ALL');
  
  const [isSignGeneratorOpen, setIsSignGeneratorOpen] = useState(false);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveForm, setArchiveForm] = useState<{ reason: string, type: 'Disposition' | 'Death' }>({
    reason: '',
    type: 'Disposition'
  });
  const [entryType, setEntryType] = useState<LogType>(LogType.GENERAL);

  const age = useMemo(() => {
      if (!animal?.dob) return 'Unknown';
      const diff = Date.now() - new Date(animal.dob).getTime();
      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      return `${years} years`;
  }, [animal?.dob]);

  const latestWeight = useMemo(() => logs.find(l => l.log_type === LogType.WEIGHT), [logs]);
  const lastFeed = useMemo(() => logs.find(l => l.log_type === LogType.FEED), [logs]);

  const filteredLogs = useMemo(() => {
      if (logFilter === 'ALL') return logs;
      return logs.filter(l => l.log_type === logFilter);
  }, [logs, logFilter]);

  const medicalLogs = useMemo(() => {
      return logs.filter(l => l.log_type === LogType.HEALTH);
  }, [logs]);

  const handleArchiveSubmit = async () => {
    if (!archiveForm.reason) return;
    try {
      await archiveAnimal(archiveForm.reason, archiveForm.type);
      setIsArchiveModalOpen(false);
      onBack();
    } catch (err) {
      console.error("Failed to archive animal:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50/50 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Loading Subject Profile...</p>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50/50 gap-6 p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300">
            <Skull size={40} />
        </div>
        <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Subject Not Found</h2>
            <p className="text-slate-500 text-sm font-medium mt-2">The requested animal profile does not exist or has been purged.</p>
        </div>
        <button onClick={onBack} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all active:scale-95">
            Return to Registry
        </button>
      </div>
    );
  }

  const isHighHazard = animal.hazard_rating === HazardRating.HIGH || animal.is_venomous;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 font-sans animate-in fade-in duration-500">
        {/* STICKY FROSTED HEADER */}
        <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={onBack} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm">
                            <img src={animal.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{animal.name}</h1>
                                {isHighHazard && <span className="text-rose-600 animate-pulse"><Skull size={16}/></span>}
                                {animal.archived && <span className="bg-slate-900 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Archived</span>}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{animal.species}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button onClick={() => setIsSignGeneratorOpen(true)} className="flex-1 md:flex-none p-3 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:shadow-md" title="Signage">
                        <Printer size={18} />
                    </button>
                    <button onClick={() => setIsEditProfileOpen(true)} className="flex-1 md:flex-none p-3 text-slate-500 hover:text-emerald-600 bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:shadow-md" title="Edit Profile">
                        <Edit size={18} />
                    </button>
                    {isStaff && (
                        <button onClick={() => setIsArchiveModalOpen(true)} className="flex-1 md:flex-none p-3 text-slate-500 hover:text-rose-600 bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:shadow-md" title="Archive">
                            <Archive size={18} />
                        </button>
                    )}
                    <button 
                        onClick={() => { setEntryType(LogType.GENERAL); setIsAddEntryOpen(true); }}
                        className="flex-[2] md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-900/10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <Plus size={16} strokeWidth={3} /> Log Activity
                    </button>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT COLUMN: IDENTITY & STATS (BENTO) */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* IDENTITY CARD */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden group">
                        <div className="aspect-square relative overflow-hidden">
                            <img src={animal.image_url} alt={animal.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                                <div>
                                    <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">Subject ID</p>
                                    <p className="text-white font-mono text-xs font-bold">{animal.id.split('-')[0].toUpperCase()}</p>
                                </div>
                                <IUCNBadge status={animal.red_list_status} size="md" />
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Calendar size={10}/> Hatched/DOB</p>
                                    <p className="text-xs font-black text-slate-800">{animal.dob ? new Date(animal.dob).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Unknown'}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><User size={10}/> Sex</p>
                                    <p className="text-xs font-black text-slate-800 uppercase">{animal.sex}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <Fingerprint size={16} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Microchip</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900 font-mono">{animal.microchip_id || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <Layers size={16} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ring No.</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900 font-mono">{animal.ring_number || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <MapPin size={16} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900 uppercase">{animal.location}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QUICK STATS */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
                            <div className="relative z-10 flex justify-between items-start mb-4">
                                <div className="p-2 bg-white/10 rounded-xl"><Scale size={20} /></div>
                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Current Weight</span>
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black tracking-tight mb-1">
                                    {latestWeight?.weight_grams ? formatWeightDisplay(latestWeight.weight_grams, animal.weight_unit) : (latestWeight?.value || 'N/A')}
                                </h3>
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                    {latestWeight ? `Last recorded ${new Date(latestWeight.log_date).toLocaleDateString()}` : 'No records found'}
                                </p>
                            </div>
                            <TrendingUp size={120} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
                        </div>

                        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 text-orange-600 rounded-xl"><Utensils size={18} /></div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nutrition Status</h4>
                                </div>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Diet</span>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Last Intake</p>
                                    <p className="text-sm font-black text-slate-800">{lastFeed?.value || 'NIL'}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 italic">{lastFeed?.notes || 'No notes available'}</p>
                                </div>
                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flying Weight</span>
                                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                        {animal.flying_weight_g ? formatWeightDisplay(animal.flying_weight_g, animal.weight_unit) : '--'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: CONTENT TABS (BENTO) */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* TABS NAVIGATION */}
                    <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex gap-1 overflow-x-auto scrollbar-hide">
                        {[
                            { id: 'Overview', icon: Info, label: 'Overview' },
                            { id: 'History', icon: History, label: 'Husbandry feed' },
                            { id: 'Medical', icon: Heart, label: 'Clinical File' },
                            { id: 'Tasks', icon: ClipboardCheck, label: 'Duties' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'
                                }`}
                            >
                                <tab.icon size={14} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* TAB CONTENT: OVERVIEW */}
                    {activeTab === 'Overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm space-y-8">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Info size={12}/> Subject Narrative
                                    </h4>
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed">{animal.description || "No physical description available."}</p>
                                </div>
                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 relative">
                                    <AlertTriangle size={48} className="absolute -right-2 -bottom-2 text-amber-200/50" />
                                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <AlertTriangle size={12}/> Critical Husbandry Notes
                                    </h4>
                                    {animal.critical_husbandry_notes && animal.critical_husbandry_notes.length > 0 ? (
                                        <ul className="space-y-3">
                                            {animal.critical_husbandry_notes.map((note, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-xs font-bold text-slate-700">
                                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></div>
                                                    {note}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs font-bold text-amber-800/50 italic">No critical notes flagged for this subject.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Thermometer size={12}/> Target Environment
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Day Temp</p>
                                            <p className="text-lg font-black text-slate-800">{animal.target_day_temp_c ? `${animal.target_day_temp_c}°C` : '--'}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Night Temp</p>
                                            <p className="text-lg font-black text-slate-800">{animal.target_night_temp_c ? `${animal.target_night_temp_c}°C` : '--'}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Humidity Min</p>
                                            <p className="text-lg font-black text-slate-800">{animal.target_humidity_min_percent ? `${animal.target_humidity_min_percent}%` : '--'}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Humidity Max</p>
                                            <p className="text-lg font-black text-slate-800">{animal.target_humidity_max_percent ? `${animal.target_humidity_max_percent}%` : '--'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Droplets size={18} className="text-blue-500" />
                                            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Misting Frequency</span>
                                        </div>
                                        <span className="text-xs font-black text-blue-900">{animal.misting_frequency || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
                                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <ShieldCheck size={12}/> Statutory Metadata
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Arrival Date</span>
                                            <span className="text-xs font-bold">{animal.acquisition_date ? new Date(animal.acquisition_date).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Origin</span>
                                            <span className="text-xs font-bold">{animal.origin || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Hazard Class</span>
                                            <span className="text-xs font-black text-rose-400 uppercase">{animal.hazard_rating}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: HISTORY FEED */}
                    {activeTab === 'History' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setLogFilter('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${logFilter === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}`}>ALL</button>
                                {[LogType.WEIGHT, LogType.FEED, LogType.FLIGHT, LogType.TRAINING, LogType.TEMPERATURE].map(type => (
                                    <button key={type} onClick={() => setLogFilter(type)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${logFilter === type ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}`}>{type}</button>
                                ))}
                            </div>

                            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50/50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Time</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Point</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Narrative</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Auth</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredLogs.map(log => (
                                                <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <p className="text-xs font-black text-slate-700">{new Date(log.log_date).toLocaleDateString('en-GB')}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(log.log_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                            log.log_type === LogType.WEIGHT ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            log.log_type === LogType.FEED ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                            'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}>
                                                            {log.log_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="text-sm font-black text-slate-900">
                                                            {log.log_type === LogType.WEIGHT && log.weight_grams ? formatWeightDisplay(log.weight_grams, animal.weight_unit) : log.value}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-xs font-medium text-slate-500 italic max-w-xs truncate">{log.notes || '-'}</p>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{log.user_initials}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredLogs.length === 0 && (
                                                <tr><td colSpan={5} className="px-8 py-24 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Nil Records Found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: MEDICAL */}
                    {activeTab === 'Medical' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Clinical Patient File</h3>
                                <button 
                                    onClick={() => { setEntryType(LogType.HEALTH); setIsAddEntryOpen(true); }}
                                    className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-rose-900/10 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
                                >
                                    <Plus size={16} strokeWidth={3} /> Add Clinical Record
                                </button>
                            </div>

                            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-rose-50/30 border-b border-rose-100">
                                            <tr>
                                                <th className="px-8 py-5 text-[10px] font-black text-rose-400 uppercase tracking-widest">Date</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-rose-400 uppercase tracking-widest">Category</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-rose-400 uppercase tracking-widest">Clinical Findings & Treatment</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-rose-400 uppercase tracking-widest text-right">Auth</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {medicalLogs.map(log => (
                                                <tr key={log.id} className="hover:bg-rose-50/20 transition-colors group">
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <span className="text-xs font-black text-slate-700">{new Date(log.log_date).toLocaleDateString('en-GB')}</span>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-rose-50 text-rose-700 border-rose-100">
                                                            {log.health_record_type || 'General'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-sm font-black text-slate-900 mb-1">{log.value}</p>
                                                        <p className="text-xs font-medium text-slate-500 italic leading-relaxed">{log.notes || '-'}</p>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{log.user_initials}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {medicalLogs.length === 0 && (
                                                <tr><td colSpan={4} className="px-8 py-24 text-center text-[10px] font-black text-rose-200 uppercase tracking-[0.4em]">No Clinical History Found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: TASKS */}
                    {activeTab === 'Tasks' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Assigned Duties</h3>
                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 uppercase tracking-widest">
                                    <CheckCircle2 size={14} /> {tasks.filter(t => t.completed).length} / {tasks.length} Resolved
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tasks.map(task => (
                                    <div key={task.id} className={`p-6 rounded-[2rem] border-2 transition-all ${task.completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm hover:border-emerald-500'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-2 rounded-xl ${task.completed ? 'bg-slate-200 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                                <ClipboardCheck size={20} />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                                                <p className="text-xs font-black text-slate-800 flex items-center gap-1.5 justify-end">
                                                    <Clock size={12} className="text-slate-400" />
                                                    {new Date(task.due_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <h4 className={`text-sm font-black uppercase tracking-tight mb-2 ${task.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{task.title}</h4>
                                        <p className="text-xs font-medium text-slate-500 italic line-clamp-2">{task.notes || 'No additional instructions provided.'}</p>
                                    </div>
                                ))}
                                {tasks.length === 0 && (
                                    <div className="col-span-full py-24 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                                        <CheckCircle2 size={48} className="mx-auto mb-4 text-slate-200" />
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No Pending Duties</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* MODALS */}
        {isSignGeneratorOpen && (
            <SignGenerator 
                animal={animal}
                orgProfile={orgProfile || null}
                onClose={() => setIsSignGeneratorOpen(false)}
            />
        )}

        {isEditProfileOpen && (
            <AnimalFormModal
                isOpen={isEditProfileOpen}
                onClose={() => setIsEditProfileOpen(false)}
                initialData={animal}
            />
        )}

        {isAddEntryOpen && (
            <AddEntryModal 
                isOpen={isAddEntryOpen}
                onClose={() => setIsAddEntryOpen(false)}
                animal={animal}
                initialType={entryType}
                foodOptions={DEFAULT_FOOD_OPTIONS}
                feedMethods={DEFAULT_FEED_METHODS[animal.category] || []}
                eventTypes={DEFAULT_EVENT_TYPES}
                allAnimals={allAnimals}
            />
        )}

        {/* ARCHIVE MODAL */}
        {isArchiveModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="p-10 space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                                <Archive size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Archive Subject</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Formal Disposition Registry</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Archive Type</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => setArchiveForm(prev => ({ ...prev, type: 'Disposition' }))}
                                        className={`flex flex-col items-center justify-center gap-3 py-6 rounded-3xl border-2 transition-all ${archiveForm.type === 'Disposition' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <Truck size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Disposition</span>
                                    </button>
                                    <button 
                                        onClick={() => setArchiveForm(prev => ({ ...prev, type: 'Death' }))}
                                        className={`flex flex-col items-center justify-center gap-3 py-6 rounded-3xl border-2 transition-all ${archiveForm.type === 'Death' ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-md' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <Skull size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Death</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Reason / Details</label>
                                <textarea 
                                    value={archiveForm.reason}
                                    onChange={(e) => setArchiveForm(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder={archiveForm.type === 'Death' ? "Cause of death, circumstances, disposal method..." : "Transfer destination, loan details, sale information..."}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-sm font-medium focus:border-emerald-500 transition-all outline-none min-h-[140px] resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button 
                                onClick={() => setIsArchiveModalOpen(false)}
                                className="flex-1 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleArchiveSubmit}
                                disabled={!archiveForm.reason}
                                className="flex-1 bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 shadow-lg shadow-slate-900/20"
                            >
                                Commit to Archive
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AnimalProfile;
