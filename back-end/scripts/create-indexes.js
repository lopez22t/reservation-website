/**
 * Index Creation Script
 * Forces creation of database indexes by loading all models
 */
const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to trigger index creation
require('../models/User');
require('../models/Reservation');
require('../models/SignIn');
require('../models/Room');
require('../models/Building');

async function createIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-room-reservation');
        console.log('✅ Connected to MongoDB');

        // Force index creation by ensuring collections exist
        const db = mongoose.connection.db;

        // List all collections to ensure they're created
        const collections = await db.listCollections().toArray();
        console.log(`📊 Found ${collections.length} collections`);

        // Wait a moment for indexes to be created
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('✅ Database indexes should now be created');
        console.log('Run "npm run optimize-db" to verify');

    } catch (error) {
        console.error('❌ Index creation failed:', error);
    } finally {
        await mongoose.connection.close();
    }
}

createIndexes();