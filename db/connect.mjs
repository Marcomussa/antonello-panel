import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

const { MONGODB_USERNAME, MONGODB_PASSWORD } = process.env;
const MONGO_URI = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@blogposts.ugifu.mongodb.net/?retryWrites=true&w=majority&appName=BlogPosts`

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI)
        console.log('MongoDB connected')
    } catch (err) {
        console.error(err.message)
        process.exit(1)
    }
}

export default connectDB