import { pool } from "../database";
import { logger } from "../utils/logger";

async function initializeTables() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create articles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        encoded_id VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        description TEXT,
        state VARCHAR(50),
        topic VARCHAR(50),
        published_date TIMESTAMP,
        url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create topics table for standardized topics
    await client.query(`
      CREATE TABLE IF NOT EXISTS topics (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create states table for standardized state names
    await client.query(`
      CREATE TABLE IF NOT EXISTS states (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        abbreviation CHAR(2) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create sources table to track news sources
    await client.query(`
      CREATE TABLE IF NOT EXISTS sources (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        base_url TEXT,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create article_tags table for flexible tagging
    await client.query(`
      CREATE TABLE IF NOT EXISTS article_tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create articles_tags junction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS articles_tags (
        article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES article_tags(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (article_id, tag_id)
      );
    `);

    // Add indices for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_state ON articles(state);
      CREATE INDEX IF NOT EXISTS idx_articles_topic ON articles(topic);
      CREATE INDEX IF NOT EXISTS idx_articles_published_date ON articles(published_date);
      CREATE INDEX IF NOT EXISTS idx_articles_title_text ON articles USING GIN (to_tsvector('english', title));
      CREATE INDEX IF NOT EXISTS idx_articles_content_text ON articles USING GIN (to_tsvector('english', content));
    `);

    // Add updated_at trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Add trigger to articles table
    await client.query(`
      DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
      CREATE TRIGGER update_articles_updated_at
          BEFORE UPDATE ON articles
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);

    // Insert default states
    await client.query(`
      INSERT INTO states (name, abbreviation) VALUES
      ('Alabama', 'AL'), ('Alaska', 'AK'), ('Arizona', 'AZ'), ('Arkansas', 'AR'),
      ('California', 'CA'), ('Colorado', 'CO'), ('Connecticut', 'CT'), ('Delaware', 'DE'),
      ('Florida', 'FL'), ('Georgia', 'GA'), ('Hawaii', 'HI'), ('Idaho', 'ID'),
      ('Illinois', 'IL'), ('Indiana', 'IN'), ('Iowa', 'IA'), ('Kansas', 'KS'),
      ('Kentucky', 'KY'), ('Louisiana', 'LA'), ('Maine', 'ME'), ('Maryland', 'MD'),
      ('Massachusetts', 'MA'), ('Michigan', 'MI'), ('Minnesota', 'MN'), ('Mississippi', 'MS'),
      ('Missouri', 'MO'), ('Montana', 'MT'), ('Nebraska', 'NE'), ('Nevada', 'NV'),
      ('New Hampshire', 'NH'), ('New Jersey', 'NJ'), ('New Mexico', 'NM'), ('New York', 'NY'),
      ('North Carolina', 'NC'), ('North Dakota', 'ND'), ('Ohio', 'OH'), ('Oklahoma', 'OK'),
      ('Oregon', 'OR'), ('Pennsylvania', 'PA'), ('Rhode Island', 'RI'), ('South Carolina', 'SC'),
      ('South Dakota', 'SD'), ('Tennessee', 'TN'), ('Texas', 'TX'), ('Utah', 'UT'),
      ('Vermont', 'VT'), ('Virginia', 'VA'), ('Washington', 'WA'), ('West Virginia', 'WV'),
      ('Wisconsin', 'WI'), ('Wyoming', 'WY')
      ON CONFLICT (abbreviation) DO NOTHING;
    `);

    // Insert default topics
    await client.query(`
      INSERT INTO topics (name, description) VALUES
      ('Environment', 'Environmental protection and climate change legislation'),
      ('Education', 'Education policy and school system reforms'),
      ('Healthcare', 'Healthcare policy and medical system legislation'),
      ('Infrastructure', 'Infrastructure development and maintenance'),
      ('Housing', 'Housing policy and development'),
      ('Transportation', 'Transportation systems and policy'),
      ('Technology', 'Technology regulation and digital policy'),
      ('Agriculture', 'Agricultural policy and farming regulations'),
      ('Energy', 'Energy policy and utilities regulation'),
      ('Finance', 'Financial regulation and economic policy')
      ON CONFLICT (name) DO NOTHING;
    `);

    await client.query("COMMIT");
    logger.info("Successfully initialized database tables");
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Error initializing database:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Execute the initialization
initializeTables()
  .then(() => {
    logger.info("Database initialization completed");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Database initialization failed:", error);
    process.exit(1);
  });
