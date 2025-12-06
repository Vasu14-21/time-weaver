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
  isLab?: boolean;
  isSpecial?: boolean;
  specialType?: 'sports' | 'library' | 'training';
}

export interface SpecialPeriods {
  sports: boolean;
  library: boolean;
  training: boolean;
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