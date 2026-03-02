import React from 'react';
import { Database, Info } from 'lucide-react';
import LegacyMigration from '@/src/components/LegacyMigration';

const SettingsMigration: React.FC = () => {
  return (
    <div className="max-w-6xl space-y-8 animate-in slide-in-from-right-4 duration-300 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-slate-200 pb-6">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <Database size={28} className="text-indigo-600" /> Legacy Data Migration
          </h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Import records from legacy KOA backup files
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-200 shadow-sm">
        <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-8">
          <Info className="text-indigo-600 shrink-0 mt-1" size={20} />
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-900">Migration Instructions</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Use this tool to migrate data from the legacy Kent Owl Academy management system. 
              The system will automatically map legacy fields such as <code className="bg-indigo-100 px-1 rounded text-indigo-700">hatch_date</code> to <code className="bg-indigo-100 px-1 rounded text-indigo-700">dob</code> and 
              <code className="bg-indigo-100 px-1 rounded text-indigo-700">weight</code> to <code className="bg-indigo-100 px-1 rounded text-indigo-700">weight_grams</code>.
              Records are imported in chunks to ensure system stability.
            </p>
          </div>
        </div>

        <LegacyMigration />
      </div>
    </div>
  );
};

export default SettingsMigration;
