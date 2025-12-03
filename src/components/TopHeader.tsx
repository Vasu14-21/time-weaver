import React from "react";

export function TopHeader() {
  return (
    <div className="w-full bg-gradient-to-r from-header-from to-header-to py-4 px-6 print:hidden">
      <div className="container mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Automatic Timetable Generator</h1>
          <p className="text-sm text-white/80">Create branch-wise timetables — conflict-safe staff assignments</p>
        </div>
        <div className="text-right text-sm text-white/80">
          <span>Mon-Sat • 55 min periods • Break 10:55-11:10 • Lunch 13:00-13:45</span>
        </div>
      </div>
    </div>
  );
}