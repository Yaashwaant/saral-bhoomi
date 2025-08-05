import {
  NoticeTemplate,
  GeneratedNotice,
  CSVFieldMapping,
  NoticeGenerationConfig,
  EnhancedLandownerRecord,
  NoticeGenerationResult,
  NoticeGenerationError
} from '@/types/notice';

export class NoticeGenerationService {
  private static instance: NoticeGenerationService;
  
  private constructor() {}
  
  public static getInstance(): NoticeGenerationService {
    if (!NoticeGenerationService.instance) {
      NoticeGenerationService.instance = new NoticeGenerationService();
    }
    return NoticeGenerationService.instance;
  }

  /**
   * Generate notices for selected landowner records
   */
  public async generateNotices(
    config: NoticeGenerationConfig,
    records: EnhancedLandownerRecord[],
    template: NoticeTemplate
  ): Promise<NoticeGenerationResult> {
    const result: NoticeGenerationResult = {
      success: false,
      noticesGenerated: 0,
      noticesFailed: 0,
      errors: [],
      generatedNotices: []
    };

    try {
      // Validate configuration
      const validationErrors = this.validateConfig(config, template);
      if (validationErrors.length > 0) {
        result.errors = validationErrors;
        return result;
      }

      // Generate notices for each record
      for (const record of records) {
        try {
          console.log('Generating notice for record:', record.id);
          console.log('Record data:', record);
          console.log('Config:', config);
          console.log('Template:', template);
          
          const notice = await this.generateSingleNotice(config, record, template);
          result.generatedNotices.push(notice);
          result.noticesGenerated++;
        } catch (error) {
          console.error('Error generating notice for record:', record.id, error);
          const errorObj: NoticeGenerationError = {
            code: 'NOTICE_GENERATION_FAILED',
            message: 'Failed to generate notice',
            messageMarathi: 'नोटीस तयार करण्यात अयशस्वी',
            messageHindi: 'नोटिस जनरेट करने में असफल',
            messageEnglish: 'Failed to generate notice',
            recordId: record.id,
            field: 'general'
          };
          result.errors.push(errorObj);
          result.noticesFailed++;
        }
      }

      result.success = result.noticesFailed === 0;
      return result;
    } catch (error) {
      const errorObj: NoticeGenerationError = {
        code: 'GENERAL_ERROR',
        message: 'General error occurred',
        messageMarathi: 'सामान्य त्रुटी आली',
        messageHindi: 'सामान्य त्रुटि हुई',
        messageEnglish: 'General error occurred'
      };
      result.errors.push(errorObj);
      return result;
    }
  }

  /**
   * Generate a single notice for a landowner record
   */
  private async generateSingleNotice(
    config: NoticeGenerationConfig,
    record: EnhancedLandownerRecord,
    template: NoticeTemplate
  ): Promise<GeneratedNotice> {
    console.log('generateSingleNotice called with:', { config, record, template });
    
    // Validate required fields
    const missingFields = this.validateRequiredFields(config, record);
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Generate notice content
    const content = this.generateContent(config, record, template);
    console.log('Generated content:', content);

    // Generate notice number
    const noticeNumber = this.generateNoticeNumber(record);

    // Create notice object
    const notice: GeneratedNotice = {
      id: Date.now().toString() + record.id,
      landownerId: record.id,
      projectId: record.projectId,
      templateId: config.templateId,
      noticeNumber,
      noticeDate: new Date(),
      content,
      status: 'generated',
      issuedBy: 'current-user',
      deliveryStatus: 'pending'
    };

    console.log('Generated notice:', notice);
    return notice;
  }

  /**
   * Generate notice content by replacing variables
   */
  private generateContent(
    config: NoticeGenerationConfig,
    record: EnhancedLandownerRecord,
    template: NoticeTemplate
  ): string {
    let content = template.content;

    // Replace variables with record data
    config.fieldMappings.forEach(mapping => {
      const value = this.getFieldValue(record, mapping.templateVariable);
      if (value !== undefined) {
        const formattedValue = this.formatValue(value, mapping.dataType);
        content = content.replace(
          new RegExp(`\\[${mapping.templateVariable}\\]`, 'g'),
          formattedValue
        );
      }
    });

    // Replace common variables
    content = this.replaceCommonVariables(content, record);

    return content;
  }

  /**
   * Get field value from record
   */
  private getFieldValue(record: EnhancedLandownerRecord, fieldName: string): any {
    const fieldMap: { [key: string]: keyof EnhancedLandownerRecord } = {
      'SURVEY_NUMBER': 'surveyNumber',
      'OWNER_NAME': 'landownerName',
      'AREA': 'area',
      'ACQUIRED_AREA': 'acquiredArea',
      'RATE': 'rate',
      'COMPENSATION_AMOUNT': 'compensationAmount',
      'SOLATIUM': 'solatium',
      'FINAL_AMOUNT': 'finalAmount',
      'VILLAGE': 'village',
      'TALUKA': 'taluka',
      'DISTRICT': 'district'
    };

    const mappedField = fieldMap[fieldName];
    const value = mappedField ? record[mappedField] : undefined;
    console.log(`getFieldValue: ${fieldName} -> ${mappedField} = ${value}`);
    return value;
  }

  /**
   * Format value based on data type
   */
  private formatValue(value: any, dataType: string): string {
    switch (dataType) {
      case 'currency':
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR'
        }).format(Number(value));
      case 'number':
        return new Intl.NumberFormat('en-IN').format(Number(value));
      case 'date':
        return new Date(value).toLocaleDateString('hi-IN');
      default:
        return String(value);
    }
  }

  /**
   * Replace common variables in template
   */
  private replaceCommonVariables(content: string, record: EnhancedLandownerRecord): string {
    const today = new Date();
    
    return content
      .replace(/\[CURRENT_DATE\]/g, today.toLocaleDateString('hi-IN'))
      .replace(/\[CURRENT_TIME\]/g, today.toLocaleTimeString('hi-IN'))
      .replace(/\[NOTICE_NUMBER\]/g, this.generateNoticeNumber(record))
      .replace(/\[PROJECT_NAME\]/g, 'Railway Flyover Project')
      .replace(/\[OFFICE_NAME\]/g, 'उपजिल्हाधिकारी (भूसंपादन) सुर्या प्रकल्प, डहाणू')
      .replace(/\[OFFICE_ADDRESS\]/g, 'इराणी रोड, आय.डी. बी. आय. बँकेच्या समोर, ता. डहाणू जि.पालघर')
      .replace(/\[PHONE_NUMBER\]/g, '०२५२८-२२०१८०')
      .replace(/\[EMAIL\]/g, 'desplandacquisition@gmail.com');
  }

  /**
   * Generate unique notice number
   */
  private generateNoticeNumber(record: EnhancedLandownerRecord): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `NOTICE-${timestamp}-${record.surveyNumber}-${random}`;
  }

  /**
   * Validate configuration
   */
  private validateConfig(
    config: NoticeGenerationConfig,
    template: NoticeTemplate
  ): NoticeGenerationError[] {
    const errors: NoticeGenerationError[] = [];

    if (!config.projectId) {
      errors.push({
        code: 'MISSING_PROJECT_ID',
        message: 'Project ID is required',
        messageMarathi: 'प्रकल्प आयडी आवश्यक आहे',
        messageHindi: 'प्रोजेक्ट आईडी आवश्यक है',
        messageEnglish: 'Project ID is required'
      });
    }

    if (!config.templateId) {
      errors.push({
        code: 'MISSING_TEMPLATE_ID',
        message: 'Template ID is required',
        messageMarathi: 'टेम्पलेट आयडी आवश्यक आहे',
        messageHindi: 'टेम्पलेट आईडी आवश्यक है',
        messageEnglish: 'Template ID is required'
      });
    }

    if (!template) {
      errors.push({
        code: 'TEMPLATE_NOT_FOUND',
        message: 'Notice template not found',
        messageMarathi: 'नोटीस टेम्पलेट सापडले नाही',
        messageHindi: 'नोटिस टेम्पलेट नहीं मिला',
        messageEnglish: 'Notice template not found'
      });
    }

    return errors;
  }

  /**
   * Validate required fields in record
   */
  private validateRequiredFields(
    config: NoticeGenerationConfig,
    record: EnhancedLandownerRecord
  ): string[] {
    const missingFields: string[] = [];
    console.log('Validating required fields for record:', record.id);
    console.log('Field mappings:', config.fieldMappings);

    config.fieldMappings.forEach(mapping => {
      if (mapping.isRequired) {
        const value = this.getFieldValue(record, mapping.templateVariable);
        console.log(`Field ${mapping.csvField} (${mapping.templateVariable}):`, value);
        if (value === undefined || value === null || value === '') {
          missingFields.push(mapping.csvField);
        }
      }
    });

    console.log('Missing fields:', missingFields);
    return missingFields;
  }

  /**
   * Generate notice content in multiple languages
   */
  public generateMultilingualContent(
    template: NoticeTemplate,
    record: EnhancedLandownerRecord,
    language: 'marathi' | 'hindi' | 'english'
  ): string {
    let content = template.content;

    // Replace variables based on language
    const languageMappings = {
      marathi: {
        'SURVEY_NUMBER': 'सर्वे क्रमांक',
        'OWNER_NAME': 'मालकाचे नाव',
        'VILLAGE': 'गाव',
        'TALUKA': 'तालुका',
        'DISTRICT': 'जिल्हा',
        'AREA': 'क्षेत्र',
        'COMPENSATION': 'मोबदला'
      },
      hindi: {
        'SURVEY_NUMBER': 'सर्वेक्षण संख्या',
        'OWNER_NAME': 'मालिक का नाम',
        'VILLAGE': 'गाँव',
        'TALUKA': 'तहसील',
        'DISTRICT': 'जिला',
        'AREA': 'क्षेत्र',
        'COMPENSATION': 'मुआवजा'
      },
      english: {
        'SURVEY_NUMBER': 'Survey Number',
        'OWNER_NAME': 'Owner Name',
        'VILLAGE': 'Village',
        'TALUKA': 'Taluka',
        'DISTRICT': 'District',
        'AREA': 'Area',
        'COMPENSATION': 'Compensation'
      }
    };

    const mappings = languageMappings[language];
    Object.entries(mappings).forEach(([key, value]) => {
      content = content.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
    });

    return content;
  }

  /**
   * Export notices to different formats
   */
  public exportNotices(
    notices: GeneratedNotice[],
    format: 'pdf' | 'docx' | 'txt'
  ): string {
    switch (format) {
      case 'txt':
        return this.exportToText(notices);
      case 'pdf':
        return this.exportToPDF(notices);
      case 'docx':
        return this.exportToDOCX(notices);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private exportToText(notices: GeneratedNotice[]): string {
    return notices.map(notice => 
      `Notice Number: ${notice.noticeNumber}\n` +
      `Date: ${notice.noticeDate.toLocaleDateString()}\n` +
      `Status: ${notice.status}\n` +
      `Content:\n${notice.content}\n` +
      '='.repeat(50) + '\n'
    ).join('\n');
  }

  private exportToPDF(notices: GeneratedNotice[]): string {
    // Implementation for PDF export
    return 'PDF export functionality to be implemented';
  }

  private exportToDOCX(notices: GeneratedNotice[]): string {
    // Implementation for DOCX export
    return 'DOCX export functionality to be implemented';
  }
} 