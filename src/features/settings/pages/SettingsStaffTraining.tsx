import React, { useState } from 'react';
import { useAppData } from '@/src/context/AppContext';
import { GraduationCap, Plus, Edit2, Trash2, X } from 'lucide-react';

const SettingsStaffTraining: React.FC = () => {
  const {
    users,
    staff_training,
    addStaffTraining,
    updateStaffTraining,
    deleteStaffTraining
  } = useAppData();

  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<any>(null);
  const [trainingForm, setTrainingForm] = useState<any>({
    user_id: '',
    training_name: '',
    completion_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    status: 'Completed',
    notes: ''
  });

  const handleSaveTraining = async () => {
      if (!trainingForm.user_id || !trainingForm.training_name) return;
      
      const data = {
          ...trainingForm,
          completion_date: new Date(trainingForm.completion_date),
          expiry_date: trainingForm.expiry_date ? new Date(trainingForm.expiry_date) : undefined
      };

      if (editingTraining) {
          await updateStaffTraining({ ...data, id: editingTraining.id });
      } else {
          await addStaffTraining(data);
      }
      setIsTrainingModalOpen(false);
      setEditingTraining(null);
  };

  const handleDeleteTraining = async (id: string) => {
      if (window.confirm('Delete this training record?')) {
          await deleteStaffTraining(id);
      }
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-300 uppercase tracking-widest";

  return (
    <div className="max-w-6xl space-y-8 animate-in slide-in-from-right-4 duration-300 pb-24">
        <div className="flex justify-between items-center border-b-2 border-slate-200 pb-2">
            <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <GraduationCap size={20} className="text-emerald-600"/> Staff Training Registry
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Professional Development & Statutory Certifications</p>
            </div>
            <button onClick={() => { 
                setEditingTraining(null); 
                setTrainingForm({
                    user_id: '',
                    training_name: '',
                    completion_date: new Date().toISOString().split('T')[0],
                    expiry_date: '',
                    status: 'Completed',
                    notes: ''
                }); 
                setIsTrainingModalOpen(true); 
            }} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-md">
                <Plus size={14}/> Log Training Record
            </button>
        </div>

        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Staff Member</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Training Name</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiry</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {staff_training.map(training => {
                        const user = users.find(u => u.id === training.user_id);
                        const isExpired = training.expiry_date && new Date(training.expiry_date) < new Date();
                        
                        return (
                            <tr key={training.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600">
                                            {user?.initials || '??'}
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">{user?.name || 'Unknown Staff'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-700">{training.training_name}</td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                    {new Date(training.completion_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                    {training.expiry_date ? new Date(training.expiry_date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest ${
                                        isExpired ? 'bg-rose-100 text-rose-600' : 
                                        training.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                        {isExpired ? 'Expired' : training.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button onClick={() => {
                                        setEditingTraining(training);
                                        setTrainingForm({
                                            ...training,
                                            completion_date: new Date(training.completion_date).toISOString().split('T')[0],
                                            expiry_date: training.expiry_date ? new Date(training.expiry_date).toISOString().split('T')[0] : ''
                                        });
                                        setIsTrainingModalOpen(true);
                                    }} className="p-2 text-slate-400 hover:text-emerald-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"><Edit2 size={14}/></button>
                                    <button onClick={() => handleDeleteTraining(training.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"><Trash2 size={14}/></button>
                                </td>
                            </tr>
                        );
                    })}
                    {staff_training.length === 0 && (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-xs font-black text-slate-300 uppercase tracking-widest">No Training Records Found</td></tr>
                    )}
                </tbody>
            </table>
        </div>

        {isTrainingModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900">{editingTraining ? 'Edit Training' : 'Log Training'}</h3>
                        <button onClick={() => setIsTrainingModalOpen(false)}><X size={20}/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Staff Member</label>
                            <select value={trainingForm.user_id} onChange={e => setTrainingForm({...trainingForm, user_id: e.target.value})} className={inputClass}>
                                <option value="">Select Staff...</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Training Name</label>
                            <input type="text" value={trainingForm.training_name} onChange={e => setTrainingForm({...trainingForm, training_name: e.target.value})} className={inputClass} placeholder="e.g. First Aid Level 2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Completion Date</label>
                                <input type="date" value={trainingForm.completion_date} onChange={e => setTrainingForm({...trainingForm, completion_date: e.target.value})} className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Expiry Date (Opt)</label>
                                <input type="date" value={trainingForm.expiry_date} onChange={e => setTrainingForm({...trainingForm, expiry_date: e.target.value})} className={inputClass} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                            <select value={trainingForm.status} onChange={e => setTrainingForm({...trainingForm, status: e.target.value})} className={inputClass}>
                                <option value="Completed">Completed</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Scheduled">Scheduled</option>
                            </select>
                        </div>
                        <button onClick={handleSaveTraining} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-lg mt-2">Save Record</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SettingsStaffTraining;
