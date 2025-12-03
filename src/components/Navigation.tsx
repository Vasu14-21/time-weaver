import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Layout, Users } from "lucide-react";
import { TopHeader } from "./TopHeader";

export function Navigation() {
  return (
    <>
      <TopHeader />
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold text-foreground">Timetable</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/faculty">
                <Button variant="orange" size="sm" className="gap-2">
                  <Users className="h-4 w-4" />
                  Faculty-Subject
                </Button>
              </Link>
              <Link to="/admin">
                <Button variant="green" size="sm" className="gap-2">
                  <Layout className="h-4 w-4" />
                  Admin Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
