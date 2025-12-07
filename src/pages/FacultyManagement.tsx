import React, { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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

const FacultyManagement = () => {
  const [facultyMappings, setFacultyMappings] = useState<FacultySubjectMapping[]>([]);
  const [newFacultyName, setNewFacultyName] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectBranch, setNewSubjectBranch] = useState("");
  const [newSubjectSection, setNewSubjectSection] = useState("");
  const [newSubjectYear, setNewSubjectYear] = useState("");
  const [newLabName, setNewLabName] = useState("");
  const [newLabCode, setNewLabCode] = useState("");
  const [newLabBranch, setNewLabBranch] = useState("");
  const [newLabSection, setNewLabSection] = useState("");
  const [newLabYear, setNewLabYear] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [addingType, setAddingType] = useState<'subject' | 'lab' | null>(null);

  useEffect(() => {
    loadFacultyMappings();
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

  const saveFacultyMappings = (mappings: FacultySubjectMapping[]) => {
    localStorage.setItem("facultySubjectMappings", JSON.stringify(mappings));
    setFacultyMappings(mappings);
    toast.success("Faculty-subject mappings saved!");
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
  };

  const addSubjectToFaculty = (facultyId: string) => {
    if (addingType === 'subject') {
      if (!newSubjectName.trim() || !newSubjectCode.trim()) {
        toast.error("Please enter both subject name and code");
        return;
      }
      if (!newSubjectBranch.trim()) {
        toast.error("Please enter branch name");
        return;
      }
      if (!newSubjectYear.trim()) {
        toast.error("Please select year");
        return;
      }

      const updated = facultyMappings.map((mapping) => {
        if (mapping.id === facultyId) {
          const newSubject = {
            id: `subject-${Date.now()}`,
            name: newSubjectName.trim(),
            code: newSubjectCode.trim(),
            branch: newSubjectBranch.trim().toUpperCase(),
            section: newSubjectSection.trim().toUpperCase(),
            year: newSubjectYear,
          };

          return {
            ...mapping,
            subjects: [...mapping.subjects, newSubject],
          };
        }
        return mapping;
      });

      saveFacultyMappings(updated);
    } else if (addingType === 'lab') {
      if (!newLabName.trim() || !newLabCode.trim()) {
        toast.error("Please enter both lab name and code");
        return;
      }
      if (!newLabBranch.trim()) {
        toast.error("Please enter branch name");
        return;
      }
      if (!newLabYear.trim()) {
        toast.error("Please select year");
        return;
      }

      const updated = facultyMappings.map((mapping) => {
        if (mapping.id === facultyId) {
          const newLab = {
            id: `lab-${Date.now()}`,
            name: newLabName.trim(),
            code: newLabCode.trim(),
            branch: newLabBranch.trim().toUpperCase(),
            section: newLabSection.trim().toUpperCase(),
            year: newLabYear,
          };

          return {
            ...mapping,
            labs: [...mapping.labs, newLab],
          };
        }
        return mapping;
      });

      saveFacultyMappings(updated);
    }

    setNewSubjectName("");
    setNewSubjectCode("");
    setNewSubjectBranch("");
    setNewSubjectSection("");
    setNewSubjectYear("");
    setNewLabName("");
    setNewLabCode("");
    setNewLabBranch("");
    setNewLabSection("");
    setNewLabYear("");
    setSelectedFacultyId(null);
    setAddingType(null);
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
  };

  const removeFaculty = (facultyId: string) => {
    const updated = facultyMappings.filter((m) => m.id !== facultyId);
    saveFacultyMappings(updated);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Faculty-Subject Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage faculty members and their teaching subjects with year, branch and section assignments. These mappings will be used for automatic faculty assignment during timetable generation.
          </p>
        </div>

        {/* Add New Faculty */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Faculty</CardTitle>
            <CardDescription>Enter faculty name to create a new entry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="facultyName">Faculty Name</Label>
                <Input
                  id="facultyName"
                  value={newFacultyName}
                  onChange={(e) => setNewFacultyName(e.target.value)}
                  placeholder="e.g., Dr. John Smith"
                  onKeyDown={(e) => e.key === "Enter" && addFaculty()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addFaculty} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Faculty
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faculty List */}
        <div className="space-y-4">
          {facultyMappings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No faculty members added yet. Add your first faculty member above.
                </p>
              </CardContent>
            </Card>
          ) : (
            facultyMappings.map((mapping) => (
              <Card key={mapping.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{mapping.facultyName}</CardTitle>
                      <CardDescription>
                        {(mapping.subjects || []).length} subject(s) • {(mapping.labs || []).length} lab(s) assigned
                      </CardDescription>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFaculty(mapping.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Subject and Lab Lists */}
                  <div className="mb-4 space-y-4">
                    {/* Theory Subjects */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Theory Subjects (SUB)</h4>
                      <div className="flex flex-wrap gap-2">
                        {(mapping.subjects || []).map((subject) => (
                          <Badge key={subject.id} variant="secondary" className="gap-2 px-3 py-1">
                            <span className="font-semibold">{subject.code}</span>
                            <span>-</span>
                            <span>{subject.name}</span>
                            <span className="text-xs opacity-70">
                              [{subject.year?.replace(" Year", "") || "?"} | {subject.branch || "?"}
                              {subject.section ? `-${subject.section}` : ''}]
                            </span>
                            <button
                              onClick={() => removeSubject(mapping.id, subject.id)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        {(mapping.subjects || []).length === 0 && (
                          <p className="text-sm text-muted-foreground">No subjects assigned yet</p>
                        )}
                      </div>
                    </div>

                    {/* Lab Subjects */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Lab Subjects (LAB - 3 hour blocks)</h4>
                      <div className="flex flex-wrap gap-2">
                        {(mapping.labs || []).map((lab) => (
                          <Badge key={lab.id} variant="outline" className="gap-2 px-3 py-1">
                            <span className="font-semibold">{lab.code}</span>
                            <span>-</span>
                            <span>{lab.name}</span>
                            <span className="text-xs opacity-70">
                              [{lab.year?.replace(" Year", "") || "?"} | {lab.branch || "?"}
                              {lab.section ? `-${lab.section}` : ''}]
                            </span>
                            <button
                              onClick={() => removeLab(mapping.id, lab.id)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        {(mapping.labs || []).length === 0 && (
                          <p className="text-sm text-muted-foreground">No labs assigned yet</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add Subject or Lab */}
                  {selectedFacultyId === mapping.id && addingType ? (
                    <div className="space-y-3 border-t pt-4">
                      {addingType === 'subject' && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Add Theory Subject</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`subjectCode-${mapping.id}`}>Subject Code *</Label>
                              <Input
                                id={`subjectCode-${mapping.id}`}
                                value={newSubjectCode}
                                onChange={(e) => setNewSubjectCode(e.target.value)}
                                placeholder="e.g., CS101"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`subjectName-${mapping.id}`}>Subject Name *</Label>
                              <Input
                                id={`subjectName-${mapping.id}`}
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                                placeholder="e.g., Data Structures"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`subjectYear-${mapping.id}`}>Year *</Label>
                              <select
                                id={`subjectYear-${mapping.id}`}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                value={newSubjectYear}
                                onChange={(e) => setNewSubjectYear(e.target.value)}
                              >
                                <option value="">Select Year</option>
                                {YEARS.map((y) => (
                                  <option key={y} value={y}>{y}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label htmlFor={`subjectBranch-${mapping.id}`}>Branch *</Label>
                              <Input
                                id={`subjectBranch-${mapping.id}`}
                                value={newSubjectBranch}
                                onChange={(e) => setNewSubjectBranch(e.target.value)}
                                placeholder="e.g., CSE"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label htmlFor={`subjectSection-${mapping.id}`}>Section</Label>
                              <Input
                                id={`subjectSection-${mapping.id}`}
                                value={newSubjectSection}
                                onChange={(e) => setNewSubjectSection(e.target.value)}
                                placeholder="e.g., A (optional)"
                                onKeyDown={(e) => e.key === "Enter" && addSubjectToFaculty(mapping.id)}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {addingType === 'lab' && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Add Lab Subject (3-hour block)</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`labCode-${mapping.id}`}>Lab Code *</Label>
                              <Input
                                id={`labCode-${mapping.id}`}
                                value={newLabCode}
                                onChange={(e) => setNewLabCode(e.target.value)}
                                placeholder="e.g., CS101L"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`labName-${mapping.id}`}>Lab Name *</Label>
                              <Input
                                id={`labName-${mapping.id}`}
                                value={newLabName}
                                onChange={(e) => setNewLabName(e.target.value)}
                                placeholder="e.g., Data Structures Lab"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`labYear-${mapping.id}`}>Year *</Label>
                              <select
                                id={`labYear-${mapping.id}`}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                value={newLabYear}
                                onChange={(e) => setNewLabYear(e.target.value)}
                              >
                                <option value="">Select Year</option>
                                {YEARS.map((y) => (
                                  <option key={y} value={y}>{y}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label htmlFor={`labBranch-${mapping.id}`}>Branch *</Label>
                              <Input
                                id={`labBranch-${mapping.id}`}
                                value={newLabBranch}
                                onChange={(e) => setNewLabBranch(e.target.value)}
                                placeholder="e.g., CSE"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label htmlFor={`labSection-${mapping.id}`}>Section</Label>
                              <Input
                                id={`labSection-${mapping.id}`}
                                value={newLabSection}
                                onChange={(e) => setNewLabSection(e.target.value)}
                                placeholder="e.g., A (optional)"
                                onKeyDown={(e) => e.key === "Enter" && addSubjectToFaculty(mapping.id)}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button onClick={() => addSubjectToFaculty(mapping.id)} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save {addingType === 'subject' ? 'Subject' : 'Lab'}
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedFacultyId(null);
                            setAddingType(null);
                            setNewSubjectName("");
                            setNewSubjectCode("");
                            setNewSubjectBranch("");
                            setNewSubjectSection("");
                            setNewSubjectYear("");
                            setNewLabName("");
                            setNewLabCode("");
                            setNewLabBranch("");
                            setNewLabSection("");
                            setNewLabYear("");
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedFacultyId(mapping.id);
                          setAddingType('subject');
                        }}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Subject
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedFacultyId(mapping.id);
                          setAddingType('lab');
                        }}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Lab
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyManagement;