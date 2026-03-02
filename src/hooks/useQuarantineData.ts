import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { Animal, LogEntry, LogType, HealthRecordType } from '@/types';
import { useAuthStore } from '@/src/store/authStore';
import { useAppData } from '@/src/context/AppContext';
import { useMemo } from 'react';

export const useQuarantineData = () => {
    const { profile: currentUser } = useAuthStore();
    const { updateAnimal, addLogEntry } = useAppData();

    const animals = useLiveQuery(async () => {
        try {
            const data = await db.animals.toArray();
            return data.map(a => ({
                ...a,
                name: String(a.name || 'Unknown'),
                species: String(a.species || 'Unknown'),
                quarantine_reason: String(a.quarantine_reason || '')
            }));
        } catch (e) {
            console.error('Dexie error in useQuarantineData (animals):', e);
            return [];
        }
    }, []);

    const logEntries = useLiveQuery(async () => {
        try {
            const data = await db.log_entries.toArray();
            return data.map(l => ({
                ...l,
                value: String(l.value || ''),
                notes: String(l.notes || '')
            }));
        } catch (e) {
            console.error('Dexie error in useQuarantineData (logEntries):', e);
            return [];
        }
    }, []);

    const isLoading = animals === undefined || logEntries === undefined;

    const quarantineAnimals = useMemo(() => {
        return (animals || []).filter(a => a.is_quarantine);
    }, [animals]);

    const healthyAnimals = useMemo(() => {
        return (animals || []).filter(a => !a.is_quarantine && !a.archived);
    }, [animals]);

    const isolateAnimal = async (animalId: string, date: string, reason: string) => {
        const animal = (animals || []).find(a => a.id === animalId);
        if (!animal) return;

        const log: Omit<LogEntry, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by'> = {
            animal_id: animal.id,
            log_date: new Date(date),
            log_type: LogType.HEALTH,
            health_record_type: HealthRecordType.QUARANTINE,
            value: 'Moved to Quarantine',
            notes: `Reason: ${reason}`
        };

        const updatedAnimal = {
            ...animal,
            is_quarantine: true,
            quarantine_start_date: new Date(date),
            quarantine_reason: reason
        };

        await addLogEntry(animal.id, log);
        await updateAnimal(updatedAnimal);
    };

    const releaseAnimal = async (animalId: string) => {
        const animal = (animals || []).find(a => a.id === animalId);
        if (!animal) return;

        const log: Omit<LogEntry, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by'> = {
            animal_id: animal.id,
            log_date: new Date(),
            log_type: LogType.HEALTH,
            health_record_type: HealthRecordType.RELEASE,
            value: 'Released from Quarantine',
            notes: 'Cleared for return to normal activities.'
        };

        const updatedAnimal = {
            ...animal,
            is_quarantine: false,
            quarantine_start_date: undefined,
            quarantine_reason: undefined
        };

        await addLogEntry(animal.id, log);
        await updateAnimal(updatedAnimal);
    };

    const getLatestVitals = (animalId: string) => {
        if (!logEntries) return { temp: '-', weight: '-' };
        
        const animalLogs = logEntries.filter(l => l.animal_id === animalId);
        const latestTemp = animalLogs
            .filter(l => l.log_type === LogType.TEMPERATURE)
            .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())[0];
        
        const latestWeight = animalLogs
            .filter(l => l.log_type === LogType.WEIGHT)
            .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())[0];

        return {
            temp: latestTemp?.temperature_c !== undefined ? `${latestTemp.temperature_c}°C` : '-',
            weight: latestWeight?.value || '-'
        };
    };

    return {
        quarantineAnimals,
        healthyAnimals,
        isLoading,
        isolateAnimal,
        releaseAnimal,
        getLatestVitals,
        currentUser
    };
};
