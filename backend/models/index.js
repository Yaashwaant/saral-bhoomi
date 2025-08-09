import User from './User.js';
import Project from './Project.js';
import LandownerRecord from './LandownerRecord.js';
import NoticeAssignment from './NoticeAssignment.js';
import PaymentRecord from './PaymentRecord.js';

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

export {
  User,
  Project,
  LandownerRecord,
  NoticeAssignment,
  PaymentRecord
};
