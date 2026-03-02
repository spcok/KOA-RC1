import { v4 as uuidv4 } from 'uuid';
import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { HolidayRequest, UserRole } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const useHolidayRegistryData = () => {
  const { profile: currentUser } = useAuthStore();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const data = useLiveQuery(async () => {
    try {
      const holidayRequests = await db.holiday_requests.toArray();
      return holidayRequests;
    } catch (e) {
      console.error("Dexie error in useHolidayRegistryData:", e);
      return [];
    }
  }, []);

  const isLoading = data === undefined;

  const canApprove = currentUser?.permissions?.holidayApprover || currentUser?.role === UserRole.ADMIN;

  const sanitizedRequests = useMemo(() => {
    if (!data) return [];
    return data.map(req => ({
      ...req,
      id: String(req.id || ''),
      user_id: String(req.user_id || ''),
      user_name: String(req.user_name || 'Unknown User'),
      start_date: String(req.start_date || ''),
      end_date: String(req.end_date || ''),
      notes: String(req.notes || ''),
      status: String(req.status || 'Pending') as 'Pending' | 'Approved' | 'Rejected',
      approved_by: String(req.approved_by || ''),
      timestamp: Number(req.timestamp || Date.now())
    }));
  }, [data]);

  const filteredRequests = useMemo(() => {
    let list = sanitizedRequests;

    // If not a manager/admin, only see own requests
    if (!canApprove) {
      list = list.filter(r => r.user_id === currentUser?.id);
    }

    // Filter by status
    if (filterStatus !== 'ALL') {
      list = list.filter(r => r.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      list = list.filter(r => 
        r.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [sanitizedRequests, canApprove, currentUser?.id, filterStatus, searchTerm]);

  const addHoliday = async (entry: Omit<HolidayRequest, 'id' | 'user_id' | 'user_name' | 'status' | 'timestamp'>) => {
    const newReq: HolidayRequest = {
      ...entry,
      id: uuidv4(),
      user_id: currentUser?.id || '',
      user_name: currentUser?.name || 'Unknown',
      status: 'Pending',
      timestamp: Date.now()
    };
    await db.holiday_requests.add(newReq);
  };

  const updateHoliday = async (id: string, updates: Partial<HolidayRequest>) => {
    await db.holiday_requests.update(id, updates);
  };

  const deleteHoliday = async (id: string) => {
    await db.holiday_requests.delete(id);
  };

  const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
    await updateHoliday(id, {
      status,
      approved_by: currentUser?.name || 'System'
    });
  };

  return {
    requests: filteredRequests,
    isLoading,
    canApprove,
    currentUser,
    filterStatus,
    setFilterStatus,
    searchTerm,
    setSearchTerm,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    handleStatusUpdate
  };
};
