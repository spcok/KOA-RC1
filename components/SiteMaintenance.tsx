
import React, { useState } from 'react';
import { SiteLogEntry } from '@/types';
import { 
    Wrench, Plus, X, AlertCircle, CheckCircle2, Clock, 
    MapPin, Loader2, Search, Filter, Trash2, Edit2, MoreVertical,
    AlertTriangle, Info, History
} from 'lucide-react';
import { useSiteMaintenanceData } from '@/src/hooks/useSiteMaintenanceData';

const SiteMaintenance: React.FC = () => {
  const { 
    filteredLogs, isLoading, filterStatus, setFilterStatus, 
    searchTerm, setSearchTerm, addLog, updateLog, deleteLog, currentUser 
  } = useSiteMaintenanceData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<SiteLogEntry | null>(null);
  
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLoc, setFormLoc] = useState('');
  const [formPriority, setFormPriority] = useState<SiteLogEntry['priority']>('Medium');
  const [formStatus, setFormStatus] = useState<SiteLogEntry['status']>('Pending');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const openModal = (log?: SiteLogEntry) => {
      if (log) {
          setEditingLog(log);
          setFormTitle(log.title);
          setFormDesc(log.description);
          setFormLoc(log.location);
          setFormPriority(log.priority);
          setFormStatus(log.status);
      } else {
          setEditingLog(null);
          setFormTitle('');
          setFormDesc('');
          setFormLoc('');
          setFormPriority('Medium');
          setFormStatus('Pending');
      }
      setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const logData = {
          title: formTitle,
          description: formDesc,
          location: formLoc,
          priority: formPriority,
          status: formStatus,
          log_date: editingLog ? editingLog.log_date : new Date(),
          user_initials: currentUser?.initials || 'SYS'
      };

      if (editingLog) {
          await updateLog({ ...editingLog, ...logData });
      } else {
          await addLog(logData);
      }
      setIsModalOpen(false);
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-400";

  const getPriorityColor = (p: string) => {
      switch(p) {
          case 'High': return 'text-rose-600 bg-rose-50 border-rose-100';
          case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
          default: return 'text-blue-600 bg-blue-50 border-blue-100';
      }
  };

  const getStatusIcon = (s: string) => {
      switch(s) {
          case 'Resolved': return <CheckCircle2 size={14} className="text-emerald-500" />;
          case 'In Progress': return <Clock size={14} className="text-blue-500" />;
          default: return <AlertCircle size={14} className="text-slate-400" />;
      }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-4 -mt-4 border-b border-slate-200">
             <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                    <Wrench className="text-slate-600" size={28} /> Facility Maintenance
                </h1>
                <p className="text-slate-500 text-sm font-medium">Work orders, repairs, and site safety logs.</p>
             </div>
             <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search orders..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all shadow-sm"
                    />
                </div>
                <button 
                    onClick={() => openModal()}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:bg-black transition-all active:scale-95 font-black uppercase text-xs tracking-widest"
                >
                    <Plus size={18}/> New Work Order
                </button>
             </div>
        </div>

        <div className="flex bg-white p-1 rounded-xl border-2 border-slate-200 shadow-sm overflow-x-auto w-full md:w-auto self-start inline-flex">
            {[
                { id: 'ALL', label: 'All Tasks' },
                { id: 'Pending', label: 'Reported' },
                { id: 'In Progress', label: 'Active' },
                { id: 'Resolved', label: 'Completed' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id as any)}
                    className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        filterStatus === tab.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <div key={log.id} className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getPriorityColor(log.priority)}`}>
                                    {log.priority} Priority
                                </span>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                                    {getStatusIcon(log.status)} {log.status}
                                </span>
                            </div>
                            <h3 className="font-black text-slate-900 uppercase tracking-tight text-base leading-tight group-hover:text-emerald-600 transition-colors">
                                {log.title}
                            </h3>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal(log)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={14}/></button>
                            <button onClick={() => deleteLog(log.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14}/></button>
                        </div>
                    </div>
                    
                    <div className="p-5 flex-1 space-y-4">
                        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">
                            {log.description || "No description provided."}
                        </p>

                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <MapPin size={12} className="text-slate-300" />
                                {log.location}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-auto">
                                <Clock size={12} className="text-slate-300" />
                                {new Date(log.log_date).toLocaleDateString('en-GB')}
                            </div>
                        </div>
                    </div>

                    <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-1">
                            Reported By: <span className="text-slate-500">{log.user_initials || 'SYS'}</span>
                        </div>
                        {log.status !== 'Resolved' && (
                            <button 
                                onClick={() => updateLog({ ...log, status: 'Resolved' })}
                                className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 flex items-center gap-1"
                            >
                                <CheckCircle2 size={12}/> Resolve
                            </button>
                        )}
                    </div>
                </div>
            )) : (
                <div className="col-span-full py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                    <History size={48} className="mb-4 opacity-10" />
                    <p className="font-black text-xs uppercase tracking-[0.3em]">No Active Work Orders</p>
                </div>
            )}
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-0 animate-in zoom-in-95 border-2 border-slate-200 overflow-hidden">
                    <div className="p-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                                {editingLog ? 'Update Work Order' : 'New Work Order'}
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Maintenance Registry</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-900 p-1"><X size={24}/></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Task Title</label>
                                <input required value={formTitle} onChange={e => setFormTitle(e.target.value)} className={inputClass} placeholder="e.g. Broken Fence Rail"/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Location</label>
                                <input required value={formLoc} onChange={e => setFormLoc(e.target.value)} className={inputClass} placeholder="e.g. Lion Enclosure North"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Priority</label>
                                    <select value={formPriority} onChange={e => setFormPriority(e.target.value as any)} className={inputClass}>
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                                    <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)} className={inputClass}>
                                        <option value="Pending">Reported</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                                <textarea 
                                    required 
                                    value={formDesc} 
                                    onChange={e => setFormDesc(e.target.value)} 
                                    className={`${inputClass} h-24 resize-none`} 
                                    placeholder="Detailed description of the issue..."
                                />
                            </div>
                        </div>

                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2">
                            {editingLog ? <Edit2 size={18}/> : <Plus size={18}/>}
                            {editingLog ? 'Update Registry' : 'Submit Work Order'}
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default SiteMaintenance;

