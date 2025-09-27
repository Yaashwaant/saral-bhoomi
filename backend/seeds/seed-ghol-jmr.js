import sequelize from '../config/database.js';
import JMRRecord from '../models/JMRRecord.js';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedGholJMR() {
  await JMRRecord.sync({ force: true });

  const csvPath = path.join(__dirname, '../../ghol_village_template.csv');
  const records = [];

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      const record = {
        project_id: 1,
        landowner_id: `seed-${row['अ.क्र']}`,
        officer_id: 1,
        survey_number: row['गट नंबर'] || row['जुना स.नं.'],
        landowner_name: row['खातेदाराचे नांव'],
        old_survey_number: row['जुना स.नं.'],
        new_survey_number: row['नविन स.नं.'],
        gat_number: row['गट नंबर'],
        cts_number: row['सी.टी.एस. नंबर'],
        area_per_712: parseFloat(row['गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)']) || 0,
        acquired_area: parseFloat(row['संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)']) || 0,
        land_type: row['जमिनीचा प्रकार'] === 'शेती' ? 'Agricultural' : 'Non-Agricultural',
        land_category: row['जमिनीचा प्रकार शेती/ बिनशेती/ धारणाधिकार'],
        approved_rate: parseFloat(row['मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये']) || 0,
        market_value: parseFloat(row['संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू']) || 0,
        factor: parseFloat(row['कलम 26 (2) नुसार गावास लागु असलेले गणक Factor']) || 1,
        land_compensation: parseFloat(row['कलम 26 नुसार जमिनीचा मोबदला']) || 0,
        buildings_count: parseInt(row['संख्या'] || row['बांधकामे संख्या'] || 0),
        buildings_amount: parseFloat(row['रक्कम रुपये'] || row['बांधकामे रक्कम रुपये'] || 0),
        forest_trees_count: parseInt(row['झाडांची संख्या'] || row['वनझाडे झाडांची संख्या'] || 0),
        forest_trees_amount: parseFloat(row['झाडांची रक्कम रु.'] || row['वनझाडे झाडांची रक्कम रु.'] || 0),
        fruit_trees_count: parseInt(row['झाडांची संख्या.1'] || row['फळझाडे झाडांची संख्या'] || 0),
        fruit_trees_amount: parseFloat(row['झाडांची रक्कम रु..1'] || row['फळझाडे झाडांची रक्कम रु.'] || 0),
        wells_count: parseInt(row['संख्या.1'] || row['विहिरी/बोअरवेल संख्या'] || 0),
        wells_amount: parseFloat(row['रक्कम रुपये.1'] || row['विहिरी/बोअरवेल रक्कम रुपये'] || 0),
        total_structures: parseFloat(row['एकुण रक्कम रुपये (16+18+ 20+22)']) || 0,
        total_with_structures: parseFloat(row['एकुण रक्कम (14+23)']) || 0,
        solatium: parseFloat(row['100 %  सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1)  RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5']) || 0,
        determined_compensation: parseFloat(row['निर्धारित मोबदला 26 = (24+25)']) || 0,
        additional_25: parseFloat(row['एकूण रक्कमेवर  25%  वाढीव मोबदला']) || 0,
        total_compensation: parseFloat(row['एकुण मोबदला (26+ 27)']) || 0,
        deduction: parseFloat(row['वजावट रक्कम रुपये']) || 0,
        final_amount: parseFloat(row['हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)']) || 0,
        remarks: row['शेरा'],
        village_name: 'घोळ',
        taluka_name: 'वसई',
        district_name: 'पालघर',
        date_of_measurement: new Date(),
        status: 'approved',
        measured_area: parseFloat(row['संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)']) || 0,
      };
      records.push(record);
    })
    .on('end', async () => {
      try {
        await JMRRecord.bulkCreate(records);
        console.log('Ghol JMR records seeded successfully');
      } catch (error) {
        console.error('Error seeding Ghol JMR:', error);
      } finally {
        await sequelize.close();
      }
    });
}

seedGholJMR();