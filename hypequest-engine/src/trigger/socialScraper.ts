import { task, schedules } from "@trigger.dev/sdk/v3";

export const scrapeSocialLeads = task({
  id: "scrape-social-leads",
  maxDuration: 300,
  run: async (payload: { keyword: string; platform: "TWITTER" | "REDDIT" | "TIKTOK" }) => {
    console.log(`[Governor] Starting scrape for keyword: "${payload.keyword}" on ${payload.platform}`);
    return {
      success: true,
      keyword: payload.keyword,
    };
  },
});

export const autoRadarCron = schedules.task({
  id: "auto-radar-cron",
  cron: "*/15 * * * *", // Runs automatically every 15 minutes
  run: async () => {
    console.log("[AutoRadar Cron] Triggering 15-minute automated background scan for all active keywords...");
    try {
      const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3500";
      const res = await fetch(`${siteUrl}/api/cron/scan`);
      const data = await res.json();
      console.log("[AutoRadar Cron Result]:", data);
      return data;
    } catch (err) {
      console.error("[AutoRadar Cron Error]:", err);
    }
  },
});
