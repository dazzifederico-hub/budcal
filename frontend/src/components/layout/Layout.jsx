import React from 'react';
import { BottomNav } from './BottomNav';

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-gray-200 selection:text-black">
      {/* Content Area */}
      <main className="flex-1 pb-24 px-4 pt-6 max-w-md mx-auto w-full overflow-x-hidden">
        {children}
      </main>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
