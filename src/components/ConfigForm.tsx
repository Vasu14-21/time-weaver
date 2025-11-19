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
        code: "",
        isLab: false,
        facultyName: "",
      }))
    );
    setLabs(
      Array.from({ length: lCount }, (_, i) => ({
        id: `lab-${i + 1}`,
        name: "",
        code: "",
        isLab: true,
        facultyName: "",
      }))
    );
    setStep(3);
  };

  const handleStep3Next = () => {
    if (subjects.some((s) => !s.name.trim() || !s.code.trim() || !s.facultyName?.trim())) {
      toast.error("Please enter all subject details including faculty name");
      return;
    }
    if (labs.some((l) => !l.name.trim() || !l.code.trim() || !l.facultyName?.trim())) {
      toast.error("Please enter all lab details including faculty name");
      return;
    }

    // Build faculty list from subjects and labs
    // Each faculty-subject/lab combination gets a separate entry
    const facultyList: Faculty[] = [];
    const allItems = [...subjects, ...labs];
    
    allItems.forEach((item) => {
      const facultyName = item.facultyName!;
      facultyList.push({
        id: `faculty-${facultyList.length + 1}`,
        name: facultyName,
        subjectId: item.id,
        subjectCode: item.code,
      });
    });

    const config: ConfigData = {
      branch: section ? `${branch}-${section}` : branch,
      section,
      faculty: facultyList,
      subjects,
      labs,
    };

    onComplete(config);
  };

  const updateSubject = (index: number, field: 'name' | 'code' | 'facultyName', value: string) => {
    const updated = [...subjects];
    updated[index] = { ...updated[index], [field]: value };
    setSubjects(updated);
  };

  const updateLab = (index: number, field: 'name' | 'code' | 'facultyName', value: string) => {
    const updated = [...labs];
    updated[index] = { ...updated[index], [field]: value };
    setLabs(updated);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Configure Timetable - Step {step} of 3</CardTitle>
          <CardDescription>
            {step === 1 && "Enter branch and section information"}
            {step === 2 && "Specify number of subjects and labs"}
            {step === 3 && "Enter subject, lab, and faculty details"}
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
              {subjects.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Subjects</h3>
                  {subjects.map((subject, index) => (
                    <div key={subject.id} className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor={`subject-${index}`}>
                          Subject {index + 1} Name *
                        </Label>
                        <Input
                          id={`subject-${index}`}
                          placeholder="e.g., IoT"
                          value={subject.name}
                          onChange={(e) => updateSubject(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`subject-code-${index}`}>
                          Subject Code *
                        </Label>
                        <Input
                          id={`subject-code-${index}`}
                          placeholder="e.g., CS401"
                          value={subject.code}
                          onChange={(e) => updateSubject(index, 'code', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`subject-faculty-${index}`}>
                          Faculty Name *
                        </Label>
                        <Input
                          id={`subject-faculty-${index}`}
                          placeholder="e.g., Raj"
                          value={subject.facultyName || ""}
                          onChange={(e) => updateSubject(index, 'facultyName', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {labs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Labs</h3>
                  {labs.map((lab, index) => (
                    <div key={lab.id} className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor={`lab-${index}`}>
                          Lab {index + 1} Name *
                        </Label>
                        <Input
                          id={`lab-${index}`}
                          placeholder="e.g., IoT Lab"
                          value={lab.name}
                          onChange={(e) => updateLab(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`lab-code-${index}`}>
                          Lab Code *
                        </Label>
                        <Input
                          id={`lab-code-${index}`}
                          placeholder="e.g., CS401L"
                          value={lab.code}
                          onChange={(e) => updateLab(index, 'code', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`lab-faculty-${index}`}>
                          Faculty Name *
                        </Label>
                        <Input
                          id={`lab-faculty-${index}`}
                          placeholder="e.g., Raj"
                          value={lab.facultyName || ""}
                          onChange={(e) => updateLab(index, 'facultyName', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleStep3Next} className="flex-1">
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
