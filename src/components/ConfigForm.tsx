import React, { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfigData, Faculty, Subject, SpecialPeriods } from "@/types/timetable";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FacultySubjectMapping } from "@/pages/FacultyManagement";
import { Badge } from "@/components/ui/badge";

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

  // Special periods state
  const [specialPeriods, setSpecialPeriods] = useState<SpecialPeriods>({
    sports: false,
    library: false,
    training: false,
  });

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

  // Get filtered faculty list based on branch and section
  const getFilteredFacultyForSubject = (isLab: boolean) => {
    const branchUpper = branch.toUpperCase();
    const sectionUpper = section.toUpperCase();

    return facultyMappings.filter((mapping) => {
      const items = isLab ? (mapping.labs || []) : (mapping.subjects || []);
      return items.some((item) => {
        const itemBranch = (item.branch || "").toUpperCase();
        const itemSection = (item.section || "").toUpperCase();
        
        // Match branch
        if (itemBranch !== branchUpper) return false;
        
        // If section is provided, match it; otherwise accept any
        if (sectionUpper && itemSection && itemSection !== sectionUpper) return false;
        
        return true;
      });
    });
  };

  // Get subject/lab details for a faculty based on branch/section
  const getFacultySubjectDetails = (facultyName: string, isLab: boolean) => {
    const branchUpper = branch.toUpperCase();
    const sectionUpper = section.toUpperCase();

    const mapping = facultyMappings.find(m => m.facultyName === facultyName);
    if (!mapping) return null;

    const items = isLab ? (mapping.labs || []) : (mapping.subjects || []);
    const matchedItem = items.find((item) => {
      const itemBranch = (item.branch || "").toUpperCase();
      const itemSection = (item.section || "").toUpperCase();
      
      if (itemBranch !== branchUpper) return false;
      if (sectionUpper && itemSection && itemSection !== sectionUpper) return false;
      
      return true;
    });

    return matchedItem;
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
      const subjectDetails = getFacultySubjectDetails(facultyName, isLab);
      
      let subjectCode = "";
      let subjectName = "";
      
      if (subjectDetails) {
        subjectCode = subjectDetails.code;
        subjectName = subjectDetails.name;
      } else {
        // Fallback if no mapping found
        if (isLab) {
          subjectCode = `LAB${index - theory + 1}`;
          subjectName = `${facultyName} Lab`;
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
      specialPeriods,
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

  const filteredTheoryFaculty = getFilteredFacultyForSubject(false);
  const filteredLabFaculty = getFilteredFacultyForSubject(true);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Configure Timetable - Step {currentStep} of 3</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Enter year, branch and section information"}
            {currentStep === 2 && "Enter subject counts and special periods"}
            {currentStep === 3 && `Select faculty members for ${branch}${section ? `-${section}` : ''}`}
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
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  placeholder="e.g., A (leave empty if no sections)"
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

          {/* Step 2: Subject Counts and Special Periods */}
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
                    onKeyDown={(e) => handleKeyDown(e)}
                  />
                  <p className="text-sm text-muted-foreground">Optional: Enter 0 to skip labs</p>
                </div>

                {/* Special Periods */}
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-base font-semibold">Special Periods (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Select any special periods to include in the timetable
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="sports"
                        checked={specialPeriods.sports}
                        onCheckedChange={(checked) =>
                          setSpecialPeriods({ ...specialPeriods, sports: checked as boolean })
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="sports"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Sports Period
                        </label>
                        <p className="text-sm text-muted-foreground">
                          1 period per week for sports activities
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="library"
                        checked={specialPeriods.library}
                        onCheckedChange={(checked) =>
                          setSpecialPeriods({ ...specialPeriods, library: checked as boolean })
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="library"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Library Period
                        </label>
                        <p className="text-sm text-muted-foreground">
                          1 period per week for library
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="training"
                        checked={specialPeriods.training}
                        onCheckedChange={(checked) =>
                          setSpecialPeriods({ ...specialPeriods, training: checked as boolean })
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="training"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Training Period
                        </label>
                        <p className="text-sm text-muted-foreground">
                          Mon-Wed: Morning training (9:00-1:00), Thu-Sat: Afternoon training (1:45-4:30)
                        </p>
                      </div>
                    </div>
                  </div>
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
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Branch: <span className="text-primary">{branch}</span>
                    {section && <span className="text-primary"> - {section}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only faculty with subjects/labs assigned to this branch{section ? ' and section' : ''} will be shown
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  Select faculty for {parseInt(theoryCount)} theory subject(s) and {parseInt(labCount)} lab subject(s)
                </p>
                
                {parseInt(theoryCount) > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Theory Subjects</h3>
                    {filteredTheoryFaculty.length === 0 && (
                      <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                        No faculty found with theory subjects for {branch}{section ? `-${section}` : ''}. 
                        Please add faculty-subject mappings in Faculty-Subject Management.
                      </p>
                    )}
                    {Array.from({ length: parseInt(theoryCount) }).map((_, index) => {
                      const selectedName = selectedFaculty[index] || "";
                      const subjectDetails = selectedName ? getFacultySubjectDetails(selectedName, false) : null;
                      
                      return (
                        <div key={`theory-${index}`} className="space-y-2">
                          <Label htmlFor={`theory-faculty-${index}`}>
                            Theory Subject {index + 1} - Faculty Name *
                          </Label>
                          <Input
                            id={`theory-faculty-${index}`}
                            placeholder="Enter faculty name"
                            value={selectedName}
                            onChange={(e) => updateFacultySelection(index, e.target.value)}
                            list={`theory-faculty-list-${index}`}
                          />
                          <datalist id={`theory-faculty-list-${index}`}>
                            {filteredTheoryFaculty.map((mapping) => (
                              <option key={mapping.facultyName} value={mapping.facultyName} />
                            ))}
                          </datalist>
                          {subjectDetails && (
                            <Badge variant="secondary" className="text-xs">
                              {subjectDetails.code} - {subjectDetails.name}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {parseInt(labCount) > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Lab Subjects</h3>
                    {filteredLabFaculty.length === 0 && (
                      <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                        No faculty found with lab subjects for {branch}{section ? `-${section}` : ''}. 
                        Please add faculty-lab mappings in Faculty-Subject Management.
                      </p>
                    )}
                    {Array.from({ length: parseInt(labCount) }).map((_, index) => {
                      const actualIndex = parseInt(theoryCount) + index;
                      const selectedName = selectedFaculty[actualIndex] || "";
                      const subjectDetails = selectedName ? getFacultySubjectDetails(selectedName, true) : null;
                      
                      return (
                        <div key={`lab-${index}`} className="space-y-2">
                          <Label htmlFor={`lab-faculty-${index}`}>
                            Lab Subject {index + 1} - Faculty Name *
                          </Label>
                          <Input
                            id={`lab-faculty-${index}`}
                            placeholder="Enter faculty name"
                            value={selectedName}
                            onChange={(e) => updateFacultySelection(actualIndex, e.target.value)}
                            list={`lab-faculty-list-${index}`}
                          />
                          <datalist id={`lab-faculty-list-${index}`}>
                            {filteredLabFaculty.map((mapping) => (
                              <option key={mapping.facultyName} value={mapping.facultyName} />
                            ))}
                          </datalist>
                          {subjectDetails && (
                            <Badge variant="outline" className="text-xs">
                              {subjectDetails.code} - {subjectDetails.name}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
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