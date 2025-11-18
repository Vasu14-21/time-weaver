import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigData, Faculty, Subject } from "@/types/timetable";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ConfigFormProps {
  onComplete: (config: ConfigData) => void;
}

export function ConfigForm({ onComplete }: ConfigFormProps) {
  const [step, setStep] = useState(1);
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [facultyCount, setFacultyCount] = useState("");
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [subjectCount, setSubjectCount] = useState("");
  const [labCount, setLabCount] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [labs, setLabs] = useState<Subject[]>([]);

  const handleStep1Next = () => {
    if (!branch.trim()) {
      toast.error("Please enter branch name");
      return;
    }
    setStep(2);
  };

  const handleStep2Next = () => {
    const count = parseInt(facultyCount);
    if (isNaN(count) || count < 1) {
      toast.error("Please enter valid number of faculty members");
      return;
    }
    setFacultyList(
      Array.from({ length: count }, (_, i) => ({
        id: `faculty-${i + 1}`,
        name: "",
      }))
    );
    setStep(3);
  };

  const handleStep3Next = () => {
    if (facultyList.some((f) => !f.name.trim())) {
      toast.error("Please enter all faculty names");
      return;
    }
    setStep(4);
  };

  const handleStep4Next = () => {
    const sCount = parseInt(subjectCount);
    const lCount = parseInt(labCount);
    
    if (isNaN(sCount) || sCount < 1) {
      toast.error("Please enter valid number of subjects");
      return;
    }
    if (isNaN(lCount) || lCount < 0) {
      toast.error("Please enter valid number of labs");
      return;
    }
    
    setSubjects(
      Array.from({ length: sCount }, (_, i) => ({
        id: `subject-${i + 1}`,
        name: "",
        isLab: false,
      }))
    );
    setLabs(
      Array.from({ length: lCount }, (_, i) => ({
        id: `lab-${i + 1}`,
        name: "",
        isLab: true,
      }))
    );
    setStep(5);
  };

  const handleStep5Next = () => {
    if (subjects.some((s) => !s.name.trim())) {
      toast.error("Please enter all subject names");
      return;
    }
    if (labs.some((l) => !l.name.trim())) {
      toast.error("Please enter all lab names");
      return;
    }

    const config: ConfigData = {
      branch: section ? `${branch}-${section}` : branch,
      section,
      faculty: facultyList,
      subjects,
      labs,
    };

    onComplete(config);
  };

  const updateFacultyName = (index: number, name: string) => {
    const updated = [...facultyList];
    updated[index] = { ...updated[index], name };
    setFacultyList(updated);
  };

  const updateSubjectName = (index: number, name: string) => {
    const updated = [...subjects];
    updated[index] = { ...updated[index], name };
    setSubjects(updated);
  };

  const updateLabName = (index: number, name: string) => {
    const updated = [...labs];
    updated[index] = { ...updated[index], name };
    setLabs(updated);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Configure Timetable - Step {step} of 5</CardTitle>
          <CardDescription>
            {step === 1 && "Enter branch and section information"}
            {step === 2 && "Specify number of faculty members"}
            {step === 3 && "Enter faculty names"}
            {step === 4 && "Specify number of subjects and labs"}
            {step === 5 && "Enter subject and lab names"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch *</Label>
                <Input
                  id="branch"
                  placeholder="e.g., CSE"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section (Optional)</Label>
                <Input
                  id="section"
                  placeholder="e.g., A"
                  value={section}
                  onChange={(e) => setSection(e.target.value.toUpperCase())}
                />
              </div>
              <Button onClick={handleStep1Next} className="w-full">
                Next
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facultyCount">Number of Faculty Members *</Label>
                <Input
                  id="facultyCount"
                  type="number"
                  min="1"
                  placeholder="e.g., 6"
                  value={facultyCount}
                  onChange={(e) => setFacultyCount(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleStep2Next} className="flex-1">
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-3">
                {facultyList.map((faculty, index) => (
                  <div key={faculty.id} className="space-y-2">
                    <Label htmlFor={`faculty-${index}`}>
                      Faculty {index + 1} Name *
                    </Label>
                    <Input
                      id={`faculty-${index}`}
                      placeholder="e.g., Dr. John Smith"
                      value={faculty.name}
                      onChange={(e) => updateFacultyName(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleStep3Next} className="flex-1">
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subjectCount">Number of Subjects *</Label>
                <Input
                  id="subjectCount"
                  type="number"
                  min="1"
                  placeholder="e.g., 5"
                  value={subjectCount}
                  onChange={(e) => setSubjectCount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="labCount">Number of Labs *</Label>
                <Input
                  id="labCount"
                  type="number"
                  min="0"
                  placeholder="e.g., 2"
                  value={labCount}
                  onChange={(e) => setLabCount(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleStep4Next} className="flex-1">
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              {subjects.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Subjects</h3>
                  {subjects.map((subject, index) => (
                    <div key={subject.id} className="space-y-2">
                      <Label htmlFor={`subject-${index}`}>
                        Subject {index + 1} Name *
                      </Label>
                      <Input
                        id={`subject-${index}`}
                        placeholder="e.g., Data Structures"
                        value={subject.name}
                        onChange={(e) => updateSubjectName(index, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {labs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Labs</h3>
                  {labs.map((lab, index) => (
                    <div key={lab.id} className="space-y-2">
                      <Label htmlFor={`lab-${index}`}>
                        Lab {index + 1} Name *
                      </Label>
                      <Input
                        id={`lab-${index}`}
                        placeholder="e.g., Programming Lab"
                        value={lab.name}
                        onChange={(e) => updateLabName(index, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleStep5Next} className="flex-1">
                  Generate Timetable
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
