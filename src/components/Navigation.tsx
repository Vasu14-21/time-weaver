import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Layout } from "lucide-react";

export function Navigation() {
  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">Timetable Generator</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/admin">
              <Button variant="outline" className="gap-2">
                <Layout className="h-4 w-4" />
                Admin Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
