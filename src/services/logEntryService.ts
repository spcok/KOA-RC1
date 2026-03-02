import { v4 as uuidv4 } from 'uuid';
import { db } from '@/src/db';
import { createRecord, updateRecord, deleteRecord } from '@/src/services/dataService';
import { LogEntry } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const addLogEntry = async (animalId: string, entry: Omit<LogEntry, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by'>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  const newEntry: LogEntry = {
    ...entry,
    id: uuidv4(),
    animal_id: animalId,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: currentUser.id,
    last_modified_by: currentUser.id,
  };
  await createRecord('log_entries', db.log_entries, newEntry);
};

export const updateLogEntry = async (updates: Partial<LogEntry>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  await updateRecord('log_entries', db.log_entries, updates.id!, { ...updates, updated_at: new Date(), last_modified_by: currentUser.id });
};

export const deleteLogEntry = async (id: string) => {
  await deleteRecord('log_entries', db.log_entries, id);
};
