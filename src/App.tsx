import React from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import SitemapFlow from './siteMapGenerator';
import Website from './websitePreview'; // Import the Website component
import './App.css';

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen">
        {/* Top Navigation Bar */}
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

        {/* Main Content */}
        <div className="flex-1">
          <ReactFlowProvider>
            <Routes>
              <Route path='/' element={<SitemapFlow/>}/>
              <Route path="/sitemap" element={<SitemapFlow />} />

              <Route path="/website" element={<Website />} />
            </Routes>
          </ReactFlowProvider>
        </div>
      </div>
    </Router>
  );
}

export default App;
