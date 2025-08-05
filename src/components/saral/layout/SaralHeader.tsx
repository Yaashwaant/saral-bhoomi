import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Shield, Globe, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SaralHeader = () => {
  const { user, logout, switchLanguage } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/saral/login');
  };

  const getRoleText = (role: string, language: string) => {
    const roleTranslations = {
      marathi: {
        admin: 'प्रशासक',
        officer: 'अधिकारी',
        agent: 'एजंट'
      },
      english: {
        admin: 'Administrator',
        officer: 'Land Officer',
        agent: 'Field Agent'
      },
      hindi: {
        admin: 'प्रशासक',
        officer: 'भूमि अधिकारी',
        agent: 'फील्ड एजेंट'
      }
    };
    return roleTranslations[language]?.[role] || role;
  };

  const getLanguageText = (language: string) => {
    const languageMap = {
      marathi: 'मराठी',
      english: 'English',
      hindi: 'हिंदी'
    };
    return languageMap[language] || language;
  };

  return (
    <header className="bg-white border-b border-orange-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-xl font-bold text-orange-800">SARAL Bhoomi</h1>
              <p className="text-xs text-orange-600">System for Automated Resourceful Acquisition of Land</p>
            </div>
          </div>

          {/* User Info and Controls */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <Select 
                value={user?.language} 
                onValueChange={(value: any) => switchLanguage(value)}
              >
                <SelectTrigger className="w-20 border-orange-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marathi">मराठी</SelectItem>
                  <SelectItem value="english">EN</SelectItem>
                  <SelectItem value="hindi">हिंदी</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-orange-100 text-orange-700">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-orange-600">
                  {getRoleText(user?.role || '', user?.language || 'marathi')}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SaralHeader;