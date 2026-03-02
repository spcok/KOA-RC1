import { v4 as uuidv4 } from 'uuid';
import { db } from '@/src/db';
import { createRecord } from '@/src/services/dataService';
import { FirstAidLogEntry } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const addFirstAidLog = async (entry: Omit<FirstAidLogEntry, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by'>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  const newEntry: FirstAidLogEntry = {
    ...entry,
    id: uuidv4(),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: currentUser.id,
    last_modified_by: currentUser.id,
  };
  await createRecord('first_aid_log_entries', db.first_aid_log_entries, newEntry);
};

export const updateFirstAidLog = async (updates: Partial<FirstAidLogEntry>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  await db.first_aid_log_entries.update(updates.id!, { ...updates, updated_at: new Date(), last_modified_by: currentUser.id });
};

export const deleteFirstAidLog = async (id: string) => {
  await db.first_aid_log_entries.delete(id);
};
