import { db } from '@/src/db';
import { updateRecord } from '@/src/services/dataService';
import { OrganisationProfile } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const updateOrgProfile = async (updates: Partial<OrganisationProfile>) => {
  const currentUser = useAuthStore.getState().profile;
  if (!currentUser) throw new Error('User not authenticated');
  
  let id = updates.id?.toString();
  if (!id) {
    const profiles = await db.organisation_profiles.toArray();
    id = profiles[0]?.id || '00000000-0000-0000-0000-000000000001';
  }
  
  await updateRecord('organisation_profiles', db.organisation_profiles, id, { ...updates, id, updated_at: new Date(), last_modified_by: currentUser.id });
};
