import React, { useEffect, useState } from 'react';

const WebsitePreivewImg: React.FC = () => {
  const [htmlCode, setHtmlCode] = useState<string>('');

  useEffect(() => {
    // Retrieve the generated HTML code from localStorage
    const code = localStorage.getItem('websiteCode');
    if (code) {
      setHtmlCode(code);
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <iframe
        srcDoc={htmlCode}
        title="Website Preview"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
};

export default WebsitePreivewImg;
