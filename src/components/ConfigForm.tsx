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
  const [facultyMappings, setFacultyMappings] = useState<FacultySubjectMapping[]>([]);

  const [theoryCount, setTheoryCount] = useState("");
  const [labCount, setLabCount] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<string[]>([]);

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

  const handleStep2Next = () => {
    const theory = parseInt(theoryCount);
    const lab = parseInt(labCount);
    
    if (isNaN(theory) || theory < 1) {
      toast.error("Please enter a valid theory subject count (minimum 1)");
      return;
    }
    if (isNaN(lab) || lab < 0) {
      toast.error("Please enter a valid lab subject count (0 or more)");
      return;
    }
    
    const totalCount = theory + lab;
    setSelectedFaculty(new Array(totalCount).fill(""));
    setCurrentStep(3);
  };

  const updateFacultySelection = (index: number, facultyName: string) => {
    const updated = [...selectedFaculty];
    updated[index] = facultyName;
    setSelectedFaculty(updated);
  };

  const handleStep3Next = () => {
    const emptyCount = selectedFaculty.filter(f => !f.trim()).length;
    if (emptyCount > 0) {
      toast.error(`Please select all ${selectedFaculty.length} faculty members`);
      return;
    }
    generateAndComplete();
  };

  const generateAndComplete = () => {
    const theory = parseInt(theoryCount);
    const lab = parseInt(labCount);
    
    const subjectsList: Subject[] = [];
    const labsList: Subject[] = [];
    const facultyList: Faculty[] = [];

    selectedFaculty.forEach((facultyName, index) => {
      const isLab = index >= theory;
      const mapping = facultyMappings.find(m => m.facultyName === facultyName);
      
      let subjectCode = "";
      let subjectName = "";
      
      if (isLab) {
        // For labs, check if faculty has lab mappings
        if (mapping && mapping.labs && mapping.labs.length > 0) {
          const lab = mapping.labs[0];
          subjectCode = lab.code;
          subjectName = lab.name;
        } else {
          subjectCode = `LAB${index - theory + 1}`;
          subjectName = `${facultyName} Lab`;
        }
      } else {
        // For subjects, check if faculty has subject mappings
        if (mapping && mapping.subjects && mapping.subjects.length > 0) {
          const subject = mapping.subjects[0];
          subjectCode = subject.code;
          subjectName = subject.name;
        } else {
          subjectCode = `SUB${index + 1}`;
          subjectName = `${facultyName} Subject`;
        }
      }

      const subjectItem: Subject = {
        id: `${isLab ? 'lab' : 'subject'}-${Date.now()}-${index}`,
        name: subjectName,
        code: subjectCode,
        isLab,
      };

      if (isLab) {
        labsList.push(subjectItem);
      } else {
        subjectsList.push(subjectItem);
      }

      facultyList.push({
        id: `faculty-${index + 1}`,
        name: facultyName,
        subjectId: subjectItem.id,
        subjectCode,
      });
    });

    const config: ConfigData = {
      year,
      branch: section ? `${branch}-${section}` : branch,
      section,
      faculty: facultyList,
      subjects: subjectsList,
      labs: labsList,
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
          <CardTitle>Configure Timetable - Step {currentStep} of 3</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Enter year, branch and section information"}
            {currentStep === 2 && "Enter subject counts"}
            {currentStep === 3 && "Select faculty members"}
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

          {/* Step 2: Subject Counts */}
          {currentStep === 2 && (
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theoryCount">Number of Theory Subjects *</Label>
                  <Input
                    id="theoryCount"
                    type="number"
                    min="1"
                    placeholder="e.g., 5"
                    value={theoryCount}
                    onChange={(e) => setTheoryCount(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e)}
                  />
                  <p className="text-sm text-muted-foreground">Minimum: 1 subject</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labCount">Number of Lab Subjects *</Label>
                  <Input
                    id="labCount"
                    type="number"
                    min="0"
                    placeholder="e.g., 2"
                    value={labCount}
                    onChange={(e) => setLabCount(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleStep2Next)}
                  />
                  <p className="text-sm text-muted-foreground">Optional: Enter 0 to skip labs</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleStep2Next} className="flex-1">
                  Next: Select Faculty
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Select Faculty */}
          {currentStep === 3 && (
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select faculty for {parseInt(theoryCount)} theory subject(s) and {parseInt(labCount)} lab subject(s)
                </p>
                
                {parseInt(theoryCount) > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Theory Subjects</h3>
                    {Array.from({ length: parseInt(theoryCount) }).map((_, index) => (
                      <div key={`theory-${index}`} className="space-y-2">
                        <Label htmlFor={`theory-faculty-${index}`}>
                          Theory Subject {index + 1} - Faculty Name *
                        </Label>
                        <Input
                          id={`theory-faculty-${index}`}
                          placeholder="Enter faculty name"
                          value={selectedFaculty[index] || ""}
                          onChange={(e) => updateFacultySelection(index, e.target.value)}
                          list="faculty-list"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {parseInt(labCount) > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Lab Subjects</h3>
                    {Array.from({ length: parseInt(labCount) }).map((_, index) => {
                      const actualIndex = parseInt(theoryCount) + index;
                      return (
                        <div key={`lab-${index}`} className="space-y-2">
                          <Label htmlFor={`lab-faculty-${index}`}>
                            Lab Subject {index + 1} - Faculty Name *
                          </Label>
                          <Input
                            id={`lab-faculty-${index}`}
                            placeholder="Enter faculty name"
                            value={selectedFaculty[actualIndex] || ""}
                            onChange={(e) => updateFacultySelection(actualIndex, e.target.value)}
                            list="faculty-list"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                <datalist id="faculty-list">
                  {facultyMappings.map((mapping) => (
                    <option key={mapping.facultyName} value={mapping.facultyName} />
                  ))}
                </datalist>
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
