import React, { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { SavedTimetable } from "@/types/timetable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { detectFacultyConflicts, FacultyConflict } from "@/utils/conflictDetection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TimetableDisplay } from "@/components/TimetableDisplay";

const AdminPortal = () => {
  const [timetables, setTimetables] = useState<SavedTimetable[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<SavedTimetable | null>(null);
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

  if (selectedTimetable) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <Button
            variant="outline"
            onClick={() => setSelectedTimetable(null)}
            className="mb-4"
          >
            ← Back to Admin Portal
          </Button>
          <TimetableDisplay
            config={selectedTimetable.config}
            entries={selectedTimetable.entries}
            onReset={() => {}}
            hideResetButton
          />
        </div>
      </div>
    );
  }

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

        {conflicts.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Faculty Conflicts Detected</AlertTitle>
            <AlertDescription>
              {conflicts.length} scheduling conflict(s) found where faculty members are
              assigned to multiple classes at the same time.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="1st Year" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="1st Year">
              1st Year
              <Badge variant="secondary" className="ml-2">
                {getTimetablesByYear("1st Year").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="2nd Year">
              2nd Year
              <Badge variant="secondary" className="ml-2">
                {getTimetablesByYear("2nd Year").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="3rd Year">
              3rd Year
              <Badge variant="secondary" className="ml-2">
                {getTimetablesByYear("3rd Year").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="4th Year">
              4th Year
              <Badge variant="secondary" className="ml-2">
                {getTimetablesByYear("4th Year").length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((year) => (
            <TabsContent key={year} value={year} className="mt-6">
              {getTimetablesByYear(year).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No timetables created for {year} yet
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {getTimetablesByYear(year).map((tt) => {
                    const ttConflicts = getConflictsForTimetable(tt.id);
                    return (
                      <Card key={tt.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                {tt.config.branch}
                                {ttConflicts.length > 0 && (
                                  <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {ttConflicts.length} Conflict(s)
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription>
                                Created on {new Date(tt.createdAt).toLocaleDateString()}{" "}
                                at {new Date(tt.createdAt).toLocaleTimeString()}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTimetable(tt)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteTimetable(tt.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        {ttConflicts.length > 0 && (
                          <CardContent>
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-destructive">
                                Conflicts:
                              </p>
                              {ttConflicts.map((conflict, idx) => (
                                <div
                                  key={idx}
                                  className="text-sm bg-destructive/10 p-2 rounded"
                                >
                                  <strong>{conflict.facultyName}</strong> is scheduled
                                  for multiple classes on <strong>{conflict.day}</strong>{" "}
                                  at <strong>{conflict.timeSlot}</strong>:
                                  <ul className="list-disc list-inside ml-4 mt-1">
                                    {conflict.conflictingTimetables.map((ct) => (
                                      <li key={ct.id}>
                                        {ct.year} - {ct.branch} ({ct.subjectName})
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </CardContent>
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
