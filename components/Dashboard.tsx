import React, { useState } from 'react';
import { Animal, AnimalCategory, HazardRating, UserRole } from '@/types';
import { Search, Plus, Scale, Utensils, ChevronLeft, ChevronRight, GripVertical, ArrowRight, Heart, CheckCircle, AlertCircle, ClipboardCheck, Skull, AlertTriangle, Lock, Unlock, Loader2 } from 'lucide-react';
import { formatWeightDisplay } from '@/src/services/weightUtils';
import AnimalFormModal from './AnimalFormModal';
import { useAuthStore } from '@/src/store/authStore';
import { useDashboardData } from '@/src/hooks/useDashboardData';

interface DashboardProps {
  onSelectAnimal: (animal: Animal) => void;
  activeTab: AnimalCategory;
  setActiveTab: (category: AnimalCategory) => void;
  viewDate: string;
  setViewDate: (date: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    onSelectAnimal, activeTab, setActiveTab, viewDate, setViewDate
}) => {
  const { profile: currentUser } = useAuthStore();
  
  const {
    filteredAnimals,
    animalStats,
    taskStats,
    isLoading,
    searchTerm,
    setSearchTerm,
    sortOption,
    isOrderLocked,
    toggleOrderLock,
    reorderAnimals,
    cycleSort
  } = useDashboardData(activeTab, viewDate);

  const [isCreateAnimalModalOpen, setIsCreateAnimalModalOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
      if (isOrderLocked) return;
      setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index || isOrderLocked) return;
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIndex || !reorderAnimals || isOrderLocked) {
          setDraggedIndex(null);
          return;
      }
      const reordered = [...filteredAnimals];
      const [draggedItem] = reordered.splice(draggedIndex, 1);
      reordered.splice(dropIndex, 0, draggedItem);
      reorderAnimals(reordered);
      setDraggedIndex(null);
  };

  const getWeightDisplay = (log?: any, unit: 'g' | 'oz' | 'lbs_oz' = 'g') => {
      if (!log) return '-';
      if (log.weight_grams) return formatWeightDisplay(log.weight_grams, unit);
      return typeof log.value === 'string' ? log.value : String(log.value || '-');
  };
  const getDateDisplay = (log?: any) => {
      if (!log || !log.log_date) return '';
      try { return new Date(log.log_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase(); } catch { return ''; }
  };
  const getTimeDisplay = (log?: any) => {
      if (!log || !log.log_date) return '';
      try { return new Date(log.log_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
  };

  const getSafeDate = (dateStr?: string | Date | null) => {
      if (!dateStr) return 'N/A';
      try {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return 'N/A';
          return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      } catch (e) {
          return 'N/A';
      }
  };

  if (isLoading) {
      return (
          <div className="p-8 flex flex-col items-center justify-center h-full min-h-[50vh] space-y-4">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Registry Data...</p>
          </div>
      );
  }

  return (
    <div className="p-4 md:p-8 pb-40 space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full max-w-7xl mx-auto relative z-10">
      
      {/* Header & Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <div className="md:col-span-2 flex flex-col justify-center space-y-2">
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">Dashboard</h1>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-widest opacity-80">Overview of {animalStats?.total || 0} active animals</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
            <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl"><Scale size={20} /></div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Weighed</span>
            </div>
            <div className="relative z-10 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">{animalStats?.weighed || 0}</span>
                <span className="text-sm font-bold text-slate-400">/ {animalStats?.total || 0}</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative z-10">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${((animalStats?.weighed || 0) / (animalStats?.total || 1)) * 100}%` }}></div>
            </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
            <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="p-2 bg-orange-100 text-orange-700 rounded-xl"><Utensils size={20} /></div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Fed</span>
            </div>
            <div className="relative z-10 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">{animalStats?.fed || 0}</span>
                <span className="text-sm font-bold text-slate-400">/ {animalStats?.total || 0}</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative z-10">
                <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${((animalStats?.fed || 0) / (animalStats?.total || 1)) * 100}%` }}></div>
            </div>
        </div>
      </div>

      {/* Tasks & Health Rota Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 text-slate-700 rounded-xl"><ClipboardCheck size={20} /></div>
                      <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Pending Duties</h2>
                  </div>
                  <span className="bg-slate-100 text-slate-600 text-xs font-black px-3 py-1 rounded-full">{taskStats?.pendingTasks?.length || 0}</span>
              </div>
              <div className="flex-1 overflow-y-auto max-h-48 pr-2 space-y-3 scrollbar-hide">
                  {(taskStats?.pendingTasks?.length || 0) > 0 ? (
                      (taskStats?.pendingTasks || []).map(t => (
                          <div key={t.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors">
                              <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0"/>
                              <div>
                                  <p className="text-sm font-bold text-slate-800 leading-tight">{t.title}</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">DUE: {getSafeDate(t.due_date)}</p>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 py-8">
                          <CheckCircle size={32} className="mb-3 text-emerald-400 opacity-50"/>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">All Duties Satisfied</p>
                      </div>
                  )}
              </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><Heart size={20} /></div>
                      <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Health Rota</h2>
                  </div>
                  <span className="bg-rose-50 text-rose-600 text-xs font-black px-3 py-1 rounded-full">{taskStats?.pendingHealth?.length || 0}</span>
              </div>
              <div className="flex-1 overflow-y-auto max-h-48 pr-2 space-y-3 scrollbar-hide">
                  {(taskStats?.pendingHealth?.length || 0) > 0 ? (
                      (taskStats?.pendingHealth || []).map(t => (
                          <div key={t.id} className="flex items-start gap-3 p-3 rounded-2xl bg-rose-50/50 border border-rose-100 hover:border-rose-200 transition-colors">
                              <Heart size={16} className="text-rose-500 mt-0.5 shrink-0"/>
                              <div>
                                  <p className="text-sm font-bold text-slate-800 leading-tight">{t.title}</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">MANDATORY: {getSafeDate(t.due_date)}</p>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 py-8">
                          <Heart size={32} className="mb-3 text-rose-300 opacity-30"/>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Collection Stable</p>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Sticky Control Bar */}
      <div className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-xl py-4 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex gap-1 overflow-x-auto scrollbar-hide w-full xl:w-auto pb-2 xl:pb-0">
                  {Object.values(AnimalCategory).map((cat: AnimalCategory) => (
                      <button key={cat} onClick={() => setActiveTab(cat)} className={`px-4 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeTab === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}>{cat}</button>
                  ))}
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-1 w-full sm:w-auto">
                        <button type="button" onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() - 1); setViewDate(d.toISOString().split('T')[0]); }} className="p-2 text-slate-400 hover:text-slate-700"><ChevronLeft size={18}/></button>
                        <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} className="px-2 py-2 text-xs font-black text-slate-800 bg-transparent border-none focus:ring-0 uppercase tracking-widest flex-1 text-center w-36" />
                        <button type="button" onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() + 1); setViewDate(d.toISOString().split('T')[0]); }} className="p-2 text-slate-400 hover:text-slate-700"><ChevronRight size={18}/></button>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"/>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 w-full sm:w-auto justify-between sm:justify-start">
                        <button type="button" onClick={cycleSort} className={`px-3 py-1 rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase transition-all ${sortOption === 'custom' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-200 text-slate-600'}`}>
                            {sortOption.replace('-', ' ')}
                            <ArrowRight size={12} className={`transition-transform duration-300 ${sortOption === 'alpha-desc' ? 'rotate-90' : sortOption === 'alpha-asc' ? '-rotate-90' : 'rotate-0'}`}/>
                        </button>
                        {sortOption === 'custom' && (
                            <button type="button" onClick={() => toggleOrderLock(!isOrderLocked)} className={`p-1.5 rounded-lg transition-all ${isOrderLocked ? 'text-emerald-600 hover:bg-emerald-100' : 'text-slate-400 hover:bg-slate-200'}`} title={isOrderLocked ? "Order Locked" : "Order Unlocked"}>
                                {isOrderLocked ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                        )}
                    </div>
              </div>
          </div>
      </div>

      {/* Animal List - Modern Card Rows */}
      <div className="space-y-3">
          {(filteredAnimals || []).map((animal, index) => {
              const d = animalStats?.animalData?.get(animal.id);
              const isHighHazard = animal.hazard_rating === HazardRating.HIGH || animal.is_venomous;
              const isMedHazard = animal.hazard_rating === HazardRating.MEDIUM;
              const isDraggable = sortOption === 'custom' && !isOrderLocked;
              
              return (
                  <div 
                    key={animal.id || index} 
                    draggable={isDraggable} 
                    onDragStart={() => handleDragStart(index)} 
                    onDragOver={(e) => handleDragOver(e, index)} 
                    onDrop={(e) => handleDrop(e, index)} 
                    onClick={() => onSelectAnimal(animal)}
                    className={`bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 group ${draggedIndex === index ? 'opacity-40 scale-[0.98]' : ''} ${d?.todayWeight ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}
                  >
                      <div className="flex items-center gap-4 w-full md:w-auto md:flex-1">
                          {isDraggable && (
                              <div className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                                  <GripVertical size={20} />
                              </div>
                          )}
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                              {animal.image_url ? <img src={animal.image_url} className="w-full h-full object-cover" alt={animal.name} /> : <div className="w-full h-full bg-slate-200"></div>}
                          </div>
                          <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                  <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight truncate">{animal.name}</h3>
                                  {isHighHazard && (<span title="Hazard Class High" className="text-rose-600 shrink-0 animate-pulse"><Skull size={14}/></span>)}
                                  {isMedHazard && !isHighHazard && (<span title="Hazard Class Medium" className="text-amber-500 shrink-0"><AlertTriangle size={14}/></span>)}
                              </div>
                              <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest truncate">{animal.species}</p>
                              {animal.latin_name && <p className="text-[10px] font-medium text-slate-400 italic truncate hidden md:block mt-0.5">{animal.latin_name}</p>}
                          </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto md:flex-1 items-center border-t border-slate-100 md:border-t-0 pt-4 md:pt-0">
                          
                          <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Today's Wt</span>
                              <span className={`text-sm md:text-base font-black tabular-nums tracking-tight ${d?.todayWeight ? "text-emerald-600" : "text-slate-800"}`}>
                                  {getWeightDisplay(d?.todayWeight, animal.weight_unit)}
                              </span>
                          </div>

                          <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Previous Wt</span>
                              {d?.previousWeight ? (
                                  <>
                                      <span className="text-xs font-bold text-slate-600">{getWeightDisplay(d.previousWeight, animal.weight_unit)}</span>
                                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{getDateDisplay(d.previousWeight)}</span>
                                  </>
                              ) : <span className="text-xs font-bold text-slate-300">N/A</span>}
                          </div>

                          <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Intake</span>
                              {d?.todayFeed ? (
                                  <>
                                      <span className="text-xs font-bold text-slate-800 uppercase truncate">{typeof d.todayFeed.value === 'string' ? d.todayFeed.value : String(d.todayFeed.value || 'Fed')}</span>
                                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">{getTimeDisplay(d.todayFeed)}</span>
                                  </>
                              ) : <span className="text-xs font-bold text-slate-300 uppercase">NIL</span>}
                          </div>

                          <div className="flex flex-col items-start md:items-end">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</span>
                              <span className="text-xs font-black text-slate-700 uppercase tracking-wider text-right">{animal.location}</span>
                          </div>

                      </div>
                  </div>
              );
          })}
      </div>
      
      {isCreateAnimalModalOpen && (
          <AnimalFormModal isOpen={isCreateAnimalModalOpen} onClose={() => setIsCreateAnimalModalOpen(false)} />
      )}
      
      {currentUser?.role === UserRole.ADMIN && (
          <button onClick={(e) => { e.stopPropagation(); setIsCreateAnimalModalOpen(true); }} className="fixed bottom-6 right-6 md:bottom-12 md:right-12 bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 z-40 font-black uppercase text-xs tracking-[0.2em] group border-4 border-white">
              <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300"/> Add Animal
          </button>
      )}
    </div>
  );
};

export default Dashboard;
