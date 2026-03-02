import { v4 as uuidv4 } from 'uuid';
import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { Incident, IncidentSeverity, IncidentType } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

export const useIncidentData = () => {
  const { profile: currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<IncidentSeverity | 'ALL'>('ALL');

  const rawIncidents = useLiveQuery(async () => {
    try {
      return await db.incidents.toArray();
    } catch (e) {
      console.error("Dexie error in incidents:", e);
      return [];
    }
  }, []);

  const isLoading = rawIncidents === undefined;

  const sanitizedIncidents = useMemo(() => {
    if (!rawIncidents) return [];
    return rawIncidents.map(inc => ({
      ...inc,
      description: String(inc.description || ''),
      location: String(inc.location || 'Site Wide'),
      type: String(inc.type || IncidentType.OTHER) as IncidentType,
      severity: String(inc.severity || IncidentSeverity.MEDIUM) as IncidentSeverity,
      status: String(inc.status || 'Open'),
      date: inc.date instanceof Date ? inc.date : new Date(inc.date || Date.now()),
      time: String(inc.time || ''),
      reported_by: String(inc.reported_by || 'SYS'),
      created_at: inc.created_at instanceof Date ? inc.created_at : new Date(inc.created_at || Date.now())
    }));
  }, [rawIncidents]);

  const filteredIncidents = useMemo(() => {
    return sanitizedIncidents
      .filter(inc => {
        const matchesSearch = inc.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             inc.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = filterSeverity === 'ALL' || inc.severity === filterSeverity;
        return matchesSearch && matchesSeverity;
      })
      .sort((a, b) => {
          const dateComp = b.date.getTime() - a.date.getTime();
          if (dateComp !== 0) return dateComp;
          return b.created_at.getTime() - a.created_at.getTime();
      });
  }, [sanitizedIncidents, searchTerm, filterSeverity]);

  const addIncident = async (entry: Omit<Incident, 'id' | 'created_at' | 'updated_at' | 'last_modified_by'>) => {
    const newEntry: Incident = {
      ...entry,
      id: uuidv4(),
      created_at: new Date(),
      updated_at: new Date(),
      last_modified_by: currentUser?.id || 'SYS'
    };
    await db.incidents.add(newEntry);
  };

  const deleteIncident = async (id: string) => {
    await db.incidents.delete(id);
  };

  return {
    incidents: filteredIncidents,
    isLoading,
    searchTerm,
    setSearchTerm,
    filterSeverity,
    setFilterSeverity,
    addIncident,
    deleteIncident
  };
};
