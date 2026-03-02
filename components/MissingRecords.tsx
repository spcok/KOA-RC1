
import React from 'react';
import { AnimalCategory } from '@/types';
import { AlertOctagon, CheckCircle2, Scale, Utensils, Calendar, Search, Filter, Loader2, AlertTriangle } from 'lucide-react';
import { useMissingRecordData } from '@/src/hooks/useMissingRecordData';

const MissingRecords: React.FC = () => {
  const { 
    analysis, 
    totalMissingDays, 
    isLoading, 
    daysToCheck, 
    setDaysToCheck, 
    selectedCategory, 
    setSelectedCategory,
    searchTerm,
    setSearchTerm
  } = useMissingRecordData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all shadow-sm uppercase tracking-wider";

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-4 -mt-4 border-b border-slate-200">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                    <AlertOctagon className="text-rose-600" size={28} /> Monitoring Gaps
                </h1>
                <p className="text-slate-500 text-sm font-medium">Official audit of missing animal health and husbandry data.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search animals..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all shadow-sm"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as AnimalCategory | 'ALL')}
                        className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-emerald-500 focus:outline-none transition-all shadow-sm"
                    >
                        <option value="ALL">All Sections</option>
                        {Object.values(AnimalCategory).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-3 py-1 shadow-sm">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Period:</span>
                        <input 
                            type="number" 
                            min="1" max="30"
                            value={daysToCheck}
                            onChange={(e) => setDaysToCheck(Number.parseInt(e.target.value) || 7)}
                            className="w-12 bg-transparent text-xs font-black text-slate-900 focus:outline-none text-center"
                        />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Days</span>
                    </div>
                </div>
                <div className="bg-rose-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Audit Alert</span>
                        <span className="text-xs font-black uppercase tracking-widest">Total Blanks</span>
                    </div>
                    <span className="text-2xl font-black">{totalMissingDays}</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {analysis.map((item) => {
                const hasGaps = item.missingCount > 0;
                return (
                    <div key={item.animal.id} className={`bg-white rounded-2xl border-2 transition-all group shadow-sm hover:shadow-md p-6 ${
                        hasGaps ? 'border-rose-200 hover:border-rose-400' : 'border-slate-200 hover:border-emerald-400'
                    }`}>
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="relative">
                                    <img 
                                        src={item.animal.imageUrl} 
                                        alt="" 
                                        className={`w-16 h-16 rounded-2xl object-cover border-2 ${hasGaps ? 'border-rose-100' : 'border-emerald-100'}`}
                                        referrerPolicy="no-referrer"
                                    />
                                    {hasGaps && (
                                        <div className="absolute -top-2 -right-2 bg-rose-600 text-white p-1 rounded-lg shadow-lg">
                                            <AlertTriangle size={14} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">{item.animal.name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                            item.completionRate === 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                            item.completionRate > 70 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                        }`}>
                                            {item.completionRate}% RATING
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        {item.animal.species} <span className="w-1 h-1 bg-slate-200 rounded-full" /> {item.animal.category}
                                    </p>
                                    
                                    <div className="flex items-center gap-4 mt-4">
                                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                            <Scale size={14} className="text-emerald-500" /> 
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weights: <span className="text-slate-900">{item.weightCount}</span>/{daysToCheck}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                            <Utensils size={14} className="text-orange-500" /> 
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feeds: <span className="text-slate-900">{item.feedCount}</span>/{daysToCheck}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 max-w-2xl">
                                <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200 shadow-inner">
                                    <div className="flex gap-1.5 h-10 w-full mb-3">
                                        {item.timeline.map((day, idx) => (
                                            <div 
                                                key={idx}
                                                title={`${day.date}: ${day.present ? 'Data Present' : 'No Records'}`}
                                                className={`flex-1 rounded-md transition-all ${
                                                    day.present ? 'bg-emerald-500 shadow-sm' : 'bg-rose-200 border-2 border-rose-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Calendar size={12}/> {new Date(item.timeline[0].date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                        </span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                             {new Date(item.timeline[item.timeline.length - 1].date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} <Calendar size={12}/>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end justify-center gap-2 min-w-[140px]">
                                {hasGaps ? (
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Gaps Detected</span>
                                        <span className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-900/20">
                                            {item.missingCount} MISSING
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Audit Passed</span>
                                        <span className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 flex items-center gap-2">
                                            <CheckCircle2 size={14} /> COMPLETE
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {analysis.length === 0 && (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-24 text-center">
                    <AlertOctagon size={48} className="mx-auto mb-4 text-slate-200"/>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Nil Monitoring Gaps Detected</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default MissingRecords;
