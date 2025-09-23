import sequelize from './config/database.js';

async function checkUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    const users = await sequelize.query('SELECT id, name, email, role FROM users', { 
      type: sequelize.QueryTypes.SELECT 
    });
    
    console.log('\nUsers in database:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role}`);
    });
    
    await sequelize.close();
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

checkUsers();
