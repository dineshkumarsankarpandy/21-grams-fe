import React from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink, useLocation } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import SitemapFlow from './siteMapGenerator';
import Website from './websitePreview'; // existing component
import WebsitePreivewImg from './websitePreviewImg'; // new preview component
import './App.css';

const AppContent: React.FC = () => {
  const location = useLocation();
  // Hide nav bar on the website preview image page
  const hideNav = location.pathname === '/website-preview';

  return (
    <div className="flex flex-col h-screen">
      {!hideNav && (
        <nav className="bg-gray-100 p-4 flex justify-center space-x-0.5">
          <NavLink
            to="/sitemap"
            className={({ isActive }) =>
              `px-4 py-2 rounded ${isActive ? 'bg-white shadow' : 'bg-gray-300'}`
            }
          >
            Sitemap
          </NavLink>
          <NavLink
            to="/website"
            className={({ isActive }) =>
              `px-4 py-2 rounded ${isActive ? 'bg-white shadow' : 'bg-gray-300'}`
            }
          >
            Website
          </NavLink>
        </nav>
      )}

      <div className="flex-1">
        <ReactFlowProvider>
          <Routes>
            <Route path="/" element={<SitemapFlow />} />
            <Route path="/sitemap" element={<SitemapFlow />} />
            <Route path="/website" element={<Website />} />
            <Route path="/website-preview" element={<WebsitePreivewImg />} />
            <Route path="*" element={<div>Not Found</div>} />
          </Routes>
        </ReactFlowProvider>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
