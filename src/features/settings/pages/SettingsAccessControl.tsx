import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { User, UserRole, UserPermissions } from '@/types';
import { addUser, updateUsers, deleteUser } from '@/src/services/userService';
import { Plus, X, ShieldCheck, PenTool, ChevronRight, Check } from 'lucide-react';
import { supabase } from '@/src/services/supabaseClient';

const SignaturePad = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        if (value && value.startsWith('data:image')) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0);
            img.src = value;
        }
    }, [value]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.beginPath();
        const pos = getPos(e);
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const dataUrl = canvasRef.current?.toDataURL();
        if (dataUrl) onChange(dataUrl);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            onChange('');
        }
    };

    return (
        <div className="space-y-2">
            <div className="border-2 border-slate-300 rounded-2xl bg-white overflow-hidden relative cursor-crosshair shadow-inner">
                <canvas 
                    ref={canvasRef} 
                    width={500} 
                    height={150} 
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[150px] touch-none"
                />
                <button type="button" onClick={clear} className="absolute bottom-3 right-3 p-2 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-xl transition-all shadow-sm"><X size={16}/></button>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Digitally Authorise using Signature Above</p>
        </div>
    );
};

const SettingsAccessControl: React.FC = () => {
  const users = useLiveQuery(async () => { try { return await db.users.toArray(); } catch (e) { console.error(e); return []; } }, []) || [];
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<Partial<User>>({});

  const handleSaveUser = async () => {
      if (!userForm.name || !userForm.initials) return;
      
      try {
        if (userForm.id) {
          await updateUsers(userForm);
        } else {
          await addUser(userForm as Omit<User, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by'>);
        }
        setIsUserModalOpen(false);
      } catch (error) {
        console.error("Failed to save user", error);
        alert("Failed to save user.");
      }
  };

  const togglePermission = (key: keyof UserPermissions) => {
      setUserForm(prev => {
          const currentPerms = prev.permissions || {} as UserPermissions;
          return {
              ...prev,
              permissions: {
                  ...currentPerms,
                  [key]: !currentPerms[key]
              }
          };
      });
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-300 uppercase tracking-widest";

  return (
    <div className="max-w-6xl space-y-8 animate-in slide-in-from-right-4 duration-300">
        <div className="flex justify-between items-center border-b-2 border-slate-200 pb-2">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Personnel Registry</h3>
            <button onClick={() => { setEditingUser(null); setUserForm({ role: UserRole.VOLUNTEER, permissions: {} as any }); setIsUserModalOpen(true); }} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-md">
                <Plus size={14}/> Authorise Staff Member
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(user => (
                <div key={user.id} onClick={() => { setEditingUser(user); setUserForm(user); setIsUserModalOpen(true); }} className="bg-white p-6 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md ${user.role === 'Admin' ? 'bg-slate-900' : 'bg-emerald-600'}`}>
                            {user.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-900 text-sm uppercase tracking-tight truncate">{user.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.job_position || user.role}</p>
                        </div>
                        {user.active ? <ShieldCheck size={18} className="text-emerald-500"/> : <X size={18} className="text-rose-400"/>}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            <PenTool size={12}/> {user.signature_image_url ? 'Signed' : 'No Sig'}
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Manage Profile <ChevronRight size={10}/></span>
                    </div>
                </div>
            ))}
        </div>

        {isUserModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
                    <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{editingUser ? 'Authorisation Registry' : 'New Staff Authorisation'}</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Credentials & Identity Registry</p>
                        </div>
                        <button onClick={() => setIsUserModalOpen(false)} className="text-slate-300 hover:text-slate-900"><X size={32}/></button>
                    </div>
                    <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto scrollbar-hide">
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 text-slate-900">Full Legal Name</label>
                            <input type="text" value={userForm.name || ''} onChange={e => setUserForm({...userForm, name: e.target.value})} className={`${inputClass} normal-case font-semibold`} /></div>
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 text-slate-900">Job Position</label>
                            <input type="text" value={userForm.job_position || ''} onChange={e => setUserForm({...userForm, job_position: e.target.value})} className={`${inputClass} normal-case font-semibold`} /></div>
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 text-slate-900">Initials (3 Max)</label>
                            <input type="text" maxLength={3} value={userForm.initials || ''} onChange={e => setUserForm({...userForm, initials: e.target.value.toUpperCase()})} className={inputClass}/></div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 text-slate-900">Security PIN</label>
                            <input type="password" maxLength={4} value={userForm.pin || ''} onChange={e => setUserForm({...userForm, pin: e.target.value})} className={inputClass}/></div>
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 text-slate-900">Academy Role</label>
                            <select value={userForm.role || UserRole.VOLUNTEER} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})} className={inputClass}><option value={UserRole.VOLUNTEER}>Volunteer</option><option value={UserRole.STAFF}>Staff</option><option value={UserRole.KEEPER}>Keeper</option><option value={UserRole.SENIOR_KEEPER}>Senior Keeper</option><option value={UserRole.ADMIN}>Admin</option><option value={UserRole.VETERINARIAN}>Veterinarian</option><option value={UserRole.DIRECTOR}>Director</option></select></div>
                        </div>

                        {/* Access Control Section */}
                        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 flex items-center gap-2">
                                <ShieldCheck size={14}/> Access Control
                            </h4>
                            
                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Account Status</span>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${userForm.active !== false ? 'text-emerald-600' : 'text-rose-500'}`}>{userForm.active !== false ? 'Active' : 'Suspended'}</span>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${userForm.active !== false ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${userForm.active !== false ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </div>
                                    <input type="checkbox" className="hidden" checked={userForm.active !== false} onChange={e => setUserForm({...userForm, active: e.target.checked})}/>
                                </label>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Granular Privileges</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64 overflow-y-auto pr-2 bg-slate-100/50 p-4 rounded-xl border border-slate-200">
                                    {[
                                        {
                                            title: "Core Modules",
                                            items: [
                                                { key: 'dashboard', label: 'Dashboard' },
                                                { key: 'dailyLog', label: 'Daily Logs' },
                                                { key: 'tasks', label: 'Tasks' },
                                                { key: 'rounds', label: 'Daily Rounds' },
                                            ]
                                        },
                                        {
                                            title: "Animal & Medical",
                                            items: [
                                                { key: 'medical', label: 'Medical Records' },
                                                { key: 'movements', label: 'Stock Movements' },
                                                { key: 'flightRecords', label: 'Flight Logs' },
                                                { key: 'feedingSchedule', label: 'Feeding Sched.' },
                                                { key: 'animalManagement', label: 'Animal Mgmt' },
                                            ]
                                        },
                                        {
                                            title: "HR & Admin",
                                            items: [
                                                { key: 'attendance', label: 'View Timesheets' },
                                                { key: 'attendanceManager', label: 'Manage Time' },
                                                { key: 'holidayApprover', label: 'Approve Leave' },
                                                { key: 'userManagement', label: 'User Mgmt' },
                                            ]
                                        },
                                        {
                                            title: "Site & System",
                                            items: [
                                                { key: 'safety', label: 'Health & Safety' },
                                                { key: 'maintenance', label: 'Maintenance' },
                                                { key: 'settings', label: 'System Settings' },
                                                { key: 'missingRecords', label: 'Data Audits' },
                                                { key: 'reports', label: 'Reports' },
                                                { key: 'documentManagement', label: 'Document Mgmt' },
                                            ]
                                        }
                                    ].map(group => (
                                        <div key={group.title} className="space-y-2">
                                            <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">{group.title}</h5>
                                            <div className="space-y-2">
                                                {group.items.map(({ key, label }) => (
                                                    <label key={key} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${userForm?.permissions?.[key as keyof UserPermissions] ?? false ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                                        <div className={`w-3 h-3 rounded border flex items-center justify-center ${userForm?.permissions?.[key as keyof UserPermissions] ?? false ? 'border-white bg-transparent' : 'border-slate-300 bg-slate-100'}`}>
                                                            {(userForm?.permissions?.[key as keyof UserPermissions] ?? false) && <Check size={8} />}
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
                                                        <input 
                                                            type="checkbox" 
                                                            className="hidden" 
                                                            checked={userForm?.permissions?.[key as keyof UserPermissions] ?? false}
                                                            onChange={() => togglePermission(key as keyof UserPermissions)}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 text-slate-900">Authorised Digital Signature</label>
                            <SignaturePad value={userForm.signature_image_url || ''} onChange={(v) => setUserForm({...userForm, signature_image_url: v})}/>
                        </div>
                        <div className="pt-4">
                            <button onClick={handleSaveUser} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95">Commit to Personnel Ledger</button>
                            <button onClick={async () => {
                                if (!supabase) return;
                                try {
                                    // @ts-ignore - WebAuthn might not be in all types yet
                                    const { options } = await supabase.auth.generateAuthenticationOptions();
                                    // @ts-ignore
                                    await supabase.auth.signInWithWebAuthn(options);
                                    alert('Device enrolled for biometric login!');
                                } catch (error) {
                                    console.error('WebAuthn enrollment error:', error);
                                    alert('Failed to enroll device. See console for details.');
                                }
                            }} className="w-full mt-4 bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest">Enroll Device for Biometric Login</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SettingsAccessControl;
