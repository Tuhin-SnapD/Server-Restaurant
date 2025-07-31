const mongoose = require('mongoose');
const config = require('./config');
const Dishes = require('./models/dishes');
const Leaders = require('./models/leaders');
const Promotions = require('./models/promotions');
const Feedback = require('./models/feedback');
const Comments = require('./models/comments');

const dbData = require('./db.json');

const url = config.mongoUrl;

async function populateDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB server successfully!');
        
        // Clear existing data
        console.log('Clearing existing data...');
        await Promise.all([
            Dishes.deleteMany({}),
            Leaders.deleteMany({}),
            Promotions.deleteMany({}),
            Feedback.deleteMany({}),
            Comments.deleteMany({})
        ]);
        console.log('Cleared existing data');
        
        // Insert dishes using data from db.json
        const dishes = dbData.dishes.map((dish) => {
            const newDish = { ...dish };
            delete newDish.id; // Remove the numeric id field
            if (typeof newDish.featured === 'string') {
                newDish.featured = newDish.featured === 'true';
            }
            return newDish;
        });
        
        const insertedDishes = await Dishes.insertMany(dishes);
        console.log('Dishes inserted:', insertedDishes.length);
        
        // Create a mapping from dish id to dish ObjectId
        const dishIdMap = {};
        insertedDishes.forEach((dish, index) => {
            dishIdMap[dbData.dishes[index].id] = dish._id;
        });
        
        // Insert comments using data from db.json and embed them in dishes
        if (dbData.comments && dbData.comments.length > 0) {
            // Group comments by dishId
            const commentsByDish = {};
            dbData.comments.forEach((comment) => {
                if (!commentsByDish[comment.dishId]) {
                    commentsByDish[comment.dishId] = [];
                }
                commentsByDish[comment.dishId].push({
                    rating: comment.rating,
                    comment: comment.comment,
                    author: comment.author,
                    date: new Date(comment.date)
                });
            });
            
            // Update dishes with embedded comments
            for (const [dishId, comments] of Object.entries(commentsByDish)) {
                const dishObjectId = dishIdMap[dishId];
                if (dishObjectId) {
                    await Dishes.findByIdAndUpdate(dishObjectId, {
                        $push: { comments: { $each: comments } }
                    });
                }
            }
            console.log('Comments embedded in dishes');
        }
        
        // Insert leaders using data from db.json
        const leaders = dbData.leaders.map((leader) => {
            const newLeader = { ...leader };
            delete newLeader.id; // Remove the numeric id field
            if (typeof newLeader.featured === 'string') {
                newLeader.featured = newLeader.featured === 'true';
            }
            return newLeader;
        });
        
        const insertedLeaders = await Leaders.insertMany(leaders);
        console.log('Leaders inserted:', insertedLeaders.length);
        
        // Insert promotions using data from db.json
        const promotions = dbData.promotions.map((promo) => {
            const newPromo = { ...promo };
            delete newPromo.id; // Remove the numeric id field
            if (typeof newPromo.featured === 'string') {
                newPromo.featured = newPromo.featured === 'true';
            }
            return newPromo;
        });
        
        const insertedPromotions = await Promotions.insertMany(promotions);
        console.log('Promotions inserted:', insertedPromotions.length);
        
        // Insert feedback using data from db.json
        if (dbData.feedback && dbData.feedback.length > 0) {
            const feedback = dbData.feedback.map((item) => {
                const newFeedback = { ...item };
                delete newFeedback.id; // Remove the numeric id field
                return {
                    ...newFeedback,
                    date: new Date(item.date)
                };
            });
            
            const insertedFeedback = await Feedback.insertMany(feedback);
            console.log('Feedback inserted:', insertedFeedback.length);
        }
        
        console.log('Database populated successfully with all data from db.json!');
        console.log('✨ Restaurant data now includes:');
        console.log(`   - ${dbData.dishes.length} premium dishes with realistic pricing and descriptions`);
        console.log(`   - ${dbData.comments.length} customer comments and ratings`);
        console.log(`   - ${dbData.promotions.length} special promotions`);
        console.log(`   - ${dbData.leaders.length} professional team members`);
        console.log(`   - ${dbData.feedback.length} customer feedback entries`);
        console.log('   - All original images and data from db.json');
        
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (err) {
        console.error('Error populating database:', err);
        await mongoose.disconnect();
        process.exit(1);
    }
}

populateDatabase(); 