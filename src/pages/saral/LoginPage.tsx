import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield, User, Lock, Globe } from 'lucide-react';

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
      poweredBy: 'महाराष्ट्र शासन द्वारे संचालित',
      description: 'भूमि संपादन प्रक्रियेचे संपूर्ण डिजिटलायझेशन - नोटीस जनरेशनपासून ते मोबदला वितरणापर्यंत'
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
      description: 'Complete digitalization of land acquisition process - from notice generation to compensation distribution'
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
      poweredBy: 'महाराष्ट्र सरकार द्वारा संचालित',
      description: 'भूमि अधिग्रहण प्रक्रिया का पूर्ण डिजिटलीकरण - नोटिस जेनरेशन से मुआवजा वितरण तक'
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-12 w-12 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold text-orange-800">{t.title}</h1>
              <p className="text-sm text-orange-600 font-medium">{t.subtitle}</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm max-w-xs mx-auto">
            {t.description}
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-orange-200">
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
                  className="border-orange-200 focus:border-orange-400"
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
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : t.loginButton}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
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
  );
};

export default LoginPage;