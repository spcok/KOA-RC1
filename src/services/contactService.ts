import { v4 as uuidv4 } from 'uuid';
import { db } from '@/src/db';
import { createRecord, updateRecord, deleteRecord } from '@/src/services/dataService';
import { Contact } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const addContact = async (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by'>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  const newContact: Contact = {
    ...contact,
    id: uuidv4(),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: currentUser.id,
    last_modified_by: currentUser.id,
  };
  await createRecord('contacts', db.contacts, newContact);
};

export const updateContact = async (updates: Partial<Contact>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  await updateRecord('contacts', db.contacts, updates.id!, { ...updates, updated_at: new Date(), last_modified_by: currentUser.id });
};

export const deleteContact = async (id: string) => {
  await deleteRecord('contacts', db.contacts, id);
};
