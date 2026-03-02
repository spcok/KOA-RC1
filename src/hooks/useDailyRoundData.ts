import { v4 as uuidv4 } from 'uuid';
import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db';
import { Animal, AnimalCategory, SiteLogEntry, Incident, IncidentType, IncidentSeverity } from '@/types';
import { useAuthStore } from '@/src/store/authStore';

interface CheckState {
    isAlive?: boolean;
    isWatered: boolean;
    isSecure: boolean;
    healthIssue?: string;
    securityIssue?: string;
}

export const useDailyRoundData = (viewDate: string) => {
    const { profile: currentUser } = useAuthStore();
    const [roundType, setRoundType] = useState<'Morning' | 'Evening'>('Morning');
    const [activeTab, setActiveTab] = useState<AnimalCategory>(AnimalCategory.OWLS);
    const [checks, setChecks] = useState<Record<string, CheckState>>({});
    const [generalNotes, setGeneralNotes] = useState('');
    const [signingInitials, setSigningInitials] = useState(currentUser?.initials || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPastRound, setIsPastRound] = useState(false);

    const data = useLiveQuery(async () => {
        try {
            const [animals, siteLogs] = await Promise.all([
                db.animals.toArray(),
                db.site_logs.toArray()
            ]);
            return { animals, siteLogs };
        } catch (e) {
            console.error("Dexie error in useDailyRoundData:", e);
            return { animals: [], siteLogs: [] };
        }
    }, []);

    const isLoading = data === undefined;

    const sanitizedAnimals = useMemo(() => {
        if (!data?.animals) return [];
        return data.animals.map(animal => ({
            ...animal,
            id: String(animal.id || ''),
            name: String(animal.name || 'Unknown'),
            location: String(animal.location || 'Unknown Location'),
            category: String(animal.category || AnimalCategory.OTHER) as AnimalCategory,
            image_url: String(animal.image_url || ''),
            archived: !!animal.archived
        }));
    }, [data?.animals]);

    const sanitizedSiteLogs = useMemo(() => {
        if (!data?.siteLogs) return [];
        return data.siteLogs.map(log => ({
            ...log,
            id: String(log.id || ''),
            title: String(log.title || ''),
            description: String(log.description || ''),
            date: log.log_date ? new Date(log.log_date) : new Date()
        }));
    }, [data?.siteLogs]);

    useEffect(() => {
        const hour = new Date().getHours();
        if (Object.keys(checks).length === 0 && viewDate === new Date().toISOString().split('T')[0]) {
            setRoundType(hour >= 12 ? 'Evening' : 'Morning');
        }
    }, [viewDate]);

    useEffect(() => {
        const existingLog = sanitizedSiteLogs.find(log => 
            log.date.toISOString().split('T')[0] === viewDate && 
            log.title === `${roundType} Round: ${activeTab}`
        );

        if (existingLog) {
            try {
                const parsedData = JSON.parse(existingLog.description);
                setChecks(parsedData.details || {});
                setGeneralNotes(parsedData.notes || '');
                setSigningInitials(parsedData.signedBy || '');
                setIsPastRound(true);
            } catch (e) {
                console.error("Failed to parse existing round data", e);
                setChecks({});
                setGeneralNotes('');
                setSigningInitials(currentUser?.initials || '');
                setIsPastRound(false);
            }
        } else {
            setChecks({});
            setGeneralNotes('');
            setSigningInitials(currentUser?.initials || '');
            setIsPastRound(false);
        }
    }, [viewDate, roundType, activeTab, sanitizedSiteLogs, currentUser?.initials]);

    const categoryAnimals = useMemo(() => {
        return sanitizedAnimals.filter(a => !a.archived && a.category === activeTab);
    }, [sanitizedAnimals, activeTab]);

    const totalAnimals = categoryAnimals.length;
    const completedChecks = useMemo(() => {
        return categoryAnimals.reduce((acc, animal) => {
            const check = checks[animal.id];
            if (!check) return acc;
            if (check.isAlive === false) return acc + 1; 
            if (check.isAlive === undefined) return acc;
            
            const isSecureChecked = check.isSecure || !!check.securityIssue;
            const isWateredChecked = check.isWatered;

            if (activeTab === AnimalCategory.OWLS || activeTab === AnimalCategory.RAPTORS) {
                if (isSecureChecked) return acc + 1;
            } else {
                if (isWateredChecked && isSecureChecked) return acc + 1;
            }
            return acc;
        }, 0);
    }, [categoryAnimals, checks, activeTab]);

    const progress = totalAnimals > 0 ? Math.round((completedChecks / totalAnimals) * 100) : 0;
    const isComplete = totalAnimals > 0 && completedChecks === totalAnimals;

    const isNoteRequired = useMemo(() => {
        if (activeTab !== AnimalCategory.OWLS && activeTab !== AnimalCategory.RAPTORS) return false;
        const hasUnwateredBird = categoryAnimals.some(a => {
            const c = checks[a.id];
            const isChecked = c && (c.isSecure || c.securityIssue);
            return isChecked && c.isAlive && !c.isWatered;
        });
        return hasUnwateredBird && !generalNotes.trim();
    }, [activeTab, categoryAnimals, checks, generalNotes]);

    const toggleWater = (id: string) => {
        setChecks(prev => ({
            ...prev,
            [id]: { ...prev[id] || { isAlive: undefined, isWatered: false, isSecure: false }, isWatered: !prev[id]?.isWatered }
        }));
    };

    const toggleSecure = (id: string, issue?: string) => {
        setChecks(prev => ({
            ...prev,
            [id]: { 
                ...prev[id] || { isAlive: undefined, isWatered: false, isSecure: false }, 
                isSecure: !issue, 
                securityIssue: issue 
            }
        }));
    };

    const toggleHealth = (id: string, issue?: string) => {
        setChecks(prev => ({ 
            ...prev, 
            [id]: { 
                ...prev[id] || { isWatered: false, isSecure: false }, 
                isAlive: !issue, 
                healthIssue: issue 
            } 
        }));
    };

    const handleSignOff = async () => {
        if (!isComplete || !signingInitials || isNoteRequired || isPastRound) return;
        setIsSubmitting(true);
        try {
            const dateStr = viewDate;
            const timestamp = Date.now();

            for (const animal of categoryAnimals) {
                const check = checks[animal.id];
                if (!check) continue;
                const issueType = check.isAlive === false ? 'Animal Injury/Illness' : (!check.isSecure ? 'Security Breach' : null);
                if (issueType) {
                    await db.incidents.add({
                        id: uuidv4(),
                        incident_date: new Date(dateStr),
                        incident_time: new Date().toLocaleTimeString(),
                        incident_type: issueType as IncidentType,
                        animal_id: animal.id,
                        description: `Detected during ${roundType} Round (${activeTab}): ${check.healthIssue || check.securityIssue}`,
                        location: animal.location || 'Unknown',
                        severity: IncidentSeverity.HIGH,
                        status: 'Open',
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                }
            }

            await db.site_logs.add({
                id: uuidv4(),
                log_date: new Date(dateStr),
                title: `${roundType} Round: ${activeTab}`,
                description: JSON.stringify({
                    type: roundType, section: activeTab, staff: currentUser?.name || 'Unknown', signedBy: signingInitials, userId: currentUser?.id || 'unknown',
                    totalChecked: totalAnimals, issuesFound: categoryAnimals.filter(a => checks[a.id]?.isAlive === false || checks[a.id]?.securityIssue).length,
                    notes: generalNotes, details: checks
                }),
                location: `${activeTab} Section`, 
                priority: 'Medium', 
                status: 'Completed',
                created_at: new Date(),
                updated_at: new Date()
            });

            alert(`${activeTab} section signed off successfully.`);
            setGeneralNotes('');
        } catch (e) {
            console.error("Sign off failed", e);
            alert("Sign off failed. Please check console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        categoryAnimals,
        isLoading,
        roundType,
        setRoundType,
        activeTab,
        setActiveTab,
        checks,
        progress,
        isComplete,
        isNoteRequired,
        signingInitials,
        setSigningInitials,
        generalNotes,
        setGeneralNotes,
        isSubmitting,
        isPastRound,
        toggleWater,
        toggleSecure,
        toggleHealth,
        handleSignOff,
        currentUser
    };
};
