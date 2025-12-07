import React, { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { SavedTimetable } from "@/types/timetable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { detectFacultyConflicts, FacultyConflict } from "@/utils/conflictDetection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TimetableDisplay } from "@/components/TimetableDisplay";

const AdminPortal = () => {
  const [timetables, setTimetables] = useState<SavedTimetable[]>([]);
  const [conflicts, setConflicts] = useState<FacultyConflict[]>([]);

  useEffect(() => {
    loadTimetables();
  }, []);

  const loadTimetables = () => {
    const saved = localStorage.getItem("allTimetables");
    if (saved) {
      try {
        const loaded = JSON.parse(saved) as SavedTimetable[];
        setTimetables(loaded);
        checkAllConflicts(loaded);
      } catch (error) {
        console.error("Error loading timetables:", error);
      }
    }
  };

  const checkAllConflicts = (allTimetables: SavedTimetable[]) => {
    const allConflicts: FacultyConflict[] = [];
    
    allTimetables.forEach((tt, index) => {
      const others = allTimetables.filter((_, i) => i !== index);
      const ttConflicts = detectFacultyConflicts(tt, others);
      allConflicts.push(...ttConflicts);
    });

    const uniqueConflicts = allConflicts.filter((conflict, index, self) =>
      index === self.findIndex((c) =>
        c.facultyName === conflict.facultyName &&
        c.day === conflict.day &&
        c.period === conflict.period
      )
    );

    setConflicts(uniqueConflicts);
  };

  const deleteTimetable = (id: string) => {
    const updated = timetables.filter((tt) => tt.id !== id);
    setTimetables(updated);
    localStorage.setItem("allTimetables", JSON.stringify(updated));
    checkAllConflicts(updated);
    toast.success("Timetable deleted");
  };

  const getTimetablesByYear = (year: string) => {
    return timetables.filter((tt) => tt.config.year === year);
  };

  const getConflictsForTimetable = (timetableId: string) => {
    return conflicts.filter((c) =>
      c.conflictingTimetables.some((ct) => ct.id === timetableId)
    );
  };

  const handleUpdateTimetableEntry = (timetableId: string, updatedEntry: any, oldEntry?: any) => {
    const updated = timetables.map((tt) => {
      if (tt.id === timetableId) {
        let newEntries = [...tt.entries];
        
        if (oldEntry) {
          newEntries = newEntries.filter(
            (e) => !(e.day === oldEntry.day && e.period === oldEntry.period)
          );
        }
        
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

        return { ...tt, entries: newEntries };
      }
      return tt;
    });

    setTimetables(updated);
    localStorage.setItem("allTimetables", JSON.stringify(updated));
    checkAllConflicts(updated);
    toast.success("Timetable updated");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Portal</h1>
          <p className="text-muted-foreground">
            Manage all timetables and detect faculty scheduling conflicts
          </p>
        </div>

        {conflicts.length > 0 ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Faculty Conflicts Detected</AlertTitle>
            <AlertDescription>
              <p>{conflicts.length} scheduling conflict(s) found where faculty members are
              assigned to multiple classes at the same time.</p>
              <p className="text-xs mt-1 opacity-80">
                This alert auto-updates when you make changes to timetables
              </p>
            </AlertDescription>
          </Alert>
        ) : timetables.length > 0 && (
          <Alert className="mb-6 border-green-500 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">No Conflicts</AlertTitle>
            <AlertDescription className="text-green-700">
              All timetables are conflict-free. Faculty schedules are valid.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="1st Year" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="1st Year" className="text-xs sm:text-sm">
              1st
              <Badge variant="secondary" className="ml-1 text-xs">
                {getTimetablesByYear("1st Year").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="2nd Year" className="text-xs sm:text-sm">
              2nd
              <Badge variant="secondary" className="ml-1 text-xs">
                {getTimetablesByYear("2nd Year").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="3rd Year" className="text-xs sm:text-sm">
              3rd
              <Badge variant="secondary" className="ml-1 text-xs">
                {getTimetablesByYear("3rd Year").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="4th Year" className="text-xs sm:text-sm">
              4th
              <Badge variant="secondary" className="ml-1 text-xs">
                {getTimetablesByYear("4th Year").length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((year) => (
            <TabsContent key={year} value={year} className="mt-0">
              {getTimetablesByYear(year).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No timetables for {year}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-8">
                  {getTimetablesByYear(year).map((tt) => {
                    const ttConflicts = getConflictsForTimetable(tt.id);
                    
                    return (
                      <Card key={tt.id} className="overflow-hidden">
                        {/* Header with branch name, date, and delete button */}
                        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg">{tt.config.branch}</h3>
                            {ttConflicts.length > 0 && (
                              <Badge variant="destructive" className="gap-1 text-xs">
                                <AlertTriangle className="h-3 w-3" />
                                {ttConflicts.length} conflicts
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {new Date(tt.createdAt).toLocaleDateString()}
                            </div>
                            <Button
                              variant="red"
                              size="sm"
                              onClick={() => deleteTimetable(tt.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Timetable Display */}
                        <CardContent className="p-0">
                          <div className="overflow-auto">
                            <TimetableDisplay
                              config={tt.config}
                              entries={tt.entries}
                              onReset={() => {}}
                              hideResetButton
                              enableEdit={true}
                              onUpdateEntry={(updatedEntry, oldEntry) =>
                                handleUpdateTimetableEntry(tt.id, updatedEntry, oldEntry)
                              }
                            />
                          </div>
                        </CardContent>

                        {/* Show conflicts for this timetable */}
                        {ttConflicts.length > 0 && (
                          <div className="px-4 py-3 bg-destructive/5 border-t">
                            <h4 className="text-sm font-semibold text-destructive flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4" />
                              Conflicts
                            </h4>
                            <div className="space-y-2">
                              {ttConflicts.map((conflict, idx) => (
                                <div
                                  key={idx}
                                  className="text-sm bg-destructive/10 p-2 rounded border border-destructive/20"
                                >
                                  <strong>{conflict.facultyName}</strong> - {conflict.day} {conflict.timeSlot}
                                  <ul className="list-none ml-2 mt-1 space-y-1">
                                    {conflict.conflictingTimetables.map((ct) => (
                                      <li key={ct.id} className="flex items-center gap-1 text-xs">
                                        <Badge variant="outline" className="text-xs">
                                          {ct.branch}
                                        </Badge>
                                        <span className="text-muted-foreground">
                                          {ct.subjectName}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPortal;