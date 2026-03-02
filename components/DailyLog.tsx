
import React, { useState } from 'react';
import { AnimalCategory, LogType, LogEntry } from '@/types';
import { ClipboardList, Check, Droplets, ChevronLeft, ChevronRight, Plus, Thermometer, Scale, Utensils, ArrowRight, Loader2, Search, Filter, Activity } from 'lucide-react';
import { formatWeightDisplay } from '@/src/services/weightUtils';
import AddEntryModal from './AddEntryModal';
import { useDailyLogData } from '@/src/hooks/useDailyLogData';
import { useAppData } from '@/src/context/AppContext';

interface DailyLogProps {
  activeCategory: AnimalCategory;
  setActiveCategory: (cat: AnimalCategory) => void;
  viewDate: string;
  setViewDate: (date: string) => void;
}

const DailyLog: React.FC<DailyLogProps> = ({ activeCategory, setActiveCategory, viewDate, setViewDate }) => {
  const { 
    animals, 
    isLoading, 
    sortOption, 
    cycleSort, 
    getTodayLog, 
    handleQuickCheck, 
    addLogEntry 
  } = useDailyLogData(viewDate, activeCategory);

  const { foodOptions, feedMethods, eventTypes } = useAppData();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [logType, setLogType] = useState<LogType>(LogType.WEIGHT);
  const [editingLog, setEditingLog] = useState<LogEntry | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const filteredAnimals = animals.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.species.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCellClick = (animalId: string, type: LogType, existingLog?: LogEntry) => {
    setSelectedAnimalId(animalId);
    setLogType(type);
    setEditingLog(existingLog);
    setModalOpen(true);
  };

  const isExotic = activeCategory === AnimalCategory.EXOTICS;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-4 -mt-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
            <Activity className="text-emerald-600" size={28} /> Daily Operations
          </h1>
          <p className="text-slate-500 text-sm font-medium">Mandatory husbandry logs for {viewDate}.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search collection..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all shadow-sm"
                />
            </div>
            <div className="flex items-center bg-white p-1 rounded-xl border-2 border-slate-200 shadow-sm">
                <button type="button" onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() - 1); setViewDate(d.toISOString().split('T')[0]); }} className="p-2 text-slate-400 hover:text-slate-900"><ChevronLeft size={18}/></button>
                <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} className="bg-transparent border-none focus:ring-0 text-slate-800 font-black text-[10px] w-32 text-center p-0 uppercase"/>
                <button type="button" onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() + 1); setViewDate(d.toISOString().split('T')[0]); }} className="p-2 text-slate-400 hover:text-slate-900"><ChevronRight size={18}/></button>
            </div>
            <button type="button" onClick={cycleSort} className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 transition-all shadow-sm flex items-center gap-2">
                <Filter size={14} /> {sortOption.replace('-', ' ')}
            </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(Object.values(AnimalCategory) as string[]).map((cat) => (
            <button key={String(cat)} type="button" onClick={() => setActiveCategory(cat as AnimalCategory)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2 ${activeCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>{cat}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAnimals.map(animal => {
            const logs = {
                weight: getTodayLog(animal.id, LogType.WEIGHT),
                feed: getTodayLog(animal.id, LogType.FEED),
                temp: getTodayLog(animal.id, LogType.TEMPERATURE),
                mist: getTodayLog(animal.id, LogType.MISTING),
                water: getTodayLog(animal.id, LogType.WATER),
            };

            return (
                <div key={animal.id} className="bg-white rounded-2xl border-2 border-slate-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-4 min-w-0">
                            <img src={animal.image_url} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shrink-0 shadow-sm" referrerPolicy="no-referrer" />
                            <div className="min-w-0">
                                <h3 className="font-black text-slate-900 uppercase text-sm md:text-base truncate leading-tight">{animal.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{animal.species}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto flex-1 max-w-4xl">
                            {/* Weight / Temp Cell */}
                            <button 
                                type="button" 
                                onClick={() => handleCellClick(animal.id, isExotic ? LogType.TEMPERATURE : LogType.WEIGHT, isExotic ? logs.temp : logs.weight)} 
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                                    (isExotic ? logs.temp : logs.weight) ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-dashed border-slate-200 text-slate-400 hover:border-emerald-200'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    {isExotic ? <Thermometer size={14}/> : <Scale size={14}/>}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{isExotic ? 'Gradient' : 'Weight'}</span>
                                </div>
                                <div className="mt-1 font-black text-xs">
                                    {isExotic ? (logs.temp ? `${logs.temp.basking_temp_c}°/${logs.temp.cool_temp_c}°` : '--') : (logs.weight ? formatWeightDisplay(logs.weight.weight_grams, animal.weight_unit) : '--')}
                                </div>
                            </button>

                            {/* Secondary Temp / Envir Cell */}
                            {!isExotic && (
                                <button 
                                    type="button" 
                                    onClick={() => handleCellClick(animal.id, LogType.TEMPERATURE, logs.temp)} 
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                                        logs.temp ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-dashed border-slate-200 text-slate-400 hover:border-emerald-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Thermometer size={14}/>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Envir.</span>
                                    </div>
                                    <div className="mt-1 font-black text-xs">
                                        {logs.temp ? `${logs.temp.temperature_c}°C` : '--'}
                                    </div>
                                </button>
                            )}

                            {/* Intake Cell */}
                            <button 
                                type="button" 
                                onClick={() => handleCellClick(animal.id, LogType.FEED, logs.feed)} 
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                                    logs.feed ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-dashed border-slate-200 text-slate-400 hover:border-emerald-200'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Utensils size={14}/>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Intake</span>
                                </div>
                                <div className="mt-1 font-black text-xs truncate max-w-full px-2">
                                    {logs.feed ? (typeof logs.feed.value === 'string' ? logs.feed.value : String(logs.feed.value || 'Fed')) : '--'}
                                </div>
                            </button>

                            {/* Quick Actions (Exotics) */}
                            {isExotic && (
                                <div className="flex gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => handleQuickCheck(animal.id, LogType.MISTING)}
                                        className={`flex-1 flex flex-col items-center justify-center rounded-xl border-2 transition-all ${
                                            logs.mist ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-300 hover:text-blue-400 hover:border-blue-200'
                                        }`}
                                    >
                                        <Droplets size={16} />
                                        <span className="text-[8px] font-black uppercase mt-1">Mist</span>
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => handleQuickCheck(animal.id, LogType.WATER)}
                                        className={`flex-1 flex flex-col items-center justify-center rounded-xl border-2 transition-all ${
                                            logs.water ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-300 hover:text-emerald-400 hover:border-emerald-200'
                                        }`}
                                    >
                                        <Check size={16} />
                                        <span className="text-[8px] font-black uppercase mt-1">Water</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="hidden md:flex flex-col items-end gap-1 min-w-[100px]">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                (logs.weight || logs.temp) && logs.feed ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                                {(logs.weight || logs.temp) && logs.feed ? 'Complete' : 'Pending'}
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}

        {filteredAnimals.length === 0 && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-24 text-center">
                <ClipboardList size={48} className="mx-auto mb-4 text-slate-200"/>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Nil Records for this Section</p>
            </div>
        )}
      </div>

      {modalOpen && selectedAnimalId && (
          <AddEntryModal 
            isOpen={modalOpen} 
            onClose={() => setModalOpen(false)} 
            onSave={(entry) => {
                // The hook handles data refresh via useLiveQuery
            }} 
            animal={animals.find(a => a.id === selectedAnimalId)!} 
            initialType={logType} 
            existingLog={editingLog}
            foodOptions={foodOptions}
            feedMethods={feedMethods[activeCategory]}
            eventTypes={eventTypes}
            initialDate={viewDate}
            allAnimals={animals}
          />
      )}
    </div>
  );
};

export default DailyLog;
