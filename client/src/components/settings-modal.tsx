import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X } from "lucide-react";
import type { User } from "@shared/schema";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export function SettingsModal({ isOpen, onClose, user }: SettingsModalProps) {
  const [notifications] = useState(false); // Disabled by design
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateIconStyleMutation = useMutation({
    mutationFn: async (iconStyle: "basic" | "playful" | "explicit") => {
      const res = await apiRequest("PATCH", `/api/users/${user.id}/icon-style`, { iconStyle });
      return res.json();
    },
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData([`/api/users/${user.id}`], updatedUser);
      toast({
        title: "Icon Style Updated",
        description: "Icon style has been updated for both you and your partner.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update icon style. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleDisconnect = () => {
    localStorage.removeItem('ignite-user');
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-ignite-surface border-ignite-surface-light max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-ignite-text flex items-center justify-between">
            Settings
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-ignite-surface-light flex items-center justify-center p-0"
            >
              <X className="text-ignite-text-muted text-sm" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ignite-text">Notifications</p>
              <p className="text-sm text-ignite-text-muted">Currently disabled by design</p>
            </div>
            <Switch
              checked={notifications}
              disabled={true}
              className="data-[state=unchecked]:bg-ignite-closed"
            />
          </div>
          
          {/* Privacy */}
          <div className="space-y-2">
            <p className="font-medium text-ignite-text">Privacy</p>
            <p className="text-sm text-ignite-text-muted">
              No mood history is stored. Real-time communication only.
            </p>
          </div>
          
          {/* User Info */}
          <div className="space-y-2">
            <p className="font-medium text-ignite-text">Your Code</p>
            <div className="font-mono bg-ignite-surface-light px-3 py-2 rounded text-ignite-text text-sm">
              {user?.partnerCode}
            </div>
          </div>
          
          {/* Disconnect */}
          <Button
            onClick={handleDisconnect}
            className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 py-3 rounded-xl font-medium"
          >
            Reset App
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
