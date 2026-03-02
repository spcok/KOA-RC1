import { v4 as uuidv4 } from 'uuid';
import { db } from '@/src/db';
import { createRecord, updateRecord, deleteRecord } from '@/src/services/dataService';
import { StaffTraining } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const addStaffTraining = async (training: Omit<StaffTraining, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by'>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  const newTraining: StaffTraining = {
    ...training,
    id: uuidv4(),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: currentUser.id,
    last_modified_by: currentUser.id,
  };
  await createRecord('staff_training', db.staff_training, newTraining);
};

export const updateStaffTraining = async (updates: Partial<StaffTraining>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  await updateRecord('staff_training', db.staff_training, updates.id!, { ...updates, updated_at: new Date(), last_modified_by: currentUser.id });
};

export const deleteStaffTraining = async (id: string) => {
  await deleteRecord('staff_training', db.staff_training, id);
};
