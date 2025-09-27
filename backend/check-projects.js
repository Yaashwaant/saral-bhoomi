import sequelize from './config/database.js';

async function checkProjects() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    // Check if projects table exists
    const tableExists = await sequelize.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projects')`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('Projects table exists:', tableExists[0].exists);
    
    if (tableExists[0].exists) {
      const count = await sequelize.query('SELECT COUNT(*) as count FROM projects', { 
        type: sequelize.QueryTypes.SELECT 
      });
      console.log('Total projects:', count[0].count);
      
      if (count[0].count > 0) {
        const projects = await sequelize.query('SELECT id, name, location FROM projects LIMIT 5', { 
          type: sequelize.QueryTypes.SELECT 
        });
        console.log('Sample projects:', projects);
      } else {
        console.log('❌ No projects found in database');
      }
    } else {
      console.log('❌ Projects table does not exist');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProjects();