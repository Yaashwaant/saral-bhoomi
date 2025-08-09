import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add a name' },
      len: { args: [1, 50], msg: 'Name cannot be more than 50 characters' }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Please add a valid email' },
      notEmpty: { msg: 'Please add an email' }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: { args: [6], msg: 'Password must be at least 6 characters' }
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'officer', 'agent'),
    defaultValue: 'officer'
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add a department' }
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add a phone number' }
    }
  },
  language: {
    type: DataTypes.ENUM('marathi', 'english', 'hindi'),
    defaultValue: 'marathi'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  resetPasswordToken: {
    type: DataTypes.STRING
  },
  resetPasswordExpire: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: false, // Database uses camelCase column names
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this.id,
      email: this.email,
      role: this.role
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      issuer: 'saral-bhoomi',
      audience: 'saral-bhoomi-users'
    }
  );
};

User.prototype.getRefreshToken = async function() {
  const refreshToken = jwt.sign(
    { 
      id: this.id,
      type: 'refresh'
    }, 
    process.env.JWT_REFRESH_SECRET, 
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'saral-bhoomi',
      audience: 'saral-bhoomi-users'
    }
  );

  // Note: refreshToken storage not implemented in current database schema
  return refreshToken;
};

User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

User.prototype.incrementLoginAttempts = async function() {
  // Note: login attempts tracking not implemented in current database schema
  return this;
};

User.prototype.resetLoginAttempts = async function() {
  // Note: login attempts tracking not implemented in current database schema
  return this;
};

User.prototype.isLocked = function() {
  // Note: account locking not implemented in current database schema
  return false;
};

User.prototype.updateLastActivity = async function() {
  // Note: lastActivity tracking not implemented in current database schema
  return this;
};

User.prototype.updateLastLogin = async function() {
  return await this.update({ 
    lastLogin: new Date()
  });
};

User.prototype.invalidateRefreshToken = async function() {
  // Note: refreshToken storage not implemented in current database schema
  return this;
};

User.prototype.isRefreshTokenValid = function(token) {
  // Note: refreshToken validation not implemented in current database schema
  return false;
};

// Static methods
User.findByEmail = function(email) {
  return this.findOne({ where: { email } });
};

User.findByRefreshToken = function(token) {
  // Note: refreshToken lookup not implemented in current database schema
  return Promise.resolve(null);
};

export default User; 