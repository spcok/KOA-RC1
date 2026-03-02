import { v4 as uuidv4 } from 'uuid';
import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { SiteLogEntry, TimeLogEntry, User } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const useSafetyDrillData = () => {
  const { profile: currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const data = useLiveQuery(async () => {
    try {
      const [siteLogs, timeLogs, users] = await Promise.all([
        db.site_log_entries.toArray(),
        db.time_log_entries.toArray(),
        db.users.toArray()
      ]);
      return { siteLogs, timeLogs, users };
    } catch (e) {
      console.error("Dexie error in useSafetyDrillData:", e);
      return { siteLogs: [], timeLogs: [], users: [] };
    }
  }, []);

  const isLoading = data === undefined;

  const sanitizedDrills = useMemo(() => {
    if (!data?.siteLogs) return [];
    return data.siteLogs
      .filter(l => l.title && l.title.includes('Drill'))
      .map(log => ({
        ...log,
        id: String(log.id || ''),
        date: String(log.date || ''),
        title: String(log.title || 'Drill'),
        location: String(log.location || 'Site Wide'),
        priority: String(log.priority || 'High'),
        status: String(log.status || 'Completed'),
        description: String(log.description || '{}'),
        loggedBy: String(log.loggedBy || 'SYS'),
        timestamp: Number(log.timestamp || Date.now())
      }));
  }, [data?.siteLogs]);

  const filteredDrills = useMemo(() => {
    return sanitizedDrills
      .filter(drill => {
        const matchesSearch = drill.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             drill.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'ALL' || drill.title.includes(filterType);
        return matchesSearch && matchesType;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [sanitizedDrills, searchTerm, filterType]);

  const getOnSitePersonnel = (drillDate: string, drillTime: string) => {
    if (!data?.timeLogs) return [];
    try {
      const drillTimestamp = new Date(`${drillDate}T${drillTime}`).getTime();
      if (isNaN(drillTimestamp)) return [];
      return data.timeLogs.filter(log => {
        const shiftDate = String(log.date);
        if (shiftDate !== drillDate) return false;
        const start = Number(log.startTime);
        const end = Number(log.endTime || Date.now());
        return drillTimestamp >= start && drillTimestamp <= end;
      });
    } catch (e) {
      return [];
    }
  };

  const addDrillLog = async (entry: Omit<SiteLogEntry, 'id' | 'loggedBy'>) => {
    const newEntry: SiteLogEntry = {
      ...entry,
      id: uuidv4(),
      loggedBy: currentUser?.initials || 'SYS'
    };
    await db.site_log_entries.add(newEntry);
  };

  const deleteDrillLog = async (id: string) => {
    await db.site_log_entries.delete(id);
  };

  return {
    drills: filteredDrills,
    timeLogs: data?.timeLogs || [],
    users: data?.users || [],
    isLoading,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    getOnSitePersonnel,
    addDrillLog,
    deleteDrillLog
  };
};
