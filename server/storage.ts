import { users, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByPartnerCode(partnerCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserMood(id: number, mood: "open" | "neutral" | "closed", duration?: number | null): Promise<User | undefined>;
  updateUserIconStyle(id: number, iconStyle: "basic" | "playful" | "explicit"): Promise<{ user: User; partner: User | undefined }>;
  connectPartner(userId: number, partnerCode: string): Promise<{ user: User; partner: User } | null>;
  setUserOnlineStatus(id: number, isOnline: boolean): Promise<void>;
  getPartner(userId: number): Promise<User | undefined>;
  checkExpiredMoods(): Promise<User[]>;
  updateLastReminderSent(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private usersByPartnerCode: Map<string, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.usersByPartnerCode = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPartnerCode(partnerCode: string): Promise<User | undefined> {
    return this.usersByPartnerCode.get(partnerCode);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      id,
      partnerId: null,
      currentMood: "neutral",
      iconStyle: "basic",
      lastMoodUpdate: new Date(),
      moodDuration: null,
      moodExpiresAt: null,
      lastReminderSent: null,
      isOnline: true,
    };
    this.users.set(id, user);
    this.usersByPartnerCode.set(user.partnerCode, user);
    return user;
  }

  async updateUserMood(id: number, mood: "open" | "neutral" | "closed", duration?: number | null): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const now = new Date();
    let expiresAt: Date | null = null;
    
    if (duration && mood !== "neutral") {
      expiresAt = new Date(now.getTime() + duration * 60 * 1000);
    }

    const updatedUser: User = {
      ...user,
      currentMood: mood,
      lastMoodUpdate: now,
      moodDuration: duration || null,
      moodExpiresAt: expiresAt,
      lastReminderSent: null, // Reset reminder when mood changes
    };
    
    this.users.set(id, updatedUser);
    this.usersByPartnerCode.set(updatedUser.partnerCode, updatedUser);
    return updatedUser;
  }

  async updateUserIconStyle(id: number, iconStyle: "basic" | "playful" | "explicit"): Promise<{ user: User; partner: User | undefined }> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");

    const updatedUser: User = {
      ...user,
      iconStyle,
    };
    
    this.users.set(id, updatedUser);
    this.usersByPartnerCode.set(updatedUser.partnerCode, updatedUser);

    // Update partner's icon style too (shared setting)
    let updatedPartner: User | undefined = undefined;
    if (user.partnerId) {
      const partner = this.users.get(user.partnerId);
      if (partner) {
        updatedPartner = {
          ...partner,
          iconStyle,
        };
        this.users.set(partner.id, updatedPartner);
        this.usersByPartnerCode.set(updatedPartner.partnerCode, updatedPartner);
      }
    }

    return { user: updatedUser, partner: updatedPartner };
  }

  async connectPartner(userId: number, partnerCode: string): Promise<{ user: User; partner: User } | null> {
    const user = this.users.get(userId);
    const partner = this.usersByPartnerCode.get(partnerCode);
    
    if (!user || !partner || user.id === partner.id) {
      return null;
    }

    const updatedUser: User = { ...user, partnerId: partner.id };
    const updatedPartner: User = { ...partner, partnerId: user.id };

    this.users.set(userId, updatedUser);
    this.users.set(partner.id, updatedPartner);
    this.usersByPartnerCode.set(updatedUser.partnerCode, updatedUser);
    this.usersByPartnerCode.set(updatedPartner.partnerCode, updatedPartner);

    return { user: updatedUser, partner: updatedPartner };
  }

  async setUserOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    const user = this.users.get(id);
    if (!user) return;

    const updatedUser: User = { ...user, isOnline };
    this.users.set(id, updatedUser);
    this.usersByPartnerCode.set(updatedUser.partnerCode, updatedUser);
  }

  async getPartner(userId: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user || !user.partnerId) return undefined;
    return this.users.get(user.partnerId);
  }

  async checkExpiredMoods(): Promise<User[]> {
    const now = new Date();
    const expiredUsers: User[] = [];

    this.users.forEach((user) => {
      if (user.moodExpiresAt && user.moodExpiresAt <= now && user.currentMood !== "neutral") {
        const updatedUser: User = {
          ...user,
          currentMood: "neutral",
          moodDuration: null,
          moodExpiresAt: null,
          lastMoodUpdate: now,
        };
        this.users.set(user.id, updatedUser);
        this.usersByPartnerCode.set(updatedUser.partnerCode, updatedUser);
        expiredUsers.push(updatedUser);
      }
    });

    return expiredUsers;
  }

  async updateLastReminderSent(id: number): Promise<void> {
    const user = this.users.get(id);
    if (!user) return;

    const updatedUser: User = { ...user, lastReminderSent: new Date() };
    this.users.set(id, updatedUser);
    this.usersByPartnerCode.set(updatedUser.partnerCode, updatedUser);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

export const storage = new MemStorage();
