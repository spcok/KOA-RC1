
import React, { useState } from 'react';
import { HolidayRequest } from '@/types';
import { Calendar, Plus, CheckCircle, XCircle, Clock, Trash2, Check, X, Info, Search, Filter, Loader2, Palmtree, CalendarDays } from 'lucide-react';
import { useHolidayRegistryData } from '@/src/hooks/useHolidayRegistryData';

const HolidayRegistry: React.FC = () => {
    const { 
        requests, 
        isLoading, 
        canApprove, 
        currentUser, 
        filterStatus, 
        setFilterStatus, 
        searchTerm, 
        setSearchTerm, 
        addHoliday, 
        deleteHoliday, 
        handleStatusUpdate 
    } = useHolidayRegistryData();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [notes, setNotes] = useState('');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addHoliday({
            start_date: startDate,
            end_date: endDate,
            notes
        });
        setIsModalOpen(false);
        setStartDate('');
        setEndDate('');
        setNotes('');
    };

    const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:border-emerald-500 focus:outline-none transition-all placeholder-slate-400";

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-4 -mt-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                        <Palmtree className="text-emerald-600" size={28} /> Holiday Registry
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Official records of staff leave and availability.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search requests..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all shadow-sm"
                        />
                    </div>
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-emerald-500 focus:outline-none transition-all shadow-sm"
                    >
                        <option value="ALL">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                    <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:bg-black transition-all active:scale-95 font-black uppercase text-xs tracking-widest shrink-0">
                        <Plus size={18}/> Request Leave
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {requests.map((req) => {
                    const isPending = req.status === 'Pending';
                    const isApproved = req.status === 'Approved';
                    const isRejected = req.status === 'Rejected';
                    const isOwner = req.user_id === currentUser?.id;
                    
                    return (
                        <div key={req.id} className={`bg-white rounded-2xl border-2 transition-all group shadow-sm hover:shadow-md p-6 ${
                            isPending ? 'border-amber-100 hover:border-amber-300' : 
                            isApproved ? 'border-emerald-100 hover:border-emerald-300' : 
                            'border-rose-100 hover:border-rose-300'
                        }`}>
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs border-2 shadow-lg shrink-0 ${
                                        isOwner ? 'bg-slate-800 text-white border-white' : 'bg-white text-slate-800 border-slate-200'
                                    }`}>
                                        {req.user_name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                            {req.user_name} {isOwner && <span className="ml-2 text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400">YOU</span>}
                                        </h3>
                                        <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1">
                                            <CalendarDays size={10}/> {new Date(req.start_date).toLocaleDateString('en-GB')} → {new Date(req.end_date).toLocaleDateString('en-GB')}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 max-w-md w-full">
                                    <p className="text-xs text-slate-500 font-medium italic leading-relaxed border-l-4 border-slate-100 pl-4">
                                        "{req.notes || 'No notes provided for this leave request.'}"
                                    </p>
                                    {req.approved_by && (
                                        <div className="mt-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            Actioned by: {req.approved_by}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${
                                        isPending ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                        isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                        'bg-rose-50 text-rose-700 border-rose-100'
                                    }`}>
                                        {isPending && <Clock size={10} />}
                                        {isApproved && <CheckCircle size={10} />}
                                        {isRejected && <XCircle size={10} />}
                                        {req.status}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        {canApprove && isPending && (
                                            <>
                                                <button onClick={() => handleStatusUpdate(req.id, 'Approved')} className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-900/20 transition-all active:scale-95" title="Approve"><Check size={16}/></button>
                                                <button onClick={() => handleStatusUpdate(req.id, 'Rejected')} className="p-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-900/20 transition-all active:scale-95" title="Reject"><X size={16}/></button>
                                            </>
                                        )}
                                        
                                        {(canApprove || (isOwner && isPending)) && (
                                            <button 
                                                onClick={() => { if(window.confirm("Purge holiday request from the registry?")) deleteHoliday(req.id) }} 
                                                className="p-2.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl border-2 border-slate-100 transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete Request"
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
                
                {requests.length === 0 && (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-24 text-center">
                        <Palmtree size={48} className="mx-auto mb-4 text-slate-200"/>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Nil Leave Registry Records</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-0 animate-in zoom-in-95 border-2 border-slate-300 overflow-hidden">
                        <div className="p-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Request Leave</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Leave Registry Application</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1"><X size={24}/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Start Date</label>
                                        <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">End Date</label>
                                        <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Notes / Reason</label>
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inputClass} h-24 resize-none font-medium`} placeholder="Optional notes for the manager..." />
                                </div>
                            </div>
                            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-xl p-4 flex gap-3">
                                <Info className="text-emerald-600 shrink-0" size={18} />
                                <p className="text-[10px] font-bold text-emerald-800 leading-relaxed uppercase">
                                    Note: Your request will be submitted to a Duty Manager for authorization.
                                </p>
                            </div>
                            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-[0.98]">
                                Submit Request
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HolidayRegistry;
