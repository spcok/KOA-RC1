import { v4 as uuidv4 } from 'uuid';
import { db } from '@/src/db';
import { createRecord, updateRecord, deleteRecord } from '@/src/services/dataService';
import { Animal, LogEntry, LogType } from '@/types';
import { useAuthStore } from '@/src/store/authStore';
import { addLogEntry } from './logEntryService';

export const addAnimal = async (animal: Omit<Animal, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by' | 'logs' | 'documents'>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  const newAnimal: Animal = {
    ...animal,
    id: uuidv4(),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: currentUser.id,
    last_modified_by: currentUser.id,
    logs: [],
    documents: []
  };
  await createRecord('animals', db.animals, newAnimal);
};

export const updateAnimal = async (updates: Partial<Animal>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  await updateRecord('animals', db.animals, updates.id!, { ...updates, updated_at: new Date(), last_modified_by: currentUser.id });
};

export const deleteAnimal = async (id: string) => {
  await deleteRecord('animals', db.animals, id);
};

export const archiveAnimal = async (id: string, reason: string, type: 'Disposition' | 'Death') => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  
  // 1. Update animal record
  await updateRecord('animals', db.animals, id, { 
    archived: true, 
    updated_at: new Date(), 
    last_modified_by: currentUser.id 
  });

  // 2. Create a formal log entry for the archive event
  const logEntry: Omit<LogEntry, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by'> = {
    animal_id: id,
    log_date: new Date(),
    log_type: type === 'Death' ? LogType.HEALTH : LogType.MOVEMENT,
    value: `${type}: ${reason}`,
    notes: `Subject archived from active registry. Reason: ${reason}`,
    ...(type === 'Death' ? { health_record_type: 'Death' as any } : { movement_type: 'Disposition' as any })
  };

  await addLogEntry(id, logEntry);
};
