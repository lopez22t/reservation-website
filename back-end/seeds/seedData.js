/**
 * Database Seeding Script
 * Run: node seeds/seedData.js
 * This populates the database with test buildings, rooms, and sample data
 */
const mongoose = require('mongoose');
require('dotenv').config();

const { Building, Room, User } = require('../models');

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-room-reservation');
        console.log('📦 Connected to MongoDB');

        // Clear existing data (optional - comment out to keep data)
        // await Building.deleteMany({});
        // await Room.deleteMany({});
        // console.log('🗑️  Cleared existing data');

        // Create Pratt Building
        let building = await Building.findOne({ name: 'Pratt Music hall' });
        if (!building) {
            building = await Building.create({
                name: 'Pratt Music hall',
                code: 'PRATT',
                description: 'Main building: Pratt Music hall',
                location: 'South Campus',
                imageUrl: '/assets/pradt.jpg',
                totalFloors: 3,
                isActive: true
            });
            console.log('✅ Created Pratt building');
        } else {
            console.log('📌 Pratt building already exists');
        }

        // Create sample rooms
        const roomData = [
            // Floor 1
            { roomNumber: '101', floor: 1, capacity: 2, roomType: 'study', amenities: ['wifi', 'desks'] },
            { roomNumber: '102', floor: 1, capacity: 4, roomType: 'group-study', amenities: ['wifi', 'whiteboard', 'desks'] },
            { roomNumber: '103', floor: 1, capacity: 1, roomType: 'study', amenities: ['wifi', 'desks', 'ac'] },
            // Floor 2
            { roomNumber: '201', floor: 2, capacity: 6, roomType: 'meeting', amenities: ['wifi', 'projector', 'whiteboard', 'desks'] },
            { roomNumber: '202', floor: 2, capacity: 3, roomType: 'group-study', amenities: ['wifi', 'computers', 'desks'] },
            { roomNumber: '203', floor: 2, capacity: 2, roomType: 'study', amenities: ['wifi', 'desks', 'printer'] },
            // Floor 3
            { roomNumber: '301', floor: 3, capacity: 4, roomType: 'lab', amenities: ['wifi', 'computers', 'projector'] },
            { roomNumber: '302', floor: 3, capacity: 2, roomType: 'study', amenities: ['wifi', 'desks', 'ac'] },
        ];

        let createdCount = 0;
        for (const data of roomData) {
            const existingRoom = await Room.findOne({
                building: building._id,
                roomNumber: data.roomNumber
            });

            if (!existingRoom) {
                await Room.create({
                    ...data,
                    building: building._id,
                    occupancyStatus: 'available',
                    currentOccupancy: 0
                });
                createdCount++;
            }
        }

        console.log(`✅ Created ${createdCount} rooms`);

        // Create a test user
        let testUser = await User.findOne({ email: 'test@mhc.edu' });
        if (!testUser) {
            testUser = await User.create({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@mhc.edu',
                password: 'Password123',
                studentId: '2024001',
                phone: '+1-413-555-0100',
                department: 'Computer Science',
                role: 'student',
                isActive: true
            });
            console.log('✅ Created test user (test@mhc.edu / Password123)');
        } else {
            console.log('📌 Test user already exists');
        }

        console.log('\n✨ Database seeding complete!');
        console.log('\n📝 Test Credentials:');
        console.log('   Email: test@mhc.edu');
        console.log('   Password: Password123');
        console.log('\n🚀 Ready to use the application!');

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedDatabase();
