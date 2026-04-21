const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  await mongoose.connect(env.mongoUri || 'mongodb://localhost:27017/warhammer-site-db')
  console.log('MongoDB connected');
};

module.exports = connectDB;
