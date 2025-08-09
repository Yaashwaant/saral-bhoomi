import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 5,
    min: parseInt(process.env.DB_POOL_MIN) || 0,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: parseInt(process.env.DB_POOL_IDLE) || 10000
  },
  retry: {
    max: 3,
    timeout: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },
  timezone: '+05:30', // IST timezone
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000
  }
});

// Test database connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

// Get database connection status
export const getConnectionStatus = () => {
  return {
    connected: sequelize.authenticate().then(() => true).catch(() => false),
    pool: {
      max: sequelize.connectionManager.pool.config.max,
      min: sequelize.connectionManager.pool.config.min,
      acquire: sequelize.connectionManager.pool.config.acquire,
      idle: sequelize.connectionManager.pool.config.idle
    }
  };
};

export default sequelize;
