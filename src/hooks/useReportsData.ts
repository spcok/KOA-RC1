import { useState, useMemo, useTransition } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { 
    Animal, LogType, Incident, SiteLogEntry, TimeLogEntry, 
    OrganisationProfile, User, AnimalCategory, LogEntry 
} from '@/types';
import { DocumentService } from '@/src/services/DocumentService';
import { formatWeightDisplay } from '@/src/services/weightUtils';
import { REPORT_SCHEMAS } from '@/components/reports/reportConfig';
import { useAuthStore } from '@/src/store/authStore';

export const useReportsData = () => {
    const { profile: currentUser } = useAuthStore();
    const [isPending, startTransition] = useTransition();

    // Filters
    const [selectedSchemaId, setSelectedSchemaId] = useState<string>('DAILY_LOG');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCategory, setSelectedCategory] = useState<AnimalCategory | 'ALL'>('ALL');
    const [selectedAnimalId, setSelectedAnimalId] = useState<string>('ALL');

    // Data Fetching with Sanitization
    const animals = useLiveQuery(async () => {
        try {
            const data = await db.animals.toArray();
            return data.map(a => ({
                ...a,
                name: String(a.name || 'Unknown'),
                species: String(a.species || 'Unknown'),
                category: String(a.category || 'General') as AnimalCategory,
                ring_number: String(a.ring_number || ''),
                microchip_id: String(a.microchip_id || '')
            }));
        } catch (e) {
            console.error("Failed to fetch animals", e);
            return [] as Animal[];
        }
    }) || [];

    const log_entries = useLiveQuery(async () => {
        try {
            const data = await db.log_entries.toArray();
            return data.map(l => ({
                ...l,
                value: String(l.value || ''),
                notes: String(l.notes || ''),
                user_initials: String(l.user_initials || 'SYS')
            }));
        } catch (e) {
            console.error("Failed to fetch log entries", e);
            return [] as LogEntry[];
        }
    }) || [];

    const incidents = useLiveQuery(async () => {
        try {
            const data = await db.incidents.toArray();
            return data.map(i => ({
                ...i,
                description: String(i.description || ''),
                location: String(i.location || 'Unknown'),
                reported_by_user_id: String(i.reported_by_user_id || 'SYS')
            }));
        } catch (e) {
            console.error("Failed to fetch incidents", e);
            return [] as Incident[];
        }
    }) || [];

    const siteLogs = useLiveQuery(async () => {
        try {
            const data = await db.site_logs.toArray();
            return data.map(s => ({
                ...s,
                title: String(s.title || ''),
                description: String(s.description || ''),
                location: String(s.location || 'Unknown')
            }));
        } catch (e) {
            console.error("Failed to fetch site logs", e);
            return [] as SiteLogEntry[];
        }
    }) || [];

    const orgProfile = useLiveQuery(async () => {
        try {
            const profiles = await db.organisation_profile.toArray();
            return profiles[0] || null;
        } catch (e) {
            console.error("Failed to fetch org profile", e);
            return null;
        }
    }) || null;

    const users = useLiveQuery(async () => {
        try {
            return await db.users.toArray();
        } catch (e) {
            console.error("Failed to fetch users", e);
            return [] as User[];
        }
    }) || [];

    const isLoading = !animals.length && !log_entries.length && !incidents.length;

    const currentSchema = REPORT_SCHEMAS[selectedSchemaId];

    const getFormattedDateRange = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
        if (startDate === endDate) return fmt(start);
        return `${fmt(start)} - ${fmt(end)}`;
    };

    const inDateRange = (date: Date | string) => {
        if (!date) return false;
        const d = typeof date === 'string' ? date : date.toISOString().split('T')[0];
        return d >= startDate && d <= endDate;
    };

    const reportColumns = useMemo(() => {
        if (selectedSchemaId === 'WEIGHTS') {
            const cols = [{ label: 'Subject', width: '16%', accessor: 'subject' }];
            const [y, m, d] = endDate.split('-').map(Number);
            const end = new Date(y, m - 1, d);
            for (let i = 6; i >= 0; i--) {
                const date = new Date(end);
                date.setDate(end.getDate() - i);
                const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });
                const dayPart = String(date.getDate()).padStart(2, '0');
                const monthPart = String(date.getMonth() + 1).padStart(2, '0');
                const yearPart = date.getFullYear();
                cols.push({ label: `${dayName} ${dayPart}/${monthPart}`, width: '12%', accessor: `${yearPart}-${monthPart}-${dayPart}` });
            }
            return cols;
        }
        return currentSchema.columns;
    }, [selectedSchemaId, endDate, currentSchema]);

    const tableData = useMemo(() => {
        let rows: any[] = [];
        const matchesFilters = (animal: Animal) => {
            if (selectedCategory !== 'ALL' && animal.category !== selectedCategory) return false;
            if (selectedAnimalId !== 'ALL' && animal.id !== selectedAnimalId) return false;
            return true;
        };
        const filteredAnimals = animals.filter(matchesFilters);

        if (selectedSchemaId === 'DAILY_LOG') {
            rows = filteredAnimals.flatMap(animal => 
                log_entries.filter(l => l.animal_id === animal.id && inDateRange(l.log_date)).map(l => ({
                    subject: animal.name,
                    time: new Date(l.log_date).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'}),
                    weight: l.log_type === LogType.WEIGHT ? (l.weight_in_grams ? formatWeightDisplay(l.weight_in_grams, animal.weight_unit) : l.value) : '-',
                    feed: l.log_type === LogType.FEED ? l.value : '-',
                    value: l.log_type === LogType.WEIGHT || l.log_type === LogType.FEED ? (l.notes || '-') : `${l.log_type}: ${l.value} ${l.notes ? `(${l.notes})` : ''}`,
                    initials: l.user_initials
                }))
            );
        } 
        else if (selectedSchemaId === 'CENSUS') {
            const censusMap = new Map<string, { species: string, latin: string, male: number, female: number, unknown: number, total: number }>();
            filteredAnimals.forEach(a => {
                if (a.is_archived) return;
                const key = a.species;
                const current = censusMap.get(key) || { species: a.species, latin: a.latin_name || '-', male: 0, female: 0, unknown: 0, total: 0 };
                if (a.sex === 'Male') current.male++;
                else if (a.sex === 'Female') current.female++;
                else current.unknown++;
                current.total++;
                censusMap.set(key, current);
            });
            rows = Array.from(censusMap.values());
        }
        else if (selectedSchemaId === 'STOCK_LIST') {
            rows = filteredAnimals.filter(a => !a.is_archived).map(a => ({
                id: a.ring_number || a.microchip_id || '-',
                name: a.name,
                latin: a.latin_name || '-',
                sex: a.sex || '?',
                age: a.date_of_birth ? `${new Date().getFullYear() - new Date(a.date_of_birth).getFullYear()}y` : '-',
                origin: a.origin || 'Unknown',
                arrival: a.acquisition_date ? new Date(a.acquisition_date).toLocaleDateString('en-GB') : '-'
            }));
        }
        else if (selectedSchemaId === 'ROUNDS_CHECKLIST') {
            const dates: string[] = [];
            const curr = new Date(startDate);
            const end = new Date(endDate);
            while (curr <= end) {
                dates.push(curr.toISOString().split('T')[0]);
                curr.setDate(curr.getDate() + 1);
            }
            rows = dates.flatMap(d => {
                const dayLogs = siteLogs.filter(l => {
                    const lDate = typeof l.log_date === 'string' ? l.log_date : l.log_date.toISOString().split('T')[0];
                    return lDate === d && l.title && l.title.includes('Round:');
                });
                return filteredAnimals.filter(a => !a.is_archived).map(animal => {
                    const sectionLogs = dayLogs.filter(l => { 
                        try { 
                            return JSON.parse(l.description).section === animal.category; 
                        } catch { 
                            return false; 
                        } 
                    });
                    const amLog = sectionLogs.find(l => JSON.parse(l.description).type === 'Morning');
                    const pmLog = sectionLogs.find(l => JSON.parse(l.description).type === 'Evening');
                    const amData = amLog ? JSON.parse(amLog.description).details?.[animal.id] : null;
                    const pmData = pmLog ? JSON.parse(pmLog.description).details?.[animal.id] : null;
                    return {
                        date: new Date(d).toLocaleDateString('en-GB', {day: 'numeric', month:'short'}),
                        animal: animal.name,
                        am_well: amData ? (amData.isAlive ? '✓' : 'X') : '-',
                        am_water: amData ? (amData.isWatered ? '✓' : '-') : '-',
                        am_secure: amData ? ((amData.isSecure || amData.securityIssue) ? '✓' : '-') : '-',
                        pm_well: pmData ? (pmData.isAlive ? '✓' : 'X') : '-',
                        pm_water: pmData ? (pmData.isWatered ? '✓' : '-') : '-',
                        pm_secure: pmData ? ((pmData.isSecure || pmData.securityIssue) ? '✓' : '-') : '-',
                        comments: [amData?.healthIssue, amData?.securityIssue, pmData?.healthIssue, pmData?.securityIssue].filter(Boolean).join('; ')
                    };
                });
            });
        }
        else if (selectedSchemaId === 'INCIDENTS') {
            rows = incidents.filter(i => inDateRange(i.incident_date)).map(i => ({
                date: new Date(i.incident_date).toLocaleDateString('en-GB'),
                location: i.location,
                category: i.incident_type,
                description: i.description,
                action: i.severity,
                initials: i.reported_by_user_id
            }));
        }
        else if (selectedSchemaId === 'WEIGHTS') {
            const keys: string[] = [];
            const [y, m, d] = endDate.split('-').map(Number);
            const end = new Date(y, m - 1, d);
            for (let i = 6; i >= 0; i--) {
                const date = new Date(end);
                date.setDate(end.getDate() - i);
                keys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
            }
            rows = filteredAnimals.map(a => {
                const row: any = { subject: a.name };
                keys.forEach(k => {
                    const dayLogs = log_entries.filter(l => l.animal_id === a.id && l.log_type === LogType.WEIGHT && new Date(l.log_date).toISOString().startsWith(k));
                    dayLogs.sort((x, y) => new Date(y.log_date).getTime() - new Date(x.log_date).getTime());
                    row[k] = dayLogs.length > 0 ? (dayLogs[0].weight_in_grams ? formatWeightDisplay(dayLogs[0].weight_in_grams, a.weight_unit) : dayLogs[0].value) : '-';
                });
                return row;
            });
        }
        else if (selectedSchemaId === 'CONSERVATION_EDUCATION') {
            rows = log_entries.filter(l => (l.log_type === LogType.CONSERVATION || l.log_type === LogType.EDUCATION) && inDateRange(l.log_date)).map(l => ({
                date: new Date(l.log_date).toLocaleDateString('en-GB'),
                type: l.log_type,
                title: l.value,
                description: l.notes || '-',
                initials: l.user_initials || '-'
            }));
        }

        return rows;
    }, [selectedSchemaId, animals, incidents, siteLogs, log_entries, startDate, endDate, selectedCategory, selectedAnimalId]);


    const exportToDocx = async () => {
        const dateRangeText = getFormattedDateRange();
        const reportTitle = currentSchema.title.toUpperCase();
        
        startTransition(async () => {
            try {
                switch (selectedSchemaId) {
                    case 'STOCK_LIST':
                        await DocumentService.generateStockList(animals.filter(a => !a.is_archived && (selectedCategory === 'ALL' || a.category === selectedCategory)), orgProfile, currentUser);
                        break;
                    case 'DAILY_LOG':
                        await DocumentService.generateDailyLog(tableData, orgProfile, dateRangeText, currentUser, reportTitle);
                        break;
                    case 'CENSUS':
                        await DocumentService.generateCensus(tableData, orgProfile, new Date().getFullYear().toString(), currentUser);
                        break;
                    case 'ROUNDS_CHECKLIST':
                        await DocumentService.generateDailyRoundsChecklist(siteLogs.filter(l => inDateRange(l.log_date) && l.title && l.title.includes('Round:')), animals, users, orgProfile, dateRangeText, currentUser, reportTitle);
                        break;
                    case 'INCIDENTS':
                        await DocumentService.generateIncidentReport(incidents.filter(i => inDateRange(i.incident_date)), orgProfile, dateRangeText, currentUser, reportTitle);
                        break;
                    case 'CONSERVATION_EDUCATION':
                        await DocumentService.generateConservationEducationLog(tableData, orgProfile, dateRangeText, currentUser, reportTitle);
                        break;
                    default:
                        alert("Export for this report type is under construction.");
                }
            } catch (e) {
                console.error("Export failed", e);
                alert("Failed to generate document.");
            }
        });
    };

    return {
        animals,
        isLoading,
        isPending,
        selectedSchemaId,
        setSelectedSchemaId,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        selectedCategory,
        setSelectedCategory,
        selectedAnimalId,
        setSelectedAnimalId,
        tableData,
        currentSchema,
        getFormattedDateRange,
        exportToDocx,
        orgProfile
    };
};
