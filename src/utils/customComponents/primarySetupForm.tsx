import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';

interface PageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegenerate: (siteMapPrompt: string, noOfPage: number, language: string) => void;
  nodeId: string;
  onSitemapGenerated?: (sitemap: any) => void;
}

export function PrimarySetupForm({ open, onOpenChange, onRegenerate, onSitemapGenerated }: PageDialogProps) {
  const [siteMapPrompt, setSiteMapPrompt] = useState<string>('');
  const [noOfPage, setNoOfPage] = useState<number>(1);
  const [language, setLanguage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = async () => {
    // Validate inputs
    if (!siteMapPrompt.trim()) {
      setError('Sitemap Prompt is required.');
      return;
    }
    if (noOfPage <= 0) {
      setError('Number of Pages must be greater than 0.');
      return;
    }

    setLoading(true);
    setError(null);

    // Prepare the payload matching the backend SitemapGenerator model
    const payload = {
      prompt: siteMapPrompt.trim(), // Use "prompt" instead of "sitemap_prompt"
      page: noOfPage,               // Use "page" instead of "no_of_pages"
      language: language.trim() || 'english', // Trim and default to "english"
    };

    try {
      const response = await axios.post(
        'http://localhost:8000/sitemap_generator/sitemap-generator',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Sitemap generated:', response);
      if (onSitemapGenerated) {
        onSitemapGenerated(response.data);
      }

      onRegenerate(siteMapPrompt, noOfPage, language);
      setSiteMapPrompt('');
      setLanguage('');
      setNoOfPage(1);
      onOpenChange(false);
    } catch (err) {
      console.error('Error generating sitemap:', err);
      if (axios.isAxiosError(err) && err.response) {
        console.log('Backend error details:', err.response.data);
        setError(`Failed to generate sitemap: ${err.response.data.detail || 'Unknown error'}`);
      } else {
        setError('Failed to generate sitemap. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="p-4 absolute top-0 left-0 mt-4 mx-20 h-fit rounded-lg w-80 bg-white shadow-lg z-50 border-r border-gray-200"
      style={{ transition: 'transform 0.3s ease-in-out', transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
    >
      <div className="">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Sitemap</h2>
          <button onClick={() => onOpenChange(false)} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sitemap Prompt *</label>
            <textarea
              value={siteMapPrompt}
              onChange={(e) => setSiteMapPrompt(e.target.value)}
              placeholder="Enter your Business ideas"
              className="w-72 h-[120px] px-2.5 py-1.5 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Pages</label>
            <Input
              value={noOfPage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setNoOfPage(isNaN(val) ? 0 : val);
              }}
              placeholder="Enter no of pages..."
              className="w-72 h-[30px] bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <Input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="default(english)"
              className="w-72 h-[30px] bg-gray-100"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>

      <div className="py-8 pl-3">
        <Button
          size="default"
          onClick={handleRegenerate}
          className="w-64 h-[30px] text-white rounded"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Sitemap'}
        </Button>
      </div>
    </div>
  );
}
