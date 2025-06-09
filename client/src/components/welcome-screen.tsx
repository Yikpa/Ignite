import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Flame, Heart, Shield } from "lucide-react";
import type { User } from "@shared/schema";

interface WelcomeScreenProps {
  onUserCreated: (user: User) => void;
}

export function WelcomeScreen({ onUserCreated }: WelcomeScreenProps) {
  const [username, setUsername] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [step, setStep] = useState<"setup" | "connect">("setup");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  const createUserMutation = useMutation({
    mutationFn: async (userData: { username: string; partnerCode: string }) => {
      const res = await apiRequest("POST", "/api/users", userData);
      return res.json();
    },
    onSuccess: (user: User) => {
      setCurrentUser(user);
      setStep("connect");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive"
      });
    }
  });

  const connectPartnerMutation = useMutation({
    mutationFn: async (partnerCode: string) => {
      if (!currentUser) throw new Error("No user");
      const res = await apiRequest("POST", `/api/users/${currentUser.id}/connect-partner`, {
        partnerCode
      });
      return res.json();
    },
    onSuccess: (result) => {
      onUserCreated(result.user);
      toast({
        title: "Connected!",
        description: "Successfully connected with your partner.",
      });
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Invalid partner code or partner already connected.",
        variant: "destructive"
      });
    }
  });

  const handleCreateUser = () => {
    if (!username.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter a username.",
        variant: "destructive"
      });
      return;
    }

    const partnerCode = `IGN${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    createUserMutation.mutate({ username: username.trim(), partnerCode });
  };

  const handleConnectPartner = () => {
    if (!partnerCode.trim()) {
      toast({
        title: "Partner Code Required",
        description: "Please enter your partner's code.",
        variant: "destructive"
      });
      return;
    }

    connectPartnerMutation.mutate(partnerCode.trim());
  };

  const handleSkipConnection = () => {
    if (currentUser) {
      onUserCreated(currentUser);
    }
  };

  if (step === "setup") {
    return (
      <div className="flex-1 px-6 py-8 animate-fade-in">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-ignite-open to-ignite-neutral rounded-full flex items-center justify-center mb-8">
            <Heart className="text-white text-2xl" />
          </div>
          
          <h2 className="text-2xl font-semibold text-ignite-text">Welcome to Ignite</h2>
          <p className="text-ignite-text-muted leading-relaxed">
            A safe space for intimate communication between partners. Share your desires discreetly and build deeper trust together.
          </p>
          
          <Card className="bg-ignite-surface border-ignite-surface-light/30">
            <CardContent className="p-6 text-left space-y-4">
              <div className="flex items-start space-x-3">
                <Shield className="text-ignite-open text-lg mt-1" />
                <div>
                  <h3 className="font-medium text-ignite-text mb-2">Trust & Consent</h3>
                  <p className="text-sm text-ignite-text-muted leading-relaxed">
                    When you indicate "Open," you're expressing sincere availability. Remember, consent can be withdrawn at any moment, and gentle communication builds lasting intimacy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-4">
            <h3 className="font-medium text-ignite-text">Create Your Profile</h3>
            <Input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-ignite-surface border-ignite-surface-light text-ignite-text placeholder-ignite-text-dim"
            />
            
            <Button
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
              className="w-full bg-gradient-to-r from-ignite-open to-ignite-neutral hover:opacity-90 text-white py-4 rounded-2xl font-medium"
            >
              {createUserMutation.isPending ? "Creating..." : "Create Profile"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-8 animate-fade-in">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-ignite-open to-ignite-neutral rounded-full flex items-center justify-center mb-8">
          <Flame className="text-white text-2xl" />
        </div>
        
        <h2 className="text-2xl font-semibold text-ignite-text">Connect with Your Partner</h2>
        <p className="text-ignite-text-muted leading-relaxed">
          Share your code with your partner or enter their code to connect.
        </p>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-xs text-ignite-text-dim mb-2">Your code:</p>
            <div className="font-mono bg-ignite-surface px-4 py-2 rounded-xl text-ignite-text text-lg">
              {currentUser?.partnerCode}
            </div>
          </div>
          
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Enter partner's code"
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
              className="bg-ignite-surface border-ignite-surface-light text-ignite-text placeholder-ignite-text-dim"
            />
            <Button
              onClick={handleConnectPartner}
              disabled={connectPartnerMutation.isPending}
              className="w-full bg-ignite-open hover:bg-ignite-open/80 text-white py-3 rounded-xl font-medium"
            >
              {connectPartnerMutation.isPending ? "Connecting..." : "Connect"}
            </Button>
          </div>
          
          <Button
            variant="ghost"
            onClick={handleSkipConnection}
            className="w-full text-ignite-text-muted hover:text-ignite-text"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
