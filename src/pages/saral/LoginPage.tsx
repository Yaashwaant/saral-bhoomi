import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield, User, Lock, Globe, Building2 } from 'lucide-react';
import collectorOfficeImage from '../../assets/images/collector-office.jpeg';


const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState<'marathi' | 'english' | 'hindi'>('marathi');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const translations = {
    marathi: {
      title: 'SARAL Bhoomi',
      subtitle: 'System for Automated Resourceful Acquisition of Land',
      loginTitle: 'प्रणालीमध्ये प्रवेश करा',
      email: 'ईमेल पत्ता',
      password: 'पासवर्ड',
      language: 'भाषा निवडा',
      loginButton: 'लॉग इन करा',
      demoCredentials: 'डेमो प्रवेश माहिती:',
      admin: 'प्रशासक: admin@saral.gov.in / admin',
      officer: 'अधिकारी: officer@saral.gov.in / officer',
      agent: 'एजंट: agent@saral.gov.in / agent',
      agent1: 'एजंट १: rajesh.patil@saral.gov.in / agent123',
      agent2: 'एजंट २: sunil.kambale@saral.gov.in / agent123',
      agent3: 'एजंट ३: mahesh.deshmukh@saral.gov.in / agent123',
      agent4: 'एजंट ४: vithal.jadhav@saral.gov.in / agent123',
      agent5: 'एजंट ५: ramrao.pawar@saral.gov.in / agent123',
      poweredBy: 'महाराष्ट्र शासन द्वारे संचालित',
      buildingTitle: 'जिल्हाधिकारी तथा जिल्हादंडाधिकारी कार्यालय',
      buildingSubtitle: 'पालघर जिल्हा'
    },
    english: {
      title: 'SARAL Bhoomi',
      subtitle: 'System for Automated Resourceful Acquisition of Land',
      loginTitle: 'System Login',
      email: 'Email Address',
      password: 'Password',
      language: 'Select Language',
      loginButton: 'Login',
      demoCredentials: 'Demo Credentials:',
      admin: 'Admin: admin@saral.gov.in / admin',
      officer: 'Officer: officer@saral.gov.in / officer',
      agent: 'Agent: agent@saral.gov.in / agent',
      agent1: 'Agent 1: rajesh.patil@saral.gov.in / agent123',
      agent2: 'Agent 2: sunil.kambale@saral.gov.in / agent123',
      agent3: 'Agent 3: mahesh.deshmukh@saral.gov.in / agent123',
      agent4: 'Agent 4: vithal.jadhav@saral.gov.in / agent123',
      agent5: 'Agent 5: ramrao.pawar@saral.gov.in / agent123',
      poweredBy: 'Powered by Government of Maharashtra',
      buildingTitle: 'District Collector & District Magistrate Office',
      buildingSubtitle: 'Palghar District'
    },
    hindi: {
      title: 'SARAL Bhoomi',
      subtitle: 'System for Automated Resourceful Acquisition of Land',
      loginTitle: 'सिस्टम लॉगिन',
      email: 'ईमेल पता',
      password: 'पासवर्ड',
      language: 'भाषा चुनें',
      loginButton: 'लॉग इन करें',
      demoCredentials: 'डेमो लॉगिन जानकारी:',
      admin: 'एडमिन: admin@saral.gov.in / admin',
      officer: 'अधिकारी: officer@saral.gov.in / officer',
      agent: 'एजेंट: agent@saral.gov.in / agent',
      agent1: 'एजेंट १: rajesh.patil@saral.gov.in / agent123',
      agent2: 'एजेंट २: sunil.kambale@saral.gov.in / agent123',
      agent3: 'एजेंट ३: mahesh.deshmukh@saral.gov.in / agent123',
      agent4: 'एजेंट ४: vithal.jadhav@saral.gov.in / agent123',
      agent5: 'एजेंट ५: ramrao.pawar@saral.gov.in / agent123',
      poweredBy: 'महाराष्ट्र सरकार द्वारे संचालित',
      buildingTitle: 'जिला कलेक्टर और जिला मजिस्ट्रेट कार्यालय',
      buildingSubtitle: 'पालघर जिला'
    }
  };

  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Login successful');
        navigate('/saral/dashboard');
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Collector Office Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <img 
          src={collectorOfficeImage} 
          alt="Collector Office Building" 
          className="w-full h-full object-cover z-0"
          onError={(e) => {
            // Fallback if image doesn't load
            console.log('Image failed to load, showing fallback');
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
          onLoad={(e) => {
            // Ensure image is visible when loaded
            console.log('Image loaded successfully');
            e.currentTarget.style.display = 'block';
            e.currentTarget.style.zIndex = '0';
          }}
        />
        
        {/* Fallback background if image doesn't load */}
        <div className="hidden absolute inset-0 bg-gradient-to-br from-orange-500 via-white to-green-500 flex items-center justify-center z-0">
          <div className="text-center text-white">
            <Building2 className="h-24 w-24 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-2">{t.buildingTitle}</h2>
            <p className="text-lg opacity-90">{t.buildingSubtitle}</p>
          </div>
        </div>

        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-white/10"></div>
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-8 text-white">
          <div className="text-center">
            <div className="mb-4">
              <h1 className="text-5xl font-black text-white [text-shadow:_0_4px_8px_rgba(0,0,0,0.9),_0_8px_16px_rgba(0,0,0,0.8)]">{t.title}</h1>
              <p className="text-xl text-white font-bold [text-shadow:_0_3px_6px_rgba(0,0,0,0.8),_0_6px_12px_rgba(0,0,0,0.7)] mt-2">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-3xl font-black mb-3 text-white [text-shadow:_0_3px_6px_rgba(0,0,0,0.8),_0_6px_12px_rgba(0,0,0,0.7)]">{t.buildingTitle}</h2>
            <p className="text-xl font-bold text-white/95 [text-shadow:_0_2px_4px_rgba(0,0,0,0.7),_0_4px_8px_rgba(0,0,0,0.6)]">{t.buildingSubtitle}</p>
            <div className="flex items-center justify-center space-x-4 mt-6">
              <div className="w-20 h-3 bg-orange-500"></div>
              <div className="w-20 h-3 bg-white"></div>
              <div className="w-20 h-3 bg-green-500"></div>
            </div>
          </div>
        </div>

        {/* Blend gradient on the right edge */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-white to-green-50">
        <div className="max-w-md w-full space-y-6">
          {/* Header for mobile */}
          <div className="lg:hidden text-center space-y-2">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-orange-800">{t.title}</h1>
              <p className="text-sm text-orange-600 font-medium">{t.subtitle}</p>
            </div>
          </div>

          {/* Login Form */}
          <Card className="shadow-xl border-orange-200 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-center text-xl text-gray-800 flex items-center justify-center space-x-2">
                <User className="h-5 w-5" />
                <span>{t.loginTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Language Selector */}
              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>{t.language}</span>
                </Label>
                <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marathi">मराठी (Marathi)</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">हिंदी (Hindi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-orange-200 focus:border-orange-400 bg-white/80"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center space-x-2">
                    <Lock className="h-4 w-4" />
                    <span>{t.password}</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-orange-200 focus:border-orange-400 bg-white/80"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : t.loginButton}
                </Button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-gray-50/80 rounded-lg backdrop-blur-sm">
                <p className="text-sm font-medium text-gray-700 mb-2">{t.demoCredentials}</p>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>{t.admin}</p>
                  <p>{t.officer}</p>
                  <p>{t.agent}</p>
                  <p className="text-orange-600 font-medium mt-2">Field Agents:</p>
                  <p>{t.agent1}</p>
                  <p>{t.agent2}</p>
                  <p>{t.agent3}</p>
                  <p>{t.agent4}</p>
                  <p>{t.agent5}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-500">{t.poweredBy}</p>
            <div className="flex items-center justify-center space-x-4 mt-2">
              <div className="w-12 h-1 bg-orange-500"></div>
              <div className="w-12 h-1 bg-white"></div>
              <div className="w-12 h-1 bg-green-500"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;