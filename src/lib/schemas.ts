import { z } from 'zod';
import { AnimalCategory, HazardRating, ConservationStatus, LogType, HealthRecordType, HealthCondition, ShellQuality } from '../../types';

export const animalFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  species: z.string().min(1, 'Species is required'),
  latin_name: z.string().optional(),
  category: z.nativeEnum(AnimalCategory),
  dob: z.string().or(z.date()).transform((val) => new Date(val)),
  is_dob_unknown: z.boolean().default(false),
  sex: z.enum(['Male', 'Female', 'Unknown']),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
  special_requirements: z.string().optional(),
  image_url: z.string().optional(),
  distribution_map_url: z.string().optional(),
  acquisition_date: z.string().or(z.date()).transform((val) => new Date(val)),
  origin: z.string().min(1, 'Origin is required'),
  sire_id: z.string().optional(),
  dam_id: z.string().optional(),
  microchip_id: z.string().optional(),
  ring_number: z.string().optional(),
  has_no_id: z.boolean().default(false),
  hazard_rating: z.nativeEnum(HazardRating),
  is_venomous: z.boolean().default(false),
  red_list_status: z.nativeEnum(ConservationStatus),
  is_group_animal: z.boolean().default(false),
  display_order: z.number().optional().default(0),
  archived: z.boolean().default(false),
  is_quarantine: z.boolean().default(false),
});

export type AnimalFormData = z.infer<typeof animalFormSchema>;

export const logEntrySchema = z.object({
  log_date: z.string().min(1, 'Date is required'),
  log_time: z.string().min(1, 'Time is required'),
  log_type: z.nativeEnum(LogType),
  notes: z.string().optional(),
  initials: z.string().max(3, 'Max 3 characters').min(1, 'Required'),
  
  // Feed specific
  feed_quantity: z.string().optional(),
  feed_type: z.string().optional(),
  has_cast: z.string().optional(), // 'yes' | 'no' | ''
  
  // Weight specific
  weight_value: z.string().optional(),
  weight_lbs: z.string().optional(),
  weight_oz: z.string().optional(),
  weight_eighths: z.string().optional(),
  
  // Health specific
  health_record_type: z.nativeEnum(HealthRecordType).optional(),
  bcs: z.number().optional(),
  
  // Temperature specific
  basking_temp_c: z.string().optional(),
  cool_temp_c: z.string().optional(),
  
  // Egg specific
  shell_quality: z.nativeEnum(ShellQuality).optional(),
  
  // Event specific
  event_type: z.string().optional(),
  event_start_time: z.string().optional(),
  event_end_time: z.string().optional(),
  event_animal_ids: z.array(z.string()).optional(),
});

export type LogEntryFormData = z.infer<typeof logEntrySchema>;
