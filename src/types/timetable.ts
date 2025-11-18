export interface Faculty {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  isLab: boolean;
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
}

export interface ConfigData {
  branch: string;
  section?: string;
  faculty: Faculty[];
  subjects: Subject[];
  labs: Subject[];
}

export interface Timetable {
  config: ConfigData;
  entries: TimetableEntry[];
}
