import { v4 as uuidv4 } from 'uuid';
import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { FirstAidLogEntry } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const useFirstAidData = () => {
  const { profile: currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');

  const rawLogs = useLiveQuery(async () => {
    try {
      return await db.first_aid_log_entries.toArray();
    } catch (e) {
      console.error("Dexie error in firstAidLogs:", e);
      return [];
    }
  }, []);

  const isLoading = rawLogs === undefined;

  const sanitizedLogs = useMemo(() => {
    if (!rawLogs) return [];
    return rawLogs.map(log => ({
      ...log,
      personName: String(log.personName || 'Unknown'),
      location: String(log.location || 'Unknown'),
      description: String(log.description || ''),
      treatment: String(log.treatment || ''),
      time: String(log.time || ''),
      date: String(log.date || ''),
      outcome: String(log.outcome || 'None') as FirstAidLogEntry['outcome'],
      type: String(log.type || 'Injury') as 'Injury' | 'Illness' | 'Near Miss'
    }));
  }, [rawLogs]);

  const filteredLogs = useMemo(() => {
    return sanitizedLogs
      .filter(log => 
        log.personName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const dateComp = b.date.localeCompare(a.date);
        if (dateComp !== 0) return dateComp;
        return (b.timestamp || 0) - (a.timestamp || 0);
      });
  }, [sanitizedLogs, searchTerm]);

  const addFirstAid = async (entry: Omit<FirstAidLogEntry, 'id' | 'timestamp' | 'treatedBy'>) => {
    const newEntry: FirstAidLogEntry = {
      ...entry,
      id: uuidv4(),
      timestamp: Date.now(),
      treatedBy: currentUser?.name || 'SYS'
    };
    await db.first_aid_log_entries.add(newEntry);
  };

  const deleteFirstAid = async (id: string) => {
    await db.first_aid_log_entries.delete(id);
  };

  return {
    logs: filteredLogs,
    isLoading,
    searchTerm,
    setSearchTerm,
    addFirstAid,
    deleteFirstAid
  };
};
