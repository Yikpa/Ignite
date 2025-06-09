import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { updateMoodSchema, updateIconStyleSchema, connectPartnerSchema, insertUserSchema } from "@shared/schema";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket connection handling
  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'authenticate' && message.userId) {
          ws.userId = message.userId;
          await storage.setUserOnlineStatus(message.userId, true);
          
          // Send current user and partner data
          const user = await storage.getUser(message.userId);
          const partner = await storage.getPartner(message.userId);
          
          ws.send(JSON.stringify({
            type: 'authenticated',
            user,
            partner
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      if (ws.userId) {
        await storage.setUserOnlineStatus(ws.userId, false);
        notifyPartner(ws.userId, { type: 'partner_offline' });
      }
    });
  });

  // Notify partner of updates
  const notifyPartner = async (userId: number, message: any) => {
    const partner = await storage.getPartner(userId);
    if (!partner) return;

    wss.clients.forEach((client: AuthenticatedWebSocket) => {
      if (client.userId === partner.id && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };

  // API Routes
  app.post('/api/users', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: 'Invalid user data' });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: 'Invalid user ID' });
    }
  });

  app.patch('/api/users/:id/mood', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { mood, duration } = updateMoodSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserMood(id, mood, duration);
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Notify partner of mood change
      await notifyPartner(id, {
        type: 'partner_mood_update',
        mood,
        lastUpdate: updatedUser.lastMoodUpdate,
        expiresAt: updatedUser.moodExpiresAt
      });

      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ error: 'Invalid mood data' });
    }
  });

  app.patch('/api/users/:id/icon-style', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { iconStyle } = updateIconStyleSchema.parse(req.body);
      
      const result = await storage.updateUserIconStyle(id, iconStyle);
      
      // Notify partner of icon style change (affects both users)
      if (result.partner) {
        await notifyPartner(id, {
          type: 'icon_style_update',
          iconStyle
        });
      }

      res.json(result.user);
    } catch (error) {
      res.status(400).json({ error: 'Invalid icon style data' });
    }
  });

  app.post('/api/users/:id/connect-partner', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { partnerCode } = connectPartnerSchema.parse(req.body);
      
      const result = await storage.connectPartner(id, partnerCode);
      if (!result) {
        return res.status(400).json({ error: 'Invalid partner code or already connected' });
      }

      // Notify both users of successful connection
      await notifyPartner(id, {
        type: 'partner_connected',
        partner: result.user
      });

      wss.clients.forEach((client: AuthenticatedWebSocket) => {
        if (client.userId === id && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'partner_connected',
            partner: result.partner
          }));
        }
      });

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: 'Invalid partner connection data' });
    }
  });

  app.get('/api/users/:id/partner', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partner = await storage.getPartner(id);
      if (!partner) {
        return res.status(404).json({ error: 'Partner not found' });
      }
      res.json(partner);
    } catch (error) {
      res.status(400).json({ error: 'Invalid user ID' });
    }
  });

  // Check for expired moods and send reminders every minute
  setInterval(async () => {
    try {
      // Check for expired moods
      const expiredUsers = await storage.checkExpiredMoods();
      for (const user of expiredUsers) {
        await notifyPartner(user.id, {
          type: 'partner_mood_update',
          mood: 'neutral',
          lastUpdate: user.lastMoodUpdate,
          expiresAt: null
        });
      }

      // Check for open mood reminders (every 30 minutes for users with no time limit)
      const now = new Date();
      const reminderInterval = 30 * 60 * 1000; // 30 minutes

      const allUsers = await storage.getAllUsers();
      
      allUsers.forEach((user) => {
        if (user.currentMood === 'open' && !user.moodExpiresAt) {
          const lastReminder = user.lastReminderSent?.getTime() || 0;
          const timeSinceLastReminder = now.getTime() - lastReminder;
          
          if (timeSinceLastReminder >= reminderInterval) {
            // Send reminder to user
            wss.clients.forEach((client: AuthenticatedWebSocket) => {
              if (client.userId === user.id && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'mood_reminder',
                  message: 'You\'ve been in Open mode for a while. Are you still available?'
                }));
              }
            });
            
            storage.updateLastReminderSent(user.id);
          }
        }
      });
    } catch (error) {
      console.error('Error in mood check interval:', error);
    }
  }, 60000); // Run every minute

  return httpServer;
}
