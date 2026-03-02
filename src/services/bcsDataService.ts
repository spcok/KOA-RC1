import { v4 as uuidv4 } from 'uuid';
import { db } from '@/src/db';
import { createRecord } from '@/src/services/dataService';
import { BCSData } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const addBCSData = async (data: Omit<BCSData, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by'>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  const newData: BCSData = {
    ...data,
    id: uuidv4(),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: currentUser.id,
    last_modified_by: currentUser.id,
  };
  await createRecord('bcs_data', db.bcs_data, newData);
};

export const updateBCSData = async (updates: Partial<BCSData>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  await db.bcs_data.update(updates.id!, { ...updates, updated_at: new Date(), last_modified_by: currentUser.id });
};

export const deleteBCSData = async (id: string) => {
  await db.bcs_data.delete(id);
};
