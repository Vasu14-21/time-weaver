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

  // Map each subject/lab to the faculty member(s) explicitly assigned to it
  const subjectFacultyMap: Record<string, Faculty[]> = {};

  faculty.forEach((member) => {
    if (!member.subjectId) return;
    if (!subjectFacultyMap[member.subjectId]) {
      subjectFacultyMap[member.subjectId] = [];
    }
    subjectFacultyMap[member.subjectId].push(member);
  });

  const shuffledSubjectsWithFaculty = shuffledSubjects.filter(
    (subject) => subjectFacultyMap[subject.id] && subjectFacultyMap[subject.id].length > 0
  );

  const shuffledLabsWithFaculty = shuffledLabs.filter(
    (lab) => subjectFacultyMap[lab.id] && subjectFacultyMap[lab.id].length > 0
  );

  // First, allocate labs (they need 3 consecutive periods)
  const availableLabDays = [...DAYS];
  
  for (const lab of shuffledLabsWithFaculty) {
    if (availableLabDays.length === 0) break;

    // Randomly choose morning or afternoon slot
    const isAfternoon = Math.random() > 0.5;
    const periods = isAfternoon ? LAB_SLOTS.afternoon : LAB_SLOTS.morning;

    // Pick a random available day
    const dayIndex = Math.floor(Math.random() * availableLabDays.length);
    const day = availableLabDays[dayIndex];
    availableLabDays.splice(dayIndex, 1); // Remove to ensure different days for labs

    const possibleFaculty = subjectFacultyMap[lab.id] || [];
    if (possibleFaculty.length === 0) continue;

    let assignedFaculty: Faculty | null = null;
    let attempts = 0;

    while (attempts < possibleFaculty.length * 2) {
      const candidateFaculty =
        possibleFaculty[Math.floor(Math.random() * possibleFaculty.length)];

      const isFacultyBusy = facultyAllocations.some(
        (allocation) =>
          allocation.facultyId === candidateFaculty.id &&
          allocation.day === day &&
          allocation.periods.some((p) => periods.includes(p))
      );

      if (!isFacultyBusy) {
        assignedFaculty = candidateFaculty;
        break;
      }

      attempts++;
    }

    if (!assignedFaculty) continue;

    // Add lab entries for all 3 periods
    periods.forEach((period) => {
      entries.push({
        day,
        period,
        subjectId: lab.id,
        facultyId: assignedFaculty!.id,
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

  // Now allocate regular subjects to remaining slots
  const regularPeriods = [1, 2, 4, 5, 7, 8, 9]; // All periods except breaks

  for (const day of DAYS) {
    for (const period of regularPeriods) {
      // Skip if already allocated (by lab)
      const isAllocated = entries.some(
        (e) => e.day === day && e.period === period
      );
      if (isAllocated) continue;

      // Try to find a subject and its assigned faculty for this slot
      let attempts = 0;
      let assignedFaculty: Faculty | null = null;
      let selectedSubject: Subject | null = null;

      while (
        attempts < shuffledSubjectsWithFaculty.length * 4 &&
        !assignedFaculty
      ) {
        const subject =
          shuffledSubjectsWithFaculty[
            Math.floor(Math.random() * shuffledSubjectsWithFaculty.length)
          ];

        const possibleFaculty = subjectFacultyMap[subject.id] || [];
        if (!possibleFaculty.length) {
          attempts++;
          continue;
        }

        let facultyAttempts = 0;
        while (facultyAttempts < possibleFaculty.length * 2) {
          const candidateFaculty =
            possibleFaculty[Math.floor(Math.random() * possibleFaculty.length)];

          // Check if this faculty is already teaching at this time
          const isFacultyBusy = facultyAllocations.some(
            (allocation) =>
              allocation.facultyId === candidateFaculty.id &&
              allocation.day === day &&
              allocation.periods.includes(period)
          );

          if (!isFacultyBusy) {
            assignedFaculty = candidateFaculty;
            selectedSubject = subject;
            break;
          }

          facultyAttempts++;
        }

        attempts++;
      }

      // If we couldn't find a valid subject/faculty pair, leave this slot empty
      if (!assignedFaculty || !selectedSubject) {
        continue;
      }

      entries.push({
        day,
        period,
        subjectId: selectedSubject.id,
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
