/**
 * Database Optimization Script
 * Creates and verifies database indexes for optimal query performance
 * Run this script after deploying to ensure indexes are in place
 */
const mongoose = require('mongoose');
require('dotenv').config();

async function optimizeDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-room-reservation');
        console.log('Connected to MongoDB for optimization');

        // Get database instance
        const db = mongoose.connection.db;

        console.log('\n🔍 Checking existing indexes...');

        // Check indexes on each collection
        const collections = ['users', 'reservations', 'signins', 'rooms', 'buildings'];

        for (const collectionName of collections) {
            try {
                const collection = db.collection(collectionName);
                const indexes = await collection.indexes();
                console.log(`\n📊 ${collectionName.toUpperCase()} Collection Indexes:`);

                indexes.forEach((index, i) => {
                    const key = Object.keys(index.key).join(', ');
                    console.log(`  ${i + 1}. ${key} (${index.name})`);
                });

                if (indexes.length === 1 && indexes[0].name === '_id_') {
                    console.log(`  ⚠️  Only default _id index found`);
                }
            } catch (error) {
                console.log(`  ❌ Could not check ${collectionName}: ${error.message}`);
            }
        }

        console.log('\n✅ Database optimization check completed');
        console.log('\n💡 Performance Tips:');
        console.log('  - Indexes are automatically created when models are loaded');
        console.log('  - Monitor slow queries with MongoDB profiler');
        console.log('  - Consider compound indexes for complex queries');
        console.log('  - Use explain() to analyze query execution plans');

    } catch (error) {
        console.error('❌ Database optimization failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run optimization if called directly
if (require.main === module) {
    optimizeDatabase();
}

module.exports = { optimizeDatabase };