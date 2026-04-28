'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { HomeHeader } from './HomeHeader';

interface MainLayoutProps {
  children: React.ReactNode;
  compactHeader?: boolean;
  showAddCategory?: boolean;
  categoryId?: string;
  categoryLayout?: string;
}

export function MainLayout({
  children,
  compactHeader,
  showAddCategory,
  categoryId,
  categoryLayout,
}: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Layout: h-screen, flex-col
  //   Row 1: Header (flex-none, chiều cao cố định)
  //   Row 2: flex-1, overflow-hidden
  //     Col 1: Sidebar (w-64, h-full, overflow-y-auto)
  //     Col 2: Main   (flex-1, h-full, overflow-y-auto)

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-light-grey">
      {/* Row 1: Header — chiều cao cố định, không co giãn */}
      <div className="flex-none z-50">
        <HomeHeader
          compact={compactHeader}
          showAddCategory={showAddCategory}
          categoryId={categoryId}
          categoryLayout={categoryLayout}
          onToggleSidebar={toggleSidebar}
        />
      </div>

      {/* Row 2: Sidebar + Main — chiếm hết phần còn lại */}
      <div className="flex flex-1 min-h-0">
        {/* Col 1: Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Col 2: Main Content — scroll độc lập */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
