import { useState, useEffect } from "react";
import { ConfigForm } from "@/components/ConfigForm";
import { TimetableDisplay } from "@/components/TimetableDisplay";
import { ConfigData, Timetable } from "@/types/timetable";
import { generateTimetable } from "@/utils/timetableGenerator";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

const Index = () => {
  const [timetable, setTimetable] = useState<Timetable | null>(null);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem("timetable");
    if (saved) {
      try {
        setTimetable(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading timetable:", error);
      }
    }
  }, []);

  const handleConfigComplete = (config: ConfigData) => {
    try {
      const allSubjects = [...config.subjects, ...config.labs];
      const entries = generateTimetable(allSubjects, config.labs, config.faculty);

      const newTimetable: Timetable = {
        config,
        entries,
      };

      setTimetable(newTimetable);
      localStorage.setItem("timetable", JSON.stringify(newTimetable));
      toast.success("Timetable generated successfully!");
    } catch (error) {
      console.error("Error generating timetable:", error);
      toast.error("Failed to generate timetable");
    }
  };

  const handleReset = () => {
    setTimetable(null);
    localStorage.removeItem("timetable");
    toast.success("Timetable cleared");
  };

  if (timetable) {
    return (
      <TimetableDisplay
        config={timetable.config}
        entries={timetable.entries}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
