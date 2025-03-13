import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegenerate: (businessName: string, businessDescription: string, siteMapPrompt: string, noOfPage: number, language: string) => void;
  nodeId: string;
  onSitemapGenerated?: (sitemap: any) => void;
  onImageGenerated?: (imageData: any) => void;
}

export function PrimarySetupForm({ open, onOpenChange, onRegenerate, onSitemapGenerated, onImageGenerated }: PageDialogProps) {
  // Sitemap state
  const [businessName, setBusinessName] = useState<string>('');
  const [businessDescription, setBusinessDescription] = useState<string>('');
  const [siteMapPrompt, setSiteMapPrompt] = useState<string>('');
  const [noOfPage, setNoOfPage] = useState<number>(1);
  const [language, setLanguage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Image state
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleRegenerate = async () => {
    if (!businessName.trim()) {
      setError('Business name required.');
      return;
    }

    if (!businessDescription.trim()) {
      setError('Business Description required.');
      return;
    }

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
      businessName: businessName.trim(),
      businessDescription: businessDescription.trim(),
      prompt: siteMapPrompt.trim(),
      page: noOfPage,         
      language: language.trim() || 'english', 
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

      onRegenerate(businessName, businessDescription, siteMapPrompt, noOfPage, language);
      setBusinessName('');
      setBusinessDescription('');
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleImageGenerate = async () => {
    if (!imageFile && !imagePrompt.trim()) {
      setImageError('Please either upload an image or provide a prompt.');
      return;
    }

    setImageLoading(true);
    setImageError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (imagePrompt) {
        formData.append('prompt', imagePrompt.trim());
      }

      // You'll need to implement the appropriate API endpoint
      const response = await axios.post(
        'http://localhost:8000/image_generator/generate',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Image generated:', response);
      if (onImageGenerated) {
        onImageGenerated(response.data);
      }

      // Reset form
      setImagePrompt('');
      setImageFile(null);
      onOpenChange(false);
    } catch (err) {
      console.error('Error generating image:', err);
      if (axios.isAxiosError(err) && err.response) {
        setImageError(`Failed to generate image: ${err.response.data.detail || 'Unknown error'}`);
      } else {
        setImageError('Failed to generate image. Please try again.');
      }
    } finally {
      setImageLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="p-4 absolute top-0 left-0 mt-4 mx-20 h-fit rounded-lg w-80 bg-white shadow-lg z-50 border-r border-gray-200"
      style={{ transition: 'transform 0.3s ease-in-out', transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
    >
      <div className="">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Generator</h2>
          <button onClick={() => onOpenChange(false)} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        <Tabs defaultValue="sitemap" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>

          <TabsContent value="sitemap" className="space-y-4">
            <div>
              <label className="block text-s font-medium text-gray-700 mb-1">Business Name</label>
              <Input 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder='Enter your Business name'
                className='w-72 h-[30px] bg-gray-100'
              />
            </div>

            <div>
              <label className="block text-s font-medium text-gray-700 mb-1">Business Description</label>
              <textarea 
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder='Enter your Business Description'
                className='w-72 h-[120px] px-2.5 py-1.5 bg-gray-100 rounded'
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sitemap Prompt *</label>
              <textarea
                value={siteMapPrompt}
                onChange={(e) => setSiteMapPrompt(e.target.value)}
                placeholder="Enter your Business ideas"
                className="w-72 h-[120px] px-2.5 py-1.5 bg-gray-100 rounded"
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
            
            <div className="py-4">
              <Button
                size="default"
                onClick={handleRegenerate}
                className="w-full h-[30px] text-white rounded"
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Sitemap'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image Prompt</label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="w-72 h-[120px] px-2.5 py-1.5 bg-gray-100 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-72 h-[30px] bg-gray-100"
              />
              {imageFile && (
                <p className="text-xs text-green-600 mt-1">File selected: {imageFile.name}</p>
              )}
            </div>
            
            {imageError && <p className="text-xs text-red-500">{imageError}</p>}
            
            <div className="py-4">
              <Button
                size="default"
                onClick={handleImageGenerate}
                className="w-full h-[30px] text-white rounded"
                disabled={imageLoading}
              >
                {imageLoading ? 'Generating...' : 'Generate Image'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}