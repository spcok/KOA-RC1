import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { Animal, AnimalCategory, LogType } from '@/types';

export const useMissingRecordData = () => {
  const [daysToCheck, setDaysToCheck] = useState<number>(7);
  const [selectedCategory, setSelectedCategory] = useState<AnimalCategory | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const data = useLiveQuery(async () => {
    try {
      const [animals, logEntries] = await Promise.all([
        db.animals.toArray(),
        db.log_entries.toArray()
      ]);
      return { animals, logEntries };
    } catch (e) {
      console.error("Dexie error in useMissingRecordData:", e);
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
      imageUrl: String(animal.imageUrl || ''),
      category: String(animal.category || AnimalCategory.OTHER) as AnimalCategory
    }));
  }, [data?.animals]);

  const missingRecordsAnalysis = useMemo(() => {
    if (!data?.logEntries) return [];

    const dates: string[] = [];
    const today = new Date();
    
    for (let i = 0; i < daysToCheck; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dates.unshift(d.toISOString().split('T')[0]);
    }

    const filtered = selectedCategory === 'ALL' 
        ? sanitizedAnimals 
        : sanitizedAnimals.filter(a => a.category === selectedCategory);

    const searched = filtered.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.species.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return searched.map(animal => {
        let missingCount = 0;
        let weightCount = 0;
        let feedCount = 0;
        const logs = data.logEntries.filter(l => l.animal_id === animal.id);
        
        const timeline = dates.map(date => {
            const hasWeight = logs.some(l => l.type === LogType.WEIGHT && String(l.date).startsWith(date));
            const hasFeed = logs.some(l => l.type === LogType.FEED && String(l.date).startsWith(date));
            const hasAny = logs.some(l => String(l.date).startsWith(date));

            if (hasWeight) weightCount++;
            if (hasFeed) feedCount++;
            if (!hasAny) missingCount++;

            return { date, present: hasAny };
        });

        const completionRate = Math.round(((daysToCheck - missingCount) / daysToCheck) * 100);
        const missingDates = timeline.filter(t => !t.present).map(t => t.date);

        return {
            animal,
            timeline,
            missingCount,
            weightCount,
            feedCount,
            completionRate,
            missingDates
        };
    }).sort((a, b) => b.missingCount - a.missingCount);

  }, [data?.logEntries, sanitizedAnimals, daysToCheck, selectedCategory, searchTerm]);

  const totalMissingDays = useMemo(() => {
      return missingRecordsAnalysis.reduce((acc, curr) => acc + curr.missingCount, 0);
  }, [missingRecordsAnalysis]);

  return {
    analysis: missingRecordsAnalysis,
    totalMissingDays,
    isLoading,
    daysToCheck,
    setDaysToCheck,
    selectedCategory,
    setSelectedCategory,
    searchTerm,
    setSearchTerm
  };
};
