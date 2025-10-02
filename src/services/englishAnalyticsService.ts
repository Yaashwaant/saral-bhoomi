import { API_BASE_URL } from '@/config';

export interface EnglishCompleteRecord {
  _id: string;
  serial_number: string;
  owner_name: string;
  old_survey_number: string;
  new_survey_number: string;
  group_number: string;
  cts_number: string;
  village: string;
  taluka: string;
  district: string;
  land_area_as_per_7_12: number;
  acquired_land_area: number;
  land_type: string;
  land_classification: string;
  approved_rate_per_hectare: number;
  market_value_as_per_acquired_area: number;
  factor_as_per_section_26_2: number;
  land_compensation_as_per_section_26: number;
  structures: number;
  forest_trees: number;
  fruit_trees: number;
  wells_borewells: number;
  total_structures_amount: number;
  total_amount_14_23: number;
  solatium_amount: number;
  determined_compensation_26: number;
  enhanced_compensation_25_percent: number;
  total_compensation_26_27: number;
  deduction_amount: number;
  final_payable_compensation: number;
  remarks: string;
  compensation_distribution_status: string;
  project_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface EnglishAnalyticsStats {
  totalRecords: number;
  totalLandArea: number;
  totalAcquiredArea: number;
  totalCompensation: number;
  averageCompensationPerHectare: number;
  uniqueVillages: number;
  uniqueTalukas: number;
  uniqueDistricts: number;
  recordsWithStructures: number;
  recordsWithTrees: number;
  recordsWithWells: number;
  completionRate: number;
  dataQualityScore: number;
}

export interface ChartData {
  name: string;
  value: number;
  count?: number;
  percentage?: number;
}

export interface LocationAnalysis {
  district: string;
  taluka: string;
  village: string;
  recordCount: number;
  totalArea: number;
  totalCompensation: number;
  averageCompensation: number;
}

export interface CompensationAnalysis {
  range: string;
  count: number;
  percentage: number;
  totalAmount: number;
}

export interface AssetAnalysis {
  hasStructures: number;
  hasTrees: number;
  hasWells: number;
  hasMultipleAssets: number;
  noAssets: number;
}

class EnglishAnalyticsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL || 'http://localhost:5000';
  }

  /**
   * Fetch all English complete records
   */
  async fetchEnglishCompleteRecords(): Promise<EnglishCompleteRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/landowners2-english/list`);
      const data = await response.json();
      
      if (data.success) {
        return data.records || [];
      }
      throw new Error(data.message || 'Failed to fetch records');
    } catch (error) {
      console.error('Error fetching English complete records:', error);
      throw error;
    }
  }

  /**
   * Fetch English complete records by project ID
   */
  async fetchRecordsByProject(projectId: string): Promise<EnglishCompleteRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/landowners2-english/${projectId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.records || [];
      }
      throw new Error(data.message || 'Failed to fetch project records');
    } catch (error) {
      console.error('Error fetching project records:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive analytics statistics
   */
  calculateAnalyticsStats(records: EnglishCompleteRecord[]): EnglishAnalyticsStats {
    const activeRecords = records.filter(r => r.is_active);
    
    const totalLandArea = activeRecords.reduce((sum, r) => 
      sum + (parseFloat(r.land_area_as_per_7_12?.toString() || '0') || 0), 0
    );
    
    const totalAcquiredArea = activeRecords.reduce((sum, r) => 
      sum + (parseFloat(r.acquired_land_area?.toString() || '0') || 0), 0
    );
    
    const totalCompensation = activeRecords.reduce((sum, r) => 
      sum + (parseFloat(r.final_payable_compensation?.toString() || '0') || 0), 0
    );

    const recordsWithStructures = activeRecords.filter(r => 
      parseFloat(r.structures?.toString() || '0') > 0
    ).length;

    const recordsWithTrees = activeRecords.filter(r => 
      (parseFloat(r.forest_trees?.toString() || '0') > 0) || 
      (parseFloat(r.fruit_trees?.toString() || '0') > 0)
    ).length;

    const recordsWithWells = activeRecords.filter(r => 
      parseFloat(r.wells_borewells?.toString() || '0') > 0
    ).length;

    // Calculate completion rate (records with all essential fields)
    const completeRecords = activeRecords.filter(r => 
      r.owner_name && 
      r.village && 
      r.taluka && 
      r.district && 
      r.final_payable_compensation
    ).length;

    const completionRate = activeRecords.length > 0 ? (completeRecords / activeRecords.length) * 100 : 0;

    // Calculate data quality score
    const recordsWithRemarks = activeRecords.filter(r => r.remarks && r.remarks.trim()).length;
    const recordsWithCompensationStatus = activeRecords.filter(r => r.compensation_distribution_status).length;
    const dataQualityScore = activeRecords.length > 0 ? 
      ((completeRecords + recordsWithRemarks + recordsWithCompensationStatus) / (activeRecords.length * 3)) * 100 : 0;

    return {
      totalRecords: activeRecords.length,
      totalLandArea,
      totalAcquiredArea,
      totalCompensation,
      averageCompensationPerHectare: totalAcquiredArea > 0 ? totalCompensation / totalAcquiredArea : 0,
      uniqueVillages: new Set(activeRecords.map(r => r.village).filter(Boolean)).size,
      uniqueTalukas: new Set(activeRecords.map(r => r.taluka).filter(Boolean)).size,
      uniqueDistricts: new Set(activeRecords.map(r => r.district).filter(Boolean)).size,
      recordsWithStructures,
      recordsWithTrees,
      recordsWithWells,
      completionRate,
      dataQualityScore
    };
  }

  /**
   * Get district-wise analysis
   */
  getDistrictWiseAnalysis(records: EnglishCompleteRecord[]): ChartData[] {
    const activeRecords = records.filter(r => r.is_active);
    const districtData = activeRecords.reduce((acc, record) => {
      if (!record.district) return acc;
      
      if (!acc[record.district]) {
        acc[record.district] = {
          count: 0,
          totalCompensation: 0,
          totalArea: 0
        };
      }
      
      acc[record.district].count += 1;
      acc[record.district].totalCompensation += parseFloat(record.final_payable_compensation?.toString() || '0') || 0;
      acc[record.district].totalArea += parseFloat(record.acquired_land_area?.toString() || '0') || 0;
      
      return acc;
    }, {} as Record<string, { count: number; totalCompensation: number; totalArea: number }>);

    return Object.entries(districtData)
      .map(([district, data]) => ({
        name: district,
        value: data.totalCompensation,
        count: data.count
      }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Get land type distribution
   */
  getLandTypeDistribution(records: EnglishCompleteRecord[]): ChartData[] {
    const activeRecords = records.filter(r => r.is_active);
    const landTypeData = activeRecords.reduce((acc, record) => {
      if (!record.land_type) return acc;
      
      acc[record.land_type] = (acc[record.land_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = activeRecords.length;
    return Object.entries(landTypeData)
      .map(([type, count]) => ({
        name: type,
        value: count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Get compensation distribution analysis
   */
  getCompensationDistribution(records: EnglishCompleteRecord[]): CompensationAnalysis[] {
    const activeRecords = records.filter(r => r.is_active);
    const ranges = [
      { label: '0-1L', min: 0, max: 100000 },
      { label: '1L-5L', min: 100000, max: 500000 },
      { label: '5L-10L', min: 500000, max: 1000000 },
      { label: '10L-25L', min: 1000000, max: 2500000 },
      { label: '25L-50L', min: 2500000, max: 5000000 },
      { label: '50L+', min: 5000000, max: Infinity }
    ];

    const total = activeRecords.length;
    return ranges.map(range => {
      const recordsInRange = activeRecords.filter(r => {
        const compensation = parseFloat(r.final_payable_compensation?.toString() || '0') || 0;
        return compensation >= range.min && compensation < range.max;
      });

      const totalAmount = recordsInRange.reduce((sum, r) => 
        sum + (parseFloat(r.final_payable_compensation?.toString() || '0') || 0), 0
      );

      return {
        range: range.label,
        count: recordsInRange.length,
        percentage: total > 0 ? (recordsInRange.length / total) * 100 : 0,
        totalAmount
      };
    });
  }

  /**
   * Get detailed location analysis
   */
  getLocationAnalysis(records: EnglishCompleteRecord[]): LocationAnalysis[] {
    const activeRecords = records.filter(r => r.is_active);
    const locationData = activeRecords.reduce((acc, record) => {
      if (!record.district || !record.taluka || !record.village) return acc;
      
      const key = `${record.district}-${record.taluka}-${record.village}`;
      if (!acc[key]) {
        acc[key] = {
          district: record.district,
          taluka: record.taluka,
          village: record.village,
          recordCount: 0,
          totalArea: 0,
          totalCompensation: 0,
          averageCompensation: 0
        };
      }
      
      acc[key].recordCount += 1;
      acc[key].totalArea += parseFloat(record.acquired_land_area?.toString() || '0') || 0;
      acc[key].totalCompensation += parseFloat(record.final_payable_compensation?.toString() || '0') || 0;
      
      return acc;
    }, {} as Record<string, LocationAnalysis>);

    // Calculate average compensation
    Object.values(locationData).forEach(location => {
      location.averageCompensation = location.totalArea > 0 ? 
        location.totalCompensation / location.totalArea : 0;
    });

    return Object.values(locationData).sort((a, b) => b.totalCompensation - a.totalCompensation);
  }

  /**
   * Get asset analysis
   */
  getAssetAnalysis(records: EnglishCompleteRecord[]): AssetAnalysis {
    const activeRecords = records.filter(r => r.is_active);
    
    const hasStructures = activeRecords.filter(r => 
      parseFloat(r.structures?.toString() || '0') > 0
    ).length;

    const hasTrees = activeRecords.filter(r => 
      (parseFloat(r.forest_trees?.toString() || '0') > 0) || 
      (parseFloat(r.fruit_trees?.toString() || '0') > 0)
    ).length;

    const hasWells = activeRecords.filter(r => 
      parseFloat(r.wells_borewells?.toString() || '0') > 0
    ).length;

    const hasMultipleAssets = activeRecords.filter(r => {
      const hasStruct = parseFloat(r.structures?.toString() || '0') > 0;
      const hasTree = (parseFloat(r.forest_trees?.toString() || '0') > 0) || 
                      (parseFloat(r.fruit_trees?.toString() || '0') > 0);
      const hasWell = parseFloat(r.wells_borewells?.toString() || '0') > 0;
      
      return [hasStruct, hasTree, hasWell].filter(Boolean).length > 1;
    }).length;

    const noAssets = activeRecords.filter(r => {
      const hasStruct = parseFloat(r.structures?.toString() || '0') > 0;
      const hasTree = (parseFloat(r.forest_trees?.toString() || '0') > 0) || 
                      (parseFloat(r.fruit_trees?.toString() || '0') > 0);
      const hasWell = parseFloat(r.wells_borewells?.toString() || '0') > 0;
      
      return !hasStruct && !hasTree && !hasWell;
    }).length;

    return {
      hasStructures,
      hasTrees,
      hasWells,
      hasMultipleAssets,
      noAssets
    };
  }

  /**
   * Get monthly trend data (based on created_at)
   */
  getMonthlyTrends(records: EnglishCompleteRecord[]): ChartData[] {
    const activeRecords = records.filter(r => r.is_active && r.created_at);
    const monthlyData = activeRecords.reduce((acc, record) => {
      const date = new Date(record.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          count: 0,
          totalCompensation: 0
        };
      }
      
      acc[monthKey].count += 1;
      acc[monthKey].totalCompensation += parseFloat(record.final_payable_compensation?.toString() || '0') || 0;
      
      return acc;
    }, {} as Record<string, { count: number; totalCompensation: number }>);

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        name: month,
        value: data.count,
        count: data.totalCompensation
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Filter records by various criteria
   */
  filterRecords(
    records: EnglishCompleteRecord[],
    filters: {
      searchTerm?: string;
      district?: string;
      taluka?: string;
      village?: string;
      landType?: string;
      compensationRange?: { min: number; max: number };
      hasAssets?: boolean;
    }
  ): EnglishCompleteRecord[] {
    let filtered = records.filter(r => r.is_active);

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.owner_name?.toLowerCase().includes(term) ||
        r.serial_number?.toString().includes(term) ||
        r.new_survey_number?.toString().includes(term) ||
        r.old_survey_number?.toString().includes(term)
      );
    }

    if (filters.district && filters.district !== 'all') {
      filtered = filtered.filter(r => r.district === filters.district);
    }

    if (filters.taluka && filters.taluka !== 'all') {
      filtered = filtered.filter(r => r.taluka === filters.taluka);
    }

    if (filters.village && filters.village !== 'all') {
      filtered = filtered.filter(r => r.village === filters.village);
    }

    if (filters.landType && filters.landType !== 'all') {
      filtered = filtered.filter(r => r.land_type === filters.landType);
    }

    if (filters.compensationRange) {
      filtered = filtered.filter(r => {
        const compensation = parseFloat(r.final_payable_compensation?.toString() || '0') || 0;
        return compensation >= filters.compensationRange!.min && 
               compensation <= filters.compensationRange!.max;
      });
    }

    if (filters.hasAssets !== undefined) {
      filtered = filtered.filter(r => {
        const hasAssets = (parseFloat(r.structures?.toString() || '0') > 0) ||
                         (parseFloat(r.forest_trees?.toString() || '0') > 0) ||
                         (parseFloat(r.fruit_trees?.toString() || '0') > 0) ||
                         (parseFloat(r.wells_borewells?.toString() || '0') > 0);
        return hasAssets === filters.hasAssets;
      });
    }

    return filtered;
  }

  /**
   * Export data to CSV format
   */
  exportToCSV(records: EnglishCompleteRecord[]): string {
    const headers = [
      'Serial Number',
      'Owner Name',
      'Old Survey Number',
      'New Survey Number',
      'Group Number',
      'CTS Number',
      'Village',
      'Taluka',
      'District',
      'Land Area (7/12)',
      'Acquired Area',
      'Land Type',
      'Land Classification',
      'Rate per Hectare',
      'Market Value',
      'Factor (26.2)',
      'Land Compensation',
      'Structures',
      'Forest Trees',
      'Fruit Trees',
      'Wells/Borewells',
      'Total Structures Amount',
      'Total Amount (14-23)',
      'Solatium Amount',
      'Determined Compensation',
      'Enhanced Compensation',
      'Total Compensation',
      'Deduction Amount',
      'Final Payable Compensation',
      'Remarks',
      'Distribution Status',
      'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...records.map(record => [
        record.serial_number,
        `"${record.owner_name || ''}"`,
        record.old_survey_number,
        record.new_survey_number,
        record.group_number,
        record.cts_number,
        `"${record.village || ''}"`,
        `"${record.taluka || ''}"`,
        `"${record.district || ''}"`,
        record.land_area_as_per_7_12,
        record.acquired_land_area,
        `"${record.land_type || ''}"`,
        `"${record.land_classification || ''}"`,
        record.approved_rate_per_hectare,
        record.market_value_as_per_acquired_area,
        record.factor_as_per_section_26_2,
        record.land_compensation_as_per_section_26,
        record.structures,
        record.forest_trees,
        record.fruit_trees,
        record.wells_borewells,
        record.total_structures_amount,
        record.total_amount_14_23,
        record.solatium_amount,
        record.determined_compensation_26,
        record.enhanced_compensation_25_percent,
        record.total_compensation_26_27,
        record.deduction_amount,
        record.final_payable_compensation,
        `"${record.remarks || ''}"`,
        `"${record.compensation_distribution_status || ''}"`,
        record.created_at
      ].join(','))
    ].join('\n');

    return csvContent;
  }
}

export const englishAnalyticsService = new EnglishAnalyticsService();
export default englishAnalyticsService;