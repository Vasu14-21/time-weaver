import React, { useState, useEffect } from "react";
import { ConfigForm } from "@/components/ConfigForm";
import { TimetableDisplay } from "@/components/TimetableDisplay";
import { Navigation } from "@/components/Navigation";
import { ConfigData, Timetable, SavedTimetable } from "@/types/timetable";
import { generateTimetable } from "@/utils/timetableGenerator";
import { detectFacultyConflicts } from "@/utils/conflictDetection";
import { toast } from "sonner";
import { Calendar, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Index = () => {
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem("timetable");
    if (saved) {
      try {
        const loadedTimetable = JSON.parse(saved);
        setTimetable(loadedTimetable);
        setEntries(loadedTimetable.entries || []);
      } catch (error) {
        console.error("Error loading timetable:", error);
      }
    }
  }, []);

  const handleConfigComplete = (config: ConfigData) => {
    try {
      const allSubjects = [...config.subjects, ...config.labs];
      const entries = generateTimetable(allSubjects, config.labs, config.faculty);

      const newTimetable: SavedTimetable = {
        id: `tt-${Date.now()}`,
        config,
        entries,
        createdAt: new Date().toISOString(),
      };

      // Check for conflicts with existing timetables
      const allTimetables = loadAllTimetables();
      const detectedConflicts = detectFacultyConflicts(newTimetable, allTimetables);

      if (detectedConflicts.length > 0) {
        setConflicts(detectedConflicts);
        toast.warning(`Timetable generated with ${detectedConflicts.length} faculty conflict(s)`);
      } else {
        toast.success("Timetable generated successfully with no conflicts!");
      }

      setTimetable(newTimetable);
      setEntries(entries);
      localStorage.setItem("timetable", JSON.stringify(newTimetable));
    } catch (error) {
      console.error("Error generating timetable:", error);
      toast.error("Failed to generate timetable");
    }
  };

  const loadAllTimetables = (): SavedTimetable[] => {
    const saved = localStorage.getItem("allTimetables");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error("Error loading all timetables:", error);
      }
    }
    return [];
  };

  const handleSave = () => {
    if (!timetable) return;

    const allTimetables = loadAllTimetables();
    const savedTimetable = timetable as SavedTimetable;
    
    // Check if already exists, update it; otherwise add new
    const existingIndex = allTimetables.findIndex((tt) => tt.id === savedTimetable.id);
    if (existingIndex >= 0) {
      allTimetables[existingIndex] = savedTimetable;
    } else {
      allTimetables.push(savedTimetable);
    }

    localStorage.setItem("allTimetables", JSON.stringify(allTimetables));
    toast.success("Timetable saved to Admin Portal!");
  };

  const handleReset = () => {
    setTimetable(null);
    setConflicts([]);
    setEntries([]);
    localStorage.removeItem("timetable");
    toast.success("Timetable cleared");
  };

  const handleUpdateEntry = (updatedEntry: any, oldEntry?: any) => {
    if (!timetable) return;

    let newEntries = [...entries];
    
    if (oldEntry) {
      // Remove old entry
      newEntries = newEntries.filter(
        (e) => !(e.day === oldEntry.day && e.period === oldEntry.period)
      );
    }
    
    // Add updated entry if it exists
    if (updatedEntry) {
      const existingIndex = newEntries.findIndex(
        (e) => e.day === updatedEntry.day && e.period === updatedEntry.period
      );
      if (existingIndex >= 0) {
        newEntries[existingIndex] = updatedEntry;
      } else {
        newEntries.push(updatedEntry);
      }
    }

    const updatedTimetable = {
      ...timetable,
      entries: newEntries,
    };

    setTimetable(updatedTimetable);
    setEntries(newEntries);
    localStorage.setItem("timetable", JSON.stringify(updatedTimetable));
  };

  if (timetable) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          {conflicts.length > 0 && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Faculty Conflicts Detected</AlertTitle>
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  {conflicts.map((conflict, idx) => (
                    <div key={idx} className="text-sm">
                      <strong>{conflict.facultyName}</strong> is scheduled for multiple
                      classes on <strong>{conflict.day}</strong> at{" "}
                      <strong>{conflict.timeSlot}</strong>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
          <TimetableDisplay
            config={timetable.config}
            entries={entries}
            onReset={handleReset}
            onSave={handleSave}
            onUpdateEntry={handleUpdateEntry}
            enableEdit={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Calendar className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Timetable Generator
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Create intelligent, conflict-free class schedules automatically
          </p>
        </div>
        <ConfigForm onComplete={handleConfigComplete} />
      </div>
    </div>
  );
};

export default Index;
