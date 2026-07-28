"use server";

import { db } from "./db";
import { users, leads } from "./db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function claimQuest(userId: string, leadId: string, xpReward: number = 150) {
  try {
    // 1. Mark the lead (quest) as claimed in the database
    await db.update(leads)
      .set({ isClaimed: true })
      .where(eq(leads.id, leadId));
    
    // 2. Fetch the user to calculate their level progress
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!userRecord) throw new Error("User not found in database.");

    // 3. Calculate new XP and handle leveling up (1000 XP per level)
    const newXp = userRecord.xpPoints + xpReward;
    const newLevel = Math.floor(newXp / 1000) + 1;

    // 4. Save the new stats to the user's profile
    await db.update(users)
      .set({ xpPoints: newXp, level: newLevel })
      .where(eq(users.id, userId));

    // 5. Tell Next.js to instantly refresh the dashboard UI
    revalidatePath("/dashboard");
    
    return { success: true, newXp, newLevel };
  } catch (error) {
    console.error("[Database] Failed to claim quest:", error);
    return { success: false, error: "Database transaction failed." };
  }
}
