import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { updateOrgProfile } from '@/src/services/orgProfileService';
import { OrganisationProfile } from '@/types';
import { Upload, Camera, Check } from 'lucide-react';

const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxWidth = 800;
        const maxHeight = 800;
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const SettingsOrgProfile: React.FC = () => {
  const orgProfiles = useLiveQuery(async () => { try { return await db.organisation_profiles.toArray(); } catch (e) { console.error(e); return []; } }, []) || [];
  const orgProfile = orgProfiles[0];

  const [orgForm, setOrgForm] = useState<OrganisationProfile>({
      id: '', 
      name: '', 
      address: '', 
      licence_number: '', 
      licence_expiry_date: undefined,
      local_authority: '',
      last_inspection_date: undefined,
      next_inspection_date: undefined,
      contact_email: '', 
      contact_phone: '', 
      logo_url: '', 
      website_url: '', 
      adoption_url: ''
  } as OrganisationProfile);

  useEffect(() => {
      if (orgProfile) {
          setOrgForm({
              id: orgProfile.id || '',
              name: orgProfile.name || '',
              address: orgProfile.address || '',
              licence_number: orgProfile.licence_number || '',
              licence_expiry_date: orgProfile.licence_expiry_date,
              local_authority: orgProfile.local_authority || '',
              last_inspection_date: orgProfile.last_inspection_date,
              next_inspection_date: orgProfile.next_inspection_date,
              contact_email: orgProfile.contact_email || '',
              contact_phone: orgProfile.contact_phone || '',
              logo_url: orgProfile.logo_url || '',
              website_url: orgProfile.website_url || '',
              adoption_url: orgProfile.adoption_url || ''
          } as OrganisationProfile);
      }
  }, [orgProfile]);

  const handleOrgSave = async () => {
      try {
        await updateOrgProfile(orgForm);
        alert('Organisation profile updated.');
      } catch (error) {
        console.error('Failed to update org profile', error);
        alert('Failed to update organisation profile.');
      }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const resized = await resizeImage(file);
              setOrgForm(prev => ({ ...prev, logo_url: resized }));
          } catch (err) { console.error(err); }
      }
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-300 uppercase tracking-widest";

  return (
    <div className="max-w-4xl space-y-8 animate-in slide-in-from-right-4 duration-300">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight border-b-2 border-slate-200 pb-2">Institution Profile</h3>
        <div className="bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center gap-8">
                <div className="w-32 h-32 bg-slate-50 rounded-2xl border-4 border-dashed border-slate-200 flex items-center justify-center relative group overflow-hidden shadow-inner">
                    {orgForm.logo_url ? <img src={orgForm.logo_url} className="w-full h-full object-contain p-2" /> : <Upload size={32} className="text-slate-300" />}
                    <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                        <Camera size={20} className="text-white mb-1"/>
                        <span className="text-[8px] font-black text-white uppercase">Replace</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                </div>
                <div className="flex-1 space-y-4">
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Academy Name</label><input type="text" value={orgForm.name} onChange={e => setOrgForm({...orgForm, name: e.target.value})} className={inputClass}/></div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Zoo Licence Number</label><input type="text" value={orgForm.licence_number} onChange={e => setOrgForm({...orgForm, licence_number: e.target.value})} className={inputClass}/></div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Licence Expiry</label><input type="date" value={orgForm.licence_expiry_date ? new Date(orgForm.licence_expiry_date).toISOString().split('T')[0] : ''} onChange={e => setOrgForm({...orgForm, licence_expiry_date: e.target.value ? new Date(e.target.value) : undefined})} className={inputClass}/></div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Local Authority</label><input type="text" value={orgForm.local_authority} onChange={e => setOrgForm({...orgForm, local_authority: e.target.value})} className={inputClass}/></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Last Inspection</label><input type="date" value={orgForm.last_inspection_date ? new Date(orgForm.last_inspection_date).toISOString().split('T')[0] : ''} onChange={e => setOrgForm({...orgForm, last_inspection_date: e.target.value ? new Date(e.target.value) : undefined})} className={inputClass}/></div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Next Inspection</label><input type="date" value={orgForm.next_inspection_date ? new Date(orgForm.next_inspection_date).toISOString().split('T')[0] : ''} onChange={e => setOrgForm({...orgForm, next_inspection_date: e.target.value ? new Date(e.target.value) : undefined})} className={inputClass}/></div>
                </div>
                <div className="col-span-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Headquarters Address</label><textarea value={orgForm.address} onChange={e => setOrgForm({...orgForm, address: e.target.value})} className={`${inputClass} h-20 resize-none font-medium normal-case`}/></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Professional Email</label><input type="email" value={orgForm.contact_email} onChange={e => setOrgForm({...orgForm, contact_email: e.target.value})} className={`${inputClass} normal-case`}/></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Academy Phone</label><input type="text" value={orgForm.contact_phone} onChange={e => setOrgForm({...orgForm, contact_phone: e.target.value})} className={inputClass}/></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Official Website</label><input type="url" value={orgForm.website_url} onChange={e => setOrgForm({...orgForm, website_url: e.target.value})} className={`${inputClass} normal-case`}/></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Adoption Portal</label><input type="url" value={orgForm.adoption_url} onChange={e => setOrgForm({...orgForm, adoption_url: e.target.value})} className={`${inputClass} normal-case`}/></div>
            </div>
            <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button onClick={handleOrgSave} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 flex items-center gap-2"><Check size={18}/> Save Institution Profile</button>
            </div>
        </div>
    </div>
  );
};

export default SettingsOrgProfile;
