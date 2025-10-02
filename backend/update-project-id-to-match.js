import dotenv from 'dotenv';
import mongoose from 'mongoose';
import CompleteEnglishLandownerRecord from './models/mongo/CompleteEnglishLandownerRecord.js';

dotenv.config();

async function updateProjectIdToMatch() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

        // Get all projects to see which one is first
        const db = mongoose.connection.db;
        const projectsCollection = db.collection('projects');
        const projects = await projectsCollection.find({}).toArray();
        
        console.log('Available projects:');
        projects.forEach((project, index) => {
            console.log(`${index + 1}. ID: ${project._id}, Name: ${project.projectName || project.name}`);
        });

        if (projects.length === 0) {
            console.log('No projects found');
            return;
        }

        // Use the first project ID (which is what the frontend selects by default)
        const firstProjectId = projects[0]._id;
        console.log(`\nUsing first project ID: ${firstProjectId}`);

        // Update all land records to use this project ID
        const result = await CompleteEnglishLandownerRecord.updateMany(
            {}, // Update all records
            { $set: { project_id: firstProjectId } }
        );

        console.log(`Updated ${result.modifiedCount} records with project ID: ${firstProjectId}`);

        // Verify the update
        const count = await CompleteEnglishLandownerRecord.countDocuments({ project_id: firstProjectId });
        console.log(`Total records now with project ID ${firstProjectId}: ${count}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

updateProjectIdToMatch();