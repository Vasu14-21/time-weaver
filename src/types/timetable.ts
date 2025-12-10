export interface Faculty {
  id: string;
  name: string;
  subjectId: string;
  subjectCode: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  isLab: boolean;
  facultyName?: string;
  facultyNames?: string[]; // For labs with multiple faculty
}

export interface TimeSlot {
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
}

export interface TimetableEntry {
  day: string;
  period: number;
  subjectId: string;
  facultyId: string;
  facultyIds?: string[]; // For labs with multiple faculty
  isLab?: boolean;
  isSpecial?: boolean;
  specialType?: 'sports' | 'library' | 'training' | 'morningTraining' | 'afternoonTraining';
}

export interface SpecialPeriods {
  sports: boolean;
  library: boolean;
  training: boolean;
  morningTraining?: boolean; // Mon-Wed 9:00-1:00
  afternoonTraining?: boolean; // Thu-Sat 1:40-4:30
}

export interface ConfigData {
  year: string;
  branch: string;
  section?: string;
  faculty: Faculty[];
  subjects: Subject[];
  labs: Subject[];
  specialPeriods?: SpecialPeriods;
}

export interface SavedTimetable extends Timetable {
  id: string;
  createdAt: string;
}

export interface Timetable {
  config: ConfigData;
  entries: TimetableEntry[];
}
