// src/routes/news.routes.ts

import express from 'express';
import { NewsController } from '../controllers/news.controller';

const router = express.Router();
const newsController = new NewsController();

// Get news with filters and pagination
router.get('/', newsController.getNews);

// Get specific article by ID
router.get('/:id', newsController.getArticleById);

// Get available states
router.get('/metadata/states', newsController.getStates);
//
// Update article by ID
router.put('/:id', newsController.updateArticle);

// Get available topics
router.get('/metadata/topics', newsController.getTopics);

export default router;
