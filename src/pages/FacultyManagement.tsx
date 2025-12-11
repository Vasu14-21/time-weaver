import React, { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Save, Users, Edit2, Search, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface FacultySubjectMapping {
  id: string;
  facultyName: string;
  branch?: string; // Main branch assignment
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
  "AIML-A", "AIML-B", "AIDS-A", "AIDS-B", "AIDS-C", "CYBER SECURITY"
];

const FacultyManagement = () => {
  const [facultyMappings, setFacultyMappings] = useState<FacultySubjectMapping[]>([]);
  const [customBranches, setCustomBranches] = useState<string[]>([]);
  const [newFacultyName, setNewFacultyName] = useState("");
  const [newFacultyBranch, setNewFacultyBranch] = useState("");
  const [newCustomBranch, setNewCustomBranch] = useState("");
  
  // Search and filter
  const [searchBranch, setSearchBranch] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  
  // Subject/Lab form state
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showLabForm, setShowLabForm] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    code: "", name: "", year: "", branch: "", section: ""
  });
  const [labForm, setLabForm] = useState({
    code: "", name: "", year: "", branch: "", section: ""
  });
  
  // Edit state
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingLab, setEditingLab] = useState<string | null>(null);
  const [editSubjectForm, setEditSubjectForm] = useState({
    code: "", name: "", year: "", branch: "", section: ""
  });
  const [editLabForm, setEditLabForm] = useState({
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
          branch: mapping.branch || "",
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
    if (!newFacultyBranch) {
      toast.error("Please select branch");
      return;
    }

    const newMapping: FacultySubjectMapping = {
      id: `faculty-${Date.now()}`,
      facultyName: newFacultyName.trim(),
      branch: newFacultyBranch,
      subjects: [],
      labs: [],
    };

    const updated = [...facultyMappings, newMapping];
    saveFacultyMappings(updated);
    setNewFacultyName("");
    setNewFacultyBranch("");
    toast.success("Faculty added!");
  };

  const addSubjectToFaculty = () => {
    if (!selectedFacultyId) return;
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
      if (mapping.id === selectedFacultyId) {
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
    setShowSubjectForm(false);
    toast.success("Subject added!");
  };

  const addLabToFaculty = () => {
    if (!selectedFacultyId) return;
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
      if (mapping.id === selectedFacultyId) {
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
    setShowLabForm(false);
    toast.success("Lab added!");
  };

  const updateSubject = (facultyId: string, subjectId: string) => {
    if (!editSubjectForm.code.trim() || !editSubjectForm.name.trim()) {
      toast.error("Please enter both subject code and name");
      return;
    }
    if (!editSubjectForm.year || !editSubjectForm.branch) {
      toast.error("Please fill all required fields");
      return;
    }

    const updated = facultyMappings.map((mapping) => {
      if (mapping.id === facultyId) {
        return {
          ...mapping,
          subjects: mapping.subjects.map((s) => 
            s.id === subjectId ? {
              ...s,
              code: editSubjectForm.code.trim().toUpperCase(),
              name: editSubjectForm.name.trim(),
              year: editSubjectForm.year,
              branch: editSubjectForm.branch,
              section: editSubjectForm.section.trim().toUpperCase(),
            } : s
          ),
        };
      }
      return mapping;
    });

    saveFacultyMappings(updated);
    setEditingSubject(null);
    toast.success("Subject updated!");
  };

  const updateLab = (facultyId: string, labId: string) => {
    if (!editLabForm.code.trim() || !editLabForm.name.trim()) {
      toast.error("Please enter both lab code and name");
      return;
    }
    if (!editLabForm.year || !editLabForm.branch) {
      toast.error("Please fill all required fields");
      return;
    }

    const updated = facultyMappings.map((mapping) => {
      if (mapping.id === facultyId) {
        return {
          ...mapping,
          labs: mapping.labs.map((l) => 
            l.id === labId ? {
              ...l,
              code: editLabForm.code.trim().toUpperCase(),
              name: editLabForm.name.trim(),
              year: editLabForm.year,
              branch: editLabForm.branch,
              section: editLabForm.section.trim().toUpperCase(),
            } : l
          ),
        };
      }
      return mapping;
    });

    saveFacultyMappings(updated);
    setEditingLab(null);
    toast.success("Lab updated!");
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
    if (selectedFacultyId === facultyId) {
      setSelectedFacultyId(null);
    }
    toast.success("Faculty removed!");
  };

  // Filter faculty by branch
  const filteredFaculty = searchBranch
    ? facultyMappings.filter((f) => {
        const branchMatch = f.branch?.toUpperCase().includes(searchBranch.toUpperCase());
        const subjectMatch = f.subjects.some(s => s.branch?.toUpperCase().includes(searchBranch.toUpperCase()));
        const labMatch = f.labs.some(l => l.branch?.toUpperCase().includes(searchBranch.toUpperCase()));
        return branchMatch || subjectMatch || labMatch;
      })
    : facultyMappings;

  const selectedFaculty = facultyMappings.find((f) => f.id === selectedFacultyId);

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
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Label>Faculty Name *</Label>
                <Input
                  value={newFacultyName}
                  onChange={(e) => setNewFacultyName(e.target.value)}
                  placeholder="e.g., Dr. John Smith"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label>Branch *</Label>
                <Select value={newFacultyBranch} onValueChange={setNewFacultyBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover max-h-[200px]">
                    {allBranches.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={addFaculty}>
                  <Plus className="h-4 w-4 mr-1" /> Add Faculty
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faculty Search and List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Panel: Search and Faculty List */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Faculty by Branch
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search Dropdown */}
              <div className="mb-4">
                <Select value={searchBranch || "all"} onValueChange={(val) => setSearchBranch(val === "all" ? "" : val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select branch to filter..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover max-h-[300px]">
                    <SelectItem value="all">All Branches</SelectItem>
                    {allBranches.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Faculty List */}
              <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                {filteredFaculty.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {searchBranch ? `No faculty found for "${searchBranch}"` : "No faculty members added yet"}
                  </p>
                ) : (
                  <div className="divide-y">
                    {filteredFaculty.map((mapping) => (
                      <div
                        key={mapping.id}
                        className={`p-3 cursor-pointer hover:bg-muted/50 flex items-center justify-between ${
                          selectedFacultyId === mapping.id ? "bg-primary/10 border-l-4 border-primary" : ""
                        }`}
                        onClick={() => setSelectedFacultyId(mapping.id)}
                      >
                        <div>
                          <p className="font-medium">{mapping.facultyName}</p>
                          <p className="text-xs text-muted-foreground">
                            {mapping.branch || "No branch"} • {mapping.subjects.length} subjects • {mapping.labs.length} labs
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFaculty(mapping.id);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Panel: Faculty Details */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedFaculty ? selectedFaculty.facultyName : "Select a Faculty"}
              </CardTitle>
              {selectedFaculty && (
                <CardDescription>
                  Branch: {selectedFaculty.branch || "Not assigned"}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!selectedFaculty ? (
                <p className="text-muted-foreground text-center py-8">
                  Click on a faculty member to view and edit their details
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Subjects */}
                  <div>
                    <h4 className="font-semibold mb-2">Theory Subjects</h4>
                    <div className="space-y-2">
                      {selectedFaculty.subjects.map((subject) => (
                        <div key={subject.id}>
                          {editingSubject === subject.id ? (
                            <div className="p-3 border rounded bg-card space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  placeholder="Subject Code *"
                                  value={editSubjectForm.code}
                                  onChange={(e) => setEditSubjectForm({...editSubjectForm, code: e.target.value})}
                                />
                                <Input
                                  placeholder="Subject Name *"
                                  value={editSubjectForm.name}
                                  onChange={(e) => setEditSubjectForm({...editSubjectForm, name: e.target.value})}
                                />
                                <Select value={editSubjectForm.year} onValueChange={(v) => setEditSubjectForm({...editSubjectForm, year: v})}>
                                  <SelectTrigger><SelectValue placeholder="Year *" /></SelectTrigger>
                                  <SelectContent className="bg-popover">{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                </Select>
                                <Select value={editSubjectForm.branch} onValueChange={(v) => setEditSubjectForm({...editSubjectForm, branch: v})}>
                                  <SelectTrigger><SelectValue placeholder="Branch *" /></SelectTrigger>
                                  <SelectContent className="bg-popover max-h-[200px]">{allBranches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                                </Select>
                                <Input
                                  placeholder="Section (optional)"
                                  value={editSubjectForm.section}
                                  onChange={(e) => setEditSubjectForm({...editSubjectForm, section: e.target.value})}
                                  className="col-span-2"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => updateSubject(selectedFaculty.id, subject.id)}>
                                  <Save className="h-3 w-3 mr-1" /> Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingSubject(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded text-sm">
                              <div className="flex-1 flex flex-wrap gap-2 items-center">
                                <Badge variant="outline">{subject.code}</Badge>
                                <span>{subject.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {subject.year?.replace(" Year", "")}
                                </Badge>
                                <Badge className="text-xs">{subject.branch}</Badge>
                                {subject.section && (
                                  <Badge variant="outline" className="text-xs">{subject.section}</Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditSubjectForm({
                                    code: subject.code,
                                    name: subject.name,
                                    year: subject.year || "",
                                    branch: subject.branch || "",
                                    section: subject.section || "",
                                  });
                                  setEditingSubject(subject.id);
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSubject(selectedFaculty.id, subject.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}

                      {showSubjectForm ? (
                        <div className="p-3 border rounded bg-card space-y-2">
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
                              <SelectTrigger><SelectValue placeholder="Year *" /></SelectTrigger>
                              <SelectContent className="bg-popover">{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={subjectForm.branch} onValueChange={(v) => setSubjectForm({...subjectForm, branch: v})}>
                              <SelectTrigger><SelectValue placeholder="Branch *" /></SelectTrigger>
                              <SelectContent className="bg-popover max-h-[200px]">{allBranches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                            </Select>
                            <Input
                              placeholder="Section (optional)"
                              value={subjectForm.section}
                              onChange={(e) => setSubjectForm({...subjectForm, section: e.target.value})}
                              className="col-span-2"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={addSubjectToFaculty}>
                              <Save className="h-3 w-3 mr-1" /> Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setShowSubjectForm(false);
                              setSubjectForm({ code: "", name: "", year: "", branch: "", section: "" });
                            }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setShowSubjectForm(true)} className="w-full">
                          <Plus className="h-3 w-3 mr-1" /> Add Subject Details
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Labs */}
                  <div>
                    <h4 className="font-semibold mb-2">Lab Subjects</h4>
                    <div className="space-y-2">
                      {selectedFaculty.labs.map((lab) => (
                        <div key={lab.id}>
                          {editingLab === lab.id ? (
                            <div className="p-3 border rounded bg-card space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  placeholder="Lab Code *"
                                  value={editLabForm.code}
                                  onChange={(e) => setEditLabForm({...editLabForm, code: e.target.value})}
                                />
                                <Input
                                  placeholder="Lab Name *"
                                  value={editLabForm.name}
                                  onChange={(e) => setEditLabForm({...editLabForm, name: e.target.value})}
                                />
                                <Select value={editLabForm.year} onValueChange={(v) => setEditLabForm({...editLabForm, year: v})}>
                                  <SelectTrigger><SelectValue placeholder="Year *" /></SelectTrigger>
                                  <SelectContent className="bg-popover">{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                </Select>
                                <Select value={editLabForm.branch} onValueChange={(v) => setEditLabForm({...editLabForm, branch: v})}>
                                  <SelectTrigger><SelectValue placeholder="Branch *" /></SelectTrigger>
                                  <SelectContent className="bg-popover max-h-[200px]">{allBranches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                                </Select>
                                <Input
                                  placeholder="Section (optional)"
                                  value={editLabForm.section}
                                  onChange={(e) => setEditLabForm({...editLabForm, section: e.target.value})}
                                  className="col-span-2"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => updateLab(selectedFaculty.id, lab.id)}>
                                  <Save className="h-3 w-3 mr-1" /> Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingLab(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-secondary/20 px-3 py-2 rounded text-sm">
                              <div className="flex-1 flex flex-wrap gap-2 items-center">
                                <Badge variant="outline">{lab.code}</Badge>
                                <span>{lab.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {lab.year?.replace(" Year", "")}
                                </Badge>
                                <Badge className="text-xs">{lab.branch}</Badge>
                                {lab.section && (
                                  <Badge variant="outline" className="text-xs">{lab.section}</Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditLabForm({
                                    code: lab.code,
                                    name: lab.name,
                                    year: lab.year || "",
                                    branch: lab.branch || "",
                                    section: lab.section || "",
                                  });
                                  setEditingLab(lab.id);
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLab(selectedFaculty.id, lab.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}

                      {showLabForm ? (
                        <div className="p-3 border rounded bg-card space-y-2">
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
                              <SelectTrigger><SelectValue placeholder="Year *" /></SelectTrigger>
                              <SelectContent className="bg-popover">{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={labForm.branch} onValueChange={(v) => setLabForm({...labForm, branch: v})}>
                              <SelectTrigger><SelectValue placeholder="Branch *" /></SelectTrigger>
                              <SelectContent className="bg-popover max-h-[200px]">{allBranches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                            </Select>
                            <Input
                              placeholder="Section (optional)"
                              value={labForm.section}
                              onChange={(e) => setLabForm({...labForm, section: e.target.value})}
                              className="col-span-2"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={addLabToFaculty}>
                              <Save className="h-3 w-3 mr-1" /> Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setShowLabForm(false);
                              setLabForm({ code: "", name: "", year: "", branch: "", section: "" });
                            }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setShowLabForm(true)} className="w-full">
                          <Plus className="h-3 w-3 mr-1" /> Add Lab Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FacultyManagement;
