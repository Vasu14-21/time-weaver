import { SavedTimetable, TimetableEntry } from "@/types/timetable";

export interface FacultyConflict {
  facultyName: string;
  day: string;
  period: number;
  timeSlot: string;
  conflictingTimetables: {
    id: string;
    year: string;
    branch: string;
    subjectName: string;
  }[];
}

export function detectFacultyConflicts(
  newTimetable: SavedTimetable,
  existingTimetables: SavedTimetable[]
): FacultyConflict[] {
  const conflicts: FacultyConflict[] = [];

  // Create a map of faculty assignments across all existing timetables
  const facultyAssignments: Map<string, {
    day: string;
    period: number;
    timetableId: string;
    year: string;
    branch: string;
    facultyName: string;
    subjectName: string;
  }[]> = new Map();

  // Build the faculty assignment map from existing timetables
  existingTimetables.forEach((tt) => {
    tt.entries.forEach((entry) => {
      const faculty = tt.config.faculty.find((f) => f.id === entry.facultyId);
      const subject = [...tt.config.subjects, ...tt.config.labs].find(
        (s) => s.id === entry.subjectId
      );

      if (faculty && subject) {
        const key = `${faculty.name}-${entry.day}-${entry.period}`;
        if (!facultyAssignments.has(key)) {
          facultyAssignments.set(key, []);
        }
        facultyAssignments.get(key)!.push({
          day: entry.day,
          period: entry.period,
          timetableId: tt.id,
          year: tt.config.year,
          branch: tt.config.branch,
          facultyName: faculty.name,
          subjectName: subject.name,
        });
      }
    });
  });

  // Check new timetable entries against existing assignments
  newTimetable.entries.forEach((entry) => {
    const faculty = newTimetable.config.faculty.find((f) => f.id === entry.facultyId);
    const subject = [...newTimetable.config.subjects, ...newTimetable.config.labs].find(
      (s) => s.id === entry.subjectId
    );

    if (faculty && subject) {
      const key = `${faculty.name}-${entry.day}-${entry.period}`;
      const existing = facultyAssignments.get(key);

      if (existing && existing.length > 0) {
        // Get time slot for display
        const timeSlot = getTimeSlotString(entry.period);
        
        // Check if conflict already exists in the list
        const existingConflict = conflicts.find(
          (c) =>
            c.facultyName === faculty.name &&
            c.day === entry.day &&
            c.period === entry.period
        );

        if (existingConflict) {
          // Add to existing conflict
          existingConflict.conflictingTimetables.push({
            id: newTimetable.id,
            year: newTimetable.config.year,
            branch: newTimetable.config.branch,
            subjectName: subject.name,
          });
        } else {
          // Create new conflict entry
          conflicts.push({
            facultyName: faculty.name,
            day: entry.day,
            period: entry.period,
            timeSlot,
            conflictingTimetables: [
              ...existing.map((e) => ({
                id: e.timetableId,
                year: e.year,
                branch: e.branch,
                subjectName: e.subjectName,
              })),
              {
                id: newTimetable.id,
                year: newTimetable.config.year,
                branch: newTimetable.config.branch,
                subjectName: subject.name,
              },
            ],
          });
        }
      }
    }
  });

  return conflicts;
}

function getTimeSlotString(period: number): string {
  const timeSlots: Record<number, string> = {
    1: "9:00 - 10:00",
    2: "10:00 - 10:55",
    3: "10:55 - 11:10 (Break)",
    4: "11:10 - 12:05",
    5: "12:05 - 1:00",
    6: "1:00 - 1:45 (Break)",
    7: "1:45 - 2:40",
    8: "2:40 - 3:35",
    9: "3:35 - 4:30",
  };
  return timeSlots[period] || "Unknown";
}
