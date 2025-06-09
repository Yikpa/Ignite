import { useEffect, useRef, useState } from "react";
import type { User } from "@shared/schema";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(userId: number | null) {
  const [partner, setPartner] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: 'authenticate',
        userId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'authenticated':
            if (message.partner) {
              setPartner(message.partner);
            }
            break;
          case 'partner_mood_update':
            setPartner(prev => prev ? {
              ...prev,
              currentMood: message.mood,
              lastMoodUpdate: new Date(message.lastUpdate),
              moodExpiresAt: message.expiresAt ? new Date(message.expiresAt) : null
            } : null);
            break;
          case 'partner_connected':
            setPartner(message.partner);
            break;
          case 'partner_offline':
            setPartner(prev => prev ? { ...prev, isOnline: false } : null);
            break;
          case 'icon_style_update':
            setPartner(prev => prev ? { ...prev, iconStyle: message.iconStyle } : null);
            break;
          case 'mood_reminder':
            // Handle mood reminder - could show a toast or modal
            if (window.confirm(message.message + '\n\nWould you like to stay in Open mode?')) {
              // User confirmed, do nothing
            } else {
              // User wants to change mood, could auto-set to neutral
              window.location.reload(); // Simple approach for now
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [userId]);

  return { partner, isConnected };
}
