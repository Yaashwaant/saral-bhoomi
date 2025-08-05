import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';
import { toast } from 'sonner';

interface UserFormData {
  name: string;
  email: string;
  role: 'admin' | 'officer' | 'agent';
  department: string;
  phone: string;
  language: 'marathi' | 'english' | 'hindi';
}

const UserManagement = () => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'officer',
    department: '',
    phone: '',
    language: 'marathi'
  });

  const translations = {
    marathi: {
      title: 'वापरकर्ता व्यवस्थापन',
      createUser: 'नवीन वापरकर्ता तयार करा',
      name: 'नाव',
      email: 'ईमेल',
      role: 'भूमिका',
      department: 'विभाग',
      phone: 'फोन',
      language: 'भाषा',
      save: 'जतन करा',
      cancel: 'रद्द करा',
      edit: 'संपादन करा',
      delete: 'हटवा',
      view: 'पाहा',
      status: 'स्थिति',
      active: 'सक्रिय',
      inactive: 'निष्क्रिय',
      actions: 'कृती',
      noUsers: 'कोणतेही वापरकर्ते नाहीत',
      admin: 'प्रशासक',
      officer: 'अधिकारी',
      agent: 'एजंट',
      marathi: 'मराठी',
      english: 'इंग्रजी',
      hindi: 'हिंदी'
    },
    english: {
      title: 'User Management',
      createUser: 'Create New User',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      department: 'Department',
      phone: 'Phone',
      language: 'Language',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      view: 'View',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      actions: 'Actions',
      noUsers: 'No users found',
      admin: 'Administrator',
      officer: 'Land Officer',
      agent: 'Field Agent',
      marathi: 'Marathi',
      english: 'English',
      hindi: 'Hindi'
    },
    hindi: {
      title: 'उपयोगकर्ता प्रबंधन',
      createUser: 'नया उपयोगकर्ता बनाएं',
      name: 'नाम',
      email: 'ईमेल',
      role: 'भूमिका',
      department: 'विभाग',
      phone: 'फोन',
      language: 'भाषा',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      edit: 'संपादित करें',
      delete: 'हटाएं',
      view: 'देखें',
      status: 'स्थिति',
      active: 'सक्रिय',
      inactive: 'निष्क्रिय',
      actions: 'कार्रवाई',
      noUsers: 'कोई उपयोगकर्ता नहीं मिला',
      admin: 'प्रशासक',
      officer: 'भूमि अधिकारी',
      agent: 'फील्ड एजेंट',
      marathi: 'मराठी',
      english: 'अंग्रेजी',
      hindi: 'हिंदी'
    }
  };

  const t = translations[user?.language || 'marathi'];

  // Mock users data
  const mockUsers = [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@saral.gov.in',
      role: 'admin',
      department: 'Land Acquisition Department',
      phone: '+91-9876543210',
      language: 'marathi',
      status: 'active'
    },
    {
      id: '2',
      name: 'Land Officer',
      email: 'officer@saral.gov.in',
      role: 'officer',
      department: 'District Office',
      phone: '+91-9876543211',
      language: 'marathi',
      status: 'active'
    },
    {
      id: '3',
      name: 'Field Agent',
      email: 'agent@saral.gov.in',
      role: 'agent',
      department: 'Field Operations',
      phone: '+91-9876543212',
      language: 'marathi',
      status: 'active'
    }
  ];

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-700">{t.active}</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700">{t.inactive}</Badge>
    );
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return t.admin;
      case 'officer': return t.officer;
      case 'agent': return t.agent;
      default: return role;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update user logic
        toast.success('User updated successfully');
      } else {
        // Create user logic
        toast.success('User created successfully');
      }
      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'officer',
        department: '',
        phone: '',
        language: 'marathi'
      });
    } catch (error) {
      toast.error('Failed to save user');
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      language: user.language
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    try {
      // Delete user logic
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
          <p className="text-gray-600">Manage system users and permissions</p>
        </div>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {t.createUser}
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-orange-600" />
            <span>Users</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleText(user.role)}</TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-orange-600" />
              <span>{editingUser ? 'Edit User' : t.createUser}</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.name}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t.role}</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t.admin}</SelectItem>
                  <SelectItem value="officer">{t.officer}</SelectItem>
                  <SelectItem value="agent">{t.agent}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">{t.department}</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t.phone}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t.language}</Label>
              <Select value={formData.language} onValueChange={(value: any) => setFormData({...formData, language: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marathi">{t.marathi}</SelectItem>
                  <SelectItem value="english">{t.english}</SelectItem>
                  <SelectItem value="hindi">{t.hindi}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                {t.save}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingUser(null);
                  setFormData({
                    name: '',
                    email: '',
                    role: 'officer',
                    department: '',
                    phone: '',
                    language: 'marathi'
                  });
                }}
                className="flex-1"
              >
                {t.cancel}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;