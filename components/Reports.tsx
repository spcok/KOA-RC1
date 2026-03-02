
import React from 'react';
import { AnimalCategory } from '@/types';
import { 
    Download, ChevronRight, FileBarChart, Layers, 
    Table2, Loader2, Calendar, Filter, Info, 
    TrendingUp, FileText, ShieldCheck, Activity
} from 'lucide-react';
import { useReportsData } from '@/src/hooks/useReportsData';
import { REPORT_SCHEMAS } from './reports/reportConfig';

const Reports: React.FC = () => {
  const { 
    animals, isLoading, isPending, selectedSchemaId, setSelectedSchemaId,
    startDate, setStartDate, endDate, setEndDate,
    selectedCategory, setSelectedCategory, tableData,
    currentSchema, getFormattedDateRange, exportToDocx, orgProfile,
    reportColumns
  } = useReportsData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all uppercase tracking-wide shadow-sm";

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
        {/* Sticky Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-4 -mt-4 border-b border-slate-200">
             <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                    <FileBarChart className="text-slate-600" size={28} /> Analytics Engine
                </h1>
                <p className="text-slate-500 text-sm font-medium">Generate statutory records and operational insights.</p>
             </div>
             <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                    onClick={exportToDocx} 
                    disabled={isPending || tableData.length === 0}
                    className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-all active:scale-95 font-black uppercase text-xs tracking-widest"
                >
                    {isPending ? <Loader2 size={18} className="animate-spin" /> : <Download size={18}/>}
                    {isPending ? 'Generating...' : 'Generate .DOCX Report'}
                </button>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar - Report Selection */}
            <div className="lg:col-span-3 space-y-4">
                <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Report Catalog</h2>
                    </div>
                    <div className="p-2 space-y-1">
                        {Object.values(REPORT_SCHEMAS).map(schema => (
                            <button
                                key={schema.id}
                                onClick={() => setSelectedSchemaId(schema.id)}
                                className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between group transition-all ${
                                    selectedSchemaId === schema.id 
                                    ? 'bg-slate-900 text-white shadow-md' 
                                    : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedSchemaId === schema.id ? 'bg-white/10' : 'bg-slate-100'}`}>
                                        {schema.id === 'DAILY_LOG' && <Activity size={14} />}
                                        {schema.id === 'STOCK_LIST' && <ShieldCheck size={14} />}
                                        {schema.id === 'CENSUS' && <TrendingUp size={14} />}
                                        {schema.id === 'INCIDENTS' && <Info size={14} />}
                                        {schema.id === 'ROUNDS_CHECKLIST' && <FileText size={14} />}
                                        {schema.id === 'CONSERVATION_EDUCATION' && <Layers size={14} />}
                                        {schema.id === 'WEIGHTS' && <TrendingUp size={14} />}
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wide">{schema.title}</span>
                                </div>
                                {selectedSchemaId === schema.id && <ChevronRight size={14} className="text-emerald-400"/>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Stats Card */}
                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200 overflow-hidden relative">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Live Preview</p>
                        <h3 className="text-3xl font-black mb-1">{tableData.length}</h3>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Records in current view</p>
                    </div>
                    <FileBarChart size={120} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
                </div>
            </div>

            {/* Main Content - Filters & Preview */}
            <div className="lg:col-span-9 space-y-6">
                {/* Bento Grid Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Calendar size={12} /> Date Range
                        </label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={e => setStartDate(e.target.value)} 
                                className={inputClass}
                            />
                            <span className="text-slate-300 font-bold">to</span>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={e => setEndDate(e.target.value)} 
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Layers size={12} /> Section Filter
                        </label>
                        <select 
                            value={selectedCategory} 
                            onChange={(e) => setSelectedCategory(e.target.value as any)} 
                            className={inputClass}
                        >
                            <option value="ALL">All Collection Sections</option>
                            {Object.values(AnimalCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Filter size={12} /> Data Integrity
                        </label>
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100 uppercase tracking-widest">
                            <ShieldCheck size={14} /> Statutory Compliant View
                        </div>
                    </div>
                </div>

                {/* Report Preview Table */}
                <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm min-h-[500px] flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{currentSchema.title}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {orgProfile?.name || 'Kent Owl Academy'} • {getFormattedDateRange()}
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <span className="px-4 py-1.5 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] shadow-sm">
                                Previewing {tableData.length} Entries
                            </span>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b-2 border-slate-200">
                                <tr>
                                    {reportColumns.map((col, idx) => (
                                        <th key={idx} style={{ width: col.width }} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tableData.length > 0 ? tableData.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-slate-50 transition-colors group">
                                        {reportColumns.map((col, cIdx) => (
                                            <td key={cIdx} className={`px-6 py-4 text-xs font-bold text-slate-700 align-top ${col.accessor === 'subject' ? 'text-slate-900' : ''}`}>
                                                {row[col.accessor]}
                                            </td>
                                        ))}
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={reportColumns.length} className="px-6 py-32 text-center text-slate-300">
                                            <Table2 size={64} className="mx-auto mb-4 opacity-10"/>
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nil Records Found for Selection</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );

};

export default Reports;
