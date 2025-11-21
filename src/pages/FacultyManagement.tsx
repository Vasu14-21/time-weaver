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
    labName?: string;
    labCode?: string;
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
    };

    const updated = [...facultyMappings, newMapping];
    saveFacultyMappings(updated);
    setNewFacultyName("");
  };

  const addSubjectToFaculty = (facultyId: string) => {
    if (!newSubjectName.trim() || !newSubjectCode.trim()) {
      toast.error("Please enter both subject name and code");
      return;
    }

    const updated = facultyMappings.map((mapping) => {
      if (mapping.id === facultyId) {
        const newSubject: any = {
          id: `subject-${Date.now()}`,
          name: newSubjectName.trim(),
          code: newSubjectCode.trim(),
        };
        
        // Add lab fields if provided
        if (newLabName.trim()) {
          newSubject.labName = newLabName.trim();
        }
        if (newLabCode.trim()) {
          newSubject.labCode = newLabCode.trim();
        }

        return {
          ...mapping,
          subjects: [...mapping.subjects, newSubject],
        };
      }
      return mapping;
    });

    saveFacultyMappings(updated);
    setNewSubjectName("");
    setNewSubjectCode("");
    setNewLabName("");
    setNewLabCode("");
    setSelectedFacultyId(null);
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
                        {mapping.subjects.length} subject(s) assigned
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
                  {/* Subject List */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {mapping.subjects.map((subject) => (
                        <div key={subject.id} className="flex flex-col gap-1">
                          <Badge variant="secondary" className="gap-2 px-3 py-1">
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
                          {(subject.labName || subject.labCode) && (
                            <Badge variant="outline" className="gap-2 px-3 py-1 text-xs">
                              <span className="font-semibold">{subject.labCode}</span>
                              <span>-</span>
                              <span>{subject.labName}</span>
                            </Badge>
                          )}
                        </div>
                      ))}
                      {mapping.subjects.length === 0 && (
                        <p className="text-sm text-muted-foreground">No subjects assigned yet</p>
                      )}
                    </div>
                  </div>

                  {/* Add Subject */}
                  {selectedFacultyId === mapping.id ? (
                    <div className="space-y-3 border-t pt-4">
                      <div className="space-y-3">
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
                        </div>
                        <div className="border-t pt-3">
                          <p className="text-sm text-muted-foreground mb-2">Lab Information (Optional)</p>
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
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => addSubjectToFaculty(mapping.id)} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save Subject
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedFacultyId(null);
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
                    <Button
                      onClick={() => setSelectedFacultyId(mapping.id)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Subject
                    </Button>
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
