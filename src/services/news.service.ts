import { Pool } from "pg";
import { Redis } from "ioredis";
import {
  Article,
  NewsFilters,
  PaginationOptions,
  NewsResponse,
} from "../types/news.types";
import { pool } from "../database";
import { redisClient } from "../cache";
import { logger } from "../utils/logger";

export class NewsService {
  private db: Pool;
  private cache: Redis;
  private readonly CACHE_TTL = 300; // 5 minutes in seconds

  constructor() {
    this.db = pool;
    this.cache = redisClient;
  }

  private generateCacheKey(
    filters: NewsFilters,
    pagination: PaginationOptions,
  ): string {
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
    pagination: PaginationOptions = { page: 1, limit: 10 },
  ): Promise<NewsResponse> {
    try {
      const cacheKey = this.generateCacheKey(filters, pagination);
      const cachedResult = await this.cache.get(cacheKey);

      if (cachedResult) {
        logger.info("Cache hit for news query");
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
        articles: articles.map((article) => ({
          ...article,
          total_count: undefined, // Remove the count from individual articles
        })),
        total,
        page: pagination.page,
        totalPages,
        hasMore: pagination.page < totalPages,
      };

      // Cache the result
      await this.cache.setex(
        cacheKey,
        this.CACHE_TTL,
        JSON.stringify(response),
      );

      return response;
    } catch (error) {
      logger.error("Error fetching news:", error);
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
        "SELECT * FROM articles WHERE id = $1",
        [id],
      );

      if (result.rows.length === 0) {
        return null;
      }

      const article = result.rows[0];
      await this.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(article));

      return article;
    } catch (error) {
      logger.error(`Error fetching article ${id}:`, error);
      throw error;
    }
  }

  async getStates(): Promise<string[]> {
    try {
      const cacheKey = "states:list";
      const cachedStates = await this.cache.get(cacheKey);

      if (cachedStates) {
        return JSON.parse(cachedStates);
      }

      // Query the states table instead of articles
      const result = await this.db.query(
        "SELECT name FROM states ORDER BY name",
      );
      const states = result.rows.map((row) => row.name);

      await this.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(states));
      return states;
    } catch (error) {
      logger.error("Error fetching states:", error);
      throw error;
    }
  }

  async getTopics(): Promise<string[]> {
    try {
      const cacheKey = "topics:list";
      const cachedTopics = await this.cache.get(cacheKey);

      if (cachedTopics) {
        return JSON.parse(cachedTopics);
      }

      // Query the topics table instead of articles
      const result = await this.db.query(
        "SELECT name FROM topics ORDER BY name",
      );
      const topics = result.rows.map((row) => row.name);

      await this.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(topics));
      return topics;
    } catch (error) {
      logger.error("Error fetching topics:", error);
      throw error;
    }
  }

  async updateArticle(
    id: number,
    updates: Partial<Article>,
  ): Promise<Article | null> {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");

      // Build the update query dynamically based on provided fields
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Only allow updating specific fields
      const allowedFields = ["title", "content", "summary", "state", "topic"];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        throw new Error("No valid fields to update");
      }

      // Add updated_at timestamp
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const query = `
        UPDATE articles 
        SET ${updateFields.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, [...values, id]);
      await client.query("COMMIT");

      if (result.rows.length === 0) {
        return null;
      }

      const updatedArticle = result.rows[0];

      // Invalidate caches
      const cacheKey = `article:${id}`;
      await this.cache.del(cacheKey);

      // Invalidate list caches
      const keys = await this.cache.keys("news:*");
      if (keys.length > 0) {
        await this.cache.del(keys);
      }

      return updatedArticle;
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error(`Error updating article ${id}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }
}
