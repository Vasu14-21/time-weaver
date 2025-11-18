import { TimeSlot, TimetableEntry, Subject, Faculty } from "@/types/timetable";

export const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const TIME_SLOTS: TimeSlot[] = [
  { day: "", period: 1, startTime: "9:00", endTime: "10:00" },
  { day: "", period: 2, startTime: "10:00", endTime: "10:55" },
  { day: "", period: 3, startTime: "10:55", endTime: "11:10", isBreak: true },
  { day: "", period: 4, startTime: "11:10", endTime: "12:05" },
  { day: "", period: 5, startTime: "12:05", endTime: "1:00" },
  { day: "", period: 6, startTime: "1:00", endTime: "1:45", isBreak: true },
  { day: "", period: 7, startTime: "1:45", endTime: "2:40" },
  { day: "", period: 8, startTime: "2:40", endTime: "3:35" },
  { day: "", period: 9, startTime: "3:35", endTime: "4:30" },
];

// Morning lab slots: periods 1,2,4 (9:00-12:05, excluding break at period 3)
// Afternoon lab slots: periods 7,8,9 (1:45-4:30)
export const LAB_SLOTS = {
  morning: [1, 2, 4],
  afternoon: [7, 8, 9],
};

interface FacultyAllocation {
  facultyId: string;
  day: string;
  periods: number[];
}

export function generateTimetable(
  subjects: Subject[],
  labs: Subject[],
  faculty: Faculty[]
): TimetableEntry[] {
  const entries: TimetableEntry[] = [];
  const facultyAllocations: FacultyAllocation[] = [];

  // Shuffle for randomness
  const shuffledSubjects = [...subjects].sort(() => Math.random() - 0.5);
  const shuffledLabs = [...labs].sort(() => Math.random() - 0.5);

  // First, allocate labs (they need 3 consecutive periods)
  const availableLabDays = [...DAYS];
  
  for (const lab of shuffledLabs) {
    if (availableLabDays.length === 0) break;

    // Randomly choose morning or afternoon slot
    const isAfternoon = Math.random() > 0.5;
    const periods = isAfternoon ? LAB_SLOTS.afternoon : LAB_SLOTS.morning;

    // Pick a random available day
    const dayIndex = Math.floor(Math.random() * availableLabDays.length);
    const day = availableLabDays[dayIndex];
    availableLabDays.splice(dayIndex, 1); // Remove to ensure different days for labs

    // Assign a random faculty member
    const assignedFaculty = faculty[Math.floor(Math.random() * faculty.length)];

    // Check if faculty is available
    const isAvailable = !facultyAllocations.some(
      (allocation) =>
        allocation.facultyId === assignedFaculty.id &&
        allocation.day === day &&
        allocation.periods.some((p) => periods.includes(p))
    );

    if (isAvailable) {
      // Add lab entries for all 3 periods
      periods.forEach((period) => {
        entries.push({
          day,
          period,
          subjectId: lab.id,
          facultyId: assignedFaculty.id,
          isLab: true,
        });
      });

      // Mark faculty as allocated
      facultyAllocations.push({
        facultyId: assignedFaculty.id,
        day,
        periods,
      });
    }
  }

  // Now allocate regular subjects to remaining slots
  const regularPeriods = [1, 2, 4, 5, 7, 8, 9]; // All periods except breaks

  for (const day of DAYS) {
    for (const period of regularPeriods) {
      // Skip if already allocated (by lab)
      const isAllocated = entries.some(
        (e) => e.day === day && e.period === period
      );
      if (isAllocated) continue;

      // Pick a random subject
      const subject =
        shuffledSubjects[Math.floor(Math.random() * shuffledSubjects.length)];

      // Pick a random faculty and check availability
      let attempts = 0;
      let assignedFaculty: Faculty | null = null;

      while (attempts < faculty.length * 2) {
        const candidateFaculty =
          faculty[Math.floor(Math.random() * faculty.length)];

        // Check if this faculty is already teaching at this time
        const isFacultyBusy = facultyAllocations.some(
          (allocation) =>
            allocation.facultyId === candidateFaculty.id &&
            allocation.day === day &&
            allocation.periods.includes(period)
        );

        if (!isFacultyBusy) {
          assignedFaculty = candidateFaculty;
          break;
        }
        attempts++;
      }

      // If we couldn't find an available faculty, use any faculty (fallback)
      if (!assignedFaculty) {
        assignedFaculty = faculty[Math.floor(Math.random() * faculty.length)];
      }

      entries.push({
        day,
        period,
        subjectId: subject.id,
        facultyId: assignedFaculty.id,
        isLab: false,
      });

      // Mark faculty as allocated for this period
      facultyAllocations.push({
        facultyId: assignedFaculty.id,
        day,
        periods: [period],
      });
    }
  }

  return entries;
}

export function validateFacultyConflict(
  entries: TimetableEntry[],
  newEntry: TimetableEntry
): boolean {
  return entries.some(
    (entry) =>
      entry.facultyId === newEntry.facultyId &&
      entry.day === newEntry.day &&
      entry.period === newEntry.period &&
      !(entry.day === newEntry.day && entry.period === newEntry.period && entry.subjectId === newEntry.subjectId)
  );
}
