import React, { useState, KeyboardEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfigData, Faculty, Subject, SpecialPeriods, Timetable } from "@/types/timetable";
import { AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { FacultySubjectMapping } from "@/pages/FacultyManagement";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateTimetable } from "@/utils/timetableGenerator";

interface BranchConfig {
  branch: string;
  specialPeriods: SpecialPeriods;
  theoryCount: string;
  labCount: string;
  selectedFaculty: string[];
  facultyErrors: string[];
}

interface ConfigFormProps {
  onComplete: (timetables: Timetable[]) => void;
}

const DEFAULT_BRANCHES = [
  "CSE-A", "CSE-B", "CSE-C", "CSE-D", "CSE-E", "CSE-F", "CSE-G", "CSE-H",
  "CS", "DS", "MECH", "CIVIL", "EEE-A", "EEE-B", "ECE-A", "ECE-B",
  "AIML-A", "AIML-B", "AIDS-A", "AIDS-B", "AIDS-C"
];

export function ConfigForm({ onComplete }: ConfigFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [year, setYear] = useState("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [branchConfigs, setBranchConfigs] = useState<Record<string, BranchConfig>>({});
  const [facultyMappings, setFacultyMappings] = useState<FacultySubjectMapping[]>([]);
  const [customBranches, setCustomBranches] = useState<string[]>([]);
  const [currentBranchIndex, setCurrentBranchIndex] = useState(0);

  useEffect(() => {
    const savedMappings = localStorage.getItem("facultySubjectMappings");
    if (savedMappings) {
      try {
        setFacultyMappings(JSON.parse(savedMappings));
      } catch (error) {
        console.error("Error loading faculty mappings:", error);
      }
    }

    const savedBranches = localStorage.getItem("customBranches");
    if (savedBranches) {
      try {
        setCustomBranches(JSON.parse(savedBranches));
      } catch (error) {
        console.error("Error loading custom branches:", error);
      }
    }
  }, []);

  const allBranches = [...DEFAULT_BRANCHES, ...customBranches];

  const toggleBranch = (branch: string) => {
    if (selectedBranches.includes(branch)) {
      setSelectedBranches(selectedBranches.filter(b => b !== branch));
      const newConfigs = { ...branchConfigs };
      delete newConfigs[branch];
      setBranchConfigs(newConfigs);
    } else {
      setSelectedBranches([...selectedBranches, branch]);
      setBranchConfigs({
        ...branchConfigs,
        [branch]: {
          branch,
          specialPeriods: { sports: false, library: false, training: false },
          theoryCount: "",
          labCount: "",
          selectedFaculty: [],
          facultyErrors: [],
        }
      });
    }
  };

  const updateBranchConfig = (branch: string, updates: Partial<BranchConfig>) => {
    setBranchConfigs({
      ...branchConfigs,
      [branch]: { ...branchConfigs[branch], ...updates }
    });
  };

  const handleStep1Next = () => {
    if (!year.trim()) {
      toast.error("Please select year");
      return;
    }
    if (selectedBranches.length === 0) {
      toast.error("Please select at least one branch");
      return;
    }
    setCurrentStep(2);
    setCurrentBranchIndex(0);
  };

  const getBranchName = (branch: string) => {
    // Extract branch name and section from combined string like "CSE-A"
    const parts = branch.split("-");
    if (parts.length > 1) {
      return { branchName: parts[0], section: parts.slice(1).join("-") };
    }
    return { branchName: branch, section: "" };
  };

  const getFilteredFacultyForBranch = (branch: string, isLab: boolean) => {
    const { branchName, section } = getBranchName(branch);
    const branchUpper = branchName.toUpperCase();
    const sectionUpper = section.toUpperCase();

    return facultyMappings.filter((mapping) => {
      const items = isLab ? (mapping.labs || []) : (mapping.subjects || []);
      return items.some((item) => {
        const itemBranch = (item.branch || "").toUpperCase();
        const itemSection = (item.section || "").toUpperCase();
        const itemYear = item.year || "";
        
        if (itemYear && itemYear !== year) return false;
        
        // Match branch - check if itemBranch matches or if full branch string matches
        const fullBranch = branch.toUpperCase();
        if (itemBranch !== branchUpper && itemBranch !== fullBranch) return false;
        
        // If section is provided in selection, match it
        if (sectionUpper && itemSection && itemSection !== sectionUpper) return false;
        
        return true;
      });
    });
  };

  const isFacultyValidForBranch = (facultyName: string, branch: string, isLab: boolean): boolean => {
    const { branchName, section } = getBranchName(branch);
    const branchUpper = branchName.toUpperCase();
    const sectionUpper = section.toUpperCase();

    const mapping = facultyMappings.find(m => 
      m.facultyName.toLowerCase() === facultyName.toLowerCase()
    );
    
    if (!mapping) return false;

    const items = isLab ? (mapping.labs || []) : (mapping.subjects || []);
    return items.some((item) => {
      const itemBranch = (item.branch || "").toUpperCase();
      const itemSection = (item.section || "").toUpperCase();
      const itemYear = item.year || "";
      
      if (itemYear && itemYear !== year) return false;
      
      const fullBranch = branch.toUpperCase();
      if (itemBranch !== branchUpper && itemBranch !== fullBranch) return false;
      
      if (sectionUpper && itemSection && itemSection !== sectionUpper) return false;
      
      return true;
    });
  };

  const getFacultySubjectDetails = (facultyName: string, branch: string, isLab: boolean) => {
    const { branchName, section } = getBranchName(branch);
    const branchUpper = branchName.toUpperCase();
    const sectionUpper = section.toUpperCase();

    const mapping = facultyMappings.find(m => 
      m.facultyName.toLowerCase() === facultyName.toLowerCase()
    );
    if (!mapping) return null;

    const items = isLab ? (mapping.labs || []) : (mapping.subjects || []);
    return items.find((item) => {
      const itemBranch = (item.branch || "").toUpperCase();
      const itemSection = (item.section || "").toUpperCase();
      const itemYear = item.year || "";
      
      if (itemYear && itemYear !== year) return false;
      
      const fullBranch = branch.toUpperCase();
      if (itemBranch !== branchUpper && itemBranch !== fullBranch) return false;
      
      if (sectionUpper && itemSection && itemSection !== sectionUpper) return false;
      
      return true;
    });
  };

  const handleStep2Next = () => {
    const currentBranch = selectedBranches[currentBranchIndex];
    const config = branchConfigs[currentBranch];
    
    const theory = parseInt(config.theoryCount);
    if (isNaN(theory) || theory < 1) {
      toast.error("Please enter a valid theory subject count (minimum 1)");
      return;
    }

    const lab = parseInt(config.labCount) || 0;
    const totalCount = theory + lab;
    
    updateBranchConfig(currentBranch, {
      selectedFaculty: new Array(totalCount).fill(""),
      facultyErrors: new Array(totalCount).fill(""),
    });

    if (currentBranchIndex < selectedBranches.length - 1) {
      setCurrentBranchIndex(currentBranchIndex + 1);
    } else {
      setCurrentStep(3);
      setCurrentBranchIndex(0);
    }
  };

  const updateFacultySelection = (branch: string, index: number, facultyName: string) => {
    const config = branchConfigs[branch];
    const theory = parseInt(config.theoryCount);
    const isLab = index >= theory;
    
    const newErrors = [...config.facultyErrors];
    
    if (facultyName.trim()) {
      const isValid = isFacultyValidForBranch(facultyName, branch, isLab);
      if (!isValid) {
        newErrors[index] = `"${facultyName}" has no ${isLab ? 'labs' : 'subjects'} for ${year} ${branch}`;
        toast.error(`Invalid faculty: "${facultyName}" has no ${isLab ? 'labs' : 'subjects'} for ${year} ${branch}`);
        const updated = [...config.selectedFaculty];
        updated[index] = "";
        updateBranchConfig(branch, { selectedFaculty: updated, facultyErrors: newErrors });
        return;
      } else {
        newErrors[index] = "";
      }
    } else {
      newErrors[index] = "";
    }
    
    const updated = [...config.selectedFaculty];
    updated[index] = facultyName;
    updateBranchConfig(branch, { selectedFaculty: updated, facultyErrors: newErrors });
  };

  const handleStep3Next = () => {
    const currentBranch = selectedBranches[currentBranchIndex];
    const config = branchConfigs[currentBranch];
    
    const emptyCount = config.selectedFaculty.filter(f => !f.trim()).length;
    if (emptyCount > 0) {
      toast.error(`Please select all ${config.selectedFaculty.length} faculty members for ${currentBranch}`);
      return;
    }
    
    const hasErrors = config.facultyErrors.some(e => e);
    if (hasErrors) {
      toast.error("Please fix faculty validation errors before proceeding");
      return;
    }

    if (currentBranchIndex < selectedBranches.length - 1) {
      setCurrentBranchIndex(currentBranchIndex + 1);
    } else {
      generateAllTimetables();
    }
  };

  const generateAllTimetables = () => {
    const timetables: Timetable[] = [];

    selectedBranches.forEach((branch) => {
      const config = branchConfigs[branch];
      const { branchName, section } = getBranchName(branch);
      const theory = parseInt(config.theoryCount);
      const lab = parseInt(config.labCount) || 0;
      
      const subjectsList: Subject[] = [];
      const labsList: Subject[] = [];
      const facultyList: Faculty[] = [];

      config.selectedFaculty.forEach((facultyName, index) => {
        const isLab = index >= theory;
        const subjectDetails = getFacultySubjectDetails(facultyName, branch, isLab);
        
        let subjectCode = "";
        let subjectName = "";
        
        if (subjectDetails) {
          subjectCode = subjectDetails.code;
          subjectName = subjectDetails.name;
        } else {
          if (isLab) {
            subjectCode = `LAB${index - theory + 1}`;
            subjectName = `${facultyName} Lab`;
          } else {
            subjectCode = `SUB${index + 1}`;
            subjectName = `${facultyName} Subject`;
          }
        }

        const subjectItem: Subject = {
          id: `${isLab ? 'lab' : 'subject'}-${Date.now()}-${index}-${branch}`,
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
          id: `faculty-${index + 1}-${branch}`,
          name: facultyName,
          subjectId: subjectItem.id,
          subjectCode,
        });
      });

      const configData: ConfigData = {
        year,
        branch: section ? `${branchName}-${section}` : branchName,
        section,
        faculty: facultyList,
        subjects: subjectsList,
        labs: labsList,
        specialPeriods: config.specialPeriods,
      };

      const entries = generateTimetable(subjectsList, labsList, facultyList, config.specialPeriods);
      timetables.push({ config: configData, entries });
    });

    onComplete(timetables);
  };

  const currentBranch = selectedBranches[currentBranchIndex];
  const currentConfig = currentBranch ? branchConfigs[currentBranch] : null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Configure Timetable - Step {currentStep} of 3
            {currentStep > 1 && selectedBranches.length > 1 && (
              <span className="text-sm font-normal ml-2">
                (Branch {currentBranchIndex + 1} of {selectedBranches.length}: {currentBranch})
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Select year and branches to generate timetables"}
            {currentStep === 2 && `Configure subject counts and special periods for ${currentBranch}`}
            {currentStep === 3 && `Select faculty members for ${year} ${currentBranch}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Year and Branch Selection */}
          {currentStep === 1 && (
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="1st Year">1st Year</SelectItem>
                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                    <SelectItem value="4th Year">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Branches * (can select multiple)</Label>
                <div className="flex flex-wrap gap-2 p-4 border rounded-lg max-h-[300px] overflow-y-auto">
                  {allBranches.map((branch) => (
                    <Badge
                      key={branch}
                      variant={selectedBranches.includes(branch) ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1.5 text-sm"
                      onClick={() => toggleBranch(branch)}
                    >
                      {branch}
                      {selectedBranches.includes(branch) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
                {selectedBranches.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedBranches.join(", ")}
                  </p>
                )}
              </div>

              <Button onClick={handleStep1Next} className="w-full">
                Next: Configure Each Branch
              </Button>
            </form>
          )}

          {/* Step 2: Subject Counts and Special Periods per Branch */}
          {currentStep === 2 && currentConfig && (
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Configuring: <span className="text-primary">{year} - {currentBranch}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Number of Theory Subjects *</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 5"
                    value={currentConfig.theoryCount}
                    onChange={(e) => updateBranchConfig(currentBranch, { theoryCount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Number of Lab Subjects</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g., 2 (optional)"
                    value={currentConfig.labCount}
                    onChange={(e) => updateBranchConfig(currentBranch, { labCount: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">Optional: Leave empty or 0 to skip labs</p>
                </div>

                {/* Special Periods */}
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-base font-semibold">Special Periods (Optional)</Label>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`sports-${currentBranch}`}
                        checked={currentConfig.specialPeriods.sports}
                        onCheckedChange={(checked) =>
                          updateBranchConfig(currentBranch, {
                            specialPeriods: { ...currentConfig.specialPeriods, sports: checked as boolean }
                          })
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor={`sports-${currentBranch}`} className="text-sm font-medium">
                          Sports Period
                        </label>
                        <p className="text-sm text-muted-foreground">1 period per week</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`library-${currentBranch}`}
                        checked={currentConfig.specialPeriods.library}
                        onCheckedChange={(checked) =>
                          updateBranchConfig(currentBranch, {
                            specialPeriods: { ...currentConfig.specialPeriods, library: checked as boolean }
                          })
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor={`library-${currentBranch}`} className="text-sm font-medium">
                          Library Period
                        </label>
                        <p className="text-sm text-muted-foreground">1 period per week</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`training-${currentBranch}`}
                        checked={currentConfig.specialPeriods.training}
                        onCheckedChange={(checked) =>
                          updateBranchConfig(currentBranch, {
                            specialPeriods: { ...currentConfig.specialPeriods, training: checked as boolean }
                          })
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor={`training-${currentBranch}`} className="text-sm font-medium">
                          Training Period
                        </label>
                        <p className="text-sm text-muted-foreground">
                          Mon-Wed: Morning (9:00-1:00), Thu-Sat: Afternoon (1:45-4:30)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentBranchIndex > 0) {
                      setCurrentBranchIndex(currentBranchIndex - 1);
                    } else {
                      setCurrentStep(1);
                    }
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button onClick={handleStep2Next} className="flex-1">
                  {currentBranchIndex < selectedBranches.length - 1 
                    ? `Next Branch (${selectedBranches[currentBranchIndex + 1]})` 
                    : "Next: Select Faculty"}
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Select Faculty per Branch */}
          {currentStep === 3 && currentConfig && (
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Year: <span className="text-primary">{year}</span> | 
                  Branch: <span className="text-primary">{currentBranch}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Only faculty with subjects/labs assigned to this year and branch will be accepted
                </p>
              </div>

              <div className="space-y-4">
                {/* Theory Subjects */}
                {parseInt(currentConfig.theoryCount) > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Theory Subjects</h3>
                    {getFilteredFacultyForBranch(currentBranch, false).length === 0 && (
                      <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                        No faculty found with theory subjects for {year} {currentBranch}.
                      </p>
                    )}
                    {Array.from({ length: parseInt(currentConfig.theoryCount) }).map((_, index) => {
                      const selectedName = currentConfig.selectedFaculty[index] || "";
                      const subjectDetails = selectedName ? getFacultySubjectDetails(selectedName, currentBranch, false) : null;
                      const hasError = currentConfig.facultyErrors[index];
                      
                      return (
                        <div key={`theory-${index}`} className="space-y-2">
                          <Label>Theory Subject {index + 1} - Faculty Name *</Label>
                          <Input
                            placeholder="Enter faculty name"
                            value={selectedName}
                            onChange={(e) => updateFacultySelection(currentBranch, index, e.target.value)}
                            list={`theory-faculty-list-${currentBranch}-${index}`}
                            className={hasError ? "border-destructive" : ""}
                          />
                          <datalist id={`theory-faculty-list-${currentBranch}-${index}`}>
                            {getFilteredFacultyForBranch(currentBranch, false).map((mapping) => (
                              <option key={mapping.facultyName} value={mapping.facultyName} />
                            ))}
                          </datalist>
                          {hasError && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {hasError}
                            </p>
                          )}
                          {subjectDetails && !hasError && (
                            <Badge variant="secondary" className="text-xs">
                              {subjectDetails.code} - {subjectDetails.name}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Lab Subjects */}
                {(parseInt(currentConfig.labCount) || 0) > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Lab Subjects</h3>
                    {getFilteredFacultyForBranch(currentBranch, true).length === 0 && (
                      <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                        No faculty found with lab subjects for {year} {currentBranch}.
                      </p>
                    )}
                    {Array.from({ length: parseInt(currentConfig.labCount) || 0 }).map((_, index) => {
                      const actualIndex = parseInt(currentConfig.theoryCount) + index;
                      const selectedName = currentConfig.selectedFaculty[actualIndex] || "";
                      const subjectDetails = selectedName ? getFacultySubjectDetails(selectedName, currentBranch, true) : null;
                      const hasError = currentConfig.facultyErrors[actualIndex];
                      
                      return (
                        <div key={`lab-${index}`} className="space-y-2">
                          <Label>Lab Subject {index + 1} - Faculty Name *</Label>
                          <Input
                            placeholder="Enter faculty name"
                            value={selectedName}
                            onChange={(e) => updateFacultySelection(currentBranch, actualIndex, e.target.value)}
                            list={`lab-faculty-list-${currentBranch}-${index}`}
                            className={hasError ? "border-destructive" : ""}
                          />
                          <datalist id={`lab-faculty-list-${currentBranch}-${index}`}>
                            {getFilteredFacultyForBranch(currentBranch, true).map((mapping) => (
                              <option key={mapping.facultyName} value={mapping.facultyName} />
                            ))}
                          </datalist>
                          {hasError && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {hasError}
                            </p>
                          )}
                          {subjectDetails && !hasError && (
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
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentBranchIndex > 0) {
                      setCurrentBranchIndex(currentBranchIndex - 1);
                    } else {
                      setCurrentStep(2);
                      setCurrentBranchIndex(selectedBranches.length - 1);
                    }
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button onClick={handleStep3Next} className="flex-1">
                  {currentBranchIndex < selectedBranches.length - 1 
                    ? `Next Branch (${selectedBranches[currentBranchIndex + 1]})` 
                    : "Generate Timetables"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
