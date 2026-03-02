import { useState, useCallback } from 'react';
import { db } from '@/src/db';
import { Animal, LogEntry, AnimalCategory, HazardRating, ConservationStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '@/src/store/authStore';
import { supabase } from '@/src/services/supabaseClient';

interface MigrationStats {
  animalsFound: number;
  logsFound: number;
}

interface MigrationProgress {
  current: number;
  total: number;
  percentage: number;
  status: 'idle' | 'parsing' | 'staging' | 'importing' | 'completed' | 'error';
  error?: string;
}

export const useMigrationData = () => {
  const { profile } = useAuthStore();
  const [stagedAnimals, setStagedAnimals] = useState<Animal[]>([]);
  const [stagedLogs, setStagedLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState<MigrationProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    status: 'idle',
  });

  const reset = useCallback(() => {
    setStagedAnimals([]);
    setStagedLogs([]);
    setProgress({
      current: 0,
      total: 0,
      percentage: 0,
      status: 'idle',
    });
  }, []);

  const parseFile = useCallback(async (file: File) => {
    setProgress(prev => ({ ...prev, status: 'parsing', error: undefined }));
    
    try {
      const text = await file.text();
      const rawData = JSON.parse(text);
      
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

      setProgress(prev => ({ ...prev, status: 'staging' }));

      const animals: Animal[] = [];
      const logs: LogEntry[] = [];
      const userId = profile?.id || 'system';
      
      const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const idMap = new Map<string, string>();

      let count = 0;
      for (const legacy of rawAnimals) {
        count++;
        
        let animalId = legacy.id;
        if (!animalId || !isValidUUID(animalId)) {
            animalId = uuidv4();
            if (legacy.id) {
                idMap.set(legacy.id, animalId);
            }
        }
        
        // Map legacy fields with strict casting and defaults
        const animal: Animal = {
          id: animalId,
          name: String(legacy.name || legacy.Name || 'Unknown Animal'),
          species: String(legacy.species || legacy.Species || 'Unknown Species'),
          latin_name: legacy.latin_name || legacy.latinName || legacy.LatinName ? String(legacy.latin_name || legacy.latinName || legacy.LatinName) : undefined,
          category: (legacy.category || legacy.Category || AnimalCategory.OWLS) as AnimalCategory,
          dob: legacy.hatch_date ? new Date(legacy.hatch_date) : (legacy.dob ? new Date(legacy.dob) : new Date()),
          is_dob_unknown: legacy.is_dob_unknown ?? legacy.isDobUnknown ?? (!legacy.hatch_date && !legacy.dob),
          sex: (legacy.sex || legacy.Sex || 'Unknown') as any,
          location: String(legacy.location || legacy.Location || 'Main Aviary'),
          description: legacy.description || legacy.Description ? String(legacy.description || legacy.Description) : undefined,
          image_url: String(legacy.image_url || legacy.imageUrl || legacy.ImageURL || ''),
          weight_unit: (legacy.weight_unit || legacy.weightUnit || 'g') as any,
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
          created_at: legacy.timestamp ? new Date(legacy.timestamp) : (legacy.created_at || legacy.createdAt ? new Date(legacy.created_at || legacy.createdAt) : new Date()),
          created_by: legacy.created_by || legacy.createdBy || userId,
          updated_at: legacy.updated_at || legacy.updatedAt ? new Date(legacy.updated_at || legacy.updatedAt) : new Date(),
          last_modified_by: legacy.last_modified_by || legacy.lastModifiedBy || userId,
        };

        animals.push(animal);

        // Map nested logs if they exist (Legacy format)
        if (legacy.logs && Array.isArray(legacy.logs)) {
          for (const legacyLog of legacy.logs) {
            
            let logId = legacyLog.id;
            if (!logId || !isValidUUID(logId)) {
                logId = uuidv4();
            }

            const log: LogEntry = {
              id: logId,
              animal_id: animalId,
              log_date: legacyLog.timestamp || legacyLog.log_date || legacyLog.logDate ? new Date(legacyLog.timestamp || legacyLog.log_date || legacyLog.logDate) : new Date(),
              log_type: (legacyLog.type || legacyLog.log_type || legacyLog.logType || 'General') as any,
              value: String(legacyLog.value || legacyLog.Value || ''),
              notes: legacyLog.notes || legacyLog.Notes ? String(legacyLog.notes || legacyLog.Notes) : undefined,
              weight_grams: legacyLog.weight || legacyLog.weight_grams || legacyLog.weightGrams ? Number(legacyLog.weight || legacyLog.weight_grams || legacyLog.weightGrams) : undefined,
              created_at: legacyLog.timestamp || legacyLog.created_at || legacyLog.createdAt ? new Date(legacyLog.timestamp || legacyLog.created_at || legacyLog.createdAt) : new Date(),
              created_by: legacyLog.created_by || legacyLog.createdBy || userId,
              updated_at: new Date(),
              last_modified_by: userId,
            };
            logs.push(log);
          }
        }

        // Yield every 200 animals to keep UI responsive during parsing
        if (count % 200 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // Process separate logs (New Backup format)
      let logCount = 0;
      for (const rawLog of rawLogs) {
        logCount++;
        
        let logId = rawLog.id;
        if (!logId || !isValidUUID(logId)) {
            logId = uuidv4();
        }
        
        let animalId = rawLog.animal_id || rawLog.animalId;
        if (animalId && idMap.has(animalId)) {
            animalId = idMap.get(animalId);
        } else if (!animalId || !isValidUUID(animalId)) {
            // If we can't map it and it's not a valid UUID, we have to skip or generate a dummy.
            // Skipping is safer to avoid orphaned records in Supabase.
            console.warn(`Skipping log ${logId} due to invalid/unmapped animal_id: ${animalId}`);
            continue;
        }

        const log: LogEntry = {
          id: logId,
          animal_id: animalId, // Must exist in this format
          log_date: rawLog.log_date || rawLog.logDate ? new Date(rawLog.log_date || rawLog.logDate) : new Date(),
          log_type: (rawLog.log_type || rawLog.logType || 'General') as any,
          value: String(rawLog.value || rawLog.Value || ''),
          notes: rawLog.notes || rawLog.Notes ? String(rawLog.notes || rawLog.Notes) : undefined,
          weight_grams: rawLog.weight_grams || rawLog.weightGrams || rawLog.weight ? Number(rawLog.weight_grams || rawLog.weightGrams || rawLog.weight) : undefined,
          created_at: rawLog.created_at || rawLog.createdAt ? new Date(rawLog.created_at || rawLog.createdAt) : new Date(),
          created_by: rawLog.created_by || rawLog.createdBy || userId,
          updated_at: rawLog.updated_at || rawLog.updatedAt ? new Date(rawLog.updated_at || rawLog.updatedAt) : new Date(),
          last_modified_by: rawLog.last_modified_by || rawLog.lastModifiedBy || userId,
          // Explicitly map other potential fields if they exist in the schema
          feed_method: rawLog.feed_method || rawLog.feedMethod,
          has_cast: rawLog.has_cast ?? rawLog.hasCast,
          condition: rawLog.condition,
          bcs: rawLog.bcs,
        };
        logs.push(log);

        if (logCount % 500 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      setStagedAnimals(animals);
      setStagedLogs(logs);
      setProgress(prev => ({
        ...prev,
        status: 'idle',
        total: animals.length + logs.length,
      }));

    } catch (err: any) {
      setProgress(prev => ({
        ...prev,
        status: 'error',
        error: err.message || 'Failed to parse legacy file',
      }));
    }
  }, [profile?.id]);

  const runImport = useCallback(async () => {
    if (stagedAnimals.length === 0 && stagedLogs.length === 0) return;

    setProgress(prev => ({ ...prev, status: 'importing', current: 0, percentage: 0 }));
    
    const ANIMAL_CHUNK = 50;
    const LOG_CHUNK = 250; // Logs are smaller, use larger chunks
    let processedCount = 0;
    const totalCount = stagedAnimals.length + stagedLogs.length;
    let lastUpdate = Date.now();

    try {
      // Import Animals in chunks
      for (let i = 0; i < stagedAnimals.length; i += ANIMAL_CHUNK) {
        const chunk = stagedAnimals.slice(i, i + ANIMAL_CHUNK);
        
        // 1. Write to local Dexie database first (Offline Backup/Cache)
        await db.animals.bulkPut(chunk);
        
        // 2. Attempt to sync to Supabase via API
        try {
            // Prepare records for Supabase (ensure dates are strings)
            const supabaseChunk = chunk.map(animal => ({
                ...animal,
                dob: animal.dob ? new Date(animal.dob).toISOString() : null,
                acquisition_date: animal.acquisition_date ? new Date(animal.acquisition_date).toISOString() : null,
                quarantine_start_date: animal.quarantine_start_date ? new Date(animal.quarantine_start_date).toISOString() : null,
                created_at: animal.created_at ? new Date(animal.created_at).toISOString() : new Date().toISOString(),
                updated_at: animal.updated_at ? new Date(animal.updated_at).toISOString() : new Date().toISOString(),
            }));
            
            const { error } = await supabase.from('animals').upsert(supabaseChunk);
            if (error) {
                console.error('Supabase sync error for animals chunk:', error);
                // We don't throw here, allowing the local Dexie data to persist
            }
        } catch (syncError) {
            console.error('Failed to sync animals chunk to Supabase:', syncError);
        }

        processedCount += chunk.length;
        
        // Throttle state updates to prevent UI flooding
        if (Date.now() - lastUpdate > 50 || processedCount === totalCount) {
          setProgress(prev => ({
            ...prev,
            current: processedCount,
            percentage: Math.round((processedCount / totalCount) * 100),
          }));
          lastUpdate = Date.now();
          // Yield to UI
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // Import Logs in chunks
      for (let i = 0; i < stagedLogs.length; i += LOG_CHUNK) {
        const chunk = stagedLogs.slice(i, i + LOG_CHUNK);
        
        // 1. Write to local Dexie database first
        await db.log_entries.bulkPut(chunk);
        
        // 2. Attempt to sync to Supabase
        try {
            const supabaseChunk = chunk.map(log => ({
                ...log,
                log_date: log.log_date ? new Date(log.log_date).toISOString() : null,
                medication_end_date: log.medication_end_date ? new Date(log.medication_end_date).toISOString() : null,
                next_due_date: log.next_due_date ? new Date(log.next_due_date).toISOString() : null,
                weathering_start_time: log.weathering_start_time ? new Date(log.weathering_start_time).toISOString() : null,
                weathering_end_time: log.weathering_end_time ? new Date(log.weathering_end_time).toISOString() : null,
                event_start_time: log.event_start_time ? new Date(log.event_start_time).toISOString() : null,
                event_end_time: log.event_end_time ? new Date(log.event_end_time).toISOString() : null,
                created_at: log.created_at ? new Date(log.created_at).toISOString() : new Date().toISOString(),
                updated_at: log.updated_at ? new Date(log.updated_at).toISOString() : new Date().toISOString(),
            }));
            
            const { error } = await supabase.from('log_entries').upsert(supabaseChunk);
            if (error) {
                console.error('Supabase sync error for logs chunk:', error);
            }
        } catch (syncError) {
            console.error('Failed to sync logs chunk to Supabase:', syncError);
        }

        processedCount += chunk.length;
        
        if (Date.now() - lastUpdate > 50 || processedCount === totalCount) {
          setProgress(prev => ({
            ...prev,
            current: processedCount,
            percentage: Math.round((processedCount / totalCount) * 100),
          }));
          lastUpdate = Date.now();
          // Yield to UI
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // Final progress update
      setProgress(prev => ({ 
        ...prev, 
        status: 'completed', 
        current: totalCount,
        percentage: 100 
      }));
    } catch (err: any) {
      console.error('Migration import failed:', err);
      setProgress(prev => ({
        ...prev,
        status: 'error',
        error: err.message || 'Database import failed',
      }));
    }
  }, [stagedAnimals, stagedLogs]);

  return {
    stagedAnimals,
    stagedLogs,
    progress,
    parseFile,
    runImport,
    reset,
  };
};
