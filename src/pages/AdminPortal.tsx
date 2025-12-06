import React, { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { SavedTimetable } from "@/types/timetable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { detectFacultyConflicts, FacultyConflict } from "@/utils/conflictDetection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TimetableDisplay } from "@/components/TimetableDisplay";

const AdminPortal = () => {
  const [timetables, setTimetables] = useState<SavedTimetable[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string | null>(null);
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
    
    // Check each timetable against all others
    allTimetables.forEach((tt, index) => {
      const others = allTimetables.filter((_, i) => i !== index);
      const ttConflicts = detectFacultyConflicts(tt, others);
      allConflicts.push(...ttConflicts);
    });

    // Remove duplicates
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
    if (selectedTimetableId === id) {
      setSelectedTimetableId(null);
    }
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

  const selectedTimetable = timetables.find(tt => tt.id === selectedTimetableId);

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Timetable List */}
          <div>
            <Tabs defaultValue="1st Year" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
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
                <TabsContent key={year} value={year} className="mt-4">
                  {getTimetablesByYear(year).length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">
                          No timetables for {year}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {getTimetablesByYear(year).map((tt) => {
                        const ttConflicts = getConflictsForTimetable(tt.id);
                        const isSelected = selectedTimetableId === tt.id;
                        
                        return (
                          <Card 
                            key={tt.id} 
                            className={`cursor-pointer transition-all ${
                              isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'
                            }`}
                            onClick={() => setSelectedTimetableId(tt.id)}
                          >
                            <CardHeader className="py-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="flex items-center gap-2 text-base">
                                    {tt.config.branch}
                                    {ttConflicts.length > 0 && (
                                      <Badge variant="destructive" className="gap-1 text-xs">
                                        <AlertTriangle className="h-3 w-3" />
                                        {ttConflicts.length}
                                      </Badge>
                                    )}
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    {new Date(tt.createdAt).toLocaleDateString()}
                                  </CardDescription>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="green"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTimetableId(tt.id);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="red"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTimetable(tt.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Right Panel: Selected Timetable Display */}
          <div>
            {selectedTimetable ? (
              <div className="sticky top-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-lg">
                      {selectedTimetable.config.branch} - {selectedTimetable.config.year}
                    </CardTitle>
                    <CardDescription>
                      Created: {new Date(selectedTimetable.createdAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-auto max-h-[70vh]">
                      <TimetableDisplay
                        config={selectedTimetable.config}
                        entries={selectedTimetable.entries}
                        onReset={() => {}}
                        hideResetButton
                        enableEdit={true}
                        onUpdateEntry={(updatedEntry, oldEntry) =>
                          handleUpdateTimetableEntry(selectedTimetable.id, updatedEntry, oldEntry)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Show conflicts for selected timetable */}
                {getConflictsForTimetable(selectedTimetable.id).length > 0 && (
                  <Card className="mt-4">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Conflicts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {getConflictsForTimetable(selectedTimetable.id).map((conflict, idx) => (
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
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a timetable from the list to view it here
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;