/**
 * Generate realistic demo votes spread over 90 minutes.
 * Each act gets votes AFTER its approximate performance time.
 * Early acts accumulate votes sooner; later acts catch up.
 *
 * Usage: npx tsx src/db/seed-demo-votes.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { acts, votes } from "./schema";
import { asc } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const EVENT_DURATION_MINS = 90;
const VOTERS_COUNT = 80; // simulate ~80 audience members
const ACT_DURATION_MINS = 4; // each act ~4 mins

async function seedDemoVotes() {
  console.log("Clearing existing votes...");
  await db.delete(votes);

  const allActs = await db
    .select()
    .from(acts)
    .orderBy(asc(acts.orderNumber));

  console.log(`Found ${allActs.length} acts`);

  const now = new Date();
  const eventStart = new Date(now.getTime() - EVENT_DURATION_MINS * 60 * 1000);

  // Each act's performance start time (evenly spaced)
  const actStartTime = (orderNum: number) => {
    const offset = (orderNum - 1) * ACT_DURATION_MINS;
    return new Date(eventStart.getTime() + offset * 60 * 1000);
  };

  const allVotes: {
    actId: number;
    voterId: string;
    score: number;
    createdAt: Date;
    updatedAt: Date;
  }[] = [];

  for (let v = 0; v < VOTERS_COUNT; v++) {
    const voterId = `demo-voter-${v.toString().padStart(3, "0")}`;

    for (const act of allActs) {
      // ~85% chance of voting for each act
      if (Math.random() > 0.85) continue;

      // Vote comes after the act performs, with some random delay
      const actStart = actStartTime(act.orderNumber);
      // Most votes within 2 mins after performance, some trickle in later
      const delayMs = Math.random() < 0.7
        ? Math.random() * 2 * 60 * 1000 // 70%: within 2 mins
        : Math.random() * 20 * 60 * 1000; // 30%: up to 20 mins later

      const voteTime = new Date(actStart.getTime() + delayMs);

      // Don't exceed event end
      if (voteTime > now) continue;

      // Score distribution: weighted towards 3-5 stars
      const scoreRand = Math.random();
      const score =
        scoreRand < 0.05 ? 1
          : scoreRand < 0.12 ? 2
            : scoreRand < 0.30 ? 3
              : scoreRand < 0.60 ? 4
                : 5;

      allVotes.push({
        actId: act.id,
        voterId,
        score,
        createdAt: voteTime,
        updatedAt: voteTime,
      });
    }
  }

  // Sort by time
  allVotes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  console.log(`Inserting ${allVotes.length} demo votes...`);

  // Insert in batches of 50
  for (let i = 0; i < allVotes.length; i += 50) {
    const batch = allVotes.slice(i, i + 50);
    await db.insert(votes).values(batch).onConflictDoNothing();
  }

  console.log("Done! Demo votes seeded.");
  console.log(
    `Event window: ${eventStart.toISOString()} → ${now.toISOString()}`
  );
}

seedDemoVotes().catch(console.error);
