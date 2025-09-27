// MongoDB Models
import MongoUser from './mongo/User.js';
import MongoProject from './mongo/Project.js';
import MongoLandownerRecord from './mongo/LandownerRecord.js';
import MongoJMRRecord from './mongo/JMRRecord.js';
import MongoEnhancedJMRRecord from './mongo/EnhancedJMRRecord.js';

// Legacy Sequelize models (commented out during MongoDB migration)
// These should be gradually phased out
// import SequelizeUser from './User.js';
// import SequelizeProject from './Project.js';
// import SequelizeLandownerRecord from './LandownerRecord.js';
// import NoticeAssignment from './NoticeAssignment.js';
// import PaymentRecord from './PaymentRecord.js';
// import SequelizeJMRRecord from './JMRRecord.js';
// import Award from './Award.js';
// import Notice from './Notice.js';
// import Payment from './Payment.js';
// import BlockchainLedger from './BlockchainLedger.js';
// import Officer from './Officer.js';

// Note: Sequelize associations are commented out during MongoDB migration
// MongoDB uses references and population instead of associations

// Notice.belongsTo(SequelizeProject, { foreignKey: 'project_id' });
// SequelizeProject.hasMany(Notice, { foreignKey: 'project_id' });

// Notice.belongsTo(SequelizeUser, { as: 'officer', foreignKey: 'officer_id' });
// SequelizeUser.hasMany(Notice, { as: 'notices', foreignKey: 'officer_id' });

// Payment.belongsTo(SequelizeProject, { foreignKey: 'project_id' });
// SequelizeProject.hasMany(Payment, { foreignKey: 'project_id' });

// Payment.belongsTo(SequelizeUser, { as: 'officer', foreignKey: 'officer_id' });
// SequelizeUser.hasMany(Payment, { as: 'payments', foreignKey: 'officer_id' });

// Payment.belongsTo(Notice, { foreignKey: 'notice_id', targetKey: 'notice_id' });
// Notice.hasMany(Payment, { foreignKey: 'notice_id', sourceKey: 'notice_id' });

// BlockchainLedger.belongsTo(SequelizeProject, { foreignKey: 'project_id' });
// SequelizeProject.hasMany(BlockchainLedger, { foreignKey: 'project_id' });

// BlockchainLedger.belongsTo(SequelizeUser, { as: 'officer', foreignKey: 'officer_id' });
// SequelizeUser.hasMany(BlockchainLedger, { as: 'blockchainEvents', foreignKey: 'officer_id' });

// BlockchainLedger.belongsTo(SequelizeJMRRecord, { foreignKey: 'survey_number', targetKey: 'survey_number' });
// SequelizeJMRRecord.hasMany(BlockchainLedger, { foreignKey: 'survey_number', sourceKey: 'survey_number' });

// BlockchainLedger.belongsTo(Notice, { foreignKey: 'survey_number', targetKey: 'survey_number' });
// Notice.hasMany(BlockchainLedger, { foreignKey: 'survey_number', sourceKey: 'survey_number' });

// BlockchainLedger.belongsTo(Payment, { foreignKey: 'survey_number', targetKey: 'survey_number' });
// Payment.hasMany(BlockchainLedger, { foreignKey: 'survey_number', sourceKey: 'survey_number' });

export {
  // MongoDB models (primary exports with original names for backward compatibility)
  MongoUser as User,
  MongoProject as Project,
  MongoLandownerRecord as LandownerRecord,
  MongoJMRRecord as JMRRecord,
  MongoEnhancedJMRRecord as EnhancedJMRRecord
  
  // Legacy Sequelize models (commented out during MongoDB migration)
  // NoticeAssignment,
  // PaymentRecord,
  // Award,
  // Notice,
  // Payment,
  // BlockchainLedger,
  // Officer
};
