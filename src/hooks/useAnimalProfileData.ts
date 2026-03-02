import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { Animal, LogEntry, Task, OrganisationProfile } from '@/types';
import { archiveAnimal as archiveAnimalService } from '@/src/services/animalService';

export const useAnimalProfileData = (animalId: string | undefined) => {
    const animal = useLiveQuery(async () => {
        if (!animalId) return null;
        try {
            const data = await db.animals.get(animalId);
            if (!data) return null;
            // Strict sanitization & Stability
            return {
                ...data,
                name: String(data.name || ''),
                species: String(data.species || ''),
                latin_name: String(data.latin_name || ''),
                location: String(data.location || ''),
                description: String(data.description || ''),
                ring_number: String(data.ring_number || ''),
                microchip_id: String(data.microchip_id || ''),
                origin: String(data.origin || ''),
                hazard_rating: String(data.hazard_rating || ''),
                red_list_status: String(data.red_list_status || ''),
                image_url: String(data.image_url || ''),
                special_requirements: String(data.special_requirements || ''),
                critical_husbandry_notes: (data.critical_husbandry_notes || []).map(n => String(n)),
            } as Animal;
        } catch (e) {
            console.error('[useAnimalProfileData] Error fetching animal:', e);
            return null;
        }
    }, [animalId]);

    const logs = useLiveQuery(async () => {
        if (!animalId) return [];
        try {
            const data = await db.log_entries
                .where('animal_id')
                .equals(animalId)
                .reverse()
                .sortBy('log_date');
            
            return data.map(log => ({
                ...log,
                value: String(log.value || ''),
                notes: String(log.notes || ''),
                user_initials: String(log.user_initials || ''),
                health_record_type: String(log.health_record_type || ''),
                feed_method: String(log.feed_method || ''),
                medication_name: String(log.medication_name || ''),
                diagnosis: String(log.diagnosis || ''),
                treatment_details: String(log.treatment_details || ''),
            })) as LogEntry[];
        } catch (e) {
            console.error('[useAnimalProfileData] Error fetching logs:', e);
            return [];
        }
    }, [animalId]);

    const tasks = useLiveQuery(async () => {
        if (!animalId) return [];
        try {
            const data = await db.tasks
                .where('animal_id')
                .equals(animalId)
                .toArray();
            
            return data.map(task => ({
                ...task,
                title: String(task.title || ''),
                notes: String(task.notes || ''),
            })) as Task[];
        } catch (e) {
            console.error('[useAnimalProfileData] Error fetching tasks:', e);
            return [];
        }
    }, [animalId]);

    const orgProfile = useLiveQuery(async () => {
        try {
            const profiles = await db.organisation_profiles.toArray();
            const profile = profiles[0];
            if (!profile) return null;
            return {
                ...profile,
                name: String(profile.name || ''),
            } as OrganisationProfile;
        } catch (e) {
            console.error('[useAnimalProfileData] Error fetching org profile:', e);
            return null;
        }
    }, []);

    const allAnimals = useLiveQuery(async () => {
        try {
            return await db.animals.toArray();
        } catch (e) {
            console.error('[useAnimalProfileData] Error fetching all animals:', e);
            return [];
        }
    }, []);

    const isLoading = animal === undefined || logs === undefined || tasks === undefined || orgProfile === undefined || allAnimals === undefined;

    const archiveAnimal = async (reason: string, type: 'Disposition' | 'Death') => {
        if (!animalId) return;
        await archiveAnimalService(animalId, reason, type);
    };

    return {
        animal: animal || null,
        logs: logs || [],
        tasks: tasks || [],
        orgProfile: orgProfile || null,
        allAnimals: allAnimals || [],
        isLoading,
        archiveAnimal
    };
};
