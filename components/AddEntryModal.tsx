import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Animal, LogType, LogEntry, AnimalCategory, HealthCondition, HealthRecordType, ShellQuality } from '@/types';
import { X, Check, Loader2, Trash2, Camera } from 'lucide-react';

import { BCSSelector } from './BCSSelector';
import { parseWeightInputToGrams } from '@/src/services/weightUtils';
import { useAppData } from '@/src/context/AppContext';
import { useAuthStore } from '@/src/store/authStore';
import { logEntrySchema, LogEntryFormData } from '@/src/lib/schemas';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (entry: LogEntry) => void;
  onDelete?: (id: string) => void;
  animal: Animal;
  allAnimals?: Animal[];
  initialType?: LogType;
  existingLog?: LogEntry;
  foodOptions: Record<string, string[]>;
  feedMethods: string[];
  eventTypes?: string[];
  defaultNotes?: string;
  initialDate?: string;
  onUpdateAnimal?: (updates: Partial<Animal>) => Promise<void>;
}

const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 1920, maxHeight = 1080;
        let { width, height } = img;
        if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }}
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const AddEntryModal: React.FC<AddEntryModalProps> = ({ 
  isOpen, onClose, onDelete, animal, initialType = LogType.FEED, existingLog, foodOptions, defaultNotes, initialDate 
}) => {
  const { addLogEntry, updateLogEntry } = useAppData();
  const { profile: currentUser } = useAuthStore();
  const [attachment, setAttachment] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LogEntryFormData>({
    resolver: zodResolver(logEntrySchema),
    defaultValues: {
      log_date: initialDate || new Date().toISOString().split('T')[0],
      log_time: new Date().toTimeString().slice(0, 5),
      log_type: initialType,
      notes: defaultNotes || '',
      initials: currentUser?.initials || '',
      feed_quantity: '',
      feed_type: '',
      has_cast: '',
      weight_value: '',
      weight_lbs: '',
      weight_oz: '',
      weight_eighths: '',
      health_record_type: HealthRecordType.OBSERVATION,
      bcs: 3,
      basking_temp_c: '',
      cool_temp_c: '',
      shell_quality: ShellQuality.NORMAL,
      event_type: '',
      event_start_time: '',
      event_end_time: '',
      event_animal_ids: [animal.id],
    },
  });

  const logFormType = watch('log_type');

  useEffect(() => {
    if (isOpen) {
        if (existingLog) {
            const d = new Date(existingLog.log_date);
            let weight_value = '';
            let weight_lbs = '';
            let weight_oz = '';
            let weight_eighths = '';

            if (existingLog.log_type === LogType.WEIGHT && existingLog.weight_grams) {
                if (animal.weight_unit === 'lbs_oz') {
                    const totalOz = existingLog.weight_grams * 0.035274;
                    const lbs = Math.floor(totalOz / 16);
                    const remainingOz = totalOz % 16;
                    const wholeOz = Math.floor(remainingOz);
                    let eighths = Math.round((remainingOz - wholeOz) * 8);
                    if (eighths === 8) { weight_oz = (wholeOz + 1).toString(); weight_eighths = '0'; }
                    else { weight_oz = wholeOz.toString(); weight_eighths = eighths > 0 ? eighths.toString() : ''; }
                    weight_lbs = lbs.toString();
                } else if (animal.weight_unit === 'oz') {
                    const totalOz = existingLog.weight_grams * 0.035274;
                    const wholeOz = Math.floor(totalOz);
                    let eighths = Math.round((totalOz - wholeOz) * 8);
                    if (eighths === 8) { weight_oz = (wholeOz + 1).toString(); weight_eighths = '0'; }
                    else { weight_oz = wholeOz.toString(); weight_eighths = eighths > 0 ? eighths.toString() : ''; }
                } else {
                    weight_value = existingLog.weight_grams.toString();
                }
            }

            const feed_parts = existingLog.log_type === LogType.FEED ? existingLog.value.split(' ') : [];

            reset({
                log_date: d.toISOString().split('T')[0],
                log_time: d.toTimeString().slice(0, 5),
                log_type: existingLog.log_type,
                notes: existingLog.notes || '',
                initials: currentUser?.initials || '',
                feed_quantity: feed_parts[0] || '',
                feed_type: feed_parts.slice(1).join(' ') || '',
                has_cast: existingLog.has_cast === true ? 'yes' : (existingLog.has_cast === false ? 'no' : ''),
                weight_value,
                weight_lbs,
                weight_oz,
                weight_eighths,
                health_record_type: existingLog.health_record_type || HealthRecordType.OBSERVATION,
                bcs: existingLog.bcs || 3,
                basking_temp_c: existingLog.basking_temp_c?.toString() || '',
                cool_temp_c: existingLog.cool_temp_c?.toString() || '',
                shell_quality: existingLog.shell_quality || ShellQuality.NORMAL,
                event_type: existingLog.event_type || '',
                event_start_time: existingLog.event_start_time?.toISOString() || '',
                event_end_time: existingLog.event_end_time?.toISOString() || '',
                event_animal_ids: existingLog.event_animal_ids || [animal.id],
            });
            setAttachment(existingLog.attachment_url || null);
        } else {
            reset({
                log_date: initialDate || new Date().toISOString().split('T')[0],
                log_time: new Date().toTimeString().slice(0, 5),
                log_type: initialType,
                notes: defaultNotes || '',
                initials: currentUser?.initials || '',
                feed_quantity: '',
                feed_type: '',
                has_cast: '',
                weight_value: '',
                weight_lbs: '',
                weight_oz: '',
                weight_eighths: '',
                health_record_type: HealthRecordType.OBSERVATION,
                bcs: 3,
                basking_temp_c: '',
                cool_temp_c: '',
                shell_quality: ShellQuality.NORMAL,
                event_type: '',
                event_start_time: '',
                event_end_time: '',
                event_animal_ids: [animal.id],
            });
            setAttachment(null);
        }
    }
  }, [isOpen, existingLog, initialType, defaultNotes, initialDate, reset, currentUser, animal.weight_unit]);

  const onSubmit: SubmitHandler<LogEntryFormData> = async (data) => {
    if (!currentUser) return;

    let value = '', weight_grams: number | undefined;
    if (data.log_type === LogType.FEED) value = `${data.feed_quantity} ${data.feed_type}`.trim();
    if (data.log_type === LogType.WEIGHT) { 
        if (animal.weight_unit === 'lbs_oz') {
            const lbs = parseInt(data.weight_lbs || '0') || 0;
            const oz = parseInt(data.weight_oz || '0') || 0;
            const eighths = parseInt(data.weight_eighths || '0') || 0;
            const totalOz = (lbs * 16) + oz + (eighths / 8);
            weight_grams = parseWeightInputToGrams(totalOz, 'oz');
            value = `${lbs}lb ${oz}${eighths > 0 ? ` ${eighths}/8` : ''}oz`;
        } else if (animal.weight_unit === 'oz') {
            const oz = parseInt(data.weight_oz || '0') || 0;
            const eighths = parseInt(data.weight_eighths || '0') || 0;
            const totalOz = oz + (eighths / 8);
            weight_grams = parseWeightInputToGrams(totalOz, 'oz');
            value = `${oz}${eighths > 0 ? ` ${eighths}/8` : ''}oz`;
        } else {
            weight_grams = parseWeightInputToGrams(parseFloat(data.weight_value || '0'), animal.weight_unit);
            value = data.weight_value || ''; 
        }
    }
    if (data.log_type === LogType.HEALTH) value = data.health_record_type || '';
    const dateTime = `${data.log_date}T${data.log_time}:00`;
    
    const baseEntry: any = {
      animal_id: animal.id,
      log_date: new Date(dateTime), 
      log_type: data.log_type, 
      value, 
      notes: data.notes,
      attachment_url: attachment || undefined, 
      weight_grams,
      has_cast: data.log_type === LogType.FEED && data.has_cast ? (data.has_cast === 'yes') : undefined,
      health_record_type: data.log_type === LogType.HEALTH ? data.health_record_type : undefined,
      condition: data.log_type === LogType.HEALTH ? HealthCondition.HEALTHY : undefined, 
      bcs: data.log_type === LogType.HEALTH ? data.bcs : undefined,
      basking_temp_c: data.basking_temp_c ? parseFloat(data.basking_temp_c) : undefined,
      cool_temp_c: data.cool_temp_c ? parseFloat(data.cool_temp_c) : undefined,
      shell_quality: data.log_type === LogType.EGG ? data.shell_quality : undefined,
      event_type: data.log_type === LogType.EVENT ? data.event_type : undefined,
      event_start_time: data.log_type === LogType.EVENT && data.event_start_time ? new Date(data.event_start_time) : undefined,
      event_end_time: data.log_type === LogType.EVENT && data.event_end_time ? new Date(data.event_end_time) : undefined,
      event_animal_ids: data.log_type === LogType.EVENT ? data.event_animal_ids : undefined,
    };

    try {
        if (existingLog) {
            await updateLogEntry({ ...existingLog, ...baseEntry });
        } else {
            await addLogEntry(animal.id, baseEntry);
        }
        onClose();
    } catch (error) {
        console.error('Failed to save log entry:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const resized = await resizeImage(file);
      setAttachment(resized);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 font-black placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:border-emerald-500 transition-all uppercase tracking-wider";
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1";
  const errorClass = "text-red-500 text-[10px] font-bold mt-1 uppercase tracking-wider";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden border-2 border-slate-200">
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50">
                <div>
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{existingLog ? 'Edit Record' : `Log ${logFormType} Entry`}</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry Update: {animal.name}</p>
                </div>
                <button type="button" onClick={onClose} className="text-slate-300 hover:text-slate-900 p-2 bg-white rounded-xl shadow-sm border border-slate-200 transition-all"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 overflow-y-auto scrollbar-hide">
                    {!existingLog && (
                      <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 shadow-inner">
                        <label className={labelClass}>Switch Registry Category</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(Object.values(LogType) as LogType[])
                            .filter(type => {
                                if (animal.category !== AnimalCategory.EXOTICS && (type === LogType.MISTING || type === LogType.WATER)) {
                                    return false;
                                }
                                return true;
                            })
                            .map(type => (
                            <button key={String(type)} type="button" onClick={() => setValue('log_type', type)} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${logFormType === type ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}`}>{type}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Entry Date</label>
                            <input type="date" {...register('log_date')} className={inputClass}/>
                            {errors.log_date && <p className={errorClass}>{errors.log_date.message}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>Entry Time</label>
                            <input type="time" {...register('log_time')} className={inputClass}/>
                            {errors.log_time && <p className={errorClass}>{errors.log_time.message}</p>}
                        </div>
                    </div>

                    {logFormType === LogType.FEED && (
                      <div className="space-y-6 bg-amber-50/30 p-6 rounded-[2rem] border-2 border-amber-100/50">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className={labelClass}>Diet Quantity</label>
                              <input type="number" step="0.1" {...register('feed_quantity')} className={inputClass}/>
                          </div>
                          <div>
                              <label className={labelClass}>Food Inventory Item</label>
                              <select {...register('feed_type')} className={inputClass}>
                                  <option value="">Select...</option>
                                  {(foodOptions[animal.category] || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                          </div>
                        </div>
                        {(animal.category === AnimalCategory.RAPTORS || animal.category === AnimalCategory.OWLS) && (
                          <div>
                              <label className={labelClass}>Statutory Cast Produced?</label>
                              <select {...register('has_cast')} className={inputClass}>
                                  <option value="">Select...</option>
                                  <option value="yes">Yes</option>
                                  <option value="no">No</option>
                              </select>
                          </div>
                        )}
                      </div>
                    )}

                    {logFormType === LogType.WEIGHT && (
                      <div className="bg-blue-50/30 p-6 rounded-[2rem] border-2 border-blue-100/50">
                        {animal.weight_unit === 'lbs_oz' ? (
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>Pounds (lbs)</label>
                                    <input type="number" step="1" min="0" {...register('weight_lbs')} className={inputClass}/>
                                </div>
                                <div>
                                    <label className={labelClass}>Ounces (oz)</label>
                                    <input type="number" step="1" min="0" max="15" {...register('weight_oz')} className={inputClass}/>
                                </div>
                                <div>
                                    <label className={labelClass}>Eighths (1/8 oz)</label>
                                    <select {...register('weight_eighths')} className={inputClass}>
                                        <option value="">0</option>
                                        {[1,2,3,4,5,6,7].map(n => <option key={n} value={String(n)}>{n}/8</option>)}
                                    </select>
                                </div>
                            </div>
                        ) : animal.weight_unit === 'oz' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Ounces (oz)</label>
                                    <input type="number" step="1" min="0" {...register('weight_oz')} className={inputClass}/>
                                </div>
                                <div>
                                    <label className={labelClass}>Eighths (1/8 oz)</label>
                                    <select {...register('weight_eighths')} className={inputClass}>
                                        <option value="">0</option>
                                        {[1,2,3,4,5,6,7].map(n => <option key={n} value={String(n)}>{n}/8</option>)}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className={labelClass}>Subject Weight ({animal.weight_unit})</label>
                                <input type="number" step="0.1" {...register('weight_value')} className={inputClass}/>
                            </div>
                        )}
                      </div>
                    )}

                    {logFormType === LogType.HEALTH && (
                      <div className="space-y-6 bg-rose-50/30 p-6 rounded-[2rem] border-2 border-rose-100/50">
                        <div>
                            <label className={labelClass}>Clinical Classification</label>
                            <select {...register('health_record_type')} className={inputClass}>
                                {(Object.values(HealthRecordType) as string[]).map(t=><option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
                            <label className={labelClass}>Visual Body Condition (Keel)</label>
                            <Controller
                                name="bcs"
                                control={control}
                                render={({ field }) => <BCSSelector value={field.value || 3} onChange={field.onChange} />}
                            />
                        </div>
                      </div>
                    )}

                    {logFormType === LogType.TEMPERATURE && (
                      <div className="space-y-6 bg-orange-50/30 p-6 rounded-[2rem] border-2 border-orange-100/50">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className={labelClass}>Basking Temp (°C)</label>
                              <input type="number" step="0.1" {...register('basking_temp_c')} className={inputClass}/>
                          </div>
                          <div>
                              <label className={labelClass}>Cool End Temp (°C)</label>
                              <input type="number" step="0.1" {...register('cool_temp_c')} className={inputClass}/>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                        <label className={labelClass}>Narrative / Clinical Notes</label>
                        <textarea rows={4} {...register('notes')} className={`${inputClass} normal-case h-32 resize-none font-semibold text-slate-700`} placeholder="Describe observations, health status, or specific actions taken..."/>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Officer Initials (3 Max)</label>
                            <input type="text" maxLength={3} {...register('initials')} className={inputClass} placeholder="ABC" onChange={e => setValue('initials', e.target.value.toUpperCase())}/>
                            {errors.initials && <p className={errorClass}>{errors.initials.message}</p>}
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-8 border-t-2 border-slate-100 mt-4 shrink-0">
                        {existingLog && onDelete ? (
                          <button type="button" onClick={() => { if(window.confirm('Permanently purge this record?')) { onDelete(existingLog.id); onClose(); }}} className="flex items-center gap-2 px-5 py-3 text-rose-600 hover:bg-rose-50 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                            <Trash2 size={18}/> Purge Entry
                          </button>
                        ) : <div/>}
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="px-6 py-3 text-slate-500 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50 flex items-center gap-3">
                              {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Check size={18}/>}
                              Authorise & Save
                            </button>
                        </div>
                    </div>
            </form>
        </div>
    </div>
  );
};

export default AddEntryModal;
