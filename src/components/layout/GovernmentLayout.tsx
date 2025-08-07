import React from 'react';
import { Phone, Mail, LogOut, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import collectorOfficeImage from '../../assets/images/collector-office.jpeg';
import emblemOfIndia from '../../assets/images/emblem-of-india.png';

interface GovernmentLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const GovernmentLayout: React.FC<GovernmentLayoutProps> = ({ 
  children, 
  title = "SARAL Bhoomi",
  subtitle = "System for Automated Resourceful Acquisition of Land"
}) => {
  const { logout, user, switchLanguage } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleLanguageChange = (language: 'marathi' | 'english' | 'hindi') => {
    switchLanguage(language);
  };

  const getLanguageText = (language: string) => {
    const languageMap = {
      marathi: 'मराठी',
      english: 'English',
      hindi: 'हिंदी'
    };
    return languageMap[language] || language;
  };

  const getGovernmentText = () => {
    const texts = {
      marathi: 'महाराष्ट्र शासन',
      english: 'Government of Maharashtra',
      hindi: 'महाराष्ट्र सरकार'
    };
    return texts[user?.language || 'marathi'] || texts.marathi;
  };

  const getDistrictText = () => {
    const texts = {
      marathi: 'पालघर',
      english: 'Palghar',
      hindi: 'पालघर'
    };
    return texts[user?.language || 'marathi'] || texts.marathi;
  };

  const getDashboardText = () => {
    const texts = {
      marathi: 'डॅशबोर्ड',
      english: 'Dashboard',
      hindi: 'डैशबोर्ड'
    };
    return texts[user?.language || 'marathi'] || texts.english;
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 relative">
      {/* Blurred Background Image */}
      <div className="fixed inset-0 z-0">
        <img 
          src={collectorOfficeImage} 
          alt="Collector Office Background" 
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white/70 to-orange-50/40"></div>
      </div>

      {/* Government Header */}
      <header className="relative z-10 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white shadow-xl border-b-4 border-orange-500">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
                         {/* Left Section - Government Branding */}
             <div className="flex items-center space-x-6">
               {/* Emblem of India */}
               <div className="flex items-center space-x-3">
                 <div className="relative">
                   <img 
                     src={emblemOfIndia} 
                     alt="Emblem of India" 
                     className="h-16 w-20 drop-shadow-lg"
                   />
                 </div>
                                   <div className="border-l-2 border-orange-400 pl-3">
                    <h1 className="text-2xl font-bold tracking-wide text-white" style={{ 
                      fontFamily: "'Noto Sans', 'Arial', sans-serif",
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}>{getGovernmentText()}</h1>
                  </div>
               </div>

                               {/* Separator */}
                <div className="h-12 w-px bg-gradient-to-b from-orange-400 via-blue-400 to-orange-400"></div>

                                 {/* District Information */}
                 <div className="text-center">
                   <h2 className="text-lg font-bold text-orange-400 drop-shadow-sm" style={{ 
                     fontFamily: "'Noto Sans', 'Arial', sans-serif",
                     fontWeight: 600,
                     letterSpacing: '0.3px',
                     textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                   }}>{getDistrictText()}</h2>
                 </div>

                {/* Separator */}
                <div className="h-12 w-px bg-gradient-to-b from-orange-400 via-blue-400 to-orange-400"></div>

                                 {/* Dashboard */}
                 <div className="text-center">
                   <h3 className="text-base font-medium text-white drop-shadow-sm" style={{ 
                     fontFamily: "'Noto Sans', 'Arial', sans-serif",
                     fontWeight: 500,
                     letterSpacing: '0.2px',
                     textShadow: '0 1px 1px rgba(0,0,0,0.1)'
                   }}>{getDashboardText()}</h3>
                 </div>


             </div>

                         {/* Right Section - Additional Info */}
             <div className="flex items-center space-x-6">
               {/* Contact Info */}
               <div className="text-right border-l-2 border-blue-600 pl-4">
                 <div className="flex items-center space-x-2 text-blue-200">
                   <Phone className="h-3 w-3" />
                   <span className="text-xs">02528-220180</span>
                 </div>
                 <div className="flex items-center space-x-2 text-blue-200">
                   <Mail className="h-3 w-3" />
                   <span className="text-xs">desplandacquisition@gmail.com</span>
                 </div>
               </div>

               {/* Separator */}
               <div className="h-12 w-px bg-gradient-to-b from-orange-400 via-blue-400 to-orange-400"></div>

               {/* Language Selector */}
               <div className="flex items-center space-x-2">
                 <Globe className="h-4 w-4 text-blue-200" />
                 <select
                   value={user?.language || 'marathi'}
                   onChange={(e) => handleLanguageChange(e.target.value as 'marathi' | 'english' | 'hindi')}
                   className="bg-transparent text-blue-200 border border-blue-400 rounded px-2 py-1 text-xs focus:outline-none focus:border-orange-400"
                 >
                   <option value="marathi" className="bg-blue-900 text-white">मराठी</option>
                   <option value="english" className="bg-blue-900 text-white">English</option>
                   <option value="hindi" className="bg-blue-900 text-white">हिंदी</option>
                 </select>
               </div>

               {/* Separator */}
               <div className="h-12 w-px bg-gradient-to-b from-orange-400 via-blue-400 to-orange-400"></div>

               {/* Logout Button */}
               <button
                 onClick={handleLogout}
                 className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-2 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2 text-white font-medium"
               >
                 <LogOut className="h-4 w-4" />
                 <span className="text-sm font-bold">Logout</span>
               </button>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 min-h-[calc(100vh-160px)]">
        {children}
      </main>

             {/* Government Footer */}
       <footer className="relative z-10 bg-blue-900 text-white py-4">
         <div className="container mx-auto px-4">
           <div className="text-center">
             <p className="text-sm">Content Owned by District Administration</p>
             <p className="text-xs text-blue-300 mt-1">© District Palghar, Developed and hosted by National Informatics Centre</p>
           </div>
         </div>
       </footer>
    </div>
  );
};

export default GovernmentLayout; 