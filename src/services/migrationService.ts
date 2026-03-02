
import { db } from '@/src/db';
import { Animal, LogEntry } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { dataService } from './dataService';

export const migrateLegacyData = async (userId: string, rawData: any): Promise<{ animalCount: number, logCount: number }> => {
  const animalsToCreate: Animal[] = [];
  const logsToCreate: LogEntry[] = [];

  // Defensive parsing: find the array of records
  let rawAnimals: any[] = [];
  let rawLogs: any[] = [];

  if (Array.isArray(rawData)) {
    rawAnimals = rawData;
  } else if (Array.isArray(rawData.data)) {
    rawAnimals = rawData.data;
  } else if (Array.isArray(rawData.animals)) {
    rawAnimals = rawData.animals;
  } else if (rawData.data && typeof rawData.data === 'object') {
    // Handle KOA_Backup format (v1.1.0)
    if (Array.isArray(rawData.data.animals)) {
      rawAnimals = rawData.data.animals;
    }
    if (Array.isArray(rawData.data.logEntries)) {
      rawLogs = rawData.data.logEntries;
    }
    // Handle potential snake_case variant
    if (Array.isArray(rawData.data.log_entries)) {
      rawLogs = [...rawLogs, ...rawData.data.log_entries];
    }
  } else {
    throw new Error('Could not find a valid array of records in the JSON file.');
  }

  for (const legacy of rawAnimals) {
    // Use existing ID if valid UUID, otherwise generate new
    const animalId = (legacy.id && legacy.id.length > 10) ? legacy.id : uuidv4();
    
    const newAnimal: Animal = {
      id: animalId,
      name: String(legacy.name || legacy.Name || 'Unknown Animal'),
      species: String(legacy.species || legacy.Species || 'Unknown Species'),
      latin_name: legacy.latin_name || legacy.latinName || legacy.LatinName ? String(legacy.latin_name || legacy.latinName || legacy.LatinName) : undefined,
      category: (legacy.category || legacy.Category || AnimalCategory.OWLS) as AnimalCategory,
      created_by: legacy.created_by || legacy.createdBy || userId,
      created_at: legacy.timestamp ? new Date(legacy.timestamp) : (legacy.created_at || legacy.createdAt ? new Date(legacy.created_at || legacy.createdAt) : new Date()),
      updated_at: legacy.updated_at || legacy.updatedAt ? new Date(legacy.updated_at || legacy.updatedAt) : new Date(),
      last_modified_by: legacy.last_modified_by || legacy.lastModifiedBy || userId,
      sex: (legacy.sex || legacy.Sex || 'Unknown') as any,
      dob: legacy.hatch_date ? new Date(legacy.hatch_date) : (legacy.dob ? new Date(legacy.dob) : new Date()),
      is_dob_unknown: legacy.is_dob_unknown ?? legacy.isDobUnknown ?? (!legacy.hatch_date && !legacy.dob),
      weight_unit: (legacy.weight_unit || legacy.weightUnit || 'g') as any,
      location: String(legacy.location || legacy.Location || 'Main Aviary'),
      acquisition_date: legacy.acquisition_date || legacy.acquisitionDate ? new Date(legacy.acquisition_date || legacy.acquisitionDate) : new Date(),
      origin: String(legacy.origin || legacy.Origin || 'Legacy Import'),
      is_venomous: Boolean(legacy.is_venomous ?? legacy.isVenomous ?? false),
      hazard_rating: (legacy.hazard_rating || legacy.hazardRating || HazardRating.NONE) as HazardRating,
      red_list_status: (legacy.red_list_status || legacy.redListStatus || ConservationStatus.NE) as ConservationStatus,
      archived: Boolean(legacy.archived ?? legacy.Archived ?? false),
      is_quarantine: Boolean(legacy.is_quarantine ?? legacy.isQuarantine ?? false),
      display_order: Number(legacy.display_order || legacy.displayOrder || 0),
      is_group_animal: Boolean(legacy.is_group_animal ?? legacy.isGroupAnimal ?? false),
      has_no_id: Boolean(legacy.has_no_id ?? legacy.hasNoId ?? false),
      image_url: String(legacy.image_url || legacy.imageUrl || legacy.ImageURL || ''),
      logs: [],
      documents: []
    };
    animalsToCreate.push(newAnimal);

    if (legacy.logs && Array.isArray(legacy.logs)) {
      for (const legacyLog of legacy.logs) {
        const newLog: LogEntry = {
          id: uuidv4(),
          animal_id: animalId,
          log_date: legacyLog.timestamp || legacyLog.log_date || legacyLog.logDate ? new Date(legacyLog.timestamp || legacyLog.log_date || legacyLog.logDate) : new Date(),
          log_type: (legacyLog.type || legacyLog.log_type || legacyLog.logType || 'General') as any,
          value: String(legacyLog.value || legacyLog.Value || ''),
          notes: legacyLog.notes || legacyLog.Notes ? String(legacyLog.notes || legacyLog.Notes) : undefined,
          created_by: legacyLog.created_by || legacyLog.createdBy || userId,
          weight_grams: legacyLog.weight || legacyLog.weight_grams || legacyLog.weightGrams ? Number(legacyLog.weight || legacyLog.weight_grams || legacyLog.weightGrams) : undefined,
          created_at: legacyLog.timestamp || legacyLog.created_at || legacyLog.createdAt ? new Date(legacyLog.timestamp || legacyLog.created_at || legacyLog.createdAt) : new Date(),
          updated_at: new Date(),
          last_modified_by: userId
        };
        logsToCreate.push(newLog);
      }
    }
  }

  // Process separate logs (New Backup format)
  for (const rawLog of rawLogs) {
    const log: LogEntry = {
      id: rawLog.id || uuidv4(),
      animal_id: rawLog.animal_id || rawLog.animalId,
      log_date: rawLog.log_date || rawLog.logDate ? new Date(rawLog.log_date || rawLog.logDate) : new Date(),
      log_type: (rawLog.log_type || rawLog.logType || 'General') as any,
      value: String(rawLog.value || rawLog.Value || ''),
      notes: rawLog.notes || rawLog.Notes ? String(rawLog.notes || rawLog.Notes) : undefined,
      weight_grams: rawLog.weight_grams || rawLog.weightGrams || rawLog.weight ? Number(rawLog.weight_grams || rawLog.weightGrams || rawLog.weight) : undefined,
      created_at: rawLog.created_at || rawLog.createdAt ? new Date(rawLog.created_at || rawLog.createdAt) : new Date(),
      created_by: rawLog.created_by || rawLog.createdBy || userId,
      updated_at: rawLog.updated_at || rawLog.updatedAt ? new Date(rawLog.updated_at || rawLog.updatedAt) : new Date(),
      last_modified_by: rawLog.last_modified_by || rawLog.lastModifiedBy || userId,
    };
    logsToCreate.push(log);
  }

  await dataService.bulkCreateRecords('animals', db.animals, animalsToCreate);
  await dataService.bulkCreateRecords('log_entries', db.log_entries, logsToCreate);

  return {
    animalCount: animalsToCreate.length,
    logCount: logsToCreate.length,
  };
};
