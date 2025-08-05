import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSaral } from '@/contexts/SaralContext';
import { toast } from 'sonner';
import { FileText, Download, Eye, Printer } from 'lucide-react';

interface GeneratedNotice {
  id: string;
  landownerId: string;
  noticeNumber: string;
  noticeDate: Date;
  content: string;
  status: 'draft' | 'generated' | 'sent';
}

const NoticeGenerator: React.FC = () => {
  const { projects, landownerRecords, updateLandownerRecord } = useSaral();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatedNotices, setGeneratedNotices] = useState<GeneratedNotice[]>([]);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    console.log('NoticeGenerator useEffect triggered:', {
      selectedProject,
      searchTerm,
      landownerRecordsCount: landownerRecords.length,
      landownerRecords: landownerRecords.slice(0, 2) // Log first 2 records for debugging
    });

    if (selectedProject) {
      const projectRecords = landownerRecords.filter(r => r.projectId === selectedProject);
      console.log('Project records found:', {
        projectId: selectedProject,
        totalRecords: projectRecords.length,
        sampleRecord: projectRecords[0]
      });

      let filtered = projectRecords;

      if (searchTerm) {
        filtered = filtered.filter(record => {
          const surveyMatch = record['स.नं./हि.नं./ग.नं.']?.toLowerCase().includes(searchTerm.toLowerCase());
          const ownerMatch = record['खातेदाराचे_नांव']?.toLowerCase().includes(searchTerm.toLowerCase());
          const villageMatch = record['गांव']?.toLowerCase().includes(searchTerm.toLowerCase());
          
          console.log('Search filtering:', {
            searchTerm,
            surveyMatch,
            ownerMatch,
            villageMatch,
            record: {
              survey: record['स.नं./हि.नं./ग.नं.'],
              owner: record['खातेदाराचे_नांव'],
              village: record['गांव']
            }
          });
          
          return surveyMatch || ownerMatch || villageMatch;
        });
      }

      console.log('Final filtered records:', {
        count: filtered.length,
        records: filtered.slice(0, 2)
      });

      setFilteredRecords(filtered);
    } else {
      console.log('No project selected, clearing filtered records');
      setFilteredRecords([]);
    }
  }, [selectedProject, searchTerm, landownerRecords]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(filteredRecords.map(r => r.id));
    } else {
      setSelectedRecords([]);
    }
  };

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    if (checked) {
      setSelectedRecords(prev => [...prev, recordId]);
    } else {
      setSelectedRecords(prev => prev.filter(id => id !== recordId));
    }
  };

  const formatNumber = (num: string | number | undefined | null) => {
    if (num === undefined || num === null || num === '') {
      return '0';
    }
    
    // Clean the value if it's a string (remove quotes, commas, etc.)
    let cleanNum = num;
    if (typeof num === 'string') {
      cleanNum = num.replace(/^"|"$/g, '').replace(/,/g, '');
    }
    
    const n = typeof cleanNum === 'string' ? parseFloat(cleanNum) : cleanNum;
    if (isNaN(n)) {
      console.warn(`Could not parse number: ${num} -> ${cleanNum} -> ${n}`);
      return '0';
    }
    return n.toLocaleString('en-IN');
  };

  const safeField = (record: any, fieldName: string) => {
    // Define field mappings between old and new formats
    const fieldMappings: { [key: string]: string[] } = {
      'खातेदाराचे_नांव': ['खातेदाराचे_नांव'],
      'स.नं./हि.नं./ग.नं.': ['स.नं./हि.नं./ग.नं.', 'सर्वे_नं'],
      'गांव': ['गांव', 'village'],
      'नमुना_7_12_नुसार_जमिनीचे_क्षेत्र': ['नमुना_7_12_नुसार_जमिनीचे_क्षेत्र', 'क्षेत्र'],
      'संपादित_जमिनीचे_क्षेत्र': ['संपादित_जमिनीचे_क्षेत्र', 'संपादित_क्षेत्र'],
      'जमिनीचा_प्रकार': ['जमिनीचा_प्रकार'],
      'जमिनीचा_प्रकार_शेती_बिनशेती': ['जमिनीचा_प्रकार_शेती_बिनशेती'],
      'मंजुर_केलेला_दर': ['मंजुर_केलेला_दर', 'दर'],
      'संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य': ['संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य'],
      'कलम_26_2_नुसार_गावास_लागु_असलेले_गणक': ['कलम_26_2_नुसार_गावास_लागु_असलेले_गणक'],
      'कलम_26_नुसार_जमिनीचा_मोबदला': ['कलम_26_नुसार_जमिनीचा_मोबदला'],
      'बांधकामे_रक्कम': ['बांधकामे_रक्कम', 'संरचना_झाडे_विहिरी_रक्कम'],
      'वनझाडे_रक्कम': ['वनझाडे_रक्कम'],
      'फळझाडे_रक्कम': ['फळझाडे_रक्कम'],
      'विहिरी_रक्कम': ['विहिरी_रक्कम'],
      'एकुण_रक्कम_13_15_17_19': ['एकुण_रक्कम_13_15_17_19'],
      'एकुण_रक्कम_11_20': ['एकुण_रक्कम_11_20'],
      'सोलेशियम_100': ['सोलेशियम_100'],
      'निर्धारित_मोबदला': ['निर्धारित_मोबदला'],
      'एकुण_रक्कमेवर_25_वाढीव_मोबदला': ['एकुण_रक्कमेवर_25_वाढीव_मोबदला'],
      'एकुण_मोबदला': ['एकुण_मोबदला', 'एकूण_मोबदला'],
      'वजावट_रक्कम': ['वजावट_रक्कम'],
      'हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम': ['हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम', 'अंतिम_रक्कम']
    };

    // Try all possible field names for this field
    const possibleFields = fieldMappings[fieldName] || [fieldName];
    let value = undefined;
    let matchedField = '';

    for (const possibleField of possibleFields) {
      if (record[possibleField] !== undefined && record[possibleField] !== null && record[possibleField] !== '') {
        value = record[possibleField];
        matchedField = possibleField;
        break;
      }
    }

    // If still not found, try fuzzy matching
    if (value === undefined || value === null) {
      const keys = Object.keys(record);
      const matchingKey = keys.find(key => 
        key.trim() === fieldName.trim() || 
        key.replace(/\s+/g, '') === fieldName.replace(/\s+/g, '') ||
        key.includes(fieldName.split('_')[0])
      );
      
      if (matchingKey) {
        value = record[matchingKey];
        matchedField = matchingKey;
      }
    }
    
    if (value === undefined || value === null || value === '') {
      console.warn(`Field ${fieldName} not found. Tried: ${possibleFields.join(', ')}. Available keys:`, Object.keys(record));
      return '';
    }
    
    if (matchedField !== fieldName) {
      console.log(`Field mapping: ${fieldName} -> ${matchedField} = ${value}`);
    }
    
    // Clean up the value (remove quotes if present)
    const cleanValue = typeof value === 'string' ? value.replace(/^"|"$/g, '') : value;
    return cleanValue;
  };

  const safeNumericField = (record: any, fieldName: string) => {
    const value = safeField(record, fieldName);
    return formatNumber(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('hi-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).split('/').join('/');
  };

  const generateNoticeContent = (record: any) => {
    console.log('Generating content for record:', record);
    console.log('Available fields in record:', Object.keys(record));
    
    // Debug specific field values
    console.log('Field values check:');
    console.log('खातेदाराचे_नांव:', record['खातेदाराचे_नांव']);
    console.log('स.नं./हि.नं./ग.नं.:', record['स.नं./हि.नं./ग.नं.']);
    console.log('गांव:', record['गांव']);
    console.log('मंजुर_केलेला_दर:', record['मंजुर_केलेला_दर']);
    console.log('सोलेशियम_100:', record['सोलेशियम_100']);
    
    const project = projects.find(p => p.id === record.projectId);
    const today = new Date();
    
    return `महाराष्ट्र शासन<br/>
उपजिल्हाधिकारी (भूसंपादन) सुर्या प्रकल्प, नांदे यांचे कार्यालय<br/>
पत्र व्यवहाराचा पत्ता-: इराणी रोड, आय.डी. बी. आय. बँकेच्या समोर, ता. नांदे जि.पालघर<br/>
दुरध्वनी क्रमांक ०२५२८-२२०१८० Email ID :desplandacquisition@gmail.com<br/>
जा.क्र./भूसंपादन/रेल्वे उड्डाणपूल प्रकल्प/कावि-${project?.pmisCode || 'PROJECT-001'}<br/>
<br/>
नोटीस:-<br/>
प्रति,<br/>
दिनांक:-${formatDate(today)}<br/>
<br/>
भूमिसंपादन, पुनर्वसन व पुनर्स्थापना करताना वाजवी भरपाई मिळण्याचा व पारदर्शकतेचा हक्क अधिनियम २०१३, च्या १९(१) २७,२९,३० च्या नोटीसनुसार ${project?.projectName || 'Railway Flyover Project'} प्रकल्पाकरिता भुसंपादन (निवाडा क्र.11/2022)<br/>
<br/>
${safeField(record, 'खातेदाराचे_नांव')}<br/>
रा. ${safeField(record, 'गांव')} ता. नांदे, जि.पालघर<br/>
<br/>
याव्दारे आपणांस नोटीस देण्यात येते की, मौजे ${safeField(record, 'गांव')}, ता.नांदे जि.पालघर येथिल खालील वर्णनाची जमिन ${project?.projectName || 'Railway Flyover Project'} प्रकल्पाकरिता संपादित करण्यात आले असुन भुमिसंपादन पुनर्वसन व पुनर्स्थापना करताना वाजवी भरपाई मिळण्याचा व पारदर्शकतेचा हक्क अधिनियम २०१३ च्या १९(१) नुसार केलेली आहे. त्यानुसार मौजे ${safeField(record, 'गांव')}, ता. नांदे जि.पालघर या गावाचा दि. 31/10/2023 रोजी निवाडा घोषित करण्यात आलेला आहे.<br/>
<br/>
मौजे ${safeField(record, 'गांव')}, ता. नांदे जि.पालघर येथिल ${project?.projectName || 'Railway Flyover Project'} प्रकल्पास संपादीत होणाऱ्या जमिनीची संयुक्त मोजणी झालेली आहे. सदर संयुक्त मोजणीमध्ये आपल्या स.नं./गट नंबरचे क्षेत्र संपादीत होत आहे. सदर संपादीत जमिनीची सर्व खातेदारांची एकत्रित मोबदल्याची रक्कम अनिवार्य (Compalsary) ने आपल्या संमतीपत्रासह मोबदला स्विकारण्याकरिता आवश्यक कागदपत्रांच्या मुळ प्रती व साक्षांकित (Attested) केलेल्या प्रतीसह उप सक्षम प्राधिकारी ${project?.projectName || 'Railway Flyover Project'} प्रकल्प तथा उपजिल्हाधिकारी (भूसंपादन) सुर्या प्रकल्प नांदे (जिल्हाधिकारी पालघर यांचे कार्यालय) यांचे कार्यालयातात ७ दिवसात जमा करावी.<br/>
<br/>
जमिनीचा तपशिल खालीलप्रमाणे आहे.<br/>
<br/>
<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse; width:100%; font-size:12px;">
  <thead>
    <tr>
      <th style="width:8%;">स.नं/हि.नं/ग.नं</th>
      <th style="width:8%;">नमुना ७/१२ नुसार जमिनीचे क्षेत्र (हे.आर)</th>
      <th style="width:8%;">संपादित जमिनीचे क्षेत्र (हे.आर)</th>
      <th style="width:8%;">जमिनीचा प्रकार</th>
      <th style="width:8%;">जमिनीचा प्रकार (शेती/बिनशेती)</th>
      <th style="width:10%;">मंजुर केलेला दर (प्रति हेक्टर) रुपये</th>
      <th style="width:10%;">संपादित होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमूल्य</th>
      <th style="width:6%;">कलम २६(२) नुसार गुणक</th>
      <th style="width:10%;">कलम २६ नुसार जमिनीचा मोबदला</th>
      <th style="width:8%;">बांधकामे रक्कम</th>
      <th style="width:8%;">वनझाडे रक्कम</th>
      <th style="width:8%;">फळझाडे रक्कम</th>
      <th style="width:8%;">विहिरी रक्कम</th>
      <th style="width:10%;">एकूण रक्कम (१३+१५+१७+१९)</th>
      <th style="width:10%;">एकूण रक्कम (११+२०)</th>
      <th style="width:10%;">१००% सोलेशियम</th>
      <th style="width:10%;">निर्धारित मोबदला (२३)</th>
      <th style="width:10%;">एकूण रक्कमेवर २५% वाढीव मोबदला</th>
      <th style="width:10%;">एकूण मोबदला (२३+२४)</th>
      <th style="width:8%;">वजावट रक्कम</th>
      <th style="width:12%;">हितसंबंधिताला अदा करावयाची एकूण मोबदला रक्कम</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>${safeField(record, 'स.नं./हि.नं./ग.नं.')}</td>
      <td>${safeField(record, 'नमुना_7_12_नुसार_जमिनीचे_क्षेत्र')}</td>
      <td>${safeField(record, 'संपादित_जमिनीचे_क्षेत्र')}</td>
      <td>${safeField(record, 'जमिनीचा_प्रकार')}</td>
      <td>${safeField(record, 'जमिनीचा_प्रकार_शेती_बिनशेती')}</td>
      <td>${safeNumericField(record, 'मंजुर_केलेला_दर')}</td>
      <td>${safeNumericField(record, 'संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य')}</td>
      <td>${safeField(record, 'कलम_26_2_नुसार_गावास_लागु_असलेले_गणक')}</td>
      <td>${safeNumericField(record, 'कलम_26_नुसार_जमिनीचा_मोबदला')}</td>
      <td>${safeNumericField(record, 'बांधकामे_रक्कम')}</td>
      <td>${safeNumericField(record, 'वनझाडे_रक्कम')}</td>
      <td>${safeNumericField(record, 'फळझाडे_रक्कम')}</td>
      <td>${safeNumericField(record, 'विहिरी_रक्कम')}</td>
      <td>${safeNumericField(record, 'एकुण_रक्कम_13_15_17_19')}</td>
      <td>${safeNumericField(record, 'एकुण_रक्कम_11_20')}</td>
      <td>${safeNumericField(record, 'सोलेशियम_100')}</td>
      <td>${safeNumericField(record, 'निर्धारित_मोबदला')}</td>
      <td>${safeNumericField(record, 'एकुण_रक्कमेवर_25_वाढीव_मोबदला')}</td>
      <td>${safeNumericField(record, 'एकुण_मोबदला')}</td>
      <td>${safeNumericField(record, 'वजावट_रक्कम')}</td>
      <td>${safeNumericField(record, 'हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम')}</td>
    </tr>
  </tbody>
</table>
<br/>
<br/>
संमतीपत्र सादर केल्यास खालील आवश्यक कागदपत्रे- मुळ प्रती व साक्षांकीत (Attested) केलेल्या प्रती-<br/>
<br/>
१) संबंधित जमिनीचा अद्यायावत ७/१२ उतारा.<br/>
२) ओळखपत्राच्या झेरॉक्स प्रतीरेशन कार्ड/निवडणूक ओळखपत्र/ आधारकार्ड, पॅनकार्ड, ड्रायव्हींग लायसन्स इ.<br/>
३) ७/१२ वर बोजा असल्यास बोजा कमी केल्याचा फेरफार अथवा ७/१२ इतर हक्कामधील बोजा असणाऱ्या संस्था/ बँक यांचे रक्कम स्विकारण्याकरिता नाहरकत दाखला,<br/>
४) ७/१२ चे सदरी इतर हक्कात जुनी शर्त अथवा नवीन शर्तीची नोंद असल्याने संबंधित फेरफार अथवा शर्तशिथिल केल्याचे आदेश.<br/>
५) बिनशेती प्लॉटधारकांनी बिनशेती आदेश व मंजुरी नकाशा सादर करावेत.<br/>
६) राष्ट्रीयकृत बँक पासबुक मूळ प्रत व छायांकित प्रत.<br/>
७) प्रत्येकी दोन फोटो.<br/>
८) ज्या खातेदारांना नुकसान भरपाई ची एकत्रित रक्कम एकट्याचे नांवे घेण्याची आहे त्यांनी दुय्यम निबंधक कडील नोंदणीकृत कुळमुखत्यारपत्र सादर करावे.<br/>
९) ज्या खातेदाराला इतर खातेदारांच्या वतीने नुकसान भरपाईची रक्कम स्विकारावयाची आहे, त्यांनी देखील नोंदणीकृत संमतीपत्र सादर करावे.<br/>
१०) खातेदार मयत असल्याने वारस हक्काचा पुरावा व फेरफार जोडावा.<br/>
११) सदर खातेदार १८ वर्षाआतील असल्यास, पालन पोषण करणा-याचे नाव असलेले संबंधित तलाठीकडील दाखला.<br/>
१२) जमिन ३८ नुसार नुकसान भरपाई स्विकारल्यावर तात्काळ जमिन संपादित संस्थेच्या नियत होईल.<br/>
<br/>
(टिप:- आयकर/नि.स.प्र./न.श च्या बजाती प्रचलीत शासन आदेशानुसार करण्यात येईल.)<br/>
<br/>
प्रत- तलाठी ${safeField(record, 'गांव')}<br/>
२/- उपरोक्त नोटीस वर नमुद केलेल्या हितसंबंधित व्यक्तीना बजावणी करणेत येऊन, सदर व्यक्तीची दिनांकीत स्वाक्षरी पोहोच नोटीसीच्या बजावणी प्रतीवरील मागील पृष्ठावर सादर करावी सदर व्यक्ती उपलब्ध नसल्यास नोटीस कुटुंबातील प्रौढ व्यक्तीस बजावण्यात यावी. तसेच व्यक्ती आढळून न आल्यास, नोटीसाची प्रत घराच्या दर्शनी भागावर चिटकवूनतसा अहवाल या कार्यालयास सादर करावा.<br/>
<br/>
सही।-xxx-<br/>
(संजीव जाधवर) सक्षम प्राधिकारी<br/>
${project?.projectName || 'Railway Flyover Project'} प्रकल्प, तथा<br/>
उपजिल्हाधिकारी (भूसंपादन), सुर्या प्रकल्प नांदे`;
  };

  const generateNotices = async () => {
    if (selectedRecords.length === 0) {
      toast.error('Please select at least one survey number');
      return;
    }

    try {
      const newNotices: GeneratedNotice[] = [];
      
      for (const recordId of selectedRecords) {
        const record = landownerRecords.find(r => r.id === recordId);
        if (!record) {
          console.error('Record not found:', recordId);
          continue;
        }

        console.log('Generating notice for record:', record);
        console.log('Record type:', typeof record);
        console.log('Record keys:', Object.keys(record));
        console.log('Sample field values:');
        console.log('- खातेदाराचे_नांव:', record['खातेदाराचे_नांव']);
        console.log('- स.नं./हि.नं./ग.नं.:', record['स.नं./हि.नं./ग.नं.']);
        console.log('- मंजुर_केलेला_दर:', record['मंजुर_केलेला_दर']);
        console.log('- सोलेशियम_100:', record['सोलेशियम_100']);
        
        let noticeContent;
        try {
          noticeContent = generateNoticeContent(record);
        } catch (contentError) {
          console.error('Error generating notice content for record:', record.id, contentError);
          toast.error(`Failed to generate notice content for record ${record.id}`);
          continue;
        }
        
        const noticeNumber = `NOTICE-${Date.now()}-${record.id}`;
        
        const notice: GeneratedNotice = {
          id: Date.now().toString() + recordId,
          landownerId: recordId,
          noticeNumber,
          noticeDate: new Date(),
          content: noticeContent,
          status: 'generated'
        };

        newNotices.push(notice);
        
        try {
          // Update record to mark notice as generated
          await updateLandownerRecord(recordId, { 
            noticeGenerated: true
          });
        } catch (updateError) {
          console.error('Failed to update record:', updateError);
          // Continue with notice generation even if update fails
        }
      }

      setGeneratedNotices(prev => [...prev, ...newNotices]);
      toast.success(`Generated ${newNotices.length} notices successfully`);
      setSelectedRecords([]);
    } catch (error) {
      console.error('Notice generation error:', error);
      toast.error('Failed to generate notices');
    }
  };

  const previewNotice = (recordId: string) => {
    const record = landownerRecords.find(r => r.id === recordId);
    if (!record) {
      toast.error('Unable to preview notice');
      return;
    }

    const content = generateNoticeContent(record);
    setPreviewContent(content);
    setIsPreviewOpen(true);
  };

  const downloadNotice = (notice: GeneratedNotice) => {
    const blob = new Blob([notice.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notice-${notice.noticeNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printNotice = (notice: GeneratedNotice) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Land Acquisition Notice</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .notice-content { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <div class="notice-content">${notice.content}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notice Generator
          </CardTitle>
          <CardDescription>
            Generate land acquisition notices automatically using CSV data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project">Select Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label>Search Survey Numbers</Label>
            <Input
              placeholder="Search by survey number, owner name, or village..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={generateNotices} 
              disabled={selectedRecords.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Notices ({selectedRecords.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Survey Numbers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Numbers ({filteredRecords.length})</CardTitle>
          <CardDescription>
            Select survey numbers to generate notices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Survey No</TableHead>
                <TableHead>Owner Name</TableHead>
                <TableHead>Village</TableHead>
                <TableHead>Area (Ha)</TableHead>
                <TableHead>Compensation</TableHead>
                <TableHead>Notice Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRecords.includes(record.id)}
                      onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{record['स.नं./हि.नं./ग.नं.']}</TableCell>
                  <TableCell>{record['खातेदाराचे_नांव']}</TableCell>
                  <TableCell>{record['गांव']}</TableCell>
                  <TableCell>{record['नमुना_7_12_नुसार_जमिनीचे_क्षेत्र']}</TableCell>
                  <TableCell>
                    <Badge>
                      ₹{(parseFloat(record['हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम']) / 100000).toFixed(1)}L
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.noticeGenerated ? (
                      <Badge variant="outline" className="text-green-600">
                        Generated
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewNotice(record.id)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Generated Notices */}
      {generatedNotices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Notices ({generatedNotices.length})</CardTitle>
            <CardDescription>
              Recently generated notices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Notice Number</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedNotices.map((notice) => {
                  const record = landownerRecords.find(r => r.id === notice.landownerId);
                  return (
                    <TableRow key={notice.id}>
                      <TableCell className="font-medium">{notice.noticeNumber}</TableCell>
                      <TableCell>{record?.खातेदाराचे_नांव}</TableCell>
                      <TableCell>{formatDate(notice.noticeDate)}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          {notice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadNotice(notice)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printNotice(notice)}
                          >
                            <Printer className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notice Preview</DialogTitle>
            <DialogDescription>
              Preview of the generated notice
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {previewContent}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => {
                const blob = new Blob([previewContent], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'notice-preview.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}>
                <Download className="h-4 w-4 mr-2" />
                Download Preview
              </Button>
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoticeGenerator;
