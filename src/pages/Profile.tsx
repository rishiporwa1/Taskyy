
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { PasswordChangeDialog } from "@/components/profile/PasswordChangeDialog";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfileCover } from "@/components/profile/ProfileCover";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null; // Add cover_url to interface
  resume_url: string | null;
  progress_score: number | null;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  useEffect(() => {
    getProfile();
  }, [user]);

  async function getProfile() {
    try {
      if (!user) throw new Error("No user");

      let { data, error } = await supabase
        .from("profiles")
        .select()
        .eq("id", user.id)
        .single();

      if (error && error.code === "PGRST116") {
        // Self-healing: if profile doesn't exist, create it!
        const { data: insertedData, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || "New User",
          })
          .select()
          .single();

        if (insertError) throw insertError;
        data = insertedData;
        error = null;
      } else if (error) {
        throw error;
      }
      
      // Ensure we have a cover_url property (even if it doesn't exist in the DB yet)
      const profileData: Profile = {
        ...data,
        cover_url: data.cover_url || null
      };
      
      setProfile(profileData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading profile",
        description: error && typeof error === "object" && "message" in error 
          ? (error as any).message 
          : error instanceof Error 
            ? error.message 
            : "An error occurred",
      });
      console.error("Profile loading error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!profile || !user) {
    return <div className="flex justify-center p-8">Profile not found</div>;
  }

  return (
    <div className="space-y-8 py-4">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/80 shadow-md overflow-hidden">
          <ProfileCover 
            userId={user.id} 
            coverUrl={profile.cover_url} 
            onCoverUpdated={getProfile}
          />
          
          <div className="relative px-6 -mt-12 mb-6">
            <ProfileAvatar 
              userId={user.id}
              avatarUrl={profile.avatar_url}
              fullName={profile.full_name}
              onAvatarUpdated={getProfile}
            />
          </div>

          <CardHeader className="pb-2">
            <CardTitle className="text-xl sm:text-2xl text-slate-950 font-bold">Profile</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <ProfileForm
              userId={user.id}
              email={user.email}
              fullName={profile.full_name || ""}
              progressScore={profile.progress_score}
              resumeUrl={profile.resume_url}
              onProfileUpdated={getProfile}
              onSignOut={signOut}
              onPasswordDialogOpen={() => setIsPasswordDialogOpen(true)}
            />

            <PasswordChangeDialog
              isOpen={isPasswordDialogOpen}
              onOpenChange={setIsPasswordDialogOpen}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
