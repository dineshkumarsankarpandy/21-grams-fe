import React from 'react';
import { Pencil } from 'lucide-react'; // Using pencil icon from lucide-react

interface SidebarProps {
  onOpenDialog: () => void; // Required prop to open the dialog
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenDialog }) => {
  return (
    <div className="fixed left-0 top-0 h-screen w-16 bg-black shadow-lg z-20">
      <div className="flex flex-col items-center py-4 gap-4">
        <button
          onClick={onOpenDialog}
          className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors"
          title="Edit Site Structure"
        >
          <Pencil size={24} />
        </button>
      </div>
    </div>
  );
};