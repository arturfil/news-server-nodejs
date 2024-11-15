import { pool } from '../database';
import { logger } from '../utils/logger';

interface Article {
  title: string;
  content: string;
  summary: string;
  state: string;
  topic: string;
  published_date: Date;
  source_url: string;
}

const sampleArticles: Article[] = [
  {
    title: "New Environmental Protection Bill Passes in California",
    content: "The California State Legislature has passed a landmark environmental protection bill that aims to reduce carbon emissions by 40% by 2030. The bill includes provisions for increased renewable energy investment and stricter regulations on industrial emissions.",
    summary: "California passes major environmental bill targeting 40% emissions reduction by 2030",
    state: "California",
    topic: "Environment",
    published_date: new Date('2024-03-15'),
    source_url: "https://example.com/ca-environment-bill"
  },
  {
    title: "Texas Education Reform Initiative Announced",
    content: "Texas lawmakers have introduced a comprehensive education reform package that includes increased funding for public schools, teacher pay raises, and new curriculum standards. The initiative is expected to impact over 5 million students across the state.",
    summary: "Texas introduces major education reform package with increased funding",
    state: "Texas",
    topic: "Education",
    published_date: new Date('2024-03-14'),
    source_url: "https://example.com/tx-education-reform"
  },
  {
    title: "Florida Healthcare Access Bill Under Debate",
    content: "The Florida Senate is debating a new healthcare access bill that would expand medical coverage to underserved communities. The proposed legislation includes provisions for telehealth services and rural healthcare facilities.",
    summary: "Florida Senate debates healthcare access expansion bill",
    state: "Florida",
    topic: "Healthcare",
    published_date: new Date('2024-03-13'),
    source_url: "https://example.com/fl-healthcare-bill"
  },
  {
    title: "New York Housing Affordability Act Passes",
    content: "New York State has passed a comprehensive housing affordability act that includes rent control measures and incentives for affordable housing development. The legislation aims to address the growing housing crisis in urban areas.",
    summary: "NY passes housing affordability act with rent control measures",
    state: "New York",
    topic: "Housing",
    published_date: new Date('2024-03-12'),
    source_url: "https://example.com/ny-housing-act"
  },
  {
    title: "Illinois Infrastructure Investment Plan Approved",
    content: "The Illinois General Assembly has approved a $45 billion infrastructure investment plan focusing on road repairs, bridge maintenance, and public transportation improvements. The plan is set to create thousands of jobs over the next decade.",
    summary: "Illinois approves $45B infrastructure investment plan",
    state: "Illinois",
    topic: "Infrastructure",
    published_date: new Date('2024-03-11'),
    source_url: "https://example.com/il-infrastructure-plan"
  }
];

async function seedArticles() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clear existing articles if needed
    await client.query('TRUNCATE TABLE articles CASCADE');
    
    // Insert each article
    for (const article of sampleArticles) {
      await client.query(
        `INSERT INTO articles (
          title,
          content,
          summary,
          state,
          topic,
          published_date,
          source_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          article.title,
          article.content,
          article.summary,
          article.state,
          article.topic,
          article.published_date,
          article.source_url
        ]
      );
    }
    
    await client.query('COMMIT');
    logger.info('Successfully seeded articles table');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error seeding articles:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seed function
seedArticles().catch((error) => {
  logger.error('Failed to seed database:', error);
  process.exit(1);
});
