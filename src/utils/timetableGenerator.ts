import { TimeSlot, TimetableEntry, Subject, Faculty, SpecialPeriods } from "@/types/timetable";

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

// Training slots
export const TRAINING_SLOTS = {
  morningDays: ["MON", "TUE", "WED"], // Morning training days
  afternoonDays: ["THU", "FRI", "SAT"], // Afternoon training days
  morningPeriods: [1, 2, 4, 5], // 9:00 - 1:00 (excluding breaks)
  afternoonPeriods: [7, 8, 9], // 1:45 - 4:30
};

// Faculty constraints
const MAX_CLASSES_PER_WEEK = 7;
const MAX_CLASSES_PER_DAY = 2;

interface FacultyAllocation {
  facultyId: string;
  day: string;
  periods: number[];
  isLab?: boolean;
}

interface FacultyWeeklyCount {
  [facultyId: string]: {
    totalClasses: number;
    dailyClasses: { [day: string]: number };
    labDays: string[]; // Days where faculty has a lab
  };
}

export function generateTimetable(
  subjects: Subject[],
  labs: Subject[],
  faculty: Faculty[],
  specialPeriods?: SpecialPeriods
): TimetableEntry[] {
  const entries: TimetableEntry[] = [];
  const facultyAllocations: FacultyAllocation[] = [];
  const facultyWeeklyCount: FacultyWeeklyCount = {};

  // Initialize faculty weekly count
  faculty.forEach((f) => {
    facultyWeeklyCount[f.id] = {
      totalClasses: 0,
      dailyClasses: {},
      labDays: [],
    };
    DAYS.forEach((day) => {
      facultyWeeklyCount[f.id].dailyClasses[day] = 0;
    });
  });

  // Track which slots are blocked by special periods
  const blockedSlots: Set<string> = new Set();

  // First, allocate training periods if enabled
  if (specialPeriods?.training) {
    // Morning training: Mon-Wed, 9:00-1:00
    TRAINING_SLOTS.morningDays.forEach((day) => {
      TRAINING_SLOTS.morningPeriods.forEach((period) => {
        entries.push({
          day,
          period,
          subjectId: "training",
          facultyId: "training",
          isLab: false,
          isSpecial: true,
          specialType: "training",
        });
        blockedSlots.add(`${day}-${period}`);
      });
    });

    // Afternoon training: Thu-Sat, 1:45-4:30
    TRAINING_SLOTS.afternoonDays.forEach((day) => {
      TRAINING_SLOTS.afternoonPeriods.forEach((period) => {
        entries.push({
          day,
          period,
          subjectId: "training",
          facultyId: "training",
          isLab: false,
          isSpecial: true,
          specialType: "training",
        });
        blockedSlots.add(`${day}-${period}`);
      });
    });
  }

  // Morning half-day training: Mon-Wed 9:00-1:00 (afternoons are normal classes)
  if (specialPeriods?.morningTraining && !specialPeriods?.training) {
    TRAINING_SLOTS.morningDays.forEach((day) => {
      TRAINING_SLOTS.morningPeriods.forEach((period) => {
        entries.push({
          day,
          period,
          subjectId: "morningTraining",
          facultyId: "morningTraining",
          isLab: false,
          isSpecial: true,
          specialType: "morningTraining",
        });
        blockedSlots.add(`${day}-${period}`);
      });
    });
  }

  // Afternoon half-day training: Thu-Sat 1:45-4:30 (mornings are normal classes)
  if (specialPeriods?.afternoonTraining && !specialPeriods?.training) {
    TRAINING_SLOTS.afternoonDays.forEach((day) => {
      TRAINING_SLOTS.afternoonPeriods.forEach((period) => {
        entries.push({
          day,
          period,
          subjectId: "afternoonTraining",
          facultyId: "afternoonTraining",
          isLab: false,
          isSpecial: true,
          specialType: "afternoonTraining",
        });
        blockedSlots.add(`${day}-${period}`);
      });
    });
  }

  // Allocate sports period (1 period per week)
  if (specialPeriods?.sports) {
    const availableDays = DAYS.filter((day) => {
      if (specialPeriods.training) {
        if (TRAINING_SLOTS.morningDays.includes(day)) {
          return true;
        } else {
          return true;
        }
      }
      return true;
    });

    const randomDay = availableDays[Math.floor(Math.random() * availableDays.length)];
    let randomPeriod: number;

    if (specialPeriods.training) {
      if (TRAINING_SLOTS.morningDays.includes(randomDay)) {
        const availablePeriods = [7, 8, 9];
        randomPeriod = availablePeriods[Math.floor(Math.random() * availablePeriods.length)];
      } else {
        const availablePeriods = [1, 2, 4, 5];
        randomPeriod = availablePeriods[Math.floor(Math.random() * availablePeriods.length)];
      }
    } else {
      const regularPeriods = [1, 2, 4, 5, 7, 8, 9];
      randomPeriod = regularPeriods[Math.floor(Math.random() * regularPeriods.length)];
    }

    if (!blockedSlots.has(`${randomDay}-${randomPeriod}`)) {
      entries.push({
        day: randomDay,
        period: randomPeriod,
        subjectId: "sports",
        facultyId: "sports",
        isLab: false,
        isSpecial: true,
        specialType: "sports",
      });
      blockedSlots.add(`${randomDay}-${randomPeriod}`);
    }
  }

  // Allocate library period (1 period per week)
  if (specialPeriods?.library) {
    const availableDays = DAYS.filter((day) => {
      if (specialPeriods.training) {
        return true;
      }
      return true;
    });

    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 50) {
      const randomDay = availableDays[Math.floor(Math.random() * availableDays.length)];
      let randomPeriod: number;

      if (specialPeriods.training) {
        if (TRAINING_SLOTS.morningDays.includes(randomDay)) {
          const availablePeriods = [7, 8, 9];
          randomPeriod = availablePeriods[Math.floor(Math.random() * availablePeriods.length)];
        } else {
          const availablePeriods = [1, 2, 4, 5];
          randomPeriod = availablePeriods[Math.floor(Math.random() * availablePeriods.length)];
        }
      } else {
        const regularPeriods = [1, 2, 4, 5, 7, 8, 9];
        randomPeriod = regularPeriods[Math.floor(Math.random() * regularPeriods.length)];
      }

      if (!blockedSlots.has(`${randomDay}-${randomPeriod}`)) {
        entries.push({
          day: randomDay,
          period: randomPeriod,
          subjectId: "library",
          facultyId: "library",
          isLab: false,
          isSpecial: true,
          specialType: "library",
        });
        blockedSlots.add(`${randomDay}-${randomPeriod}`);
        placed = true;
      }
      attempts++;
    }
  }

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
  const availableLabDays = DAYS.filter((day) => {
    const morningBlocked = LAB_SLOTS.morning.every((p) => blockedSlots.has(`${day}-${p}`));
    const afternoonBlocked = LAB_SLOTS.afternoon.every((p) => blockedSlots.has(`${day}-${p}`));
    return !morningBlocked || !afternoonBlocked;
  });

  const usedLabDays: string[] = [];

  for (const lab of shuffledLabsWithFaculty) {
    const remainingDays = availableLabDays.filter((d) => !usedLabDays.includes(d));
    if (remainingDays.length === 0) break;

    let assignedDay: string | null = null;
    let periods: number[] = [];

    for (const day of remainingDays.sort(() => Math.random() - 0.5)) {
      const morningAvailable = LAB_SLOTS.morning.every((p) => !blockedSlots.has(`${day}-${p}`));
      const afternoonAvailable = LAB_SLOTS.afternoon.every((p) => !blockedSlots.has(`${day}-${p}`));

      if (morningAvailable && afternoonAvailable) {
        assignedDay = day;
        periods = Math.random() > 0.5 ? LAB_SLOTS.afternoon : LAB_SLOTS.morning;
        break;
      } else if (morningAvailable) {
        assignedDay = day;
        periods = LAB_SLOTS.morning;
        break;
      } else if (afternoonAvailable) {
        assignedDay = day;
        periods = LAB_SLOTS.afternoon;
        break;
      }
    }

    if (!assignedDay) continue;
    usedLabDays.push(assignedDay);

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
          allocation.day === assignedDay &&
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
        day: assignedDay!,
        period,
        subjectId: lab.id,
        facultyId: assignedFaculty!.id,
        isLab: true,
      });
      blockedSlots.add(`${assignedDay}-${period}`);
    });

    // Mark faculty as allocated and track lab day
    facultyAllocations.push({
      facultyId: assignedFaculty.id,
      day: assignedDay,
      periods,
      isLab: true,
    });

    // Update faculty weekly count - labs count as 1 class for the constraint
    if (facultyWeeklyCount[assignedFaculty.id]) {
      facultyWeeklyCount[assignedFaculty.id].totalClasses += 1;
      facultyWeeklyCount[assignedFaculty.id].dailyClasses[assignedDay] += 1;
      facultyWeeklyCount[assignedFaculty.id].labDays.push(assignedDay);
    }
  }

  // Now allocate regular subjects to remaining slots
  const regularPeriods = [1, 2, 4, 5, 7, 8, 9];

  for (const day of DAYS) {
    for (const period of regularPeriods) {
      if (blockedSlots.has(`${day}-${period}`)) continue;

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

          // Check weekly class limit (max 7 per week)
          const weeklyCount = facultyWeeklyCount[candidateFaculty.id]?.totalClasses || 0;
          if (weeklyCount >= MAX_CLASSES_PER_WEEK) {
            facultyAttempts++;
            continue;
          }

          // Check daily class limit (max 2 per day)
          const dailyCount = facultyWeeklyCount[candidateFaculty.id]?.dailyClasses[day] || 0;
          if (dailyCount >= MAX_CLASSES_PER_DAY) {
            facultyAttempts++;
            continue;
          }

          // Check if faculty has lab on this day - if so, skip normal class allocation
          const hasLabOnDay = facultyWeeklyCount[candidateFaculty.id]?.labDays.includes(day);
          if (hasLabOnDay) {
            facultyAttempts++;
            continue;
          }

          if (!isFacultyBusy) {
            assignedFaculty = candidateFaculty;
            selectedSubject = subject;
            break;
          }

          facultyAttempts++;
        }

        attempts++;
      }

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

      // Update faculty weekly count
      if (facultyWeeklyCount[assignedFaculty.id]) {
        facultyWeeklyCount[assignedFaculty.id].totalClasses += 1;
        facultyWeeklyCount[assignedFaculty.id].dailyClasses[day] += 1;
      }
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