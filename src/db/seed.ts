import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { acts, settings } from "./schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const seedActs = [
  {
    nameZh: "成人詩班（你是最重要）",
    nameEn: "Adult Choir — You Are Most Important",
    church: "Derby",
    orderNumber: 1,
  },
  {
    nameZh: "Mill Hill 查經班朗讀詩篇23篇",
    nameEn: "Mill Hill Bible Study Group — Psalm 23 Reading",
    church: "King's Cross",
    orderNumber: 2,
  },
  {
    nameZh: "Linberg一家 — Rasa Sayang &《用馬來西亞的天氣來說愛你》",
    nameEn: "The Linbergs — Rasa Sayang & Saying Love You with Malaysian Weather",
    church: "King's Cross",
    orderNumber: 3,
  },
  {
    nameZh: "林煒餘 獨唱",
    nameEn: "Wai Yu Lam — Solo",
    church: "Woking",
    orderNumber: 4,
  },
  {
    nameZh: "Ukulele 三人組（活出愛）",
    nameEn: "Ukulele Trio — Living Out Love",
    church: "Derby",
    orderNumber: 5,
  },
  {
    nameZh: "李育棠 — 我想學摩度",
    nameEn: "Yuk Tong Li — I Want to Learn Magic",
    church: "Norwich",
    orderNumber: 6,
  },
  {
    nameZh: "AIA 平安羽扇舞",
    nameEn: "AIA Peace Feather Fan Dance",
    church: "Birmingham",
    orderNumber: 7,
  },
  {
    nameZh: "啟超、Florence 獻唱（紅豆詞 和 紅綿）",
    nameEn: "Kai Chiu & Florence — Red Bean Lyrics & Red Cotton",
    church: "Norwich",
    orderNumber: 8,
  },
  {
    nameZh: "Namiwa 短宣甜酸苦辣棟篤笑",
    nameEn: "Namiwa Mission — Sweet Sour Bitter Spicy Stand-up Comedy",
    church: "Epsom",
    orderNumber: 9,
  },
  {
    nameZh: "小提琴鋼琴合奏（Violin Sonata No.3 in F Major 2nd Mov Allegro by Handel）",
    nameEn: "Violin & Piano Duet — Handel Violin Sonata No.3 in F Major, 2nd Mov",
    church: "Derby",
    orderNumber: 10,
  },
  {
    nameZh: "Vivian 獨唱（詩篇23篇）",
    nameEn: "Vivian — Solo (Psalm 23)",
    church: "Norwich",
    orderNumber: 11,
  },
  {
    nameZh: "徐兆堅（一家四口）夏威夷結他演奏",
    nameEn: "Siu Kin Tsui (Family of Four) — Hawaiian Guitar",
    church: "Woking",
    orderNumber: 12,
  },
  {
    nameZh: "令鼓舞",
    nameEn: "Drum Dance",
    church: "Epsom",
    orderNumber: 13,
  },
  {
    nameZh: "跳繩123",
    nameEn: "Jump Rope 123",
    church: "Norwich",
    orderNumber: 14,
  },
  {
    nameZh: "BCMC 男子組四重唱",
    nameEn: "BCMC Men's Quartet",
    church: "Birmingham",
    orderNumber: 15,
  },
  {
    nameZh: "耶穌是王教會（耶王）話劇",
    nameEn: "Jesus Is King Church — Drama",
    church: "King's Cross",
    orderNumber: 16,
  },
];

async function seed() {
  console.log("Seeding database...");

  // Insert acts
  for (const act of seedActs) {
    await db.insert(acts).values(act).onConflictDoNothing();
  }
  console.log(`Seeded ${seedActs.length} acts`);

  // Insert default settings
  await db
    .insert(settings)
    .values({ key: "voting_locked", value: "false" })
    .onConflictDoNothing();
  console.log("Seeded settings");

  console.log("Done!");
}

seed().catch(console.error);
