import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield, User, Lock, Globe, Building2, MapPin, Phone, Mail } from 'lucide-react';
import collectorOfficeImage from '../../assets/images/collector-office.jpeg';
import emblemOfIndia from '../../assets/images/emblem-of-india.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState<'marathi' | 'english' | 'hindi'>('marathi');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      // Route users based on their role
      switch (user.role) {
        case 'field_officer':
          navigate('/field-officer');
          break;
        case 'admin':
        case 'officer':
        case 'agent':
        default:
          navigate('/saral/dashboard');
          break;
      }
    }
  }, [isAuthenticated, user, navigate]);

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
      buildingSubtitle: 'पालघर जिल्हा',
      districtInfo: 'पालघर जिल्हा',
      population: 'जनसंख्या: 2,995,428',
      area: 'क्षेत्रफल: 4,696.99 वर्ग किमी',
      literacy: 'साक्षरता: 66.65%'
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
      buildingSubtitle: 'Palghar District',
      districtInfo: 'Palghar District',
      population: 'Population: 2,995,428',
      area: 'Area: 4,696.99 sq km',
      literacy: 'Literacy Rate: 66.65%'
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
      buildingSubtitle: 'पालघर जिला',
      districtInfo: 'पालघर जिला',
      population: 'जनसंख्या: 2,995,428',
      area: 'क्षेत्रफल: 4,696.99 वर्ग किमी',
      literacy: 'साक्षरता: 66.65%'
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
        // The useEffect will handle the role-based redirect
        // No need to navigate here as it will be handled automatically
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 relative">
      {/* Government Header */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={emblemOfIndia} 
                  alt="Emblem of India" 
                  className="h-12 w-16 drop-shadow-lg"
                />
                <div>
                  <h1 className="text-lg font-bold">महाराष्ट्र शासन</h1>
                  <p className="text-xs text-blue-200">Government of Maharashtra</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <h2 className="text-lg font-bold text-white">जिल्हाधिकारी तथा जिल्हादंडाधिकारी कार्यालय</h2>
                <p className="text-sm text-blue-200">पालघर जिल्हा</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Left Side - District Information */}
        <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
          {/* Background Image - Consistent with GovernmentLayout */}
          <img 
            src={collectorOfficeImage} 
            alt="Collector Office Building" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-orange-900/20"></div>
          {/* Seamless blend gradient to right side */}
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-white via-white/60 to-transparent"></div>
          
          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-8">
            <div className="text-left pl-8">
              <div className="mb-6">
                <h1 className="text-5xl font-bold text-white [text-shadow:_2px_2px_4px_rgba(0,0,0,0.7)]" style={{ 
                  fontFamily: "'Noto Sans', 'Arial', sans-serif",
                  fontWeight: 700,
                  letterSpacing: '1px'
                }}>{t.title}</h1>
                <p className="text-xl text-white font-medium [text-shadow:_1px_1px_3px_rgba(0,0,0,0.6)] mt-3" style={{ 
                  fontFamily: "'Noto Sans', 'Arial', sans-serif",
                  fontWeight: 500,
                  letterSpacing: '0.3px'
                }}>{t.subtitle}</p>
              </div>
            </div>
            
            <div className="text-left pl-8">
              <h2 className="text-3xl font-bold mb-3 text-white [text-shadow:_2px_2px_4px_rgba(0,0,0,0.7)]" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}>{t.buildingTitle}</h2>
              <p className="text-xl text-white [text-shadow:_1px_1px_3px_rgba(0,0,0,0.6)]" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>{t.buildingSubtitle}</p>
              <div className="flex items-center space-x-6 mt-6">
                <div className="w-20 h-3 bg-orange-500 rounded shadow-lg"></div>
                <div className="w-20 h-3 bg-white rounded shadow-lg"></div>
                <div className="w-20 h-3 bg-green-500 rounded shadow-lg"></div>
              </div>
            </div>
          </div>


        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-2/5 flex items-center justify-center p-4 bg-gradient-to-br from-white via-blue-50/20 to-orange-50/20 backdrop-blur-sm">
          <div className="max-w-md w-full space-y-6">
            {/* Header for mobile */}
            <div className="lg:hidden text-center space-y-2">
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-blue-900">{t.title}</h1>
                <p className="text-sm text-blue-700 font-medium">{t.subtitle}</p>
              </div>
            </div>

            {/* Login Form */}
            <Card className="shadow-xl border-blue-200 bg-white/95 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-t-lg">
                <CardTitle className="text-center text-xl text-blue-900 flex items-center justify-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>{t.loginTitle}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {/* Language Selector */}
                <div className="space-y-2">
                  <Label htmlFor="language" className="flex items-center space-x-2 text-blue-800">
                    <Globe className="h-4 w-4" />
                    <span>{t.language}</span>
                  </Label>
                  <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
                    <SelectTrigger className="border-blue-200 focus:border-blue-400">
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
                    <Label htmlFor="email" className="text-blue-800">{t.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-blue-200 focus:border-blue-400 bg-white/80"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center space-x-2 text-blue-800">
                      <Lock className="h-4 w-4" />
                      <span>{t.password}</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-blue-200 focus:border-blue-400 bg-white/80"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : t.loginButton}
                  </Button>
                </form>

                {/* Demo Credentials */}
                <div className="mt-6 p-4 bg-blue-50/80 rounded-lg backdrop-blur-sm border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-2">{t.demoCredentials}</p>
                  <div className="space-y-1 text-xs text-blue-700">
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
              <p className="text-sm text-blue-600 font-medium">{t.poweredBy}</p>
              <div className="flex items-center justify-center space-x-4 mt-2">
                <div className="w-12 h-1 bg-orange-500 rounded"></div>
                <div className="w-12 h-1 bg-blue-500 rounded"></div>
                <div className="w-12 h-1 bg-green-500 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Government Footer */}
      <footer className="bg-blue-900 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">Content Owned by District Administration</p>
          <p className="text-xs text-blue-300 mt-1">© District Palghar, Developed and hosted by National Informatics Centre</p>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;