import { v4 as uuidv4 } from 'uuid';
import { db } from '@/src/db';
import { createRecord, deleteRecord } from '@/src/services/dataService';
import { GlobalDocument } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const addDocument = async (doc: Omit<GlobalDocument, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by'>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  const newDoc: GlobalDocument = {
    ...doc,
    id: uuidv4(),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: currentUser.id,
    last_modified_by: currentUser.id,
  };
  await createRecord('global_documents', db.documents, newDoc);
};

export const updateDocument = async (doc: GlobalDocument) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  const updatedDoc: GlobalDocument = {
    ...doc,
    updated_at: new Date(),
    last_modified_by: currentUser.id,
  };
  await db.documents.put(updatedDoc);
};

export const deleteDocument = async (id: string) => {
  await deleteRecord('global_documents', db.documents, id);
};
