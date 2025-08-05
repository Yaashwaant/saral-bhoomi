import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Database, 
  Shield, 
  Globe, 
  Mail,
  Bell,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const SystemSettings = () => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    systemName: 'SARAL Bhoomi',
    defaultLanguage: 'marathi',
    emailNotifications: true,
    smsNotifications: false,
    autoBackup: true,
    backupFrequency: 'daily',
    sessionTimeout: 30,
    maxFileSize: 10,
    enableAuditLog: true,
    maintenanceMode: false
  });

  const translations = {
    marathi: {
      title: 'सिस्टम सेटिंग्स',
      subtitle: 'सिस्टम कॉन्फिगरेशन आणि सेटिंग्स',
      general: 'सामान्य सेटिंग्स',
      systemName: 'सिस्टम नाव',
      defaultLanguage: 'डिफॉल्ट भाषा',
      notifications: 'सूचना सेटिंग्स',
      emailNotifications: 'ईमेल सूचना',
      smsNotifications: 'SMS सूचना',
      security: 'सुरक्षा सेटिंग्स',
      sessionTimeout: 'सत्र टाइमआउट (मिनिटे)',
      maxFileSize: 'कमाल फाईल आकार (MB)',
      backup: 'बॅकअप सेटिंग्स',
      autoBackup: 'स्वयंचलित बॅकअप',
      backupFrequency: 'बॅकअप वारंवारता',
      daily: 'दररोज',
      weekly: 'दर आठवड्याला',
      monthly: 'दर महिन्याला',
      audit: 'ऑडिट लॉग',
      enableAuditLog: 'ऑडिट लॉग सक्षम करा',
      maintenance: 'मेंटेनन्स मोड',
      maintenanceMode: 'मेंटेनन्स मोड सक्षम करा',
      save: 'जतन करा',
      reset: 'रीसेट करा',
      testConnection: 'कनेक्शन चाचणी',
      systemStatus: 'सिस्टम स्थिति',
      online: 'ऑनलाइन',
      offline: 'ऑफलाइन',
      healthy: 'आरोग्यवान',
      warning: 'चेतावणी',
      error: 'त्रुटी',
      saveSuccess: 'सेटिंग्स यशस्वीरित्या जतन केल्या',
      saveFailed: 'सेटिंग्स जतन करणे अयशस्वी',
      testSuccess: 'कनेक्शन यशस्वी',
      testFailed: 'कनेक्शन अयशस्वी'
    },
    english: {
      title: 'System Settings',
      subtitle: 'System configuration and settings',
      general: 'General Settings',
      systemName: 'System Name',
      defaultLanguage: 'Default Language',
      notifications: 'Notification Settings',
      emailNotifications: 'Email Notifications',
      smsNotifications: 'SMS Notifications',
      security: 'Security Settings',
      sessionTimeout: 'Session Timeout (minutes)',
      maxFileSize: 'Maximum File Size (MB)',
      backup: 'Backup Settings',
      autoBackup: 'Auto Backup',
      backupFrequency: 'Backup Frequency',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      audit: 'Audit Log',
      enableAuditLog: 'Enable Audit Log',
      maintenance: 'Maintenance Mode',
      maintenanceMode: 'Enable Maintenance Mode',
      save: 'Save',
      reset: 'Reset',
      testConnection: 'Test Connection',
      systemStatus: 'System Status',
      online: 'Online',
      offline: 'Offline',
      healthy: 'Healthy',
      warning: 'Warning',
      error: 'Error',
      saveSuccess: 'Settings saved successfully',
      saveFailed: 'Failed to save settings',
      testSuccess: 'Connection successful',
      testFailed: 'Connection failed'
    },
    hindi: {
      title: 'सिस्टम सेटिंग्स',
      subtitle: 'सिस्टम कॉन्फ़िगरेशन और सेटिंग्स',
      general: 'सामान्य सेटिंग्स',
      systemName: 'सिस्टम नाम',
      defaultLanguage: 'डिफ़ॉल्ट भाषा',
      notifications: 'सूचना सेटिंग्स',
      emailNotifications: 'ईमेल सूचनाएं',
      smsNotifications: 'SMS सूचनाएं',
      security: 'सुरक्षा सेटिंग्स',
      sessionTimeout: 'सत्र टाइमआउट (मिनट)',
      maxFileSize: 'अधिकतम फ़ाइल आकार (MB)',
      backup: 'बैकअप सेटिंग्स',
      autoBackup: 'स्वचालित बैकअप',
      backupFrequency: 'बैकअप आवृत्ति',
      daily: 'दैनिक',
      weekly: 'साप्ताहिक',
      monthly: 'मासिक',
      audit: 'ऑडिट लॉग',
      enableAuditLog: 'ऑडिट लॉग सक्षम करें',
      maintenance: 'रखरखाव मोड',
      maintenanceMode: 'रखरखाव मोड सक्षम करें',
      save: 'सहेजें',
      reset: 'रीसेट करें',
      testConnection: 'कनेक्शन परीक्षण',
      systemStatus: 'सिस्टम स्थिति',
      online: 'ऑनलाइन',
      offline: 'ऑफलाइन',
      healthy: 'स्वस्थ',
      warning: 'चेतावनी',
      error: 'त्रुटि',
      saveSuccess: 'सेटिंग्स सफलतापूर्वक सहेजी गईं',
      saveFailed: 'सेटिंग्स सहेजने में विफल',
      testSuccess: 'कनेक्शन सफल',
      testFailed: 'कनेक्शन विफल'
    }
  };

  const t = translations[user?.language || 'marathi'];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(t.saveSuccess);
    } catch (error) {
      toast.error(t.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      systemName: 'SARAL Bhoomi',
      defaultLanguage: 'marathi',
      emailNotifications: true,
      smsNotifications: false,
      autoBackup: true,
      backupFrequency: 'daily',
      sessionTimeout: 30,
      maxFileSize: 10,
      enableAuditLog: true,
      maintenanceMode: false
    });
    toast.success('Settings reset to default');
  };

  const handleTestConnection = async () => {
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(t.testSuccess);
    } catch (error) {
      toast.error(t.testFailed);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleTestConnection}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t.testConnection}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : t.save}
          </Button>
        </div>
      </div>

      {/* System Status */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>{t.systemStatus}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Badge className="bg-green-100 text-green-700">{t.online}</Badge>
            <Badge className="bg-green-100 text-green-700">{t.healthy}</Badge>
            <span className="text-sm text-gray-600">Last updated: 2 minutes ago</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-orange-600" />
              <span>{t.general}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemName">{t.systemName}</Label>
              <Input
                id="systemName"
                value={settings.systemName}
                onChange={(e) => setSettings({...settings, systemName: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultLanguage">{t.defaultLanguage}</Label>
              <Select 
                value={settings.defaultLanguage} 
                onValueChange={(value: any) => setSettings({...settings, defaultLanguage: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marathi">मराठी</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">हिंदी</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <span>{t.notifications}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications">{t.emailNotifications}</Label>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="smsNotifications">{t.smsNotifications}</Label>
              <Switch
                id="smsNotifications"
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => setSettings({...settings, smsNotifications: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <span>{t.security}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">{t.sessionTimeout}</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxFileSize">{t.maxFileSize}</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => setSettings({...settings, maxFileSize: parseInt(e.target.value)})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-orange-600" />
              <span>{t.backup}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoBackup">{t.autoBackup}</Label>
              <Switch
                id="autoBackup"
                checked={settings.autoBackup}
                onCheckedChange={(checked) => setSettings({...settings, autoBackup: checked})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backupFrequency">{t.backupFrequency}</Label>
              <Select 
                value={settings.backupFrequency} 
                onValueChange={(value: any) => setSettings({...settings, backupFrequency: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t.daily}</SelectItem>
                  <SelectItem value="weekly">{t.weekly}</SelectItem>
                  <SelectItem value="monthly">{t.monthly}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Audit Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span>{t.audit}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enableAuditLog">{t.enableAuditLog}</Label>
              <Switch
                id="enableAuditLog"
                checked={settings.enableAuditLog}
                onCheckedChange={(checked) => setSettings({...settings, enableAuditLog: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-orange-600" />
              <span>{t.maintenance}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenanceMode">{t.maintenanceMode}</Label>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-2">
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1"
            >
              {t.reset}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : t.save}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;