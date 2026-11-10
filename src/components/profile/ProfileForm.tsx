
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Key, LogOut } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ResumeSection } from "@/components/profile/ResumeSection";

interface ProfileFormProps {
  userId: string;
  email: string | undefined;
  fullName: string;
  progressScore: number | null;
  resumeUrl: string | null;
  onProfileUpdated: () => void;
  onSignOut: () => Promise<void>;
  onPasswordDialogOpen: () => void;
}

export function ProfileForm({
  userId,
  email,
  fullName,
  progressScore,
  resumeUrl,
  onProfileUpdated,
  onSignOut,
  onPasswordDialogOpen,
}: ProfileFormProps) {
  const [formFullName, setFormFullName] = useState(fullName);

  async function updateProfile() {
    try {
      if (!userId) throw new Error("No user");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formFullName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      onProfileUpdated();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="text"
          value={email}
          disabled
          className="bg-white/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          value={formFullName}
          onChange={(e) => setFormFullName(e.target.value)}
          className="bg-white"
        />
      </div>

      <div className="space-y-2">
        <Label>Progress Score</Label>
        <Progress value={progressScore || 0} className="h-2" />
        <p className="text-sm text-gray-500 mt-1">
          Current progress: {progressScore || 0}%
        </p>
      </div>

      <div className="space-y-2">
        <Label>Resume</Label>
        <ResumeSection
          userId={userId}
          resumeUrl={resumeUrl}
          onResumeUpdated={onProfileUpdated}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            size="sm"
            onClick={updateProfile}
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-400 text-white font-normal"
          >
            Update Profile
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onPasswordDialogOpen}
            className="w-full sm:w-auto bg-white hover:bg-slate-50 font-normal"
          >
            <Key className="w-4 h-4 mr-2" />
            Change Password
          </Button>
        </div>
        <Button 
          size="sm"
          variant="destructive" 
          onClick={onSignOut}
          className="w-full sm:w-auto mt-2 sm:mt-0"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
