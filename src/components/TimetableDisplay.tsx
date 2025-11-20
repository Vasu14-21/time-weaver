import React, { useState } from "react";
import { TimetableEntry, ConfigData } from "@/types/timetable";
import { DAYS, TIME_SLOTS } from "@/utils/timetableGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, Edit } from "lucide-react";
import { TimetableEditor } from "./TimetableEditor";

interface TimetableDisplayProps {
  config: ConfigData;
  entries: TimetableEntry[];
  onReset: () => void;
  onSave?: () => void;
  hideResetButton?: boolean;
  onUpdateEntry?: (updatedEntry: TimetableEntry, oldEntry?: TimetableEntry) => void;
  enableEdit?: boolean;
}

export function TimetableDisplay({ 
  config, 
  entries, 
  onReset, 
  onSave, 
  hideResetButton,
  onUpdateEntry,
  enableEdit = false
}: TimetableDisplayProps) {
  const [editingEntry, setEditingEntry] = useState<{ entry: TimetableEntry | null; day: string; period: number } | null>(null);
  const getEntry = (day: string, period: number) => {
    return entries.find((e) => e.day === day && e.period === period);
  };

  const getSubjectName = (subjectId: string) => {
    const subject = config.subjects.find((s) => s.id === subjectId);
    if (subject) return subject.name;
    const lab = config.labs.find((l) => l.id === subjectId);
    return lab?.name || "";
  };

  const getSubjectCode = (subjectId: string) => {
    const subject = config.subjects.find((s) => s.id === subjectId);
    if (subject) return subject.code;
    const lab = config.labs.find((l) => l.id === subjectId);
    return lab?.code || "";
  };

  const getFacultyName = (facultyId: string) => {
    const faculty = config.faculty.find((f) => f.id === facultyId);
    return faculty?.name || "";
  };

  const handleEditEntry = (day: string, period: number) => {
    const entry = getEntry(day, period);
    setEditingEntry({ entry: entry || null, day, period });
  };

  const handleSaveEntry = (updatedEntry: TimetableEntry) => {
    if (onUpdateEntry) {
      const oldEntry = editingEntry?.entry;
      onUpdateEntry(updatedEntry, oldEntry);
    }
    setEditingEntry(null);
  };

  const handleDeleteEntry = () => {
    if (onUpdateEntry && editingEntry?.entry) {
      onUpdateEntry(editingEntry.entry, editingEntry.entry);
    }
    setEditingEntry(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    const tableHtml = document.querySelector('table')?.outerHTML || '';
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head>
          <meta charset='utf-8'>
          <title>Timetable - ${config.branch}</title>
          <style>
            body { font-family: Calibri, Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .break-cell { background-color: #fef3c7; }
            .lab-cell { background-color: #dbeafe; }
            .subject-cell { background-color: #f0fdf4; }
          </style>
        </head>
        <body>
          <h1>Class Timetable - ${config.branch}</h1>
          ${tableHtml}
        </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Timetable-${config.branch}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const timeSlots = TIME_SLOTS.filter((slot) => !slot.isBreak);
  const displaySlots = [
    { period: 1, label: "I", time: "9:00-10:00" },
    { period: 2, label: "II", time: "10:00-10:55" },
    { period: 3, label: "Break", time: "10:55-11:10", isBreak: true },
    { period: 4, label: "III", time: "11:10-12:05" },
    { period: 5, label: "IV", time: "12:05-1:00" },
    { period: 6, label: "Lunch Break", time: "1:00-1:45", isBreak: true },
    { period: 7, label: "V", time: "1:45-2:40" },
    { period: 8, label: "VI", time: "2:40-3:35" },
    { period: 9, label: "VII", time: "3:35-4:30" },
  ];

  return (
    <div className="max-w-[95vw] mx-auto p-4 space-y-4">
      <Card>
        <CardHeader className="print:border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Class Timetable</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Branch: <span className="font-semibold">{config.branch}</span>
              </p>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button onClick={handleExportWord} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Word
              </Button>
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              {onSave && (
                <Button onClick={onSave} variant="default" size="sm">
                  Save to Admin Portal
                </Button>
              )}
              {enableEdit && (
                <Button variant="outline" size="sm" disabled className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Mode Active
                </Button>
              )}
              {!hideResetButton && (
                <Button onClick={onReset} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  New Timetable
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-sm font-semibold min-w-[80px]">
                    Day
                  </th>
                  {displaySlots.map((slot, idx) => (
                    <th
                      key={idx}
                      className={`border border-border p-2 text-sm font-semibold min-w-[120px] ${
                        slot.isBreak ? "bg-break text-break-foreground" : ""
                      }`}
                    >
                      <div>{slot.label}</div>
                      <div className="text-xs font-normal mt-1">{slot.time}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day}>
                    <td className="border border-border p-2 font-semibold bg-muted text-center">
                      {day}
                    </td>
                    {displaySlots.map((slot, idx) => {
                      if (slot.isBreak) {
                        return (
                          <td
                            key={idx}
                            className="border border-border p-2 text-center bg-break text-break-foreground"
                          >
                            <div className="text-sm font-medium">Break</div>
                          </td>
                        );
                      }

                      const entry = getEntry(day, slot.period);
                      if (!entry) {
                        return (
                          <td
                            key={idx}
                            className={`border border-border p-2 text-center ${
                              enableEdit ? "cursor-pointer hover:bg-muted/50" : ""
                            }`}
                            onClick={() => enableEdit && handleEditEntry(day, slot.period)}
                          >
                            <div className="text-xs text-muted-foreground">
                              {enableEdit ? "Click to add" : "-"}
                            </div>
                          </td>
                        );
                      }

                      const isLab = entry.isLab;
                      const bgClass = isLab
                        ? "bg-lab text-lab-foreground"
                        : "bg-subject text-subject-foreground";

                      return (
                        <td
                          key={idx}
                          className={`border border-border p-2 ${bgClass} ${
                            enableEdit ? "cursor-pointer hover:opacity-80" : ""
                          }`}
                          onClick={() => enableEdit && handleEditEntry(day, slot.period)}
                        >
                          <div className="text-xs font-semibold text-muted-foreground">
                            {getSubjectCode(entry.subjectId)}
                          </div>
                          <div className="text-sm font-semibold mt-1">
                            {getSubjectName(entry.subjectId)}
                          </div>
                          <div className="text-xs mt-1 opacity-90">
                            {getFacultyName(entry.facultyId)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-4 items-center justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-subject rounded"></div>
              <span>Subject</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-lab rounded"></div>
              <span>Lab (3 periods)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-break border border-border rounded"></div>
              <span>Break</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {editingEntry && (
        <TimetableEditor
          isOpen={true}
          onClose={() => setEditingEntry(null)}
          entry={editingEntry.entry}
          day={editingEntry.day}
          period={editingEntry.period}
          config={config}
          onSave={handleSaveEntry}
          onDelete={handleDeleteEntry}
        />
      )}
    </div>
  );
}
