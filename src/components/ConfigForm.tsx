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
  selectedLabFaculty: string[][]; // For multiple faculty per lab
  facultyErrors: string[];
}

interface ConfigFormProps {
  onComplete: (timetables: Timetable[]) => void;
  initialStep?: number;
  savedState?: ConfigFormState | null;
  onStateChange?: (state: ConfigFormState) => void;
}

export interface ConfigFormState {
  currentStep: number;
  year: string;
  selectedBranches: string[];
  branchConfigs: Record<string, BranchConfig>;
  currentBranchIndex: number;
}

const DEFAULT_BRANCHES = [
  "CSE-A", "CSE-B", "CSE-C", "CSE-D", "CSE-E", "CSE-F", "CSE-G", "CSE-H",
  "CS", "DS", "MECH", "CIVIL", "EEE-A", "EEE-B", "ECE-A", "ECE-B",
  "AIML-A", "AIML-B", "AIDS-A", "AIDS-B", "AIDS-C"
];

export function ConfigForm({ onComplete, initialStep, savedState, onStateChange }: ConfigFormProps) {
  const [currentStep, setCurrentStep] = useState(savedState?.currentStep || 1);
  const [year, setYear] = useState(savedState?.year || "");
  const [selectedBranches, setSelectedBranches] = useState<string[]>(savedState?.selectedBranches || []);
  const [branchConfigs, setBranchConfigs] = useState<Record<string, BranchConfig>>(savedState?.branchConfigs || {});
  const [facultyMappings, setFacultyMappings] = useState<FacultySubjectMapping[]>([]);
  const [customBranches, setCustomBranches] = useState<string[]>([]);
  const [currentBranchIndex, setCurrentBranchIndex] = useState(savedState?.currentBranchIndex || 0);

  // Save state whenever it changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        currentStep,
        year,
        selectedBranches,
        branchConfigs,
        currentBranchIndex,
      });
    }
  }, [currentStep, year, selectedBranches, branchConfigs, currentBranchIndex]);

  useEffect(() => {
    const loadData = () => {
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
    };

    loadData();

    // Listen for storage changes (when coming back from Faculty Management)
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", loadData);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", loadData);
    };
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
          specialPeriods: { sports: false, library: false, training: false, morningTraining: false, afternoonTraining: false },
          theoryCount: "",
          labCount: "",
          selectedFaculty: [],
          selectedLabFaculty: [],
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
        
        const fullBranch = branch.toUpperCase();
        if (itemBranch !== branchUpper && itemBranch !== fullBranch) return false;
        
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
    
    updateBranchConfig(currentBranch, {
      selectedFaculty: new Array(theory).fill(""),
      selectedLabFaculty: new Array(lab).fill([]).map(() => [""]),
      facultyErrors: new Array(theory + lab).fill(""),
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
    const newErrors = [...config.facultyErrors];
    
    if (facultyName.trim()) {
      const isValid = isFacultyValidForBranch(facultyName, branch, false);
      if (!isValid) {
        newErrors[index] = `"${facultyName}" has no subjects for ${year} ${branch}`;
        toast.error(`Invalid faculty: "${facultyName}" has no subjects for ${year} ${branch}`);
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

  const updateLabFacultySelection = (branch: string, labIndex: number, facultyIndex: number, facultyName: string) => {
    const config = branchConfigs[branch];
    const theory = parseInt(config.theoryCount);
    const errorIndex = theory + labIndex;
    const newErrors = [...config.facultyErrors];
    
    if (facultyName.trim()) {
      const isValid = isFacultyValidForBranch(facultyName, branch, true);
      if (!isValid) {
        newErrors[errorIndex] = `"${facultyName}" has no labs for ${year} ${branch}`;
        toast.error(`Invalid faculty: "${facultyName}" has no labs for ${year} ${branch}`);
        const updated = [...config.selectedLabFaculty];
        updated[labIndex][facultyIndex] = "";
        updateBranchConfig(branch, { selectedLabFaculty: updated, facultyErrors: newErrors });
        return;
      } else {
        newErrors[errorIndex] = "";
      }
    } else {
      newErrors[errorIndex] = "";
    }
    
    const updated = [...config.selectedLabFaculty];
    updated[labIndex][facultyIndex] = facultyName;
    updateBranchConfig(branch, { selectedLabFaculty: updated, facultyErrors: newErrors });
  };

  const addLabFaculty = (branch: string, labIndex: number) => {
    const config = branchConfigs[branch];
    const updated = [...config.selectedLabFaculty];
    updated[labIndex] = [...updated[labIndex], ""];
    updateBranchConfig(branch, { selectedLabFaculty: updated });
  };

  const removeLabFaculty = (branch: string, labIndex: number, facultyIndex: number) => {
    const config = branchConfigs[branch];
    if (config.selectedLabFaculty[labIndex].length <= 1) return;
    const updated = [...config.selectedLabFaculty];
    updated[labIndex] = updated[labIndex].filter((_, i) => i !== facultyIndex);
    updateBranchConfig(branch, { selectedLabFaculty: updated });
  };

  const handleStep3Next = () => {
    const currentBranch = selectedBranches[currentBranchIndex];
    const config = branchConfigs[currentBranch];
    
    // Check theory faculty
    const emptyTheory = config.selectedFaculty.filter(f => !f.trim()).length;
    if (emptyTheory > 0) {
      toast.error(`Please select all ${config.selectedFaculty.length} theory faculty members for ${currentBranch}`);
      return;
    }
    
    // Check lab faculty (at least one per lab)
    for (let i = 0; i < config.selectedLabFaculty.length; i++) {
      const hasValidFaculty = config.selectedLabFaculty[i].some(f => f.trim());
      if (!hasValidFaculty) {
        toast.error(`Please select at least one faculty for Lab ${i + 1} in ${currentBranch}`);
        return;
      }
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

      // Add theory subjects
      config.selectedFaculty.forEach((facultyName, index) => {
        const subjectDetails = getFacultySubjectDetails(facultyName, branch, false);
        
        let subjectCode = subjectDetails?.code || `SUB${index + 1}`;
        let subjectName = subjectDetails?.name || `${facultyName} Subject`;

        const subjectItem: Subject = {
          id: `subject-${Date.now()}-${index}-${branch}`,
          name: subjectName,
          code: subjectCode,
          isLab: false,
        };

        subjectsList.push(subjectItem);

        facultyList.push({
          id: `faculty-${index + 1}-${branch}`,
          name: facultyName,
          subjectId: subjectItem.id,
          subjectCode,
        });
      });

      // Add lab subjects with multiple faculty support
      config.selectedLabFaculty.forEach((facultyNames, labIndex) => {
        const validFacultyNames = facultyNames.filter(f => f.trim());
        const firstFaculty = validFacultyNames[0];
        const subjectDetails = getFacultySubjectDetails(firstFaculty, branch, true);
        
        let labCode = subjectDetails?.code || `LAB${labIndex + 1}`;
        let labName = subjectDetails?.name || `Lab ${labIndex + 1}`;

        const labItem: Subject = {
          id: `lab-${Date.now()}-${labIndex}-${branch}`,
          name: labName,
          code: labCode,
          isLab: true,
          facultyNames: validFacultyNames,
        };

        labsList.push(labItem);

        validFacultyNames.forEach((facultyName, fIndex) => {
          facultyList.push({
            id: `faculty-lab-${labIndex}-${fIndex}-${branch}`,
            name: facultyName,
            subjectId: labItem.id,
            subjectCode: labCode,
          });
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
                          Full Training Period
                        </label>
                        <p className="text-sm text-muted-foreground">
                          Mon-Wed: Morning (9:00-1:00), Thu-Sat: Afternoon (1:45-4:30)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`morningTraining-${currentBranch}`}
                        checked={currentConfig.specialPeriods.morningTraining}
                        onCheckedChange={(checked) =>
                          updateBranchConfig(currentBranch, {
                            specialPeriods: { ...currentConfig.specialPeriods, morningTraining: checked as boolean }
                          })
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor={`morningTraining-${currentBranch}`} className="text-sm font-medium">
                          Morning Half-Day Training
                        </label>
                        <p className="text-sm text-muted-foreground">
                          Mon-Wed: 9:00 to 1:00 (Afternoon normal classes)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`afternoonTraining-${currentBranch}`}
                        checked={currentConfig.specialPeriods.afternoonTraining}
                        onCheckedChange={(checked) =>
                          updateBranchConfig(currentBranch, {
                            specialPeriods: { ...currentConfig.specialPeriods, afternoonTraining: checked as boolean }
                          })
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor={`afternoonTraining-${currentBranch}`} className="text-sm font-medium">
                          Afternoon Half-Day Training
                        </label>
                        <p className="text-sm text-muted-foreground">
                          Thu-Sat: 1:45 to 4:30 (Morning normal classes)
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

                {/* Lab Subjects with Multiple Faculty Support */}
                {(parseInt(currentConfig.labCount) || 0) > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Lab Subjects</h3>
                    <p className="text-sm text-muted-foreground">
                      Labs can have multiple faculty members. Click "Add Faculty" to add more.
                    </p>
                    {getFilteredFacultyForBranch(currentBranch, true).length === 0 && (
                      <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                        No faculty found with lab subjects for {year} {currentBranch}.
                      </p>
                    )}
                    {Array.from({ length: parseInt(currentConfig.labCount) || 0 }).map((_, labIndex) => {
                      const theory = parseInt(currentConfig.theoryCount);
                      const hasError = currentConfig.facultyErrors[theory + labIndex];
                      const labFaculty = currentConfig.selectedLabFaculty[labIndex] || [""];
                      const firstFacultyDetails = labFaculty[0] ? getFacultySubjectDetails(labFaculty[0], currentBranch, true) : null;
                      
                      return (
                        <div key={`lab-${labIndex}`} className="space-y-2 p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <Label className="font-semibold">Lab Subject {labIndex + 1}</Label>
                            {firstFacultyDetails && (
                              <Badge variant="outline" className="text-xs">
                                {firstFacultyDetails.code} - {firstFacultyDetails.name}
                              </Badge>
                            )}
                          </div>
                          
                          {labFaculty.map((facultyName, fIndex) => (
                            <div key={`lab-${labIndex}-faculty-${fIndex}`} className="flex gap-2 items-center">
                              <Input
                                placeholder={`Faculty ${fIndex + 1} name`}
                                value={facultyName}
                                onChange={(e) => updateLabFacultySelection(currentBranch, labIndex, fIndex, e.target.value)}
                                list={`lab-faculty-list-${currentBranch}-${labIndex}-${fIndex}`}
                                className={hasError ? "border-destructive" : ""}
                              />
                              <datalist id={`lab-faculty-list-${currentBranch}-${labIndex}-${fIndex}`}>
                                {getFilteredFacultyForBranch(currentBranch, true).map((mapping) => (
                                  <option key={mapping.facultyName} value={mapping.facultyName} />
                                ))}
                              </datalist>
                              {labFaculty.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLabFaculty(currentBranch, labIndex, fIndex)}
                                  className="text-destructive shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addLabFaculty(currentBranch, labIndex)}
                          >
                            + Add Faculty
                          </Button>
                          
                          {hasError && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {hasError}
                            </p>
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
