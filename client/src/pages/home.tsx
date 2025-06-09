import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { WelcomeScreen } from "@/components/welcome-screen";
import { MoodSelector } from "@/components/mood-selector";
import { PartnerMood } from "@/components/partner-mood";
import { SettingsModal } from "@/components/settings-modal";
import { useWebSocket } from "@/hooks/use-websocket";
import { Flame, Settings, Shield } from "lucide-react";
import type { User } from "@shared/schema";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<"myMood" | "partnerMood">("myMood");
  const [showSettings, setShowSettings] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('ignite-user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('ignite-user');
      }
    }
  }, []);

  // Save user to localStorage when currentUser changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ignite-user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Fetch current user data
  const { data: user } = useQuery({
    queryKey: [`/api/users/${currentUser?.id}`],
    enabled: !!currentUser?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update currentUser when data changes
  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  // WebSocket connection for real-time updates
  const { partner, isConnected } = useWebSocket(currentUser?.id || null);

  const handleUserCreated = (user: User) => {
    setCurrentUser(user);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col max-w-md mx-auto bg-ignite-bg">
        <WelcomeScreen onUserCreated={handleUserCreated} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-ignite-bg">
      {/* Header Navigation */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-ignite-surface-light/30">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-ignite-open to-ignite-neutral rounded-full flex items-center justify-center">
            <Flame className="text-white text-sm" />
          </div>
          <h1 className="text-lg font-semibold text-ignite-text">Ignite</h1>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 rounded-full bg-ignite-surface hover:bg-ignite-surface-light p-0"
        >
          <Settings className="text-ignite-text-muted text-sm" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex bg-ignite-surface rounded-2xl p-1 mb-8">
          <Button
            variant="ghost"
            onClick={() => setCurrentView("myMood")}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              currentView === "myMood"
                ? "bg-ignite-open text-white"
                : "text-ignite-text-muted hover:text-ignite-text"
            }`}
          >
            My Mood
          </Button>
          <Button
            variant="ghost"
            onClick={() => setCurrentView("partnerMood")}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              currentView === "partnerMood"
                ? "bg-ignite-open text-white"
                : "text-ignite-text-muted hover:text-ignite-text"
            }`}
          >
            {partner ? `${partner.username}'s Mood` : "Partner's Mood"}
          </Button>
        </div>

        {/* Content based on current view */}
        {currentView === "myMood" ? (
          <MoodSelector user={currentUser} />
        ) : (
          <PartnerMood partner={partner} isConnected={isConnected} />
        )}
      </main>

      {/* Footer with Consent Reminder */}
      <footer className="px-6 py-4 border-t border-ignite-surface-light/30">
        <div className="flex items-center justify-center space-x-2 text-xs text-ignite-text-dim">
          <Shield className="text-ignite-open h-3 w-3" />
          <span>"Open mode indicates sincere readiness"</span>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        user={currentUser}
      />
    </div>
  );
}
