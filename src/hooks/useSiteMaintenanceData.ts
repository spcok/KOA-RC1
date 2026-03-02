import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { SiteLogEntry } from '@/types';
import { useAuthStore } from '@/src/store/authStore';
import { useAppData } from '@/src/context/AppContext';
import { useState, useMemo } from 'react';

export const useSiteMaintenanceData = () => {
    const { profile: currentUser } = useAuthStore();
    const { addSiteLog, updateSiteLog, deleteSiteLog } = useAppData();
    
    const [filterStatus, setFilterStatus] = useState<'ALL' | SiteLogEntry['status']>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const siteLogs = useLiveQuery(async () => {
        try {
            const data = await db.site_log_entries.toArray();
            return data.map(l => ({
                ...l,
                title: String(l.title || 'Untitled'),
                description: String(l.description || ''),
                location: String(l.location || 'Unknown'),
                priority: String(l.priority || 'Medium') as SiteLogEntry['priority'],
                status: String(l.status || 'Pending') as SiteLogEntry['status']
            }));
        } catch (e) {
            console.error('Dexie error in useSiteMaintenanceData (siteLogs):', e);
            return [];
        }
    }, []);

    const isLoading = siteLogs === undefined;

    const filteredLogs = useMemo(() => {
        if (!siteLogs) return [];
        
        let result = [...siteLogs];
        
        if (filterStatus !== 'ALL') {
            result = result.filter(l => l.status === filterStatus);
        }

        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            result = result.filter(l => 
                l.title.toLowerCase().includes(s) ||
                l.description.toLowerCase().includes(s) ||
                l.location.toLowerCase().includes(s)
            );
        }

        // Sort by date descending (newest first)
        return result.sort((a, b) => {
            return new Date(b.log_date).getTime() - new Date(a.log_date).getTime();
        });
    }, [siteLogs, filterStatus, searchTerm]);

    const addLog = async (log: Omit<SiteLogEntry, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by'>) => {
        await addSiteLog(log);
    };

    const updateLog = async (log: SiteLogEntry) => {
        await updateSiteLog(log);
    };

    const deleteLog = async (id: string) => {
        await deleteSiteLog(id);
    };

    return {
        filteredLogs,
        isLoading,
        filterStatus,
        setFilterStatus,
        searchTerm,
        setSearchTerm,
        addLog,
        updateLog,
        deleteLog,
        currentUser
    };
};
