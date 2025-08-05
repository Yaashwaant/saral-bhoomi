
import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Frown, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-lg mx-auto p-8">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Frown className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center px-4 py-2 bg-agri-primary text-white rounded-lg hover:bg-agri-primary-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
