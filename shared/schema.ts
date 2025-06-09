import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  partnerCode: text("partner_code").notNull().unique(),
  partnerId: integer("partner_id"),
  currentMood: text("current_mood", { enum: ["open", "neutral", "closed"] }).notNull().default("neutral"),
  iconStyle: text("icon_style", { enum: ["basic", "playful", "explicit"] }).notNull().default("basic"),
  lastMoodUpdate: timestamp("last_mood_update").defaultNow(),
  moodDuration: integer("mood_duration"), // Duration in minutes, null for no limit
  moodExpiresAt: timestamp("mood_expires_at"),
  lastReminderSent: timestamp("last_reminder_sent"),
  isOnline: boolean("is_online").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  partnerCode: true,
});

export const updateMoodSchema = z.object({
  mood: z.enum(["open", "neutral", "closed"]),
  duration: z.number().nullable().optional(), // Duration in minutes, null for no limit
});

export const updateIconStyleSchema = z.object({
  iconStyle: z.enum(["basic", "playful", "explicit"]),
});

export const connectPartnerSchema = z.object({
  partnerCode: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpdateMood = z.infer<typeof updateMoodSchema>;
export type UpdateIconStyle = z.infer<typeof updateIconStyleSchema>;
export type ConnectPartner = z.infer<typeof connectPartnerSchema>;
