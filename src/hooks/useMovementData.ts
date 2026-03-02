import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { LogEntry, Animal, LogType, MovementType } from '@/types';
import { useAuthStore } from '@/src/store/authStore';
import { useAppData } from '@/src/context/AppContext';
import { useState, useMemo } from 'react';

export const useMovementData = () => {
    const { profile: currentUser } = useAuthStore();
    const { addLogEntry, updateLogEntry, updateAnimal } = useAppData();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | MovementType>('ALL');

    const animals = useLiveQuery(async () => {
        try {
            const data = await db.animals.toArray();
            return data.map(a => ({
                ...a,
                name: String(a.name || 'Unknown'),
                species: String(a.species || 'Unknown'),
                location: String(a.location || 'Unknown')
            }));
        } catch (e) {
            console.error('Dexie error in useMovementData (animals):', e);
            return [];
        }
    }, []);

    const logEntries = useLiveQuery(async () => {
        try {
            const data = await db.log_entries
                .filter(l => l.log_type === LogType.MOVEMENT)
                .toArray();
            return data.map(l => ({
                ...l,
                value: String(l.value || ''),
                notes: String(l.notes || ''),
                source_location: String(l.source_location || ''),
                destination_location: String(l.destination_location || ''),
                external_party_name: String(l.external_party_name || '')
            }));
        } catch (e) {
            console.error('Dexie error in useMovementData (logEntries):', e);
            return [];
        }
    }, []);

    const isLoading = animals === undefined || logEntries === undefined;

    const movementLogs = useMemo(() => {
        if (!animals || !logEntries) return [];
        
        const allLogs = logEntries
            .map(log => ({ 
                log, 
                animal: animals.find(a => a.id === log.animal_id) 
            }))
            .filter(item => item.animal);

        let filtered = allLogs;
        
        if (filterType !== 'ALL') {
            filtered = filtered.filter(l => l.log.movement_type === filterType);
        }

        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter(item => 
                item.animal?.name.toLowerCase().includes(s) ||
                item.animal?.species.toLowerCase().includes(s) ||
                item.log.source_location?.toLowerCase().includes(s) ||
                item.log.destination_location?.toLowerCase().includes(s)
            );
        }

        return filtered.sort((a, b) => {
            return new Date(b.log.log_date).getTime() - new Date(a.log.log_date).getTime();
        });
    }, [animals, logEntries, filterType, searchTerm]);

    const addMovement = async (movement: {
        animalId: string;
        date: string;
        type: MovementType;
        source: string;
        destination: string;
        notes: string;
    }) => {
        const animal = animals?.find(a => a.id === movement.animalId);
        if (!animal) return;

        const movementLog: Omit<LogEntry, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by'> = {
            animal_id: movement.animalId,
            log_date: new Date(movement.date),
            log_type: LogType.MOVEMENT,
            value: `${movement.type}: ${movement.source || 'Internal'} to ${movement.destination || 'Internal'}`,
            notes: movement.notes,
            movement_type: movement.type,
            source_location: movement.source,
            destination_location: movement.destination
        };

        await addLogEntry(movement.animalId, movementLog);
        
        // Update animal location if it's a transfer or acquisition
        if (movement.type === MovementType.TRANSFER || movement.type === MovementType.ACQUISITION) {
            await updateAnimal({ ...animal, location: movement.destination });
        }
    };

    return {
        movementLogs,
        animals: animals || [],
        isLoading,
        filterType,
        setFilterType,
        searchTerm,
        setSearchTerm,
        addMovement,
        currentUser
    };
};
