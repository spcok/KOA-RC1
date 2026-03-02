import { v4 as uuidv4 } from 'uuid';
import { db } from '@/src/db';
import { createRecord } from '@/src/services/dataService';
import { DailyRoundEntry } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const addDailyRound = async (entry: Omit<DailyRoundEntry, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by'>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  const newEntry: DailyRoundEntry = {
    ...entry,
    id: uuidv4(),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: currentUser.id,
    last_modified_by: currentUser.id,
  };
  await createRecord('daily_round_entries', db.daily_round_entries, newEntry);
};

export const updateDailyRound = async (updates: Partial<DailyRoundEntry>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  await db.daily_round_entries.update(updates.id!, { ...updates, updated_at: new Date(), last_modified_by: currentUser.id });
};

export const deleteDailyRound = async (id: string) => {
  await db.daily_round_entries.delete(id);
};
