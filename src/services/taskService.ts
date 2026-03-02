import { v4 as uuidv4 } from 'uuid';
import { db } from '@/src/db';
import { createRecord, updateRecord, deleteRecord } from '@/src/services/dataService';
import { Task } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const addTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by'>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  const newTask: Task = {
    ...task,
    id: uuidv4(),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: currentUser.id,
    last_modified_by: currentUser.id,
  };
  await createRecord('tasks', db.tasks, newTask);
};

export const updateTask = async (updates: Partial<Task>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  await updateRecord('tasks', db.tasks, updates.id!, { ...updates, updated_at: new Date(), last_modified_by: currentUser.id });
};

export const deleteTask = async (id: string) => {
  await deleteRecord('tasks', db.tasks, id);
};

export const addTasks = async (newTasks: Task[]) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  for (const task of newTasks) {
    const taskWithMeta: Task = {
      ...task,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: currentUser.id,
      last_modified_by: currentUser.id,
    };
    await createRecord('tasks', db.tasks, taskWithMeta);
  }
};
