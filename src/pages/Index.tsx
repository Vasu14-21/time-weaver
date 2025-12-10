import React, { useState, useEffect } from "react";
import { ConfigForm, ConfigFormState } from "@/components/ConfigForm";
import { TimetableDisplay } from "@/components/TimetableDisplay";
import { Navigation } from "@/components/Navigation";
import { Timetable, TimetableEntry, SavedTimetable } from "@/types/timetable";
import { toast } from "sonner";
import { Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [activeTab, setActiveTab] = useState("0");
  const [configFormState, setConfigFormState] = useState<ConfigFormState | null>(null);

  useEffect(() => {
    // Load current timetables
    const saved = localStorage.getItem("currentTimetables");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setTimetables(parsed);
        }
      } catch (error) {
        console.error("Error loading timetables:", error);
      }
    }

    // Load config form state
    const savedState = localStorage.getItem("configFormState");
    if (savedState) {
      try {
        setConfigFormState(JSON.parse(savedState));
      } catch (error) {
        console.error("Error loading config form state:", error);
      }
    }
  }, []);

  const handleConfigComplete = (generatedTimetables: Timetable[]) => {
    setTimetables(generatedTimetables);
    setActiveTab("0");
    localStorage.setItem("currentTimetables", JSON.stringify(generatedTimetables));
    // Clear config form state after completion
    localStorage.removeItem("configFormState");
    setConfigFormState(null);
    toast.success(`Generated ${generatedTimetables.length} timetable(s)!`);
  };

  const handleUpdateEntries = (timetableIndex: number, entries: TimetableEntry[]) => {
    const updated = [...timetables];
    updated[timetableIndex] = { ...updated[timetableIndex], entries };
    setTimetables(updated);
    localStorage.setItem("currentTimetables", JSON.stringify(updated));
  };

  const handleReset = () => {
    setTimetables([]);
    setConfigFormState(null);
    localStorage.removeItem("currentTimetables");
    localStorage.removeItem("configFormState");
  };

  const handleConfigStateChange = (state: ConfigFormState) => {
    setConfigFormState(state);
    localStorage.setItem("configFormState", JSON.stringify(state));
  };

  const handleSaveToAdmin = () => {
    const savedTimetables = localStorage.getItem("savedTimetables");
    let existing: SavedTimetable[] = [];
    
    if (savedTimetables) {
      try {
        existing = JSON.parse(savedTimetables);
      } catch (error) {
        console.error("Error parsing saved timetables:", error);
      }
    }

    const newSaved: SavedTimetable[] = timetables.map(tt => ({
      ...tt,
      id: `timetable-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }));

    const allTimetables = [...existing, ...newSaved];
    localStorage.setItem("savedTimetables", JSON.stringify(allTimetables));
    // Also save to allTimetables for admin portal
    localStorage.setItem("allTimetables", JSON.stringify(allTimetables));
    toast.success(`${timetables.length} timetable(s) saved to Admin Portal!`);
  };

  if (timetables.length > 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <h2 className="text-2xl font-bold">Generated Timetables ({timetables.length})</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>Create New</Button>
              <Button onClick={handleSaveToAdmin}>Save All to Admin Portal</Button>
            </div>
          </div>

          {timetables.length === 1 ? (
            <TimetableDisplay
              config={timetables[0].config}
              entries={timetables[0].entries}
              onUpdateEntries={(entries) => handleUpdateEntries(0, entries)}
            />
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 flex-wrap h-auto">
                {timetables.map((tt, i) => (
                  <TabsTrigger key={i} value={i.toString()} className="mb-1">
                    {tt.config.year} - {tt.config.branch}
                  </TabsTrigger>
                ))}
              </TabsList>
              {timetables.map((tt, i) => (
                <TabsContent key={i} value={i.toString()}>
                  <TimetableDisplay
                    config={tt.config}
                    entries={tt.entries}
                    onUpdateEntries={(entries) => handleUpdateEntries(i, entries)}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
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
            <h1 className="text-4xl font-bold text-foreground">Timetable Generator</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Create intelligent, conflict-free class schedules automatically
          </p>
        </div>
        <ConfigForm 
          onComplete={handleConfigComplete} 
          savedState={configFormState}
          onStateChange={handleConfigStateChange}
        />
      </div>
    </div>
  );
};

export default Index;
