import { v4 as uuidv4 } from 'uuid';
import { db } from '@/src/db';
import { createRecord } from '@/src/services/dataService';
import { Incident } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const addIncident = async (incident: Omit<Incident, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by' | 'reported_by_user_id'>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  const newIncident: Incident = {
    ...incident,
    id: uuidv4(),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: currentUser.id,
    last_modified_by: currentUser.id,
    reported_by_user_id: currentUser.id,
  };
  await createRecord('incidents', db.incidents, newIncident);
};

export const updateIncident = async (updates: Partial<Incident>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  await db.incidents.update(updates.id!, { ...updates, updated_at: new Date(), last_modified_by: currentUser.id });
};

export const deleteIncident = async (id: string) => {
  await db.incidents.delete(id);
};
