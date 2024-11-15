// src/services/news.service.ts

import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { Article, NewsFilters, PaginationOptions, NewsResponse } from '../types/news.types';
import { pool } from '../database';
import { redisClient } from '../cache';
import { logger } from '../utils/logger';

export class NewsService {
  private db: Pool;
  private cache: Redis;
  private readonly CACHE_TTL = 300; // 5 minutes in seconds

  constructor() {
    this.db = pool;
    this.cache = redisClient;
  }

  private generateCacheKey(filters: NewsFilters, pagination: PaginationOptions): string {
    return `news:${JSON.stringify({ ...filters, ...pagination })}`;
  }

  private buildQuery(filters: NewsFilters): {
    query: string;
    params: any[];
  } {
    let query = `
      SELECT 
        a.*,
        COUNT(*) OVER() as total_count
      FROM articles a
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.state) {
      query += ` AND state = $${paramIndex}`;
      params.push(filters.state);
      paramIndex++;
    }

    if (filters.topic) {
      query += ` AND topic = $${paramIndex}`;
      params.push(filters.topic);
      paramIndex++;
    }

    if (filters.startDate) {
      query += ` AND published_date >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND published_date <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    if (filters.searchQuery) {
      query += ` AND (
        to_tsvector('english', title) @@ plainto_tsquery('english', $${paramIndex})
        OR to_tsvector('english', content) @@ plainto_tsquery('english', $${paramIndex})
      )`;
      params.push(filters.searchQuery);
      paramIndex++;
    }

    return { query, params };
  }

  async getNews(
    filters: NewsFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<NewsResponse> {
    try {
      const cacheKey = this.generateCacheKey(filters, pagination);
      const cachedResult = await this.cache.get(cacheKey);

      if (cachedResult) {
        logger.info('Cache hit for news query');
        return JSON.parse(cachedResult);
      }

      const { query: baseQuery, params } = this.buildQuery(filters);
      const offset = (pagination.page - 1) * pagination.limit;
      
      const finalQuery = `
        ${baseQuery}
        ORDER BY published_date DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      const finalParams = [...params, pagination.limit, offset];

      const result = await this.db.query(finalQuery, finalParams);
      const articles = result.rows;
      const total = articles.length > 0 ? parseInt(articles[0].total_count) : 0;
      const totalPages = Math.ceil(total / pagination.limit);

      const response: NewsResponse = {
        articles: articles.map(article => ({
          ...article,
          total_count: undefined // Remove the count from individual articles
        })),
        total,
        page: pagination.page,
        totalPages,
        hasMore: pagination.page < totalPages
      };

      // Cache the result
      await this.cache.setex(
        cacheKey,
        this.CACHE_TTL,
        JSON.stringify(response)
      );

      return response;
    } catch (error) {
      logger.error('Error fetching news:', error);
      throw error;
    }
  }

  async getArticleById(id: number): Promise<Article | null> {
    try {
      const cacheKey = `article:${id}`;
      const cachedArticle = await this.cache.get(cacheKey);

      if (cachedArticle) {
        logger.info(`Cache hit for article ${id}`);
        return JSON.parse(cachedArticle);
      }

      const result = await this.db.query(
        'SELECT * FROM articles WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const article = result.rows[0];
      await this.cache.setex(
        cacheKey,
        this.CACHE_TTL,
        JSON.stringify(article)
      );

      return article;
    } catch (error) {
      logger.error(`Error fetching article ${id}:`, error);
      throw error;
    }
  }

  async getStates(): Promise<string[]> {
    try {
      const cacheKey = 'states:list';
      const cachedStates = await this.cache.get(cacheKey);

      if (cachedStates) {
        return JSON.parse(cachedStates);
      }

      const result = await this.db.query(
        'SELECT DISTINCT state FROM articles WHERE state IS NOT NULL ORDER BY state'
      );
      const states = result.rows.map(row => row.state);

      await this.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(states));
      return states;
    } catch (error) {
      logger.error('Error fetching states:', error);
      throw error;
    }
  }

  async getTopics(): Promise<string[]> {
    try {
      const cacheKey = 'topics:list';
      const cachedTopics = await this.cache.get(cacheKey);

      if (cachedTopics) {
        return JSON.parse(cachedTopics);
      }

      const result = await this.db.query(
        'SELECT DISTINCT topic FROM articles WHERE topic IS NOT NULL ORDER BY topic'
      );
      const topics = result.rows.map(row => row.topic);

      await this.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(topics));
      return topics;
    } catch (error) {
      logger.error('Error fetching topics:', error);
      throw error;
    }
  }
}
