import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { TimeLogEntry, User, UserRole } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const useTimeSheetData = () => {
  const { profile: currentUser } = useAuthStore();
  const [filterUserId, setFilterUserId] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');

  const data = useLiveQuery(async () => {
    try {
      const [timeLogs, users] = await Promise.all([
        db.time_log_entries.toArray(),
        db.users.toArray()
      ]);
      return { timeLogs, users };
    } catch (e) {
      console.error("Dexie error in useTimeSheetData:", e);
      return { timeLogs: [], users: [] };
    }
  }, []);

  const isLoading = data === undefined;

  const sanitizedLogs = useMemo(() => {
    if (!data?.timeLogs) return [];
    return data.timeLogs.map(log => ({
      ...log,
      id: String(log.id || ''),
      userId: String(log.userId || ''),
      userName: String(log.userName || 'Unknown'),
      date: String(log.date || ''),
      startTime: Number(log.startTime || 0),
      endTime: log.endTime ? Number(log.endTime) : undefined,
      durationMinutes: log.durationMinutes ? Number(log.durationMinutes) : undefined,
      status: String(log.status || 'Active') as 'Active' | 'Completed'
    }));
  }, [data?.timeLogs]);

  const filteredLogs = useMemo(() => {
    return sanitizedLogs
      .filter(log => {
        const userMatch = filterUserId === 'ALL' || log.userId === filterUserId;
        const dateMatch = !filterDate || log.date === filterDate;
        return userMatch && dateMatch;
      })
      .sort((a, b) => b.startTime - a.startTime);
  }, [sanitizedLogs, filterUserId, filterDate]);

  const deleteTimeLog = async (id: string) => {
    await db.time_log_entries.delete(id);
  };

  const updateTimeLog = async (id: string, updates: Partial<TimeLogEntry>) => {
    await db.time_log_entries.update(id, updates);
  };

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  return {
    logs: filteredLogs,
    users: data?.users || [],
    isLoading,
    filterUserId,
    setFilterUserId,
    filterDate,
    setFilterDate,
    deleteTimeLog,
    updateTimeLog,
    isAdmin,
    currentUser
  };
};
