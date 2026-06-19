
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface PasswordChangeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PasswordChangeDialog({ isOpen, onOpenChange }: PasswordChangeDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  async function changePassword() {
    try {
      setChangingPassword(true);
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords don't match");
      }

      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error changing password",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setChangingPassword(false);
    }
  }

  const handleCancel = () => {
    onOpenChange(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-white"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto bg-white hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={changePassword}
            disabled={changingPassword || !newPassword || !confirmPassword}
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-400 text-white font-normal"
          >
            {changingPassword ? "Changing Password..." : "Change Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
