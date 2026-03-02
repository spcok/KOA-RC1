
import { v4 as uuidv4 } from 'uuid';
import React, { useEffect, useTransition } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Animal, AnimalCategory, HazardRating, ConservationStatus } from '@/types';
import { X, Check, Camera, Sparkles, Loader2, Zap, Shield, History, Info, Globe, Skull, Users } from 'lucide-react';
import { getLatinName, getConservationStatus } from '@/src/services/geminiService';
import { useAppData } from '@/src/context/AppContext';
import { useAuthStore } from '@/src/store/authStore';
import { animalFormSchema, AnimalFormData } from '@/src/lib/schemas';

interface AnimalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Animal;
  locations?: string[]; 
}

const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 800, maxHeight = 800;
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) { height = Math.round((height * maxWidth) / width); width = maxWidth; } 
          else { width = Math.round((width * maxHeight) / height); height = maxHeight; }
        }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const AnimalFormModal: React.FC<AnimalFormModalProps> = ({ isOpen, onClose, initialData, locations = [] }) => {
  const { addAnimal, updateAnimal } = useAppData();
  const { profile: currentUser } = useAuthStore();
  const [isAiPending, startAiTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnimalFormData>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: {
      name: '',
      species: '',
      latin_name: '',
      category: AnimalCategory.OWLS,
      dob: new Date().toISOString().split('T')[0],
      is_dob_unknown: false,
      sex: 'Unknown',
      location: '',
      description: '',
      special_requirements: '',
      image_url: '',
      distribution_map_url: '',
      acquisition_date: new Date().toISOString().split('T')[0],
      origin: '',
      sire_id: '',
      dam_id: '',
      microchip_id: '',
      ring_number: '',
      has_no_id: false,
      hazard_rating: HazardRating.LOW,
      is_venomous: false,
      red_list_status: ConservationStatus.NE,
      is_group_animal: false,
      display_order: 0,
      archived: false,
      is_quarantine: false,
    },
  });

  // Watch fields for conditional rendering and previews
  const category = watch('category');
  const imageUrl = watch('image_url');
  const distroUrl = watch('distribution_map_url');
  const isBird = category === AnimalCategory.OWLS || category === AnimalCategory.RAPTORS;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          ...initialData,
          dob: initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
          acquisition_date: initialData.acquisition_date ? new Date(initialData.acquisition_date).toISOString().split('T')[0] : '',
        });
      } else {
        reset({
          name: '',
          species: '',
          latin_name: '',
          category: AnimalCategory.OWLS,
          dob: new Date().toISOString().split('T')[0],
          is_dob_unknown: false,
          sex: 'Unknown',
          location: '',
          description: '',
          special_requirements: '',
          image_url: `https://picsum.photos/seed/${uuidv4()}/400/400`,
          distribution_map_url: '',
          acquisition_date: new Date().toISOString().split('T')[0],
          origin: '',
          sire_id: '',
          dam_id: '',
          microchip_id: '',
          ring_number: '',
          has_no_id: false,
          hazard_rating: HazardRating.LOW,
          is_venomous: false,
          red_list_status: ConservationStatus.NE,
          is_group_animal: false,
          display_order: 0,
          archived: false,
          is_quarantine: false,
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit: SubmitHandler<AnimalFormData> = async (data) => {
    if (!currentUser) return;

    try {
      // Ensure dates are Date objects (zod handles this but double check if needed for API)
      const animalData = {
        ...data,
        dob: new Date(data.dob),
        acquisition_date: new Date(data.acquisition_date),
      };

      if (initialData) {
        await updateAnimal({ ...initialData, ...animalData });
      } else {
        await addAnimal(animalData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save animal:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image_url' | 'distribution_map_url') => {
    const file = e.target.files?.[0];
    if (file) {
      const resized = await resizeImage(file);
      setValue(field, resized, { shouldDirty: true });
    }
  };

  const handleAutoFill = () => {
    const species = watch('species');
    if (!species) return;
    startAiTransition(async () => {
        const [latin, status] = await Promise.all([getLatinName(species), getConservationStatus(species)]);
        if (latin) setValue('latin_name', latin, { shouldDirty: true });
        if (status) setValue('red_list_status', status, { shouldDirty: true });
    });
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-2.5 bg-[#f3f6f9] border border-[#e1e8ef] rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-300";
  const errorClass = "text-red-500 text-[10px] font-bold mt-1 uppercase tracking-wider";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest";
  
  return (
    <div className="fixed inset-0 bg-slate-900/0 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-start shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{initialData ? 'Edit' : 'Add'} Animal Record</h2>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">ZLA 1981 SECTION 9 STATUTORY REGISTRY</p>
                </div>
                <button type="button" onClick={onClose} className="text-slate-300 hover:text-slate-900"><X size={32} /></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-8 space-y-12 bg-white">
                <input type="hidden" {...register('image_url')} />
                <input type="hidden" {...register('distribution_map_url')} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-4 grid grid-cols-2 gap-4 h-fit">
                        <section>
                            <h3 className="text-[9px] font-black text-slate-400 uppercase mb-3">PROFILE PHOTO</h3>
                            <div className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200">
                                <img src={imageUrl || `https://picsum.photos/seed/${uuidv4()}/400/400`} alt="Subject" className="w-full h-full object-cover"/>
                                <label className="absolute inset-0 bg-black/5 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                                    <div className="bg-white/90 p-3 rounded-full shadow-lg"><Camera size={20} /></div>
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'image_url')} className="hidden" />
                                </label>
                            </div>
                        </section>
                        <section className="bg-[#f9fbff] rounded-2xl p-4 border border-[#e8f0fe] flex flex-col">
                            <h3 className="text-[9px] font-black text-slate-400 uppercase mb-3 flex items-center gap-1.5"><Globe size={12}/> RANGE MAP</h3>
                            <div className="relative group flex-1 rounded-lg overflow-hidden border border-[#d0e1fd] bg-white">
                                {distroUrl ? (
                                    <img src={distroUrl} alt="Range Map" className="w-full h-full object-cover"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300 text-[10px] font-bold uppercase">No Map</div>
                                )}
                                <label className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center">
                                    <span className="bg-white text-slate-900 px-2 py-1 rounded text-[8px] font-black uppercase shadow-lg">Upload</span>
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'distribution_map_url')} className="hidden" />
                                </label>
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-8 space-y-12">
                        <section className="space-y-6">
                            <h3 className="text-[11px] font-black text-[#10b981] uppercase tracking-[0.2em] flex items-center gap-2 pb-3 border-b border-[#f0fdf4]"><Info size={16}/> IDENTIFICATION & TAXONOMY</h3>
                            
                            <div className="grid md:grid-cols-12 gap-6">
                                <div className="md:col-span-5">
                                    <label className={labelClass}>SUBJECT NAME *</label>
                                    <input {...register('name')} className={inputClass} />
                                    {errors.name && <p className={errorClass}>{errors.name.message}</p>}
                                </div>
                                <div className="md:col-span-4">
                                    <label className={labelClass}>SECTION *</label>
                                    <select {...register('category')} className={inputClass}>
                                        {(Object.values(AnimalCategory) as string[]).map(cat => <option key={String(cat)} value={cat}>{cat}</option>)}
                                    </select>
                                    {errors.category && <p className={errorClass}>{errors.category.message}</p>}
                                </div>
                                <div className="md:col-span-3">
                                    <label className={labelClass}>LOCATION *</label>
                                    <input {...register('location')} list="location-list" className={inputClass} />
                                    <datalist id="location-list">
                                        {(locations as string[]).map(loc => <option key={String(loc)} value={loc} />)}
                                    </datalist>
                                    {errors.location && <p className={errorClass}>{errors.location.message}</p>}
                                </div>
                            </div>

                            {category === AnimalCategory.MAMMALS && (
                                <div className="md:col-span-12 bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="p-2 bg-white rounded-lg border border-amber-100 text-amber-600 shadow-sm"><Users size={16}/></div>
                                    <label className="flex items-center gap-3 cursor-pointer flex-1 group">
                                        <input type="checkbox" {...register('is_group_animal')} className="w-5 h-5 accent-amber-600 rounded focus:ring-amber-500 transition-all"/>
                                        <div>
                                            <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest block group-hover:text-amber-700 transition-colors">Group / Mob Designation</span>
                                            <span className="text-[9px] font-bold text-amber-700/60 block">Classify this record as a collective group (e.g. Meerkat Mob)</span>
                                        </div>
                                    </label>
                                </div>
                            )}

                            <div className="grid md:grid-cols-12 gap-6">
                                <div className="md:col-span-7">
                                    <label className={labelClass}>COMMON SPECIES *</label>
                                    <div className="flex gap-2">
                                        <input {...register('species')} className={inputClass} />
                                        <button type="button" onClick={handleAutoFill} disabled={isAiPending} className="px-4 bg-[#0f172a] text-white rounded-lg hover:bg-black disabled:opacity-50">
                                            {isAiPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={18} />}
                                        </button>
                                    </div>
                                    {errors.species && <p className={errorClass}>{errors.species.message}</p>}
                                </div>
                                <div className="md:col-span-5">
                                    <label className={labelClass}>SCIENTIFIC NAME</label>
                                    <input {...register('latin_name')} className={`${inputClass} italic`} />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-12 gap-6">
                                <div className="md:col-span-4">
                                    <label className={labelClass}>SEX</label>
                                    <select {...register('sex')} className={inputClass}>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Unknown">Unknown</option>
                                    </select>
                                </div>
                                <div className="md:col-span-4">
                                    <div className="flex justify-between items-center mb-1.5 px-1">
                                        <label className="text-10px font-black text-slate-400 uppercase">DATE OF BIRTH</label>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" {...register('is_dob_unknown')} />
                                            <span className="text-[9px] font-black text-slate-400 uppercase">UNKNOWN</span>
                                        </div>
                                    </div>
                                    <input type="date" {...register('dob')} className={inputClass} />
                                </div>
                                <div className="md:col-span-4">
                                    <label className={labelClass}>IUCN STATUS</label>
                                    <select {...register('red_list_status')} className={inputClass}>
                                        {(Object.values(ConservationStatus) as string[]).map(s => <option key={String(s)} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section className="bg-slate-50/50 rounded-2xl p-6 border-2 border-slate-100">
                            <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                                <History size={16} /> Statutory Acquisition & Pedigree
                            </h3>
                            
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className={labelClass}>Date of Arrival *</label>
                                    <input type="date" {...register('acquisition_date')} className={inputClass} />
                                    {errors.acquisition_date && <p className={errorClass}>{errors.acquisition_date.message}</p>}
                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1.5">Date acquired by Kent Owl Academy</p>
                                </div>
                                <div>
                                    <label className={labelClass}>Source / Origin *</label>
                                    <input {...register('origin')} className={inputClass} placeholder="e.g. International Centre for Birds of Prey" />
                                    {errors.origin && <p className={errorClass}>{errors.origin.message}</p>}
                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1.5">Mandatory for movement audit trail</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Sire (Father)</label>
                                    <div className="relative">
                                        <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input {...register('sire_id')} className={`${inputClass} pl-9`} placeholder="Ancestry ID or Name" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Dam (Mother)</label>
                                    <div className="relative">
                                        <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input {...register('dam_id')} className={`${inputClass} pl-9`} placeholder="Ancestry ID or Name" />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-[11px] font-black text-[#f59e0b] uppercase tracking-[0.2em] flex items-center gap-2 pb-3 border-b border-[#fffbeb]"><Zap size={16}/> MARKERS & BIOMETRICS</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="lg:col-span-2">
                                    <div className="flex justify-between items-center mb-1.5 px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">IDENTIFICATION</label>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" {...register('has_no_id')} />
                                            <span className="text-[9px] font-black text-slate-400 uppercase">NO ID</span>
                                        </div>
                                    </div>
                                    <div className={`grid ${isBird ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                        <input {...register('microchip_id')} className={`${inputClass} font-mono`} placeholder="Microchip..." />
                                        {isBird && <input {...register('ring_number')} className={`${inputClass} font-mono`} placeholder="Ring..." />}
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>HAZARD CLASS</label>
                                    <select {...register('hazard_rating')} className={inputClass}>
                                        {(Object.values(HazardRating) as string[]).map(h => <option key={String(h)} value={h}>{h}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col justify-end pb-1.5">
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-100 hover:border-emerald-200 transition-all">
                                        <input type="checkbox" {...register('is_venomous')} />
                                        <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5"><Skull size={10}/> VENOMOUS</span>
                                    </label>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-8 pt-12 border-t border-slate-100 pb-4">
                    <div className="flex items-center gap-4 text-slate-400">
                        <Shield size={24}/>
                        <p className="text-[10px] font-bold uppercase max-w-sm">I VERIFY THIS RECORD IS AN ACCURATE ENTRY INTO THE STATUTORY STOCK LEDGER.</p>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-8 py-4 bg-white text-slate-500 border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">Discard</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none px-12 py-4 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                            {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <Check size={20} />}
                            {isSubmitting ? 'Authorizing...' : 'Authorize'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
  );
};

export default AnimalFormModal;
