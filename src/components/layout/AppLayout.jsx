import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary selection:bg-status-info/20 selection:text-text-primary">
      {/* Sticky Navbar */}
      <Navbar />

      {/* Main Content Container */}
      <main className="flex-1 flex flex-col w-full relative">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
