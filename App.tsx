import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from './src/store/authStore';
import { AppProvider } from './src/context/AppContext';
import { syncAllTables } from './src/services/dataService';

// Import individual components
import Dashboard from './components/Dashboard';
import DailyLog from './components/DailyLog';
import Tasks from './components/Tasks';
import Health from './components/Health';
import Movements from './components/Movements';
import SiteMaintenance from './components/SiteMaintenance';
import Reports from './components/Reports';
import SettingsLayout from './src/features/settings/SettingsLayout';
import SettingsOrgProfile from './src/features/settings/pages/SettingsOrgProfile';
import SettingsAccessControl from './src/features/settings/pages/SettingsAccessControl';
import SettingsSystemHealth from './src/features/settings/pages/SettingsSystemHealth';
import SettingsStaffTraining from './src/features/settings/pages/SettingsStaffTraining';
import SettingsDirectory from './src/features/settings/pages/SettingsDirectory';
import SettingsOperationalLists from './src/features/settings/pages/SettingsOperationalLists';
import SettingsDocuments from './src/features/settings/pages/SettingsDocuments';
import SettingsDiagnostics from './src/features/settings/pages/SettingsDiagnostics';
import SettingsIntelligence from './src/features/settings/pages/SettingsIntelligence';
import SettingsMigration from './src/features/settings/pages/SettingsMigration';
import Incidents from './components/Incidents';
import FirstAid from './components/FirstAid';
import SafetyDrills from './components/SafetyDrills';
import TimeSheets from './components/TimeSheets';
import HolidayRegistry from './components/HolidayRegistry';
import MissingRecords from './components/MissingRecords';
import DailyRounds from './components/DailyRounds';
import FlightRecords from './components/FlightRecords';
import ZooCompliance from './components/ZooCompliance';
import HelpCenter from './components/HelpCenter';
import AnimalProfile from './components/AnimalProfile';

// Initialize the store outside the React tree to avoid lifecycle race conditions
useAuthStore.getState().initialize();

const ProfileMissingScreen = ({ onSignOut }: { onSignOut: () => void }) => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-100 gap-4">
    <Loader2 className="animate-spin text-amber-600" size={48} />
    <p className="font-black text-slate-400 uppercase tracking-[0.2em] text-xs">Profile Not Found</p>
    <p className="text-slate-500 text-center max-w-sm">
      Your user account exists, but we couldn't find a corresponding staff profile. 
      Please contact your administrator to have one created.
    </p>
    <button onClick={onSignOut} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all">
      Sign Out
    </button>
  </div>
);

const GlobalSpinner = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-100 gap-4">
    <Loader2 className="animate-spin text-emerald-600" size={48} />
    <p className="font-black text-slate-400 uppercase tracking-[0.2em] text-xs">Authorising Secure Environment...</p>
  </div>
);

function AppContent() {
  const { user, profile, isLoading, isInitialized, signOut } = useAuthStore();
  const [fontScale, setFontScale] = useState(100);
  const navigate = useNavigate();

  // State for Dashboard and DailyLog
  const [activeTab, setActiveTab] = useState('Owls');
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user && profile) {
      syncAllTables().catch(console.error);
    }
  }, [user, profile]);

  if (!isInitialized || isLoading) {
    return <GlobalSpinner />;
  }

  if (!user) return <LoginScreen />;
  if (user && !profile) return <ProfileMissingScreen onSignOut={signOut} />;

  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<Layout fontScale={fontScale} setFontScale={setFontScale} />}>
          <Route index element={<Dashboard onSelectAnimal={(animal: any) => navigate(`/animal/${animal.id}`)} activeTab={activeTab} setActiveTab={setActiveTab} viewDate={viewDate} setViewDate={setViewDate} />} />
          <Route path="animal/:id" element={<AnimalProfileWrapper onBack={() => navigate(-1)} />} />
          <Route path="daily-log" element={<DailyLog activeCategory={activeTab as any} setActiveCategory={setActiveTab as any} viewDate={viewDate} setViewDate={setViewDate} />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="medical" element={<Health />} />
          <Route path="movements" element={<Movements />} />
          <Route path="flight-records" element={<FlightRecords />} />
          <Route path="daily-rounds" element={<DailyRounds />} />
          <Route path="maintenance" element={<SiteMaintenance />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="first-aid" element={<FirstAid />} />
          <Route path="safety-drills" element={<SafetyDrills />} />
          <Route path="timesheets" element={<TimeSheets />} />
          <Route path="holidays" element={<HolidayRegistry />} />
          <Route path="compliance" element={<ZooCompliance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="missing-records" element={<MissingRecords />} />
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="org" replace />} />
            <Route path="org" element={<SettingsOrgProfile />} />
            <Route path="users" element={<SettingsAccessControl />} />
            <Route path="training" element={<SettingsStaffTraining />} />
            <Route path="directory" element={<SettingsDirectory />} />
            <Route path="lists" element={<SettingsOperationalLists />} />
            <Route path="documents" element={<SettingsDocuments />} />
            <Route path="diagnostics" element={<SettingsDiagnostics />} />
            <Route path="intelligence" element={<SettingsIntelligence />} />
            <Route path="migration" element={<SettingsMigration />} />
            <Route path="system" element={<SettingsSystemHealth />} />
            {/* Fallback for other tabs not yet extracted */}
            <Route path="*" element={<div className="p-8 text-slate-400 font-black uppercase tracking-widest">Module Extraction in Progress...</div>} />
          </Route>
          <Route path="help" element={<HelpCenter />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

const AnimalProfileWrapper = ({ onBack }: { onBack: () => void }) => {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <AnimalProfile animalId={id} onBack={onBack} />;
};

export default App;
