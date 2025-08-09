import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projectName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add a project name' },
      len: { args: [1, 200], msg: 'Project name cannot be more than 200 characters' }
    }
  },
  pmisCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Please add a PMIS code' }
    }
  },
  schemeName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add a scheme name' }
    }
  },
  landRequired: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Land required cannot be negative' }
    }
  },
  landAvailable: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Land available cannot be negative' }
    }
  },
  landToBeAcquired: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Land to be acquired cannot be negative' }
    }
  },
  type: {
    type: DataTypes.ENUM('greenfield', 'brownfield'),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please specify project type' }
    }
  },
  indexMap: {
    type: DataTypes.STRING // File path
  },
  videoUrl: {
    type: DataTypes.STRING
  },
  // Status fields
  stage3A: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  stage3D: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  corrigendum: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  award: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  description: {
    type: DataTypes.TEXT,
    validate: {
      len: { args: [0, 1000], msg: 'Description cannot be more than 1000 characters' }
    }
  },
  // Location fields
  district: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add district' }
    }
  },
  taluka: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add taluka' }
    }
  },
  villages: {
    type: DataTypes.JSON, // Store as JSON array
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add at least one village' }
    }
  },
  // Budget fields
  estimatedCost: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Estimated cost cannot be negative' }
    }
  },
  allocatedBudget: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Allocated budget cannot be negative' }
    }
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'INR'
  },
  // Timeline fields
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add start date' }
    }
  },
  expectedCompletion: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add expected completion date' }
    }
  },
  actualCompletion: {
    type: DataTypes.DATE
  },
  stakeholders: {
    type: DataTypes.JSON // Store as JSON array of objects
  },
  documents: {
    type: DataTypes.JSON // Store as JSON array of objects
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assignedOfficers: {
    type: DataTypes.JSON // Store as JSON array of user IDs
  },
  assignedAgents: {
    type: DataTypes.JSON // Store as JSON array of user IDs
  }
}, {
  tableName: 'projects',
  timestamps: true,
  underscored: false, // Database uses camelCase column names
  indexes: [
    {
      unique: true,
      fields: ['pmisCode']
    },
    {
      fields: ['district']
    },
    {
      fields: ['taluka']
    },
    {
      fields: ['createdBy']
    },
    {
      fields: ['isActive']
    }
  ]
});

// Instance methods
Project.prototype.getProgress = function() {
  const totalStages = 4; // stage3A, stage3D, corrigendum, award
  const completedStages = [this.stage3A, this.stage3D, this.corrigendum, this.award]
    .filter(stage => stage === 'approved').length;
  return Math.round((completedStages / totalStages) * 100);
};

Project.prototype.getAcquisitionProgress = function() {
  if (this.landRequired === 0) return 0;
  return Math.round(((this.landAvailable / this.landRequired) * 100));
};

export default Project; 