import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import { initializeDatabase } from './database';
import { logger } from './utils/logger';
import 'dotenv/config';
import routes from './routes';
import { initializeRedis } from './cache';

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cors());


// Routes
app.use('/api', routes);


// Database and Redis initialization
async function initializeApp() {
  try {
    await initializeDatabase();
    await initializeRedis();
    
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to initialize app:', error);
    process.exit(1);
  }
}

initializeApp();
