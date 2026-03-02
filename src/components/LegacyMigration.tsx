import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileJson, 
  Database, 
  ArrowRight,
  RefreshCw,
  X,
  Info
} from 'lucide-react';
import { useMigrationData } from '@/src/hooks/useMigrationData';
import { motion, AnimatePresence } from 'motion/react';

export const LegacyMigration: React.FC = () => {
  const { 
    stagedAnimals, 
    stagedLogs, 
    progress, 
    parseFile, 
    runImport, 
    reset 
  } = useMigrationData();
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      parseFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  const renderContent = () => {
    // Error State
    if (progress.status === 'error') {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center p-8 text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Migration Failed</h3>
          <p className="text-slate-500 mb-6 max-w-xs">{progress.error}</p>
          <button 
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-black transition-all"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </motion.div>
      );
    }

    // Completed State
    if (progress.status === 'completed') {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center p-8 text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="text-emerald-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Migration Successful</h3>
          <p className="text-slate-500 mb-6">
            Imported <span className="font-bold text-slate-900">{stagedAnimals.length}</span> animals and <span className="font-bold text-slate-900">{stagedLogs.length}</span> log entries.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={reset}
              className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Import Another
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              View Dashboard
            </button>
          </div>
        </motion.div>
      );
    }

    // Importing State
    if (progress.status === 'importing') {
      return (
        <div className="p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Database className="text-indigo-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Importing Records...</h3>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  {progress.current} of {progress.total} processed
                </p>
              </div>
            </div>
            <span className="text-2xl font-black text-indigo-600">{progress.percentage}%</span>
          </div>
          
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-6">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              className="h-full bg-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Animals</p>
              <p className="text-lg font-bold text-slate-900">{stagedAnimals.length}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Logs</p>
              <p className="text-lg font-bold text-slate-900">{stagedLogs.length}</p>
            </div>
          </div>
        </div>
      );
    }

    // Parsing/Staging State
    if (progress.status === 'parsing' || progress.status === 'staging') {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Analysing Data Structure</h3>
          <p className="text-slate-500">Mapping legacy fields and validating records...</p>
        </div>
      );
    }

    // Confirmation State
    if (stagedAnimals.length > 0) {
      return (
        <div className="p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">Ready to Import</h3>
              <p className="text-slate-500">We've successfully mapped the legacy backup file.</p>
            </div>
            <button 
              onClick={reset}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Database className="text-indigo-600" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">Legacy Backup Detected</p>
                <div className="flex gap-4 mt-1">
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">
                    {stagedAnimals.length} Animals
                  </span>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">
                    {stagedLogs.length} Logs
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
              <Info className="text-amber-600 shrink-0" size={20} />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Warning:</strong> This process will add these records to your local database. 
                Existing animals with the same ID will be updated. This action cannot be undone.
              </p>
            </div>
          </div>

          <button 
            onClick={runImport}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-sm hover:bg-black transition-all shadow-xl shadow-slate-200 group"
          >
            Start Migration Pipeline
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      );
    }

    // Initial Dropzone State
    return (
      <div 
        className={`p-12 border-2 border-dashed rounded-3xl transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer
          ${isDragging ? 'border-indigo-500 bg-indigo-50 scale-[0.98]' : 'border-slate-200 hover:border-slate-300 bg-white'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept=".json" 
          className="hidden" 
        />
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <UploadCloud className="text-slate-400" size={40} />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Legacy Data Migration</h3>
        <p className="text-slate-500 max-w-xs mb-8">
          Drop your <span className="font-bold text-slate-900">KOA_Backup.json</span> file here or click to browse.
        </p>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <FileJson size={12} />
          JSON Format Required
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        <AnimatePresence mode="wait">
          <motion.div
            key={progress.status + (stagedAnimals.length > 0 ? 'confirmed' : 'idle')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Institutional Data Pipeline v2.4
        </p>
      </div>
    </div>
  );
};

export default LegacyMigration;
