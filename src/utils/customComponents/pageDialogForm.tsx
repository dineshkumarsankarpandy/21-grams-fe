import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Define the props for the dialog
interface PageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegenerate: (pageName: string, pagePrompt: string) => void;
  nodeId: string;
  onUpdateLabel: (nodeId: string, newLabel: string) => void;
}

export function PageDialog({ open, onOpenChange, onRegenerate, nodeId, onUpdateLabel }: PageDialogProps) {
  const [pageName, setPageName] = useState<string>('');
  const [pagePrompt, setPagePrompt] = useState<string>('');

  // Reset fields when the dialog opens
  useEffect(() => {
    if (open) {
      setPageName('');
      setPagePrompt('');
    }
  }, [open]);

  const handleRegenerate = () => {
    if (pageName.trim()) {
      onRegenerate(pageName, pagePrompt);
      setPageName('');
      setPagePrompt('');
      onOpenChange(false);
    }
  };

  // Update the node label when Enter is pressed in the pageName input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && pageName.trim()) {
      onUpdateLabel(nodeId, pageName);
      setPageName('');
    }
  };

  if (!open) return null;

  return (
    <div 
      className="p-4 absolute top-0 right-0 mt-14 mx-20 h-fit rounded-lg w-80 bg-white shadow-lg z-50 border-r border-gray-200"
      style={{ transition: 'transform 0.3s ease-in-out', transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
    >
      <div className="">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Page</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Page name *</label>
            <Input
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter page name"
              className="w-72 h-[30px] bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Page prompt</label>
            <textarea
              value={pagePrompt}
              onChange={(e) => setPagePrompt(e.target.value)}
              placeholder="Enter your prompt here.."
              className="w-72 h-[120px] px-2.5 py-1.5 bg-gray-100"
            />
            {/* Keeping this comment consistent with PrimarySetupForm */}
            {/* <p className="mt-1 text-xs text-gray-500">Combines with the sitemap prompt.</p> */}
          </div>
        </div>
      </div>

      <div className="py-8 pl-3">
        <Button
          size="default"
          onClick={handleRegenerate}
          className="w-64 h-[30px] text-white rounded"
        >
          Regenerate page
        </Button>
      </div>
    </div>
  );
}