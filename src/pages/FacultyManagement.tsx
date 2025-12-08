import React, { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Save, Users, Edit2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FacultySubjectMapping {
  id: string;
  facultyName: string;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    branch?: string;
    section?: string;
    year?: string;
  }>;
  labs: Array<{
    id: string;
    name: string;
    code: string;
    branch?: string;
    section?: string;
    year?: string;
  }>;
}

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const DEFAULT_BRANCHES = [
  "CSE-A", "CSE-B", "CSE-C", "CSE-D", "CSE-E", "CSE-F", "CSE-G", "CSE-H",
  "CS", "DS", "MECH", "CIVIL", "EEE-A", "EEE-B", "ECE-A", "ECE-B",
  "AIML-A", "AIML-B", "AIDS-A", "AIDS-B", "AIDS-C"
];

const FacultyManagement = () => {
  const [facultyMappings, setFacultyMappings] = useState<FacultySubjectMapping[]>([]);
  const [customBranches, setCustomBranches] = useState<string[]>([]);
  const [newFacultyName, setNewFacultyName] = useState("");
  const [newCustomBranch, setNewCustomBranch] = useState("");
  
  // Subject form state
  const [showSubjectForm, setShowSubjectForm] = useState<string | null>(null);
  const [showLabForm, setShowLabForm] = useState<string | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    code: "", name: "", year: "", branch: "", section: ""
  });
  const [labForm, setLabForm] = useState({
    code: "", name: "", year: "", branch: "", section: ""
  });

  useEffect(() => {
    loadFacultyMappings();
    loadCustomBranches();
  }, []);

  const loadFacultyMappings = () => {
    const saved = localStorage.getItem("facultySubjectMappings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated = parsed.map((mapping: any) => ({
          ...mapping,
          subjects: (mapping.subjects || []).map((s: any) => ({
            ...s,
            branch: s.branch || "",
            section: s.section || "",
            year: s.year || "",
          })),
          labs: (mapping.labs || []).map((l: any) => ({
            ...l,
            branch: l.branch || "",
            section: l.section || "",
            year: l.year || "",
          })),
        }));
        setFacultyMappings(migrated);
      } catch (error) {
        console.error("Error loading faculty mappings:", error);
      }
    }
  };

  const loadCustomBranches = () => {
    const saved = localStorage.getItem("customBranches");
    if (saved) {
      try {
        setCustomBranches(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading custom branches:", error);
      }
    }
  };

  const saveFacultyMappings = (mappings: FacultySubjectMapping[]) => {
    localStorage.setItem("facultySubjectMappings", JSON.stringify(mappings));
    setFacultyMappings(mappings);
  };

  const saveCustomBranches = (branches: string[]) => {
    localStorage.setItem("customBranches", JSON.stringify(branches));
    setCustomBranches(branches);
  };

  const allBranches = [...DEFAULT_BRANCHES, ...customBranches];

  const addCustomBranch = () => {
    if (!newCustomBranch.trim()) {
      toast.error("Please enter branch name");
      return;
    }
    const branchUpper = newCustomBranch.trim().toUpperCase();
    if (allBranches.includes(branchUpper)) {
      toast.error("Branch already exists");
      return;
    }
    const updated = [...customBranches, branchUpper];
    saveCustomBranches(updated);
    setNewCustomBranch("");
    toast.success(`Branch "${branchUpper}" added!`);
  };

  const removeCustomBranch = (branch: string) => {
    const updated = customBranches.filter(b => b !== branch);
    saveCustomBranches(updated);
    toast.success(`Branch "${branch}" removed!`);
  };

  const addFaculty = () => {
    if (!newFacultyName.trim()) {
      toast.error("Please enter faculty name");
      return;
    }

    const newMapping: FacultySubjectMapping = {
      id: `faculty-${Date.now()}`,
      facultyName: newFacultyName.trim(),
      subjects: [],
      labs: [],
    };

    const updated = [...facultyMappings, newMapping];
    saveFacultyMappings(updated);
    setNewFacultyName("");
    toast.success("Faculty added!");
  };

  const addSubjectToFaculty = (facultyId: string) => {
    if (!subjectForm.code.trim() || !subjectForm.name.trim()) {
      toast.error("Please enter both subject code and name");
      return;
    }
    if (!subjectForm.year) {
      toast.error("Please select year");
      return;
    }
    if (!subjectForm.branch) {
      toast.error("Please select branch");
      return;
    }

    const updated = facultyMappings.map((mapping) => {
      if (mapping.id === facultyId) {
        const newSubject = {
          id: `subject-${Date.now()}`,
          name: subjectForm.name.trim(),
          code: subjectForm.code.trim().toUpperCase(),
          branch: subjectForm.branch,
          section: subjectForm.section.trim().toUpperCase(),
          year: subjectForm.year,
        };
        return {
          ...mapping,
          subjects: [...mapping.subjects, newSubject],
        };
      }
      return mapping;
    });

    saveFacultyMappings(updated);
    setSubjectForm({ code: "", name: "", year: "", branch: "", section: "" });
    setShowSubjectForm(null);
    toast.success("Subject added!");
  };

  const addLabToFaculty = (facultyId: string) => {
    if (!labForm.code.trim() || !labForm.name.trim()) {
      toast.error("Please enter both lab code and name");
      return;
    }
    if (!labForm.year) {
      toast.error("Please select year");
      return;
    }
    if (!labForm.branch) {
      toast.error("Please select branch");
      return;
    }

    const updated = facultyMappings.map((mapping) => {
      if (mapping.id === facultyId) {
        const newLab = {
          id: `lab-${Date.now()}`,
          name: labForm.name.trim(),
          code: labForm.code.trim().toUpperCase(),
          branch: labForm.branch,
          section: labForm.section.trim().toUpperCase(),
          year: labForm.year,
        };
        return {
          ...mapping,
          labs: [...mapping.labs, newLab],
        };
      }
      return mapping;
    });

    saveFacultyMappings(updated);
    setLabForm({ code: "", name: "", year: "", branch: "", section: "" });
    setShowLabForm(null);
    toast.success("Lab added!");
  };

  const removeSubject = (facultyId: string, subjectId: string) => {
    const updated = facultyMappings.map((mapping) => {
      if (mapping.id === facultyId) {
        return {
          ...mapping,
          subjects: mapping.subjects.filter((s) => s.id !== subjectId),
        };
      }
      return mapping;
    });
    saveFacultyMappings(updated);
    toast.success("Subject removed!");
  };

  const removeLab = (facultyId: string, labId: string) => {
    const updated = facultyMappings.map((mapping) => {
      if (mapping.id === facultyId) {
        return {
          ...mapping,
          labs: mapping.labs.filter((l) => l.id !== labId),
        };
      }
      return mapping;
    });
    saveFacultyMappings(updated);
    toast.success("Lab removed!");
  };

  const removeFaculty = (facultyId: string) => {
    const updated = facultyMappings.filter((m) => m.id !== facultyId);
    saveFacultyMappings(updated);
    toast.success("Faculty removed!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 space-y-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Faculty-Subject Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage faculty members and their teaching subjects with year, branch and section assignments.
          </p>
        </div>

        {/* Add Custom Branch */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Manage Branches</CardTitle>
            <CardDescription>Add custom branches if needed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end mb-4">
              <div className="flex-1">
                <Label>New Branch Name</Label>
                <Input
                  value={newCustomBranch}
                  onChange={(e) => setNewCustomBranch(e.target.value.toUpperCase())}
                  placeholder="e.g., IT-A"
                  onKeyDown={(e) => e.key === "Enter" && addCustomBranch()}
                />
              </div>
              <Button onClick={addCustomBranch} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Branch
              </Button>
            </div>
            {customBranches.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Custom branches:</span>
                {customBranches.map((branch) => (
                  <span key={branch} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                    {branch}
                    <button onClick={() => removeCustomBranch(branch)} className="hover:text-destructive">×</button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add New Faculty */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Faculty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Faculty Name</Label>
                <Input
                  value={newFacultyName}
                  onChange={(e) => setNewFacultyName(e.target.value)}
                  placeholder="e.g., Dr. John Smith"
                  onKeyDown={(e) => e.key === "Enter" && addFaculty()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addFaculty}>
                  <Plus className="h-4 w-4 mr-1" /> Add Faculty
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faculty Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Faculty List</CardTitle>
            <CardDescription>All faculty members and their assigned subjects/labs</CardDescription>
          </CardHeader>
          <CardContent>
            {facultyMappings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No faculty members added yet. Add your first faculty member above.
              </p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[200px]">Faculty Name</TableHead>
                      <TableHead>Subjects (Theory)</TableHead>
                      <TableHead>Labs</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facultyMappings.map((mapping) => (
                      <TableRow key={mapping.id}>
                        <TableCell className="font-medium align-top">
                          {mapping.facultyName}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-2">
                            {mapping.subjects.map((subject) => (
                              <div key={subject.id} className="flex items-center gap-2 bg-primary/10 px-2 py-1 rounded text-sm">
                                <span className="font-semibold">{subject.code}</span>
                                <span>-</span>
                                <span>{subject.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  [{subject.year?.replace(" Year", "")} | {subject.branch}{subject.section ? `-${subject.section}` : ''}]
                                </span>
                                <button onClick={() => removeSubject(mapping.id, subject.id)} className="ml-auto text-destructive hover:text-destructive/80">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            {showSubjectForm === mapping.id ? (
                              <div className="space-y-2 p-2 border rounded bg-card">
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Subject Code *"
                                    value={subjectForm.code}
                                    onChange={(e) => setSubjectForm({...subjectForm, code: e.target.value})}
                                  />
                                  <Input
                                    placeholder="Subject Name *"
                                    value={subjectForm.name}
                                    onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
                                  />
                                  <Select value={subjectForm.year} onValueChange={(v) => setSubjectForm({...subjectForm, year: v})}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Year *" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover">
                                      {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <Select value={subjectForm.branch} onValueChange={(v) => setSubjectForm({...subjectForm, branch: v})}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Branch *" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover max-h-[200px]">
                                      {allBranches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    placeholder="Section (optional)"
                                    value={subjectForm.section}
                                    onChange={(e) => setSubjectForm({...subjectForm, section: e.target.value})}
                                    className="col-span-2"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => addSubjectToFaculty(mapping.id)}>
                                    <Save className="h-3 w-3 mr-1" /> Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => {
                                    setShowSubjectForm(null);
                                    setSubjectForm({ code: "", name: "", year: "", branch: "", section: "" });
                                  }}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => setShowSubjectForm(mapping.id)}>
                                <Plus className="h-3 w-3 mr-1" /> Add Subject
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-2">
                            {mapping.labs.map((lab) => (
                              <div key={lab.id} className="flex items-center gap-2 bg-secondary/20 px-2 py-1 rounded text-sm">
                                <span className="font-semibold">{lab.code}</span>
                                <span>-</span>
                                <span>{lab.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  [{lab.year?.replace(" Year", "")} | {lab.branch}{lab.section ? `-${lab.section}` : ''}]
                                </span>
                                <button onClick={() => removeLab(mapping.id, lab.id)} className="ml-auto text-destructive hover:text-destructive/80">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            {showLabForm === mapping.id ? (
                              <div className="space-y-2 p-2 border rounded bg-card">
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Lab Code *"
                                    value={labForm.code}
                                    onChange={(e) => setLabForm({...labForm, code: e.target.value})}
                                  />
                                  <Input
                                    placeholder="Lab Name *"
                                    value={labForm.name}
                                    onChange={(e) => setLabForm({...labForm, name: e.target.value})}
                                  />
                                  <Select value={labForm.year} onValueChange={(v) => setLabForm({...labForm, year: v})}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Year *" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover">
                                      {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <Select value={labForm.branch} onValueChange={(v) => setLabForm({...labForm, branch: v})}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Branch *" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover max-h-[200px]">
                                      {allBranches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    placeholder="Section (optional)"
                                    value={labForm.section}
                                    onChange={(e) => setLabForm({...labForm, section: e.target.value})}
                                    className="col-span-2"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => addLabToFaculty(mapping.id)}>
                                    <Save className="h-3 w-3 mr-1" /> Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => {
                                    setShowLabForm(null);
                                    setLabForm({ code: "", name: "", year: "", branch: "", section: "" });
                                  }}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => setShowLabForm(mapping.id)}>
                                <Plus className="h-3 w-3 mr-1" /> Add Lab
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeFaculty(mapping.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacultyManagement;
