import User from './mongo/User.js';
import Project from './mongo/Project.js';
import LandownerRecord from './mongo/LandownerRecord.js';
import NoticeAssignment from './mongo/NoticeAssignment.js';
import PaymentRecord from './mongo/PaymentRecord.js';
import JMRRecord from './mongo/JMRRecord.js';
import Award from './mongo/Award.js';
import Notice from './mongo/Notice.js';
import Payment from './mongo/Payment.js';
import BlockchainLedger from './mongo/BlockchainLedger.js';
import Officer from './mongo/Officer.js';

// Define associations
Project.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(Project, { as: 'createdProjects', foreignKey: 'createdBy' });

// Match snake_case column in DB
LandownerRecord.belongsTo(Project, { foreignKey: 'project_id' });
Project.hasMany(LandownerRecord, { foreignKey: 'project_id' });

// Use attribute names; underscored mapping will handle DB columns
LandownerRecord.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(LandownerRecord, { as: 'createdRecords', foreignKey: 'createdBy' });

LandownerRecord.belongsTo(User, { as: 'assignedAgentUser', foreignKey: 'assignedAgent' });
User.hasMany(LandownerRecord, { as: 'assignedRecords', foreignKey: 'assignedAgent' });

NoticeAssignment.belongsTo(Project, { foreignKey: 'project_id' });
Project.hasMany(NoticeAssignment, { foreignKey: 'project_id' });

// PaymentRecord associations
PaymentRecord.belongsTo(LandownerRecord, { foreignKey: 'landownerRecordId' });
LandownerRecord.hasMany(PaymentRecord, { foreignKey: 'landownerRecordId' });

PaymentRecord.belongsTo(User, { as: 'initiatedBy', foreignKey: 'createdBy' });
User.hasMany(PaymentRecord, { as: 'initiatedPayments', foreignKey: 'createdBy' });

// JMR & Award associations
JMRRecord.belongsTo(Project, { foreignKey: 'project_id' });
Project.hasMany(JMRRecord, { foreignKey: 'project_id' });
Award.belongsTo(Project, { foreignKey: 'project_id' });
Project.hasMany(Award, { foreignKey: 'project_id' });

Award.belongsTo(User, { as: 'officer', foreignKey: 'officer_id' });
User.hasMany(Award, { as: 'awards', foreignKey: 'officer_id' });

// New blockchain system associations
JMRRecord.belongsTo(User, { as: 'officer', foreignKey: 'officer_id' });
User.hasMany(JMRRecord, { as: 'jmrRecords', foreignKey: 'officer_id' });

Notice.belongsTo(Project, { foreignKey: 'project_id' });
Project.hasMany(Notice, { foreignKey: 'project_id' });

Notice.belongsTo(User, { as: 'officer', foreignKey: 'officer_id' });
User.hasMany(Notice, { as: 'notices', foreignKey: 'officer_id' });

Payment.belongsTo(Project, { foreignKey: 'project_id' });
Project.hasMany(Payment, { foreignKey: 'project_id' });

Payment.belongsTo(User, { as: 'officer', foreignKey: 'officer_id' });
User.hasMany(Payment, { as: 'payments', foreignKey: 'officer_id' });

Payment.belongsTo(Notice, { foreignKey: 'notice_id', targetKey: 'notice_id' });
Notice.hasMany(Payment, { foreignKey: 'notice_id', sourceKey: 'notice_id' });

BlockchainLedger.belongsTo(Project, { foreignKey: 'project_id' });
Project.hasMany(BlockchainLedger, { foreignKey: 'project_id' });

BlockchainLedger.belongsTo(User, { as: 'officer', foreignKey: 'officer_id' });
User.hasMany(BlockchainLedger, { as: 'blockchainEvents', foreignKey: 'officer_id' });

BlockchainLedger.belongsTo(JMRRecord, { foreignKey: 'survey_number', targetKey: 'survey_number' });
JMRRecord.hasMany(BlockchainLedger, { foreignKey: 'survey_number', sourceKey: 'survey_number' });

BlockchainLedger.belongsTo(Notice, { foreignKey: 'survey_number', targetKey: 'survey_number' });
Notice.hasMany(BlockchainLedger, { foreignKey: 'survey_number', sourceKey: 'survey_number' });

BlockchainLedger.belongsTo(Payment, { foreignKey: 'survey_number', targetKey: 'survey_number' });
Payment.hasMany(BlockchainLedger, { foreignKey: 'survey_number', sourceKey: 'survey_number' });

export {
  User,
  Project,
  LandownerRecord,
  NoticeAssignment,
  PaymentRecord,
  JMRRecord,
  Award,
  Notice,
  Payment,
  BlockchainLedger,
  Officer
};
