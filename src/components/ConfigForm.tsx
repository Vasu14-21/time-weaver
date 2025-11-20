import React, { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigData, Faculty, Subject } from "@/types/timetable";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FacultySubjectMapping } from "@/pages/FacultyManagement";

interface ConfigFormProps {
  onComplete: (config: ConfigData) => void;
}

export function ConfigForm({ onComplete }: ConfigFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [labs, setLabs] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [skipLabs, setSkipLabs] = useState(false);
  const [facultyMappings, setFacultyMappings] = useState<FacultySubjectMapping[]>([]);

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [labName, setLabName] = useState("");
  const [labCode, setLabCode] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("facultySubjectMappings");
    if (saved) {
      try {
        setFacultyMappings(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading faculty mappings:", error);
      }
    }
  }, []);

  const handleStep1Next = () => {
    if (!year.trim()) {
      toast.error("Please select year");
      return;
    }
    if (!branch.trim()) {
      toast.error("Please enter branch name");
      return;
    }
    setCurrentStep(2);
  };

  const addSubject = () => {
    if (!subjectName.trim() || !subjectCode.trim()) {
      toast.error("Please enter subject name and code");
      return;
    }

    const newSubject: Subject = {
      id: `subject-${Date.now()}`,
      name: subjectName.trim(),
      code: subjectCode.trim(),
      isLab: false,
    };

    setSubjects([...subjects, newSubject]);
    setSubjectName("");
    setSubjectCode("");
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const addLab = () => {
    if (!labName.trim() || !labCode.trim()) {
      toast.error("Please enter lab name and code");
      return;
    }

    const newLab: Subject = {
      id: `lab-${Date.now()}`,
      name: labName.trim(),
      code: labCode.trim(),
      isLab: true,
    };

    setLabs([...labs, newLab]);
    setLabName("");
    setLabCode("");
  };

  const removeLab = (id: string) => {
    setLabs(labs.filter((l) => l.id !== id));
  };

  const handleStep2Next = () => {
    if (subjects.length === 0) {
      toast.error("Please add at least one subject");
      return;
    }
    if (skipLabs) {
      generateAndComplete();
    } else {
      setCurrentStep(3);
    }
  };

  const handleStep3Next = () => {
    if (!skipLabs && labs.length === 0) {
      toast.error("Please add at least one lab subject or go back and skip labs");
      return;
    }
    generateAndComplete();
  };

  const getFacultyForSubject = (subjectCode: string, subjectName: string): string => {
    for (const mapping of facultyMappings) {
      const matchingSubject = mapping.subjects.find(
        (s) => s.code.toLowerCase() === subjectCode.toLowerCase() ||
              s.name.toLowerCase() === subjectName.toLowerCase()
      );
      if (matchingSubject) {
        return mapping.facultyName;
      }
    }
    return "Unassigned Faculty";
  };

  const generateAndComplete = () => {
    const facultyList: Faculty[] = [];
    const allItems = [...subjects, ...labs];

    allItems.forEach((item) => {
      const facultyName = getFacultyForSubject(item.code, item.name);
      facultyList.push({
        id: `faculty-${facultyList.length + 1}`,
        name: facultyName,
        subjectId: item.id,
        subjectCode: item.code,
      });
    });

    const config: ConfigData = {
      year,
      branch: section ? `${branch}-${section}` : branch,
      section,
      faculty: facultyList,
      subjects,
      labs,
    };

    onComplete(config);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, action?: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (action) {
        action();
      } else {
        const form = e.currentTarget.form;
        if (form) {
          const inputs = Array.from(form.querySelectorAll('input:not([disabled])')) as HTMLInputElement[];
          const index = inputs.indexOf(e.currentTarget);
          if (index < inputs.length - 1) {
            inputs[index + 1].focus();
          }
        }
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Configure Timetable - Step {currentStep} of {skipLabs ? 2 : 3}</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Enter year, branch and section information"}
            {currentStep === 2 && "Add subjects for timetable"}
            {currentStep === 3 && "Add lab subjects (optional)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Year, Branch, Section */}
          {currentStep === 1 && (
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <select
                  id="year"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch *</Label>
                <Input
                  id="branch"
                  placeholder="e.g., CSE"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value.toUpperCase())}
                  onKeyDown={(e) => handleKeyDown(e)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section (Optional)</Label>
                <Input
                  id="section"
                  placeholder="e.g., A"
                  value={section}
                  onChange={(e) => setSection(e.target.value.toUpperCase())}
                  onKeyDown={(e) => handleKeyDown(e, handleStep1Next)}
                />
              </div>
              <Button onClick={handleStep1Next} className="w-full">
                Next
              </Button>
            </form>
          )}

          {/* Step 2: Add Subjects */}
          {currentStep === 2 && (
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subjectCode">Subject Code *</Label>
                    <Input
                      id="subjectCode"
                      placeholder="e.g., CS401"
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subjectName">Subject Name *</Label>
                    <Input
                      id="subjectName"
                      placeholder="e.g., Data Structures"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, addSubject)}
                    />
                  </div>
                </div>
                <Button onClick={addSubject} variant="outline" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Subject
                </Button>

                {subjects.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Added Subjects ({subjects.length})</h3>
                    <div className="space-y-2">
                      {subjects.map((subject) => (
                        <div
                          key={subject.id}
                          className="flex items-center justify-between bg-muted p-3 rounded-lg"
                        >
                          <div>
                            <span className="font-semibold">{subject.code}</span> - {subject.name}
                            <div className="text-sm text-muted-foreground">
                              Faculty: {getFacultyForSubject(subject.code, subject.name)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSubject(subject.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="skipLabs"
                    checked={skipLabs}
                    onChange={(e) => setSkipLabs(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="skipLabs" className="cursor-pointer">
                    Skip lab subjects (optional)
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handleStep2Next} className="flex-1">
                    {skipLabs ? "Generate Timetable" : "Next: Add Labs"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Step 3: Add Labs */}
          {currentStep === 3 && !skipLabs && (
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="labCode">Lab Code *</Label>
                    <Input
                      id="labCode"
                      placeholder="e.g., CS401L"
                      value={labCode}
                      onChange={(e) => setLabCode(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labName">Lab Name *</Label>
                    <Input
                      id="labName"
                      placeholder="e.g., Data Structures Lab"
                      value={labName}
                      onChange={(e) => setLabName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, addLab)}
                    />
                  </div>
                </div>
                <Button onClick={addLab} variant="outline" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Lab
                </Button>

                {labs.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Added Labs ({labs.length})</h3>
                    <div className="space-y-2">
                      {labs.map((lab) => (
                        <div
                          key={lab.id}
                          className="flex items-center justify-between bg-muted p-3 rounded-lg"
                        >
                          <div>
                            <span className="font-semibold">{lab.code}</span> - {lab.name}
                            <div className="text-sm text-muted-foreground">
                              Faculty: {getFacultyForSubject(lab.code, lab.name)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLab(lab.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleStep3Next} className="flex-1">
                  Generate Timetable
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
