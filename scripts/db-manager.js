#!/usr/bin/env node

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// Import models
const Dishes = require('../models/dishes');
const Leaders = require('../models/leaders');
const Promotions = require('../models/promotions');
const Feedback = require('../models/feedback');
const Comments = require('../models/comments');
const Users = require('../models/users');
const Favorites = require('../models/favorite');

class DatabaseManager {
    constructor() {
        this.backupDir = './backups';
        this.ensureBackupDir();
    }

    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async connect() {
        try {
            await mongoose.connect(config.mongoUrl, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('✅ Connected to MongoDB');
        } catch (error) {
            console.error('❌ Failed to connect to MongoDB:', error.message);
            process.exit(1);
        }
    }

    async disconnect() {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }

    async backup(collectionName = null) {
        console.log('📦 Starting database backup...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, `backup-${timestamp}.json`);
        
        const collections = {
            dishes: Dishes,
            leaders: Leaders,
            promotions: Promotions,
            feedback: Feedback,
            comments: Comments,
            users: Users,
            favorites: Favorites
        };

        const backup = {};

        for (const [name, model] of Object.entries(collections)) {
            if (!collectionName || collectionName === name) {
                console.log(`   Backing up ${name}...`);
                const data = await model.find({}).lean();
                backup[name] = data;
                console.log(`   ✅ ${name}: ${data.length} documents`);
            }
        }

        fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
        console.log(`✅ Backup saved to: ${backupPath}`);
        
        return backupPath;
    }

    async restore(backupPath) {
        console.log('🔄 Starting database restore...');
        
        if (!fs.existsSync(backupPath)) {
            console.error('❌ Backup file not found:', backupPath);
            return;
        }

        const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        
        const collections = {
            dishes: Dishes,
            leaders: Leaders,
            promotions: Promotions,
            feedback: Feedback,
            comments: Comments,
            users: Users,
            favorites: Favorites
        };

        for (const [name, data] of Object.entries(backup)) {
            if (collections[name]) {
                console.log(`   Restoring ${name}...`);
                await collections[name].deleteMany({});
                if (data.length > 0) {
                    await collections[name].insertMany(data);
                }
                console.log(`   ✅ ${name}: ${data.length} documents restored`);
            }
        }

        console.log('✅ Database restore completed');
    }

    async clear(collectionName = null) {
        console.log('🗑️  Clearing database...');
        
        const collections = {
            dishes: Dishes,
            leaders: Leaders,
            promotions: Promotions,
            feedback: Feedback,
            comments: Comments,
            users: Users,
            favorites: Favorites
        };

        for (const [name, model] of Object.entries(collections)) {
            if (!collectionName || collectionName === name) {
                console.log(`   Clearing ${name}...`);
                await model.deleteMany({});
                console.log(`   ✅ ${name} cleared`);
            }
        }

        console.log('✅ Database cleared');
    }

    async stats() {
        console.log('📊 Database Statistics:');
        
        const collections = {
            dishes: Dishes,
            leaders: Leaders,
            promotions: Promotions,
            feedback: Feedback,
            comments: Comments,
            users: Users,
            favorites: Favorites
        };

        for (const [name, model] of Object.entries(collections)) {
            const count = await model.countDocuments();
            console.log(`   ${name}: ${count} documents`);
        }
    }

    async migrate() {
        console.log('🔄 Running database migrations...');
        
        // Example migration: Add new fields to existing documents
        try {
            // Update dishes with new fields if they don't exist
            const result = await Dishes.updateMany(
                { category: { $exists: false } },
                { $set: { category: 'main' } }
            );
            if (result.modifiedCount > 0) {
                console.log(`   ✅ Updated ${result.modifiedCount} dishes with category field`);
            }

            // Add more migrations as needed
            console.log('✅ Database migrations completed');
        } catch (error) {
            console.error('❌ Migration failed:', error.message);
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const dbManager = new DatabaseManager();

    try {
        await dbManager.connect();

        switch (command) {
            case 'backup':
                const collection = args[1] || null;
                await dbManager.backup(collection);
                break;

            case 'restore':
                const backupPath = args[1];
                if (!backupPath) {
                    console.error('❌ Please specify backup file path');
                    console.log('Usage: node db-manager.js restore <backup-file>');
                    process.exit(1);
                }
                await dbManager.restore(backupPath);
                break;

            case 'clear':
                const clearCollection = args[1] || null;
                await dbManager.clear(clearCollection);
                break;

            case 'stats':
                await dbManager.stats();
                break;

            case 'migrate':
                await dbManager.migrate();
                break;

            default:
                console.log('📋 Database Manager Commands:');
                console.log('   backup [collection]     - Backup database (or specific collection)');
                console.log('   restore <file>          - Restore from backup file');
                console.log('   clear [collection]      - Clear database (or specific collection)');
                console.log('   stats                   - Show database statistics');
                console.log('   migrate                 - Run database migrations');
                console.log('');
                console.log('Examples:');
                console.log('   node db-manager.js backup');
                console.log('   node db-manager.js backup dishes');
                console.log('   node db-manager.js restore ./backups/backup-2024-01-01.json');
                console.log('   node db-manager.js clear');
                console.log('   node db-manager.js stats');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await dbManager.disconnect();
    }
}

if (require.main === module) {
    main();
}

module.exports = DatabaseManager; 