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
    facultyName: string;
  }[];
}

export function detectFacultyConflicts(
  newTimetable: SavedTimetable,
  existingTimetables: SavedTimetable[]
): FacultyConflict[] {
  const conflicts: FacultyConflict[] = [];

  // Create a map of faculty assignments across all existing timetables
  // Key: "facultyname-day-period" (faculty name is case-insensitive)
  const facultyAssignments: Map<string, {
    day: string;
    period: number;
    timetableId: string;
    year: string;
    branch: string;
    facultyName: string;
    subjectName: string;
  }[]> = new Map();

  // Helper function to normalize faculty name for comparison
  const normalizeFacultyName = (name: string) => name.toLowerCase().trim();

  // Build the faculty assignment map from existing timetables
  existingTimetables.forEach((tt) => {
    tt.entries.forEach((entry) => {
      // Skip special periods
      if (entry.isSpecial) return;

      const faculty = tt.config.faculty.find((f) => f.id === entry.facultyId);
      const subject = [...tt.config.subjects, ...tt.config.labs].find(
        (s) => s.id === entry.subjectId
      );

      if (faculty && subject) {
        const key = `${normalizeFacultyName(faculty.name)}-${entry.day}-${entry.period}`;
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

      // Also check for facultyIds array (labs with multiple faculty)
      if (entry.facultyIds) {
        entry.facultyIds.forEach((fId) => {
          const fac = tt.config.faculty.find((f) => f.id === fId);
          if (fac && subject) {
            const key = `${normalizeFacultyName(fac.name)}-${entry.day}-${entry.period}`;
            if (!facultyAssignments.has(key)) {
              facultyAssignments.set(key, []);
            }
            // Avoid duplicates
            const existing = facultyAssignments.get(key)!;
            if (!existing.find(e => e.timetableId === tt.id && e.subjectName === subject.name)) {
              existing.push({
                day: entry.day,
                period: entry.period,
                timetableId: tt.id,
                year: tt.config.year,
                branch: tt.config.branch,
                facultyName: fac.name,
                subjectName: subject.name,
              });
            }
          }
        });
      }
    });
  });

  // Check new timetable entries against existing assignments
  newTimetable.entries.forEach((entry) => {
    // Skip special periods
    if (entry.isSpecial) return;

    const faculty = newTimetable.config.faculty.find((f) => f.id === entry.facultyId);
    const subject = [...newTimetable.config.subjects, ...newTimetable.config.labs].find(
      (s) => s.id === entry.subjectId
    );

    const checkFacultyConflict = (facultyName: string, subjectName: string) => {
      const key = `${normalizeFacultyName(facultyName)}-${entry.day}-${entry.period}`;
      const existing = facultyAssignments.get(key);

      if (existing && existing.length > 0) {
        // Get time slot for display
        const timeSlot = getTimeSlotString(entry.period);
        
        // Check if conflict already exists in the list
        const existingConflict = conflicts.find(
          (c) =>
            normalizeFacultyName(c.facultyName) === normalizeFacultyName(facultyName) &&
            c.day === entry.day &&
            c.period === entry.period
        );

        if (existingConflict) {
          // Add to existing conflict if not already there
          const alreadyHasNewTimetable = existingConflict.conflictingTimetables.some(
            ct => ct.id === newTimetable.id && ct.subjectName === subjectName
          );
          if (!alreadyHasNewTimetable) {
            existingConflict.conflictingTimetables.push({
              id: newTimetable.id,
              year: newTimetable.config.year,
              branch: newTimetable.config.branch,
              subjectName: subjectName,
              facultyName: facultyName,
            });
          }
        } else {
          // Create new conflict entry
          conflicts.push({
            facultyName: facultyName,
            day: entry.day,
            period: entry.period,
            timeSlot,
            conflictingTimetables: [
              ...existing.map((e) => ({
                id: e.timetableId,
                year: e.year,
                branch: e.branch,
                subjectName: e.subjectName,
                facultyName: e.facultyName,
              })),
              {
                id: newTimetable.id,
                year: newTimetable.config.year,
                branch: newTimetable.config.branch,
                subjectName: subjectName,
                facultyName: facultyName,
              },
            ],
          });
        }
      }
    };

    if (faculty && subject) {
      checkFacultyConflict(faculty.name, subject.name);
    }

    // Also check for facultyIds array (labs with multiple faculty)
    if (entry.facultyIds && subject) {
      entry.facultyIds.forEach((fId) => {
        const fac = newTimetable.config.faculty.find((f) => f.id === fId);
        if (fac) {
          checkFacultyConflict(fac.name, subject.name);
        }
      });
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
