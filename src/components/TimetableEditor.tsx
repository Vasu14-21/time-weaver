import React, { useState } from "react";
import { TimetableEntry, ConfigData } from "@/types/timetable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface TimetableEditorProps {
  isOpen: boolean;
  onClose: () => void;
  entry: TimetableEntry | null;
  day: string;
  period: number;
  config: ConfigData;
  onSave: (updatedEntry: TimetableEntry) => void;
  onDelete: () => void;
}

export function TimetableEditor({
  isOpen,
  onClose,
  entry,
  day,
  period,
  config,
  onSave,
  onDelete,
}: TimetableEditorProps) {
  const [subjectId, setSubjectId] = useState(entry?.subjectId || "");
  const [facultyId, setFacultyId] = useState(entry?.facultyId || "");

  const allSubjects = [...config.subjects, ...config.labs];

  const handleSave = () => {
    if (!subjectId || !facultyId) {
      toast.error("Please select both subject and faculty");
      return;
    }

    const updatedEntry: TimetableEntry = {
      day,
      period,
      subjectId,
      facultyId,
      isLab: config.labs.some((lab) => lab.id === subjectId),
    };

    onSave(updatedEntry);
    toast.success("Timetable updated successfully");
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    toast.success("Entry removed");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Edit Timetable Entry - {day}, Period {period}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {allSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.code} - {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="faculty">Faculty</Label>
            <Select value={facultyId} onValueChange={setFacultyId}>
              <SelectTrigger id="faculty">
                <SelectValue placeholder="Select faculty" />
              </SelectTrigger>
              <SelectContent>
                {config.faculty.map((faculty) => (
                  <SelectItem key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {entry && (
            <Button variant="destructive" onClick={handleDelete}>
              Remove Entry
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
