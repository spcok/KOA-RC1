import { v4 as uuidv4 } from 'uuid';
import { db } from '@/src/db';
import { LocalBackupEntry } from '@/types';
import { dataService } from './dataService';

export const backupService = {
  generateFullBackup: async () => {
    const [
      animals, tasks, users, siteLogs, incidents, 
      firstAidLogs, contacts, orgProfile, logEntries
    ] = await Promise.all([
      db.animals.toArray(),
      db.tasks.toArray(),
      db.users.toArray(),
      db.site_log_entries.toArray(),
      db.incidents.toArray(),
      db.first_aid_log_entries.toArray(),
      db.contacts.toArray(),
      db.organisation_profiles.toArray(),
      db.log_entries.toArray()
    ]);

    return {
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      data: {
        animals, tasks, users, siteLogs, incidents,
        firstAidLogs, contacts, orgProfile, logEntries
      }
    };
  },

  exportDatabase: async () => {
    const backup = await backupService.generateFullBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KOA_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  importDatabase: async (jsonString: string) => {
    try {
      const backup = JSON.parse(jsonString);
      if (!backup.data) throw new Error('Invalid backup format');

      const d = backup.data;

      // Batch updates
      const promises = [];
      if (d.animals && d.animals.length > 0) promises.push(dataService.bulkCreateRecords('animals', db.animals, d.animals));
      if (d.tasks && d.tasks.length > 0) promises.push(dataService.bulkCreateRecords('tasks', db.tasks, d.tasks));
      if (d.users && d.users.length > 0) promises.push(dataService.bulkCreateRecords('users', db.users, d.users));
      if (d.siteLogs && d.siteLogs.length > 0) promises.push(dataService.bulkCreateRecords('site_log_entries', db.site_log_entries, d.siteLogs));
      if (d.incidents && d.incidents.length > 0) promises.push(dataService.bulkCreateRecords('incidents', db.incidents, d.incidents));
      if (d.firstAidLogs && d.firstAidLogs.length > 0) promises.push(dataService.bulkCreateRecords('first_aid_log_entries', db.first_aid_log_entries, d.firstAidLogs));
      if (d.contacts && d.contacts.length > 0) promises.push(dataService.bulkCreateRecords('contacts', db.contacts, d.contacts));
      if (d.orgProfile && d.orgProfile.length > 0) promises.push(dataService.bulkCreateRecords('organisation_profiles', db.organisation_profiles, d.orgProfile));
      if (d.logEntries && d.logEntries.length > 0) promises.push(dataService.bulkCreateRecords('log_entries', db.log_entries, d.logEntries));

      await Promise.all(promises);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  // --- INTERNAL RESTORE POINTS ---
  
  createLocalSnapshot: async (): Promise<LocalBackupEntry | null> => {
    try {
      const fullData = await backupService.generateFullBackup();
      const jsonString = JSON.stringify(fullData);
      
      const snapshot: LocalBackupEntry = {
        id: uuidv4(),
        created_at: new Date(),
        created_by: 'system',
        updated_at: new Date(),
        last_modified_by: 'system',
        backup_date: new Date(),
        size_bytes: jsonString.length,
        file_path: 'local'
      };

      // We don't have a local backup table in db.ts yet, so we just return the snapshot object
      // If needed, we can add it to db.ts
      return snapshot;
    } catch (e) {
      console.error("Snapshot creation failed", e);
      return null;
    }
  },

  restoreFromSnapshot: async (snapshot: LocalBackupEntry): Promise<boolean> => {
    // In a real implementation, we'd read the snapshot data from storage
    // For now, this is just a stub
    return false;
  }
};