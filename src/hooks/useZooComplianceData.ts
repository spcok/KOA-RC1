import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { LogType, OrganisationProfile, LogEntry } from '@/types';

export interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  status: 'compliant' | 'non-compliant' | 'pending' | 'n/a';
  lastChecked: string;
  category: string;
}

export const useZooComplianceData = () => {
  const orgProfile = useLiveQuery(async () => {
    try {
      const profiles = await db.organisation_profile.toArray();
      return profiles[0] || null;
    } catch (e) {
      console.error("Failed to fetch org profile", e);
      return null;
    }
  }) || null;

  const log_entries = useLiveQuery(async () => {
    try {
      const data = await db.log_entries.toArray();
      return data.map(l => ({
        ...l,
        value: String(l.value || ''),
        notes: String(l.notes || '')
      }));
    } catch (e) {
      console.error("Failed to fetch log entries", e);
      return [] as LogEntry[];
    }
  }) || [];

  const complianceData: ComplianceItem[] = useMemo(() => [
    // Section 1: Conservation, Education, and Research
    { id: '1.1', category: 'Conservation', title: 'Conservation Participation', description: 'Participation in research from which conservation benefits accrue to species of wild animals.', status: 'compliant', lastChecked: '2025-02-15' },
    { id: '1.2', category: 'Conservation', title: 'Education Strategy', description: 'Provision of information to the public about the species of wild animals and their natural habitats.', status: 'compliant', lastChecked: '2025-02-15' },
    { id: '1.3', category: 'Conservation', title: 'Species Information', description: 'Information about the species exhibited must be displayed.', status: 'compliant', lastChecked: '2025-02-15' },
    
    // Section 2: Animal Management
    { id: '2.1', category: 'Animal Welfare', title: 'Dietary Requirements', description: 'Animals must be provided with food and water which is suitable for their species.', status: 'compliant', lastChecked: '2025-02-20' },
    { id: '2.2', category: 'Animal Welfare', title: 'Veterinary Care', description: 'A programme of preventative and curative veterinary care and nutrition.', status: 'compliant', lastChecked: '2025-02-20' },
    { id: '2.3', category: 'Animal Welfare', title: 'Housing Standards', description: 'Accommodating animals under conditions which aim to satisfy their biological and conservation requirements.', status: 'pending', lastChecked: '2025-01-10' },
    
    // Section 3: Public Safety
    { id: '3.1', category: 'Public Safety', title: 'Escape Prevention', description: 'Preventing the escape of animals and measures to be taken in the event of any escape.', status: 'compliant', lastChecked: '2025-02-25' },
    { id: '3.2', category: 'Public Safety', title: 'Public Protection', description: 'Protecting the public from fire and other hazards.', status: 'compliant', lastChecked: '2025-02-25' },
    
    // Section 4: Records
    { id: '4.1', category: 'Records', title: 'Animal Records', description: 'Keeping up-to-date records of the zoo\'s collection.', status: 'compliant', lastChecked: '2025-02-28' },
    { id: '4.2', category: 'Records', title: 'Staff Training Records', description: 'Records of staff training and competency.', status: 'non-compliant', lastChecked: '2024-12-01' },
  ], []);

  const stats = useMemo(() => {
    const total = complianceData.length;
    const compliant = complianceData.filter(i => i.status === 'compliant').length;
    const pending = complianceData.filter(i => i.status === 'pending').length;
    const nonCompliant = complianceData.filter(i => i.status === 'non-compliant').length;
    
    const conservationLogs = (log_entries || []).filter(l => l.log_type === LogType.CONSERVATION);
    const educationLogs = (log_entries || []).filter(l => l.log_type === LogType.EDUCATION);
    
    // Check license expiry
    const isLicenseValid = orgProfile?.licence_expiry_date && new Date(orgProfile.licence_expiry_date) > new Date();
    const isInspectionValid = orgProfile?.next_inspection_date && new Date(orgProfile.next_inspection_date) > new Date();

    return {
      overallPercentage: Math.round((compliant / total) * 100),
      pendingCount: pending,
      criticalCount: nonCompliant + (isLicenseValid ? 0 : 1) + (isInspectionValid ? 0 : 1),
      conservationCount: conservationLogs.length,
      educationCount: educationLogs.length,
      conservationProgress: Math.min(100, (conservationLogs.length / 5) * 100), // Target 5
      educationProgress: Math.min(100, (educationLogs.length / 10) * 100), // Target 10
      isLicenseValid,
      isInspectionValid
    };
  }, [complianceData, log_entries, orgProfile]);

  const isLoading = !complianceData.length && !log_entries.length;

  return {
    orgProfile,
    complianceData,
    stats,
    isLoading
  };
};
