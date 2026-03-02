import { v4 as uuidv4 } from 'uuid';
import { db } from '@/src/db';
import { createRecord } from '@/src/services/dataService';
import { AnimalMovement } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const addAnimalMovement = async (movement: Omit<AnimalMovement, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by'>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  const newMovement: AnimalMovement = {
    ...movement,
    id: uuidv4(),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: currentUser.id,
    last_modified_by: currentUser.id,
  };
  await createRecord('animal_movements', db.animal_movements, newMovement);
};

export const updateAnimalMovement = async (updates: Partial<AnimalMovement>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  await db.animal_movements.update(updates.id!, { ...updates, updated_at: new Date(), last_modified_by: currentUser.id });
};

export const deleteAnimalMovement = async (id: string) => {
  await db.animal_movements.delete(id);
};
