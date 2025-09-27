import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const JMRRecord = sequelize.define('JMRRecord', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  survey_number: { 
    type: DataTypes.STRING, 
    allowNull: false,
    comment: 'Primary identifier for land parcel'
  },
  project_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  landowner_id: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  landowner_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sub_division_number: {
    type: DataTypes.STRING
  },
  survey_sub_number: {
    type: DataTypes.STRING
  },
  owner_id: {
    type: DataTypes.STRING
  },
  owner_name: {
    type: DataTypes.STRING
  },
  father_name: {
    type: DataTypes.STRING
  },
  plot_area: {
    type: DataTypes.DECIMAL(12,4)
  },
  land_classification: {
    type: DataTypes.STRING
  },
  revenue_village: {
    type: DataTypes.STRING
  },
  irrigation_type: {
    type: DataTypes.STRING
  },
  crop_type: {
    type: DataTypes.STRING
  },
  reference_number: {
    type: DataTypes.STRING
  },
  file_number: {
    type: DataTypes.STRING
  },
  khata_number: {
    type: DataTypes.STRING
  },
  khasra_number: {
    type: DataTypes.STRING
  },
  mutation_number: {
    type: DataTypes.STRING
  },
  land_record_number: {
    type: DataTypes.STRING
  },
  boundary_north: {
    type: DataTypes.STRING
  },
  boundary_south: {
    type: DataTypes.STRING
  },
  boundary_east: {
    type: DataTypes.STRING
  },
  boundary_west: {
    type: DataTypes.STRING
  },
  acquisition_date: {
    type: DataTypes.DATE
  },
  possession_date: {
    type: DataTypes.DATE
  },
  verification_date: {
    type: DataTypes.DATE
  },
  surveyor_name: {
    type: DataTypes.STRING
  },
  witness_1: {
    type: DataTypes.STRING
  },
  witness_2: {
    type: DataTypes.STRING
  },
  compensation_amount: {
    type: DataTypes.DECIMAL(15,2),
    defaultValue: 0
  },
  structure_compensation: {
    type: DataTypes.DECIMAL(15,2),
    defaultValue: 0
  },
  tree_compensation: {
    type: DataTypes.DECIMAL(15,2),
    defaultValue: 0
  },
  well_compensation: {
    type: DataTypes.DECIMAL(15,2),
    defaultValue: 0
  },
  approval_authority: {
    type: DataTypes.STRING
  },
  gazette_notification: {
    type: DataTypes.STRING
  },
  old_survey_number: {
    type: DataTypes.STRING
  },
  new_survey_number: {
    type: DataTypes.STRING
  },
  gat_number: {
    type: DataTypes.STRING
  },
  cts_number: {
    type: DataTypes.STRING
  },
  area_per_712: {
    type: DataTypes.DECIMAL(12,4)
  },
  acquired_area: {
    type: DataTypes.DECIMAL(12,4)
  },
  land_type: {
    type: DataTypes.ENUM('Agricultural', 'Non-Agricultural'),
    allowNull: false,
    defaultValue: 'Agricultural'
  },
  land_category: {
    type: DataTypes.STRING
  },
  approved_rate: {
    type: DataTypes.DECIMAL(15,2)
  },
  market_value: {
    type: DataTypes.DECIMAL(15,2)
  },
  factor: {
    type: DataTypes.DECIMAL(5,2),
    defaultValue: 1
  },
  land_compensation: {
    type: DataTypes.DECIMAL(15,2)
  },
  buildings_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  buildings_amount: {
    type: DataTypes.DECIMAL(15,2),
    defaultValue: 0
  },
  forest_trees_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  forest_trees_amount: {
    type: DataTypes.DECIMAL(15,2),
    defaultValue: 0
  },
  fruit_trees_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  fruit_trees_amount: {
    type: DataTypes.DECIMAL(15,2),
    defaultValue: 0
  },
  wells_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  wells_amount: {
    type: DataTypes.DECIMAL(15,2),
    defaultValue: 0
  },
  total_structures: {
    type: DataTypes.DECIMAL(15,2),
    defaultValue: 0
  },
  total_with_structures: {
    type: DataTypes.DECIMAL(15,2),
    defaultValue: 0
  },
  solatium: {
    type: DataTypes.DECIMAL(15,2),
    defaultValue: 0
  },
  determined_compensation: {
    type: DataTypes.DECIMAL(15,2),
    defaultValue: 0
  },
  additional_25: {
    type: DataTypes.DECIMAL(15,2),
    defaultValue: 0
  },
  total_compensation: {
    type: DataTypes.DECIMAL(15,2),
    defaultValue: 0
  },
  deduction: {
    type: DataTypes.DECIMAL(15,2),
    defaultValue: 0
  },
  final_amount: {
    type: DataTypes.DECIMAL(15,2),
    defaultValue: 0
  },
  officer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Field Officer who performed the measurement'
  },
  measured_area: { 
    type: DataTypes.DECIMAL(12, 4), 
    allowNull: false, 
    defaultValue: 0 
  },
  tribal_classification: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the land belongs to tribal community'
  },
  category: { 
    type: DataTypes.STRING 
  },
  date_of_measurement: { 
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  village_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  taluka_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  district_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  attachments: { 
    type: DataTypes.JSON 
  },
  notes: { 
    type: DataTypes.TEXT 
  },
  remarks: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  }
}, {
  tableName: 'jmr_records',
  timestamps: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['survey_number'] },
    { fields: ['landowner_id'] },
    { fields: ['officer_id'] },
    { fields: ['village_name'] },
    { fields: ['taluka_name'] },
    { fields: ['district_name'] },
    { fields: ['land_type'] },
    { fields: ['tribal_classification'] }
  ]
});

export default JMRRecord;


