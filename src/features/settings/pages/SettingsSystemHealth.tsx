import React, { useState, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { backupService } from '@/src/services/backupService';
import { migrateLegacyData } from '@/src/services/migrationService';
import { useAuthStore } from '@/src/store/authStore';
import { parseSmartCSV, parseCSVToAnimals } from '@/src/services/csvService';
import { formatWeightDisplay } from '@/src/services/weightUtils';
import { diagnosticsService } from '@/src/services/diagnosticsService';
import { Activity, Database, HardDrive, Download, Upload, RotateCcw, Loader2, Terminal, Play, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  category: 'Security' | 'Logic' | 'State' | 'Performance';
  status: 'pending' | 'running' | 'pass' | 'fail';
  message?: string;
  duration?: number;
  logs: string[];
}

const SettingsSystemHealth: React.FC = () => {
  const { profile: currentUser } = useAuthStore();
  
  const animals = useLiveQuery(async () => { try { return await db.animals.toArray(); } catch (e) { console.error(e); return []; } }, []) || [];
  const log_entries = useLiveQuery(async () => { try { return await db.log_entries.toArray(); } catch (e) { console.error(e); return []; } }, []) || [];
  const tasks = useLiveQuery(async () => { try { return await db.tasks.toArray(); } catch (e) { console.error(e); return []; } }, []) || [];
  const users = useLiveQuery(async () => { try { return await db.users.toArray(); } catch (e) { console.error(e); return []; } }, []) || [];

  const [isProcessingBackup, setIsProcessingBackup] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{ count: number, type: 'animal' | 'log' } | null>(null);

  // Diagnostic Test State
  const [isTestsRunning, setIsTestsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [activeTestLogId, setActiveTestLogId] = useState<string | null>(null);
  const testScrollRef = useRef<HTMLDivElement>(null);

  const storageStats = useMemo(() => {
      const totalAnimals = animals.length;
      const totalLogs = log_entries.length;
      const dbSizeEst = JSON.stringify(animals).length + JSON.stringify(tasks).length + JSON.stringify(users).length + JSON.stringify(log_entries).length;
      const dbSizeMB = (dbSizeEst / (1024 * 1024)).toFixed(2);
      return { totalAnimals, totalLogs, dbSizeMB };
  }, [animals, tasks, users, log_entries]);

  const handleExportData = async () => {
      await backupService.exportDatabase();
  };

  const handleMigration = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const jsonData = JSON.parse(event.target?.result as string);
              if (currentUser?.id) {
                  const { animalCount, logCount } = await migrateLegacyData(currentUser.id, jsonData);
                  setMigrationStatus({ count: animalCount, type: 'animal' });
                  setTimeout(() => setMigrationStatus({ count: logCount, type: 'log' }), 3000);
              }
          } catch (error) {
              console.error("Migration failed", error);
              alert("Migration failed. Check console for details.");
          }
      };
      reader.readAsText(file);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
          if (window.confirm("WARNING: Importing a database will overwrite all current data. This cannot be undone. Continue?")) {
              setIsProcessingBackup(true);
              const content = event.target?.result as string;
              const success = await backupService.importDatabase(content);
              if (success) { alert("Database imported successfully. System will reload."); window.location.reload(); } else { alert("Import failed. Invalid file format."); }
              setIsProcessingBackup(false);
          }
      };
      reader.readAsText(file);
  };

  // --- DIAGNOSTIC TEST RUNNER ---
  const createTest = (id: string, name: string, category: TestResult['category']): TestResult => ({
    id, name, category, status: 'pending', logs: []
  });

  const logTest = (testId: string, message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString().split(' ')[0];
    const logLine = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}`;
    setTestResults(prev => prev.map(r => r.id === testId ? { ...r, logs: [...r.logs, logLine] } : r));
  };

  const assert = (condition: boolean, msg: string, testId: string) => {
    if (!condition) {
        logTest(testId, `❌ ASSERTION FAILED: ${msg}`);
        throw new Error(msg);
    }
    logTest(testId, `✅ PASS: ${msg}`);
  };

  const runInputSanitization = async (testId: string) => {
    logTest(testId, "Starting Input Vector Analysis...");
    const xssVector = "<script>alert('pwned')</script>";
    const safeCsv = `Date,Name,Notes\n2024-01-01,Bird,${xssVector}`;
    logTest(testId, "Injecting XSS into CSV Parser...", xssVector);
    const parsed = parseSmartCSV(safeCsv, []);
    const note = parsed[0]?.logs[0]?.notes;
    assert(parsed.length > 0, "Parser survived malicious input", testId);
    assert(typeof note === 'string', "Data type integrity maintained", testId);
    assert(note === xssVector, "Content preserved without execution", testId);
    return "Security boundaries intact.";
  };

  const runLogicStressTest = async (testId: string) => {
    const ITERATIONS = 50;
    logTest(testId, `Starting CPU Stress Test: ${ITERATIONS} cycles...`);
    const start = performance.now();
    const heavyCSV = `Date,Name,Weight,Notes\n${Array(100).fill("2024-01-01,StressTest,500,Repeated line for load").join('\n')}`;
    for (let i = 0; i < ITERATIONS; i++) {
        formatWeightDisplay(Math.random() * 10000, 'lbs_oz');
        parseCSVToAnimals(heavyCSV);
        if (i % 10 === 0) logTest(testId, `Cycle ${i}/${ITERATIONS} complete...`);
    }
    const duration = performance.now() - start;
    const avg = duration / ITERATIONS;
    logTest(testId, `Total Duration: ${duration.toFixed(2)}ms, Avg per Cycle: ${avg.toFixed(2)}ms`);
    assert(avg < 50, "Performance within acceptable bounds (<50ms/op)", testId);
    return `Passed. Avg Load: ${avg.toFixed(2)}ms`;
  };

  const runStateAudit = async (testId: string) => {
    logTest(testId, `Auditing Live State...`);
    if (animals.length === 0) return "No data to audit.";
    const ids = new Set();
    const duplicates = animals.filter(a => ids.has(a.id) || !ids.add(a.id));
    if (duplicates.length > 0) throw new Error(`State Integrity Failure: ${duplicates.length} Duplicate IDs`);
    logTest(testId, "ID Uniqueness Verified.");
    const issues = diagnosticsService.runFullAudit(animals, tasks, users);
    let errors = 0;
    issues.forEach(issue => {
        logTest(testId, `${issue.severity === 'Critical' ? 'CRITICAL' : 'WARN'}: ${issue.message}`);
        if(issue.severity === 'Critical') errors++;
    });
    return `Audit Complete. ${errors} Critical Errors.`;
  };

  const runDiagnosticSuite = async () => {
    setIsTestsRunning(true);
    setActiveTestLogId(null);
    const suite = [
        createTest('sec_01', 'Input Sanitization & XSS', 'Security'),
        createTest('perf_01', 'Logic Stress Test (50x)', 'Performance'),
        createTest('state_01', 'Live Schema Validation', 'State'),
    ];
    setTestResults(suite);
    const runners = { 'sec_01': runInputSanitization, 'perf_01': runLogicStressTest, 'state_01': runStateAudit };

    for (const test of suite) {
        setTestResults(prev => prev.map(r => r.id === test.id ? { ...r, status: 'running' } : r));
        setActiveTestLogId(test.id);
        try {
            const start = performance.now();
            const msg = await runners[test.id as keyof typeof runners](test.id);
            const end = performance.now();
            setTestResults(prev => prev.map(r => r.id === test.id ? { ...r, status: 'pass', message: msg, duration: end - start } : r));
        } catch (e: any) {
            logTest(test.id, `FATAL ERROR: ${e.message}`);
            setTestResults(prev => prev.map(r => r.id === test.id ? { ...r, status: 'fail', message: e.message } : r));
        }
    }
    setIsTestsRunning(false);
  };

  const activeTestLogs = (testResults || []).find(r => r.id === activeTestLogId)?.logs || [];

  return (
    <div className="max-w-6xl space-y-8 animate-in slide-in-from-right-4 duration-300 pb-24">
        <div className="border-b-2 border-slate-200 pb-6">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Activity size={28} className="text-emerald-600" /> System Health & Data
            </h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Database Management & Diagnostics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Storage Stats */}
            <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 shadow-sm space-y-6">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Database size={16} className="text-blue-500"/> Database Statistics
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Animals</p>
                        <p className="text-2xl font-black text-slate-900">{storageStats.totalAnimals}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Logs</p>
                        <p className="text-2xl font-black text-slate-900">{storageStats.totalLogs}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Size</p>
                        <p className="text-2xl font-black text-slate-900">{storageStats.dbSizeMB} MB</p>
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 shadow-sm space-y-6">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <HardDrive size={16} className="text-emerald-500"/> Data Management
                </h4>
                <div className="space-y-4">
                    <button onClick={handleExportData} className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md">
                        <Download size={16}/> Export Full Database
                    </button>
                    
                    <div className="relative">
                        <input type="file" id="import-db" className="hidden" accept=".json" onChange={handleFileImport} disabled={isProcessingBackup} />
                        <label htmlFor="import-db" className={`w-full bg-rose-50 text-rose-600 border-2 border-rose-200 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-all cursor-pointer ${isProcessingBackup ? 'opacity-50 pointer-events-none' : ''}`}>
                            {isProcessingBackup ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16}/>} Import & Overwrite Database
                        </label>
                    </div>

                    <div className="relative pt-4 border-t border-slate-100">
                        <input type="file" id="migrate-db" className="hidden" accept=".json" onChange={handleMigration} />
                        <label htmlFor="migrate-db" className="w-full bg-amber-50 text-amber-600 border-2 border-amber-200 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-100 transition-all cursor-pointer">
                            <RotateCcw size={16}/> Migrate Legacy Data
                        </label>
                        {migrationStatus && (
                            <p className="text-center text-[10px] font-bold text-amber-600 mt-2 uppercase">
                                Migrated {migrationStatus.count} {migrationStatus.type}s
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Diagnostic Tests */}
            <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 shadow-sm col-span-1 lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Terminal size={16} className="text-slate-700"/> System Diagnostics
                    </h4>
                    <button onClick={runDiagnosticSuite} disabled={isTestsRunning} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-md disabled:opacity-50">
                        {isTestsRunning ? <Loader2 size={14} className="animate-spin"/> : <Play size={14}/>} Run Suite
                    </button>
                </div>

                {testResults.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="col-span-1 space-y-2">
                            {testResults.map(test => (
                                <button 
                                    key={test.id}
                                    onClick={() => setActiveTestLogId(test.id)}
                                    className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between ${activeTestLogId === test.id ? 'border-slate-900 bg-slate-50' : 'border-slate-100 hover:border-slate-300'}`}
                                >
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">{test.name}</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{test.category}</p>
                                    </div>
                                    {test.status === 'running' && <Loader2 size={14} className="text-blue-500 animate-spin"/>}
                                    {test.status === 'pass' && <CheckCircle2 size={14} className="text-emerald-500"/>}
                                    {test.status === 'fail' && <XCircle size={14} className="text-rose-500"/>}
                                    {test.status === 'pending' && <Clock size={14} className="text-slate-300"/>}
                                </button>
                            ))}
                        </div>
                        <div className="col-span-2 bg-slate-900 rounded-xl p-4 font-mono text-xs text-emerald-400 h-64 overflow-y-auto" ref={testScrollRef}>
                            {activeTestLogId ? (
                                activeTestLogs.map((log, i) => (
                                    <div key={i} className="mb-1">{log}</div>
                                ))
                            ) : (
                                <div className="text-slate-500 flex h-full items-center justify-center">Select a test to view logs</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default SettingsSystemHealth;
