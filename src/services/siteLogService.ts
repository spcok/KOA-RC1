import { v4 as uuidv4 } from 'uuid';
import { db } from '@/src/db';
import { createRecord } from '@/src/services/dataService';
import { SiteLogEntry } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const addSiteLog = async (entry: Omit<SiteLogEntry, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by' | 'logged_by_user_id'>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  const newEntry: SiteLogEntry = {
    ...entry,
    id: uuidv4(),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: currentUser.id,
    last_modified_by: currentUser.id,
    logged_by_user_id: currentUser.id,
  };
  await createRecord('site_log_entries', db.site_log_entries, newEntry);
};

export const updateSiteLog = async (updates: Partial<SiteLogEntry>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  await db.site_log_entries.update(updates.id!, { ...updates, updated_at: new Date(), last_modified_by: currentUser.id });
};

export const deleteSiteLog = async (id: string) => {
  await db.site_log_entries.delete(id);
};
