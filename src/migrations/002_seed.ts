import { pool } from "../database";
import { logger } from "../utils/logger";

interface Article {
  title: string;
  content: string;
  description: string;
  state: string;
  topic: string;
  published_date: Date;
  url: string;
}

const sampleArticles: Article[] = [
  {
    title: "Texas Education Reform Initiative Announced",
    content:
      "Texas lawmakers have introduced a comprehensive education reform package that includes increased funding for public schools, teacher pay raises, and new curriculum standards. The initiative is expected to impact over 5 million students across the state.",
    description:
      "Texas introduces major education reform package with increased funding",
    state: "Texas",
    topic: "Education",
    published_date: new Date("2024-03-14"),
    url: "https://example.com/tx-education-reform",
  },
  {
    title: "Florida Healthcare Access Bill Under Debate",
    content:
      "The Florida Senate is debating a new healthcare access bill that would expand medical coverage to underserved communities. The proposed legislation includes provisions for telehealth services and rural healthcare facilities.",
    description: "Florida Senate debates healthcare access expansion bill",
    state: "Florida",
    topic: "Healthcare",
    published_date: new Date("2024-03-13"),
    url: "https://example.com/fl-healthcare-bill",
  },
  {
    title: "New York Housing Affordability Act Passes",
    content:
      "New York State has passed a comprehensive housing affordability act that includes rent control measures and incentives for affordable housing development. The legislation aims to address the growing housing crisis in urban areas.",
    description: "NY passes housing affordability act with rent control measures",
    state: "New York",
    topic: "Housing",
    published_date: new Date("2024-03-12"),
    url: "https://example.com/ny-housing-act",
  },
  {
    title: "Illinois Infrastructure Investment Plan Approved",
    content:
      "The Illinois General Assembly has approved a $45 billion infrastructure investment plan focusing on road repairs, bridge maintenance, and public transportation improvements. The plan is set to create thousands of jobs over the next decade.",
    description: "Illinois approves $45B infrastructure investment plan",
    state: "Illinois",
    topic: "Infrastructure",
    published_date: new Date("2024-03-11"),
    url: "https://example.com/il-infrastructure-plan",
  },
  {
    title: "New Environmental Protection Bill Passes in California",
    content:
      "The California State Legislature has passed a landmark environmental protection bill that aims to reduce carbon emissions by 40% by 2030. The bill includes provisions for increased renewable energy investment and stricter regulations on industrial emissions.",
    description:
      "California passes major environmental bill targeting 40% emissions reduction by 2030",
    state: "California",
    topic: "Environment",
    published_date: new Date("2024-03-15"),
    url: "https://example.com/ca-environment-bill",
  },
  // New articles...
  {
    title: "Washington State Unveils Ambitious Technology Initiative",
    content:
      "Washington state government announces a comprehensive technology modernization program aimed at improving digital services and cybersecurity across all state agencies.",
    description: "WA launches major tech modernization initiative",
    state: "Washington",
    topic: "Technology",
    published_date: new Date("2024-03-10"),
    url: "https://example.com/wa-tech-initiative",
  },
  {
    title: "Massachusetts Education Budget Increases by $2 Billion",
    content:
      "The Massachusetts legislature approves historic education funding increase, focusing on early childhood education and STEM programs in public schools.",
    description: "MA approves major education budget increase",
    state: "Massachusetts",
    topic: "Education",
    published_date: new Date("2024-03-09"),
    url: "https://example.com/ma-education-budget",
  },
  {
    title: "Oregon Passes Groundbreaking Housing Legislation",
    content:
      "Oregon lawmakers pass new housing bill that addresses zoning restrictions and promotes affordable housing development in urban areas.",
    description: "OR passes comprehensive housing reform",
    state: "Oregon",
    topic: "Housing",
    published_date: new Date("2024-03-08"),
    url: "https://example.com/or-housing-bill",
  },
  {
    title: "Michigan Announces Major Infrastructure Overhaul",
    content:
      "Michigan Department of Transportation reveals $5 billion plan to upgrade roads, bridges, and public transit systems across the state.",
    description: "MI launches infrastructure improvement plan",
    state: "Michigan",
    topic: "Infrastructure",
    published_date: new Date("2024-03-07"),
    url: "https://example.com/mi-infrastructure",
  },
  {
    title: "Arizona Expands Renewable Energy Programs",
    content:
      "Arizona Corporation Commission approves expansion of solar and wind energy projects, aiming for 50% renewable energy by 2035.",
    description: "AZ expands renewable energy initiatives",
    state: "Arizona",
    topic: "Energy",
    published_date: new Date("2024-03-06"),
    url: "https://example.com/az-renewable-energy",
  },
  {
    title: "Virginia Healthcare Access Initiative Launches",
    content:
      "Virginia implements new healthcare program to expand medical services in rural areas and improve telemedicine access.",
    description: "VA launches rural healthcare initiative",
    state: "Virginia",
    topic: "Healthcare",
    published_date: new Date("2024-03-05"),
    url: "https://example.com/va-healthcare",
  },
  {
    title: "Colorado Agricultural Support Bill Passes",
    content:
      "Colorado legislature approves comprehensive agricultural support package, including drought relief and sustainable farming initiatives.",
    description: "CO passes agricultural support bill",
    state: "Colorado",
    topic: "Agriculture",
    published_date: new Date("2024-03-04"),
    url: "https://example.com/co-agriculture",
  },
  {
    title: "Minnesota Transportation Innovation Fund Created",
    content:
      "Minnesota establishes new transportation innovation fund to support electric vehicle infrastructure and smart traffic systems.",
    description: "MN creates transportation innovation fund",
    state: "Minnesota",
    topic: "Transportation",
    published_date: new Date("2024-03-03"),
    url: "https://example.com/mn-transportation",
  },
  {
    title: "New Jersey Financial Technology Hub Announced",
    content:
      "New Jersey announces creation of fintech innovation hub to attract technology companies and promote financial sector growth.",
    description: "NJ establishes fintech innovation hub",
    state: "New Jersey",
    topic: "Finance",
    published_date: new Date("2024-03-02"),
    url: "https://example.com/nj-fintech",
  },
];

async function seedArticles() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Clear existing articles if needed
    await client.query("TRUNCATE TABLE articles CASCADE");

    // Insert each article
    for (const article of sampleArticles) {
      await client.query(
        `INSERT INTO articles (
          title,
          content,
          description,
          state,
          topic,
          published_date,
          url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          article.title,
          article.content,
          article.description,
          article.state,
          article.topic,
          article.published_date,
          article.url,
        ],
      );
    }

    await client.query("COMMIT");
    logger.info("Successfully seeded articles table");
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Error seeding articles:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seed function
seedArticles().catch((error) => {
  logger.error("Failed to seed database:", error);
  process.exit(1);
});
