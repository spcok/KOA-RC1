import { v4 as uuidv4 } from 'uuid';
import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { Animal, AnimalCategory, LogType, LogEntry } from '@/types';

export const useDailyLogData = (initialDate: string, initialCategory: AnimalCategory) => {
  const [viewDate, setViewDate] = useState(initialDate);
  const [activeCategory, setActiveCategory] = useState<AnimalCategory>(initialCategory);
  const [sortOption, setSortOption] = useState<'alpha-asc' | 'alpha-desc' | 'custom'>('alpha-asc');

  const data = useLiveQuery(async () => {
    try {
      const [animals, logEntries] = await Promise.all([
        db.animals.toArray(),
        db.log_entries.toArray()
      ]);
      return { animals, logEntries };
    } catch (e) {
      console.error("Dexie error in useDailyLogData:", e);
      return { animals: [], logEntries: [] };
    }
  }, []);

  const isLoading = data === undefined;

  const sanitizedAnimals = useMemo(() => {
    if (!data?.animals) return [];
    return data.animals.map(animal => ({
      ...animal,
      id: String(animal.id || ''),
      name: String(animal.name || 'Unknown'),
      species: String(animal.species || 'Unknown Species'),
      image_url: String(animal.image_url || ''),
      category: String(animal.category || AnimalCategory.OTHER) as AnimalCategory,
      weight_unit: String(animal.weight_unit || 'g')
    }));
  }, [data?.animals]);

  const sanitizedLogs = useMemo(() => {
    if (!data?.logEntries) return [];
    return data.logEntries.map(log => ({
      ...log,
      id: String(log.id || ''),
      animal_id: String(log.animal_id || ''),
      log_type: String(log.log_type || LogType.GENERAL) as LogType,
      value: String(log.value || ''),
      log_date: log.log_date ? new Date(log.log_date) : new Date()
    }));
  }, [data?.logEntries]);

  const filteredAndSortedAnimals = useMemo(() => {
    const filtered = sanitizedAnimals.filter(a => a.category === activeCategory && !a.archived);
    
    return [...filtered].sort((a, b) => {
      if (sortOption === 'alpha-asc') return a.name.localeCompare(b.name);
      if (sortOption === 'alpha-desc') return b.name.localeCompare(a.name);
      if (sortOption === 'custom') return (a.display_order ?? 0) - (b.display_order ?? 0);
      return 0;
    });
  }, [sanitizedAnimals, activeCategory, sortOption]);

  const getTodayLog = (animalId: string, type: LogType): any | undefined => {
    return sanitizedLogs.find(log => {
      const d = log.log_date;
      return d.toISOString().startsWith(viewDate) && 
             log.animal_id === animalId && 
             log.log_type === type;
    });
  };

  const addLogEntry = async (animalId: string, entry: any) => {
      await db.log_entries.add({
          ...entry,
          id: uuidv4(),
          animal_id: animalId,
          created_at: new Date(),
          updated_at: new Date()
      });
  };

  const handleQuickCheck = async (animalId: string, type: LogType) => {
    const existing = getTodayLog(animalId, type);
    if (existing) return;

    const newEntry = {
      log_date: new Date(`${viewDate}T${new Date().toTimeString().slice(0, 5)}:00`),
      log_type: type,
      value: `Completed - ${type}`,
    };
    
    await addLogEntry(animalId, newEntry);
  };

  const cycleSort = () => {
    if (sortOption === 'alpha-asc') setSortOption('alpha-desc');
    else if (sortOption === 'alpha-desc') setSortOption('custom');
    else setSortOption('alpha-asc');
  };

  return {
    animals: filteredAndSortedAnimals,
    isLoading,
    viewDate,
    setViewDate,
    activeCategory,
    setActiveCategory,
    sortOption,
    cycleSort,
    getTodayLog,
    handleQuickCheck,
    addLogEntry
  };
};
