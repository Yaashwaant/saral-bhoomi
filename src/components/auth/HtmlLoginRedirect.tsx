import { useEffect } from 'react';

const HtmlLoginRedirect = () => {
  useEffect(() => {
    // Use a small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      window.location.href = '/login.html';
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'sans-serif'
    }}>
      Redirecting to login page...
    </div>
  );
};

export default HtmlLoginRedirect;