import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { Animal, AnimalCategory, LogType, LogEntry, Task } from '@/types';
import { useAppData } from '@/src/context/AppContext';

export interface AnimalData {
  todayWeight?: LogEntry;
  latestWeight?: LogEntry;
  todayFeed?: LogEntry;
  previousWeight?: LogEntry;
}

export interface AnimalStats {
  total: number;
  weighed: number;
  fed: number;
  animalData: Map<string, AnimalData>;
}

export interface TaskStats {
  pendingTasks: Task[];
  pendingHealth: Task[];
}

export const useDashboardData = (activeTab: AnimalCategory, viewDate: string) => {
  const { updateAnimal } = useAppData();

  const [sortOption, setSortOption] = useState<'alpha-asc' | 'alpha-desc' | 'custom'>('alpha-asc');
  const [isOrderLocked, setIsOrderLocked] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleOrderLock = (val: boolean) => setIsOrderLocked(val);

  const rawAnimals = useLiveQuery(async () => {
    try {
      if (!activeTab) return [];
      return await db.animals.where('category').equals(activeTab).filter(a => !a.archived).toArray();
    } catch (e) {
      console.error("Dexie error in rawAnimals:", e);
      return [];
    }
  }, [activeTab]);

  const rawTasks = useLiveQuery(async () => {
    try {
      // Use filter instead of where for boolean field to avoid IDBKeyRange issues in some environments
      // and ensure the query doesn't fail if the index is picky about boolean keys.
      return await db.tasks.filter(t => t.completed === false).toArray();
    } catch (e) {
      console.error("Dexie error in rawTasks:", e);
      return [];
    }
  }, []);

  const isLoading = rawAnimals === undefined || rawTasks === undefined;

  const animals = rawAnimals || [];
  const tasks = rawTasks || [];

  const reorderAnimals = async (newOrder: Animal[]) => {
      try {
          const updates = newOrder.map((animal, index) => 
              updateAnimal({ ...animal, display_order: index })
          );
          await Promise.all(updates);
      } catch (error) {
          console.error("Failed to reorder animals:", error);
      }
  };

  const animalStats = useLiveQuery(async () => {
      try {
          if (!rawAnimals) return undefined;
          const safeAnimals = rawAnimals;
          const total = safeAnimals.length;
          let weighed = 0;
          let fed = 0;
          
          const animalData = new Map<string, AnimalData>();

          const start = new Date(viewDate);
          const end = new Date(viewDate);
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
              return { total, weighed, fed, animalData };
          }
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);

          const todayLogs = await db.log_entries.where('log_date').between(start, end).toArray();

          for (const animal of safeAnimals) {
              if (!animal.id) continue; // Safety valve for missing ID

              const animalTodayLogs = (todayLogs || []).filter(l => l.animal_id === animal.id);
              const todayWeight = animalTodayLogs.find(l => l.log_type === LogType.WEIGHT);
              const todayFeed = animalTodayLogs.find(l => l.log_type === LogType.FEED);
              
              if (todayWeight) weighed++;
              if (todayFeed) fed++;

              const previousWeights = await db.log_entries
                .where('animal_id').equals(animal.id)
                .filter(l => l.log_type === LogType.WEIGHT && l.log_date < start)
                .sortBy('log_date');
                
              const previousWeight = (previousWeights || []).length > 0 ? previousWeights[previousWeights.length - 1] : undefined;
              const latestWeight = todayWeight || previousWeight;

              // Sanitize log values
              const sanitizeLog = (log?: LogEntry) => {
                if (!log) return undefined;
                return {
                  ...log,
                  value: typeof log.value === 'string' ? log.value : String(log.value || '')
                };
              };

              animalData.set(animal.id, { 
                  todayWeight: sanitizeLog(todayWeight), 
                  latestWeight: sanitizeLog(latestWeight), 
                  todayFeed: sanitizeLog(todayFeed), 
                  previousWeight: sanitizeLog(previousWeight)
              });
          }

          return { total, weighed, fed, animalData };
      } catch (err) {
          console.error("Dexie query error in animalStats:", err);
          return { total: rawAnimals?.length || 0, weighed: 0, fed: 0, animalData: new Map<string, AnimalData>() };
      }
  }, [rawAnimals, viewDate]) || { total: animals.length, weighed: 0, fed: 0, animalData: new Map<string, AnimalData>() };

  const taskStats = useMemo(() => {
    const safeTasks = tasks.map(t => ({
      ...t,
      title: typeof t.title === 'string' ? t.title : 'Task'
    }));
    return {
      pendingTasks: safeTasks.filter((t: Task) => !t.completed && t.task_type !== LogType.HEALTH),
      pendingHealth: safeTasks.filter((t: Task) => !t.completed && t.task_type === LogType.HEALTH)
    };
  }, [tasks]);

  const filteredAnimals = useMemo(() => {
    let result = animals
      .map(a => ({
        ...a,
        name: typeof a.name === 'string' ? a.name : 'Unknown',
        species: typeof a.species === 'string' ? a.species : 'Unknown',
        latin_name: typeof a.latin_name === 'string' ? a.latin_name : '',
        location: typeof a.location === 'string' ? a.location : 'Unknown'
      }))
      .filter((a: Animal) => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (sortOption === 'alpha-asc') result.sort((a: Animal, b: Animal) => a.name.localeCompare(b.name));
    else if (sortOption === 'alpha-desc') result.sort((a: Animal, b: Animal) => b.name.localeCompare(a.name));
    else if (sortOption === 'custom') result.sort((a: Animal, b: Animal) => (a.display_order ?? 0) - (b.display_order ?? 0));
    
    return result;
  }, [animals, searchTerm, sortOption]);

  const cycleSort = () => {
      if (sortOption === 'alpha-asc') setSortOption('alpha-desc');
      else if (sortOption === 'alpha-desc') setSortOption('custom');
      else setSortOption('alpha-asc');
  };

  return {
    animals,
    filteredAnimals,
    animalStats,
    taskStats,
    isLoading,
    searchTerm,
    setSearchTerm,
    sortOption,
    setSortOption,
    isOrderLocked,
    toggleOrderLock,
    reorderAnimals,
    cycleSort
  };
};
