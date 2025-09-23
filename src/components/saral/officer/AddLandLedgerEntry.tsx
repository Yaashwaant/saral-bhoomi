import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Plus,
  Save,
  RefreshCw,
  Hash,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

interface LandEntryForm {
  surveyNumber: string;
  propertyNumber: string;
  ownerId: string;
  landType: string;
  action: string;
  details: string;
  landArea: string;
  location: string;
  projectDetails: string;
}

interface GasEstimate {
  estimatedGas: string;
  gasPrice: string;
  totalCost: string;
}

const AddLandLedgerEntry: React.FC = () => {
  const [formData, setFormData] = useState<LandEntryForm>({
    surveyNumber: '',
    propertyNumber: '',
    ownerId: '',
    landType: '',
    action: '',
    details: '',
    landArea: '',
    location: '',
    projectDetails: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState<string>('');

  const landTypes = [
    'Agricultural',
    'Non-Agricultural',
    'Residential',
    'Commercial',
    'Industrial',
    'Forest',
    'Wasteland',
    'Government'
  ];

  const actions = [
    'Award Declared',
    'Notice Generated',
    'JMR Measurement Uploaded',
    'Payment Slip Created',
    'Payment Released',
    'Payment Pending',
    'Payment Failed',
    'Ownership Updated',
    'Compensated',
    'Status Update'
  ];

  const handleInputChange = (field: keyof LandEntryForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const estimateGas = async () => {
    if (!formData.surveyNumber || !formData.action) {
      toast.error('Please fill in survey number and action first');
      return;
    }

    setIsEstimatingGas(true);
    try {
      const response = await fetch('/api/blockchain/gas-estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          survey_number: formData.surveyNumber,
          event_type: formData.action.toUpperCase().replace(/\s+/g, '_'),
          metadata: {
            details: formData.details,
            landArea: formData.landArea,
            location: formData.location,
            projectDetails: formData.projectDetails
          },
          ownerId: formData.ownerId,
          landType: formData.landType,
          landArea: formData.landArea,
          location: formData.location,
          projectDetails: formData.projectDetails
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGasEstimate(data.data);
        toast.success('Gas estimate calculated successfully');
      } else {
        toast.error('Failed to estimate gas');
      }
    } catch (error) {
      console.error('Gas estimation error:', error);
      toast.error('Failed to estimate gas');
    } finally {
      setIsEstimatingGas(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.surveyNumber || !formData.action || !formData.ownerId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/blockchain/entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          survey_number: formData.surveyNumber,
          event_type: formData.action.toUpperCase().replace(/\s+/g, '_'),
          officer_id: 'current_user_id', // This should come from auth context
          project_id: 'current_project_id', // This should come from context
          remarks: formData.details,
          metadata: {
            details: formData.details,
            landArea: formData.landArea,
            location: formData.location,
            projectDetails: formData.projectDetails,
            ownerId: formData.ownerId,
            landType: formData.landType
          },
          ownerId: formData.ownerId,
          landType: formData.landType,
          landArea: formData.landArea,
          location: formData.location,
          projectDetails: formData.projectDetails
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Land ledger entry created successfully!');
        setBlockchainStatus('Entry created and added to blockchain');
        
        // Reset form
        setFormData({
          surveyNumber: '',
          propertyNumber: '',
          ownerId: '',
          landType: '',
          action: '',
          details: '',
          landArea: '',
          location: '',
          projectDetails: ''
        });
        setGasEstimate(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create entry');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to create entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Land Ledger Entry</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Create a new blockchain entry for land records with comprehensive data collection
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-4" />
              Land Entry Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="surveyNumber">Survey Number *</Label>
                  <Input
                    id="surveyNumber"
                    value={formData.surveyNumber}
                    onChange={(e) => handleInputChange('surveyNumber', e.target.value)}
                    placeholder="e.g., SY-2024-001"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="propertyNumber">Property Number *</Label>
                  <Input
                    id="propertyNumber"
                    value={formData.propertyNumber}
                    onChange={(e) => handleInputChange('propertyNumber', e.target.value)}
                    placeholder="e.g., PR-2024-001"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ownerId">Owner ID *</Label>
                  <Input
                    id="ownerId"
                    value={formData.ownerId}
                    onChange={(e) => handleInputChange('ownerId', e.target.value)}
                    placeholder="e.g., OWN-001"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="landType">Land Type *</Label>
                  <Select value={formData.landType} onValueChange={(value) => handleInputChange('landType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select land type" />
                    </SelectTrigger>
                    <SelectContent>
                      {landTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="action">Action *</Label>
                  <Select value={formData.action} onValueChange={(value) => handleInputChange('action', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      {actions.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="landArea">Land Area</Label>
                  <Input
                    id="landArea"
                    value={formData.landArea}
                    onChange={(e) => handleInputChange('landArea', e.target.value)}
                    placeholder="e.g., 5 acres"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Village, District, State"
                  />
                </div>

                <div>
                  <Label htmlFor="projectDetails">Project Details</Label>
                  <Input
                    id="projectDetails"
                    value={formData.projectDetails}
                    onChange={(e) => handleInputChange('projectDetails', e.target.value)}
                    placeholder="e.g., Highway expansion project"
                  />
                </div>
              </div>

              {/* Details */}
              <div>
                <Label htmlFor="details">Details *</Label>
                <Textarea
                  id="details"
                  value={formData.details}
                  onChange={(e) => handleInputChange('details', e.target.value)}
                  placeholder="Enter detailed description of the land entry..."
                  rows={4}
                  required
                />
              </div>

              {/* Gas Estimation */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Blockchain Gas Estimation</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={estimateGas}
                    disabled={isEstimatingGas || !formData.surveyNumber || !formData.action}
                  >
                    {isEstimatingGas ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Estimating...
                      </>
                    ) : (
                      <>
                        <Hash className="h-4 w-4 mr-2" />
                        Estimate Gas
                      </>
                    )}
                  </Button>
                </div>

                {gasEstimate && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Estimated Gas:</span>
                        <p className="text-blue-700">{gasEstimate.estimatedGas}</p>
                      </div>
                      <div>
                        <span className="font-medium">Gas Price:</span>
                        <p className="text-blue-700">{gasEstimate.gasPrice}</p>
                      </div>
                      <div>
                        <span className="font-medium">Total Cost:</span>
                        <p className="text-blue-700">{gasEstimate.totalCost}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Blockchain Status */}
              {blockchainStatus && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {blockchainStatus}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating Entry...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Entry
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddLandLedgerEntry;
