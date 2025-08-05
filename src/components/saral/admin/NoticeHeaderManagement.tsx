import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Eye,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

const NoticeHeaderManagement = () => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const translations = {
    marathi: {
      title: 'नोटीस हेडर व्यवस्थापन',
      subtitle: 'नोटीस हेडर फाईल्स अपलोड आणि व्यवस्थापन',
      uploadHeader: 'हेडर अपलोड करा',
      fileName: 'फाईल नाव',
      version: 'आवृत्ती',
      status: 'स्थिति',
      uploadedBy: 'अपलोड केले',
      uploadedAt: 'अपलोड तारीख',
      actions: 'कृती',
      active: 'सक्रिय',
      inactive: 'निष्क्रिय',
      pending: 'प्रलंबित',
      approved: 'मंजूर',
      rejected: 'नाकारले',
      download: 'डाउनलोड करा',
      delete: 'हटवा',
      view: 'पाहा',
      activate: 'सक्रिय करा',
      deactivate: 'निष्क्रिय करा',
      noHeaders: 'कोणतेही हेडर नाहीत',
      uploadSuccess: 'हेडर यशस्वीरित्या अपलोड झाले',
      uploadFailed: 'हेडर अपलोड अयशस्वी',
      deleteSuccess: 'हेडर यशस्वीरित्या हटवले',
      deleteFailed: 'हेडर हटवणे अयशस्वी'
    },
    english: {
      title: 'Notice Header Management',
      subtitle: 'Upload and manage notice header files',
      uploadHeader: 'Upload Header',
      fileName: 'File Name',
      version: 'Version',
      status: 'Status',
      uploadedBy: 'Uploaded By',
      uploadedAt: 'Upload Date',
      actions: 'Actions',
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      download: 'Download',
      delete: 'Delete',
      view: 'View',
      activate: 'Activate',
      deactivate: 'Deactivate',
      noHeaders: 'No headers found',
      uploadSuccess: 'Header uploaded successfully',
      uploadFailed: 'Header upload failed',
      deleteSuccess: 'Header deleted successfully',
      deleteFailed: 'Failed to delete header'
    },
    hindi: {
      title: 'नोटिस हेडर प्रबंधन',
      subtitle: 'नोटिस हेडर फाइलें अपलोड और प्रबंधन',
      uploadHeader: 'हेडर अपलोड करें',
      fileName: 'फाइल नाम',
      version: 'संस्करण',
      status: 'स्थिति',
      uploadedBy: 'अपलोड किया गया',
      uploadedAt: 'अपलोड तिथि',
      actions: 'कार्रवाई',
      active: 'सक्रिय',
      inactive: 'निष्क्रिय',
      pending: 'लंबित',
      approved: 'अनुमोदित',
      rejected: 'अस्वीकृत',
      download: 'डाउनलोड करें',
      delete: 'हटाएं',
      view: 'देखें',
      activate: 'सक्रिय करें',
      deactivate: 'निष्क्रिय करें',
      noHeaders: 'कोई हेडर नहीं मिला',
      uploadSuccess: 'हेडर सफलतापूर्वक अपलोड किया गया',
      uploadFailed: 'हेडर अपलोड विफल',
      deleteSuccess: 'हेडर सफलतापूर्वक हटाया गया',
      deleteFailed: 'हेडर हटाने में विफल'
    }
  };

  const t = translations[user?.language || 'marathi'];

  // Mock headers data
  const mockHeaders = [
    {
      id: '1',
      fileName: 'Notice_Header_v1.pdf',
      version: 1,
      status: 'active',
      uploadedBy: 'Admin User',
      uploadedAt: '2024-01-15',
      fileUrl: '#'
    },
    {
      id: '2',
      fileName: 'Notice_Header_v2.pdf',
      version: 2,
      status: 'inactive',
      uploadedBy: 'Admin User',
      uploadedAt: '2024-01-20',
      fileUrl: '#'
    },
    {
      id: '3',
      fileName: 'Notice_Header_v3.pdf',
      version: 3,
      status: 'pending',
      uploadedBy: 'Land Officer',
      uploadedAt: '2024-01-25',
      fileUrl: '#'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">{t.active}</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-700">{t.inactive}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">{t.pending}</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-700">{t.approved}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">{t.rejected}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(t.uploadSuccess);
      setIsDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      toast.error(t.uploadFailed);
    }
  };

  const handleDelete = async (headerId: string) => {
    try {
      // Simulate delete
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(t.deleteSuccess);
    } catch (error) {
      toast.error(t.deleteFailed);
    }
  };

  const handleActivate = async (headerId: string) => {
    try {
      // Simulate activation
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Header activated successfully');
    } catch (error) {
      toast.error('Failed to activate header');
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
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          {t.uploadHeader}
        </Button>
      </div>

      {/* Headers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-orange-600" />
            <span>Notice Headers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mockHeaders.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t.noHeaders}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.fileName}</TableHead>
                  <TableHead>{t.version}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.uploadedBy}</TableHead>
                  <TableHead>{t.uploadedAt}</TableHead>
                  <TableHead>{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockHeaders.map((header) => (
                  <TableRow key={header.id}>
                    <TableCell className="font-medium">{header.fileName}</TableCell>
                    <TableCell>v{header.version}</TableCell>
                    <TableCell>{getStatusBadge(header.status)}</TableCell>
                    <TableCell>{header.uploadedBy}</TableCell>
                    <TableCell>{header.uploadedAt}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {header.status === 'inactive' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => handleActivate(header.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {header.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(header.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-orange-600" />
              <span>{t.uploadHeader}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select PDF File</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
              />
            </div>
            
            {selectedFile && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Selected: {selectedFile.name}
                  </span>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button 
                onClick={handleUpload}
                disabled={!selectedFile}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {t.uploadHeader}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedFile(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoticeHeaderManagement;