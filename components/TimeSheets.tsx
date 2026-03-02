import React from 'react';
import { Clock, Calendar, ArrowRight, Timer, Trash2, Loader2, User as UserIcon, CalendarDays } from 'lucide-react';
import { useTimeSheetData } from '@/src/hooks/useTimeSheetData';

const TimeSheets: React.FC = () => {
    const { 
        logs, 
        users, 
        isLoading, 
        filterUserId, 
        setFilterUserId, 
        filterDate, 
        setFilterDate, 
        deleteTimeLog, 
        isAdmin 
    } = useTimeSheetData();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    const formatDuration = (mins?: number) => {
        if (mins === undefined || mins === null) return 'Duty Active';
        const hrs = Math.floor(mins / 60);
        const m = mins % 60;
        return `${hrs}h ${m}m`;
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Permanently remove this attendance record from the statutory ledger?")) {
            deleteTimeLog(id);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-4 -mt-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                        <Clock className="text-slate-600" size={28} /> Attendance Ledger
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Official record of personnel presence and operational hours.</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="flex-1 md:w-48 relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select 
                            value={filterUserId} 
                            onChange={(e) => setFilterUserId(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-emerald-500 focus:outline-none transition-all shadow-sm"
                        >
                            <option value="ALL">Entire Team</option>
                            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 md:w-48 relative">
                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="date" 
                            value={filterDate} 
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-emerald-500 focus:outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {logs.map((log) => {
                    const isActive = log.status === 'Active';
                    return (
                        <div key={log.id} className="bg-white rounded-2xl border-2 border-slate-200 p-6 hover:border-emerald-500 transition-all group shadow-sm hover:shadow-md">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center font-black text-xs border-2 border-white shadow-lg shrink-0">
                                        {log.userName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.userName}</h3>
                                        <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1">
                                            <Calendar size={10}/> {new Date(log.date).toLocaleDateString('en-GB')}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-1 items-center justify-center gap-8 w-full md:w-auto">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Clock In</span>
                                        <span className="bg-slate-50 px-3 py-1.5 rounded-lg border-2 border-slate-100 font-mono text-xs font-black text-slate-600">
                                            {new Date(log.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <ArrowRight size={16} className="text-slate-200 mt-4" />
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Clock Out</span>
                                        <span className={`px-3 py-1.5 rounded-lg border-2 font-mono text-xs font-black ${isActive ? 'bg-amber-50 border-amber-100 text-amber-600 italic' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                            {log.endTime ? new Date(log.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-right">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                                            <Timer size={10}/> Duration
                                        </div>
                                        <div className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                            {formatDuration(log.durationMinutes)}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${
                                            isActive ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        }`}>
                                            {log.status}
                                        </span>
                                        {isAdmin && (
                                            <button 
                                                onClick={() => handleDelete(log.id)}
                                                className="p-2.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl border-2 border-slate-100 transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete Log"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
                
                {logs.length === 0 && (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-24 text-center">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Nil Attendance Records Found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeSheets;
