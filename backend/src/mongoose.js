const mongoose = require('mongoose');
const config = require('./config/config');
const Logger = require('./utils/logger');

const logger = new Logger('Database');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`, { error });
    process.exit(1);
  }
};

module.exports = connectDB;
