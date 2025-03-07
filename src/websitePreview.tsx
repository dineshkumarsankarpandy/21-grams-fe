import { useState, useRef } from 'react';
import axios from 'axios';
import { Maximize2, Minimize2 } from 'lucide-react';

const SITEMAP_STORAGE_KEY = 'sitemap_data';

function Website() {
  const [generatedWebsite, setGeneratedWebsite] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const fetchWebsiteContent = async () => {
    // Retrieve sitemap data from localStorage
    const savedDataStr = localStorage.getItem(SITEMAP_STORAGE_KEY);
    if (!savedDataStr) {
      setError('No sitemap data found. Please generate a sitemap first.');
      return;
    }
    let savedData;
    try {
      savedData = JSON.parse(savedDataStr);
    } catch (err) {
      setError('Error parsing sitemap data from localStorage.');
      return;
    }
    // Find the root node
    const rootNode = savedData.savedNodes?.find((node: any) => node.id === 'root');
    if (!rootNode) {
      setError('Root node not found in sitemap data.');
      return;
    }
    // Prepare the payload according to the expected schema:
    // {
    //   "BrandName": "string",
    //   "BusinessDescription": "string",
    //   "pageTitle": "string",
    //   "sections": [
    //     {
    //       "sectionTitle": "string",
    //       "sectionDescription": "string"
    //     }
    //   ]
    // }
    const payload = {
      pageTitle: rootNode.data.label,
      sections: rootNode.data.sections?.map((section: any) => ({
        sectionTitle: section.title || section.sectionTitle,
        sectionDescription: section.description || section.sectionDescription,
      })),
    };

    setLoading(true);
    setError(null);
    try {
      // Adjust the endpoint URL for your second API call if needed
      const res = await axios.post(
        'http://localhost:8000/website_generator/website-generator',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      setGeneratedWebsite(res.data);
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`container mx-auto p-6 transition-all duration-300 ${isFullScreen ? 'hidden' : 'block'}`}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Panel - Controls */}
          <div className="md:w-1/3 bg-white p-6 rounded-lg shadow-md">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3 text-gray-700">Website Generation</h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Generate your website from the saved sitemap. Make sure you have created a sitemap first.
                </p>
                <button
                  onClick={fetchWebsiteContent}
                  disabled={loading}
                  className="w-full bg-black hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 shadow-sm flex items-center justify-center disabled:bg-gray-600"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    'Generate Website'
                  )}
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {!loading && !error && !generatedWebsite && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-600 text-sm">Please generate a sitemap first.</p>
                </div>
              )}

              {generatedWebsite && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-600 text-sm">Website generated successfully! View the preview on the right.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="md:w-2/3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-medium text-gray-700">Website Preview</h2>
                {generatedWebsite && generatedWebsite.code && (
                  <button 
                    onClick={toggleFullScreen}
                    className="text-gray-600 hover:text-blue-600 focus:outline-none"
                    title="Toggle fullscreen"
                  >
                    <Maximize2 size={20} />
                  </button>
                )}
              </div>
              <div className="relative" style={{ height: '70vh' }} ref={previewRef}>
                {generatedWebsite && generatedWebsite.code ? (
                  <iframe
                    title="Website Preview"
                    srcDoc={generatedWebsite.code}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No website preview available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Preview */}
      {isFullScreen && generatedWebsite && generatedWebsite.code && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={toggleFullScreen}
              className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 focus:outline-none"
              title="Exit fullscreen"
            >
              <Minimize2 size={24} />
            </button>
          </div>
          <iframe
            title="Website Preview Fullscreen"
            srcDoc={generatedWebsite.code}
            className="w-full h-full border-0"
            sandbox="allow-scripts"
          />
        </div>
      )}
    </div>
  );
}

export default Website;
