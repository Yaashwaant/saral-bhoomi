import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  IndianRupee, 
  Users, 
  FileText, 
  TrendingUp,
  Download,
  Eye,
  BarChart3,
  PieChart
} from 'lucide-react';

const VillageWiseReports = () => {
  const { user } = useAuth();
  const { projects, getVillageSummary } = useSaral();
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');

  const translations = {
    marathi: {
      title: 'गावनिहाय अहवाल',
      subtitle: 'गावनिहाय मोबदला आणि प्रगती ट्रॅकिंग',
      selectProject: 'प्रकल्प निवडा',
      selectVillage: 'गाव निवडा',
      allVillages: 'सर्व गावे',
      totalCompensation: 'एकूण मोबदला',
      totalSurveyNos: 'एकूण सर्वे नं.',
      totalLandParties: 'एकूण जमीन मालक',
      totalArea: 'एकूण क्षेत्र',
      compensationPaid: 'दिलेला मोबदला',
      pendingPayment: 'प्रलंबित पेमेंट',
      acquisition: 'संपादन',
      paid: 'दिले',
      pending: 'प्रलंबित',
      hectares: 'हेक्टर',
      parties: 'मालक',
      surveys: 'सर्वे',
      download: 'डाउनलोड करा',
      viewDetails: 'तपशील पाहा',
      progress: 'प्रगती',
      status: 'स्थिती',
      completed: 'पूर्ण',
      inProgress: 'प्रगतीत',
      notStarted: 'सुरू नाही',
      village: 'गाव',
      taluka: 'तालुका',
      district: 'जिल्हा',
      noData: 'कोणतेही डेटा नाही',
      summary: 'सारांश',
      details: 'तपशील'
    },
    english: {
      title: 'Village-wise Reports',
      subtitle: 'Village-wise compensation and progress tracking',
      selectProject: 'Select Project',
      selectVillage: 'Select Village',
      allVillages: 'All Villages',
      totalCompensation: 'Total Compensation',
      totalSurveyNos: 'Total Survey Nos.',
      totalLandParties: 'Total Land Parties',
      totalArea: 'Total Area',
      compensationPaid: 'Compensation Paid',
      pendingPayment: 'Pending Payment',
      acquisition: 'Acquisition',
      paid: 'Paid',
      pending: 'Pending',
      hectares: 'Hectares',
      parties: 'Parties',
      surveys: 'Surveys',
      download: 'Download',
      viewDetails: 'View Details',
      progress: 'Progress',
      status: 'Status',
      completed: 'Completed',
      inProgress: 'In Progress',
      notStarted: 'Not Started',
      village: 'Village',
      taluka: 'Taluka',
      district: 'District',
      noData: 'No data available',
      summary: 'Summary',
      details: 'Details'
    },
    hindi: {
      title: 'गांव रिपोर्ट',
      subtitle: 'गांव-वार मुआवजा और प्रगति ट्रैकिंग',
      selectProject: 'परियोजना चुनें',
      selectVillage: 'गांव चुनें',
      allVillages: 'सभी गांव',
      totalCompensation: 'कुल मुआवजा',
      totalSurveyNos: 'कुल सर्वेक्षण संख्या',
      totalLandParties: 'कुल भूमि मालिक',
      totalArea: 'कुल क्षेत्र',
      compensationPaid: 'भुगतान किया गया मुआवजा',
      pendingPayment: 'लंबित भुगतान',
      acquisition: 'अधिग्रहण',
      paid: 'भुगतान किया',
      pending: 'लंबित',
      hectares: 'हेक्टेयर',
      parties: 'मालिक',
      surveys: 'सर्वेक्षण',
      download: 'डाउनलोड करें',
      viewDetails: 'विवरण देखें',
      progress: 'प्रगति',
      status: 'स्थिति',
      completed: 'पूर्ण',
      inProgress: 'प्रगति में',
      notStarted: 'शुरू नहीं हुआ',
      village: 'गांव',
      taluka: 'तालुका',
      district: 'जिला',
      noData: 'कोई डेटा उपलब्ध नहीं',
      summary: 'सारांश',
      details: 'विवरण'
    }
  };

  const t = translations[user?.language || 'marathi'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getProgressPercentage = (paid: number, total: number) => {
    return total > 0 ? (paid / total) * 100 : 0;
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 80) {
      return <Badge className="bg-green-100 text-green-700">{t.completed}</Badge>;
    } else if (percentage >= 20) {
      return <Badge className="bg-yellow-100 text-yellow-700">{t.inProgress}</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-700">{t.notStarted}</Badge>;
    }
  };

  const villageData = selectedProject ? getVillageSummary(selectedProject) : [];

  const filteredVillageData = selectedVillage && selectedVillage !== 'all' 
    ? villageData.filter(v => v.villageName === selectedVillage)
    : villageData;

  const totalStats = villageData.reduce((acc, village) => ({
    totalCompensation: acc.totalCompensation + village.totalCompensation,
    totalSurveyNos: acc.totalSurveyNos + village.totalSurveyNos,
    totalLandParties: acc.totalLandParties + village.totalLandParties,
    totalArea: acc.totalArea + village.totalArea,
    compensationPaid: acc.compensationPaid + village.compensationPaid,
    paidSurveyNos: acc.paidSurveyNos + village.paidSurveyNos,
    paidLandParties: acc.paidLandParties + village.paidLandParties,
    paidArea: acc.paidArea + village.paidArea,
    pendingCompensation: acc.pendingCompensation + village.pendingCompensation,
    pendingSurveyNos: acc.pendingSurveyNos + village.pendingSurveyNos,
    pendingLandParties: acc.pendingLandParties + village.pendingLandParties,
    pendingArea: acc.pendingArea + village.pendingArea,
  }), {
    totalCompensation: 0,
    totalSurveyNos: 0,
    totalLandParties: 0,
    totalArea: 0,
    compensationPaid: 0,
    paidSurveyNos: 0,
    paidLandParties: 0,
    paidArea: 0,
    pendingCompensation: 0,
    pendingSurveyNos: 0,
    pendingLandParties: 0,
    pendingArea: 0,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t.download}
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t.selectProject}</label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t.selectVillage}</label>
          <Select value={selectedVillage} onValueChange={setSelectedVillage}>
            <SelectTrigger>
              <SelectValue placeholder="All villages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allVillages}</SelectItem>
              {villageData.map((village) => (
                <SelectItem key={village.villageName} value={village.villageName}>
                  {village.villageName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {selectedProject && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <IndianRupee className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(totalStats.totalCompensation)}
                  </p>
                  <p className="text-sm text-gray-600">{t.totalCompensation}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">{totalStats.totalSurveyNos}</p>
                  <p className="text-sm text-gray-600">{t.totalSurveyNos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">{totalStats.totalLandParties}</p>
                  <p className="text-sm text-gray-600">{t.totalLandParties}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MapPin className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">{totalStats.totalArea.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">{t.totalArea} ({t.hectares})</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Village Details */}
      {selectedProject && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Acquisition Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                <span>{t.acquisition} {t.summary}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t.compensationPaid}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(totalStats.compensationPaid)}
                    </span>
                    <Badge className="bg-green-100 text-green-700">
                      {totalStats.paidSurveyNos} {t.surveys}
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={getProgressPercentage(totalStats.compensationPaid, totalStats.totalCompensation)} 
                  className="h-2"
                />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t.pendingPayment}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-yellow-600">
                      {formatCurrency(totalStats.pendingCompensation)}
                    </span>
                    <Badge className="bg-yellow-100 text-yellow-700">
                      {totalStats.pendingSurveyNos} {t.surveys}
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={getProgressPercentage(totalStats.pendingCompensation, totalStats.totalCompensation)} 
                  className="h-2 bg-gray-200"
                />
              </div>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                <span>{t.progress} {t.overview}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t.paid}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-green-600">
                      {totalStats.paidLandParties}
                    </span>
                    <span className="text-sm text-gray-500">{t.parties}</span>
                  </div>
                </div>
                <Progress 
                  value={getProgressPercentage(totalStats.paidLandParties, totalStats.totalLandParties)} 
                  className="h-2 bg-green-100"
                />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t.pending}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-yellow-600">
                      {totalStats.pendingLandParties}
                    </span>
                    <span className="text-sm text-gray-500">{t.parties}</span>
                  </div>
                </div>
                <Progress 
                  value={getProgressPercentage(totalStats.pendingLandParties, totalStats.totalLandParties)} 
                  className="h-2 bg-yellow-100"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Village Table */}
      {selectedProject && filteredVillageData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              <span>{t.village} {t.details}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.village}</TableHead>
                    <TableHead>{t.totalCompensation}</TableHead>
                    <TableHead>{t.totalSurveyNos}</TableHead>
                    <TableHead>{t.totalLandParties}</TableHead>
                    <TableHead>{t.totalArea} ({t.hectares})</TableHead>
                    <TableHead>{t.compensationPaid}</TableHead>
                    <TableHead>{t.pendingPayment}</TableHead>
                    <TableHead>{t.progress}</TableHead>
                    <TableHead>{t.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVillageData.map((village) => {
                    const progressPercentage = getProgressPercentage(
                      village.compensationPaid, 
                      village.totalCompensation
                    );
                    
                    return (
                      <TableRow key={village.villageName}>
                        <TableCell className="font-medium">{village.villageName}</TableCell>
                        <TableCell>{formatCurrency(village.totalCompensation)}</TableCell>
                        <TableCell>{village.totalSurveyNos}</TableCell>
                        <TableCell>{village.totalLandParties}</TableCell>
                        <TableCell>{village.totalArea.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(village.compensationPaid)}
                        </TableCell>
                        <TableCell className="text-yellow-600">
                          {formatCurrency(village.pendingCompensation)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={progressPercentage} className="w-16 h-2" />
                            <span className="text-sm">{Math.round(progressPercentage)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(progressPercentage)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {selectedProject && filteredVillageData.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{t.noData}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VillageWiseReports;