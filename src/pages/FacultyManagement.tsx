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
  }>;
  labs: Array<{
    id: string;
    name: string;
    code: string;
  }>;
}

const FacultyManagement = () => {
  const [facultyMappings, setFacultyMappings] = useState<FacultySubjectMapping[]>([]);
  const [newFacultyName, setNewFacultyName] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newLabName, setNewLabName] = useState("");
  const [newLabCode, setNewLabCode] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [addingType, setAddingType] = useState<'subject' | 'lab' | null>(null);

  useEffect(() => {
    loadFacultyMappings();
  }, []);

  const loadFacultyMappings = () => {
    const saved = localStorage.getItem("facultySubjectMappings");
    if (saved) {
      try {
        setFacultyMappings(JSON.parse(saved));
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

      const updated = facultyMappings.map((mapping) => {
        if (mapping.id === facultyId) {
          const newSubject = {
            id: `subject-${Date.now()}`,
            name: newSubjectName.trim(),
            code: newSubjectCode.trim(),
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

      const updated = facultyMappings.map((mapping) => {
        if (mapping.id === facultyId) {
          const newLab = {
            id: `lab-${Date.now()}`,
            name: newLabName.trim(),
            code: newLabCode.trim(),
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
    setNewLabName("");
    setNewLabCode("");
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
            Manage faculty members and their teaching subjects. These mappings will be used for automatic faculty assignment during timetable generation.
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
                        {mapping.subjects.length} subject(s) • {mapping.labs.length} lab(s) assigned
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
                        {mapping.subjects.map((subject) => (
                          <Badge key={subject.id} variant="secondary" className="gap-2 px-3 py-1">
                            <span className="font-semibold">{subject.code}</span>
                            <span>-</span>
                            <span>{subject.name}</span>
                            <button
                              onClick={() => removeSubject(mapping.id, subject.id)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        {mapping.subjects.length === 0 && (
                          <p className="text-sm text-muted-foreground">No subjects assigned yet</p>
                        )}
                      </div>
                    </div>

                    {/* Lab Subjects */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Lab Subjects (LAB - 3 hour blocks)</h4>
                      <div className="flex flex-wrap gap-2">
                        {mapping.labs.map((lab) => (
                          <Badge key={lab.id} variant="outline" className="gap-2 px-3 py-1">
                            <span className="font-semibold">{lab.code}</span>
                            <span>-</span>
                            <span>{lab.name}</span>
                            <button
                              onClick={() => removeLab(mapping.id, lab.id)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        {mapping.labs.length === 0 && (
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
                              <Label htmlFor={`subjectCode-${mapping.id}`}>Subject Code</Label>
                              <Input
                                id={`subjectCode-${mapping.id}`}
                                value={newSubjectCode}
                                onChange={(e) => setNewSubjectCode(e.target.value)}
                                placeholder="e.g., CS101"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`subjectName-${mapping.id}`}>Subject Name</Label>
                              <Input
                                id={`subjectName-${mapping.id}`}
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                                placeholder="e.g., Data Structures"
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
                              <Label htmlFor={`labCode-${mapping.id}`}>Lab Code</Label>
                              <Input
                                id={`labCode-${mapping.id}`}
                                value={newLabCode}
                                onChange={(e) => setNewLabCode(e.target.value)}
                                placeholder="e.g., CS101L"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`labName-${mapping.id}`}>Lab Name</Label>
                              <Input
                                id={`labName-${mapping.id}`}
                                value={newLabName}
                                onChange={(e) => setNewLabName(e.target.value)}
                                placeholder="e.g., Data Structures Lab"
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
                            setNewLabName("");
                            setNewLabCode("");
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
