# SARAL Bhoomi - Backend Requirements Document

## System Overview
**SARAL Bhoomi** (System for Automated Resourceful Acquisition of Land) is a comprehensive land acquisition management system for government authorities to digitize and streamline the land acquisition process under the RFCTLARR Act, 2013.

## Tech Stack
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **File Storage**: AWS S3 / Local Storage
- **PDF Generation**: pdf-lib / Puppeteer
- **Payment Integration**: RTGS API (Simulated)
- **Language Support**: Marathi (default), English, Hindi

## Database Schema

### 1. Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: String (admin|officer|agent),
  department: String,
  phone: String,
  language: String (marathi|english|hindi),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

### 2. Projects Collection
```javascript
{
  _id: ObjectId,
  projectName: String,
  pmisCode: String,
  schemeName: String,
  landRequired: Number, // hectares
  landAvailable: Number,
  landToBeAcquired: Number,
  type: String (greenfield|brownfield),
  indexMapUrl: String,
  videoUrl: String,
  status: {
    stage3A: String (pending|approved|rejected),
    stage3D: String (pending|approved|rejected),
    corrigendum: String (pending|approved|rejected),
    award: String (pending|approved|rejected)
  },
  createdBy: ObjectId (ref: Users),
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Landowner Records Collection
```javascript
{
  _id: ObjectId,
  projectId: ObjectId (ref: Projects),
  खातेदाराचे_नांव: String, // landowner_name
  सर्वे_नं: String, // survey_number
  क्षेत्र: String, // area (Ha.Ar)
  संपादित_क्षेत्र: String, // acquired_area (sq.m / Ha.Ar)
  दर: String, // rate (₹)
  संरचना_झाडे_विहिरी_रक्कम: String, // structures_amount
  एकूण_मोबदला: String, // compensation_amount
  सोलेशियम_100: String, // solatium
  अंतिम_रक्कम: String, // final_compensation
  village: String,
  taluka: String,
  district: String,
  noticeGenerated: Boolean,
  kycStatus: String (pending|in_progress|completed|approved|rejected),
  paymentStatus: String (pending|initiated|success|failed),
  assignedAgent: ObjectId (ref: Users),
  createdAt: Date,
  updatedAt: Date
}
```

### 4. KYC Documents Collection
```javascript
{
  _id: ObjectId,
  landownerId: ObjectId (ref: LandownerRecords),
  documentType: String (aadhaar|pan|voter_id|7_12_extract|power_of_attorney|bank_passbook|photo),
  fileName: String,
  fileUrl: String,
  fileSize: Number,
  mimeType: String,
  uploadedAt: Date,
  uploadedBy: ObjectId (ref: Users),
  verified: Boolean,
  verifiedBy: ObjectId (ref: Users),
  verifiedAt: Date
}
```

### 5. Notice Headers Collection
```javascript
{
  _id: ObjectId,
  fileName: String,
  fileUrl: String,
  fileSize: Number,
  version: Number,
  isActive: Boolean,
  uploadedAt: Date,
  uploadedBy: ObjectId (ref: Users)
}
```

### 6. Generated Notices Collection
```javascript
{
  _id: ObjectId,
  landownerId: ObjectId (ref: LandownerRecords),
  noticeNumber: String,
  noticeUrl: String,
  generatedAt: Date,
  generatedBy: ObjectId (ref: Users),
  status: String (generated|sent|acknowledged)
}
```

### 7. Payments Collection
```javascript
{
  _id: ObjectId,
  landownerId: ObjectId (ref: LandownerRecords),
  amount: Number,
  referenceNumber: String,
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    branch: String
  },
  status: String (pending|initiated|success|failed),
  rtgsResponse: Object,
  initiatedAt: Date,
  completedAt: Date,
  retryCount: Number,
  maxRetries: Number
}
```

### 8. System Logs Collection
```javascript
{
  _id: ObjectId,
  action: String,
  userId: ObjectId (ref: Users),
  resourceType: String,
  resourceId: ObjectId,
  details: Object,
  ipAddress: String,
  userAgent: String,
  createdAt: Date
}
```

## API Endpoints

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET /api/auth/profile
PUT /api/auth/profile
PUT /api/auth/language
```

### User Management (Admin Only)
```
GET /api/users
POST /api/users
GET /api/users/:id
PUT /api/users/:id
DELETE /api/users/:id
PUT /api/users/:id/status
```

### Project Management
```
GET /api/projects
POST /api/projects
GET /api/projects/:id
PUT /api/projects/:id
DELETE /api/projects/:id
GET /api/projects/:id/stats
PUT /api/projects/:id/status
```

### CSV Upload & Processing
```
POST /api/projects/:id/csv-upload
GET /api/projects/:id/landowners
POST /api/projects/:id/landowners
PUT /api/landowners/:id
DELETE /api/landowners/:id
GET /api/landowners/:id
```

### Notice Management
```
POST /api/notices/headers
GET /api/notices/headers
PUT /api/notices/headers/:id/activate
DELETE /api/notices/headers/:id
POST /api/projects/:id/generate-notices
GET /api/notices/generated
GET /api/notices/:id/download
```

### KYC Management
```
GET /api/kyc/queue
GET /api/kyc/assigned
POST /api/kyc/documents
GET /api/kyc/documents/:landownerId
PUT /api/kyc/:landownerId/approve
PUT /api/kyc/:landownerId/reject
GET /api/kyc/:landownerId/documents
```

### Payment Management
```
GET /api/payments/pending
POST /api/payments/initiate
GET /api/payments/:id/status
POST /api/payments/:id/retry
GET /api/payments/history
GET /api/payments/:id/receipt
```

### Village Reports
```
GET /api/reports/village-summary
GET /api/reports/project/:id/villages
GET /api/reports/compensation-breakdown
GET /api/reports/kyc-progress
GET /api/reports/payment-status
```

### Agent Management
```
GET /api/agents/assigned-records
POST /api/agents/assign
PUT /api/agents/:id/assign
GET /api/agents/:id/tasks
PUT /api/agents/:id/tasks/:taskId/complete
```

## File Upload Specifications

### Supported File Types
- **Images**: JPG, JPEG, PNG, GIF (Max: 5MB)
- **Documents**: PDF, DOC, DOCX (Max: 10MB)
- **CSV/Excel**: CSV, XLSX (Max: 10MB)
- **Notice Headers**: DOCX (Max: 2MB)

### File Storage Structure
```
uploads/
├── projects/
│   └── {projectId}/
│       ├── index-maps/
│       └── csv-files/
├── kyc-documents/
│   └── {landownerId}/
│       ├── aadhaar/
│       ├── pan/
│       ├── voter-id/
│       ├── 7-12-extract/
│       ├── power-of-attorney/
│       ├── bank-passbook/
│       └── photos/
├── notice-headers/
└── generated-notices/
    └── {landownerId}/
```

## Security Requirements

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Session management
- Password hashing (bcrypt)
- Rate limiting
- CORS configuration

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- File upload validation
- API rate limiting
- Audit logging

### File Security
- File type validation
- File size limits
- Virus scanning
- Secure file storage
- Access control for files

## Performance Requirements

### Response Times
- API responses: < 500ms
- File uploads: < 30s (10MB files)
- CSV processing: < 60s (1000 records)
- PDF generation: < 10s per notice
- Payment processing: < 5s

### Scalability
- Support 1000+ concurrent users
- Handle 10,000+ landowner records
- Process 100+ CSV files simultaneously
- Generate 1000+ notices per hour

### Caching
- Redis for session storage
- MongoDB query caching
- File upload progress caching
- API response caching

## Error Handling

### HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error

### Error Response Format
```javascript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
    details: {
      field: "email",
      issue: "Invalid email format"
    }
  },
  timestamp: "2024-01-15T10:30:00Z"
}
```

## Testing Requirements

### Unit Tests
- API endpoint testing
- Database operation testing
- File upload testing
- Authentication testing
- Validation testing

### Integration Tests
- End-to-end workflow testing
- CSV processing testing
- PDF generation testing
- Payment integration testing
- KYC workflow testing

### Performance Tests
- Load testing
- Stress testing
- File upload performance
- Database query performance

## Deployment Requirements

### Environment Variables
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/saral_bhoomi
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
RTGS_API_URL=https://api.rtgs.gov.in
RTGS_API_KEY=your-api-key
```

### Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2 Configuration
```javascript
module.exports = {
  apps: [{
    name: 'saral-bhoomi-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

## Monitoring & Logging

### Application Monitoring
- Health check endpoints
- Performance metrics
- Error tracking
- User activity monitoring
- File upload monitoring

### Logging
- Request/response logging
- Error logging
- User action logging
- File operation logging
- Payment transaction logging

### Alerts
- System downtime alerts
- Error rate alerts
- Performance degradation alerts
- Payment failure alerts
- Storage space alerts

## Backup & Recovery

### Database Backup
- Daily automated backups
- Point-in-time recovery
- Backup verification
- Offsite backup storage

### File Backup
- Daily file system backup
- Incremental backup strategy
- Backup restoration testing
- Disaster recovery plan

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Database setup and schema creation
- [ ] Authentication system
- [ ] Basic CRUD operations
- [ ] File upload system
- [ ] API documentation

### Phase 2: Project Management (Week 3-4)
- [ ] Project CRUD operations
- [ ] CSV upload and processing
- [ ] Landowner record management
- [ ] Basic reporting

### Phase 3: Notice Generation (Week 5-6)
- [ ] Notice header management
- [ ] PDF generation system
- [ ] Notice distribution
- [ ] Notice tracking

### Phase 4: KYC Workflow (Week 7-8)
- [ ] Document upload system
- [ ] KYC approval workflow
- [ ] Agent assignment
- [ ] KYC status tracking

### Phase 5: Payment Integration (Week 9-10)
- [ ] RTGS API integration
- [ ] Payment processing
- [ ] Payment status tracking
- [ ] Receipt generation

### Phase 6: Reporting & Analytics (Week 11-12)
- [ ] Village-wise reports
- [ ] Compensation tracking
- [ ] Progress analytics
- [ ] Export functionality

### Phase 7: Testing & Optimization (Week 13-14)
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Documentation completion

## Success Metrics

### Technical Metrics
- API response time < 500ms
- 99.9% uptime
- Zero security vulnerabilities
- 100% test coverage

### Business Metrics
- 90%+ KYC completion rate
- 95%+ payment success rate
- 50% reduction in processing time
- 100% data accuracy

## Contact Information

For technical queries and implementation support:
- **Backend Team**: [Your Team Name]
- **Email**: backend@saral.gov.in
- **Documentation**: [GitHub Repository URL]
- **API Documentation**: [Swagger/OpenAPI URL]

---

**Note**: This document serves as a comprehensive guide for backend development. All implementations should follow government security standards and data protection regulations.