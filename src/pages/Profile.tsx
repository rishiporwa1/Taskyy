import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { PasswordChangeDialog } from "@/components/profile/PasswordChangeDialog";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfileCover } from "@/components/profile/ProfileCover";
import { useUser } from "@clerk/clerk-react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  resume_url: string | null;
  progress_score: number | null;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setDeleting(true);
      const userId = user.id;

      // 1. Delete monthly tasks (goals sub-items)
      const { error: monthlyErr } = await supabase
        .from("monthly_tasks")
        .delete()
        .eq("user_id", userId);
      if (monthlyErr) throw monthlyErr;

      // 2. Delete yearly goals
      const { error: goalsErr } = await supabase
        .from("yearly_goals")
        .delete()
        .eq("user_id", userId);
      if (goalsErr) throw goalsErr;

      // 3. Delete daily tasks
      const { error: dailyErr } = await supabase
        .from("daily_tasks")
        .delete()
        .eq("user_id", userId);
      if (dailyErr) throw dailyErr;

      // 4. Delete schedule items
      const { error: scheduleErr } = await supabase
        .from("schedule_items")
        .delete()
        .eq("user_id", userId);
      if (scheduleErr) throw scheduleErr;

      // 5. Delete profile record
      const { error: profileErr } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);
      if (profileErr) throw profileErr;

      // 6. Delete Clerk Auth Account
      if (clerkUser) {
        await clerkUser.delete();
        toast({
          title: "Account deleted",
          description: "Your account and data have been permanently deleted.",
        });
        setIsDeleteDialogOpen(false);
        await signOut();
      }
    } catch (error: any) {
      const errorMsg = error?.message || error?.longMessage || "";
      const isRecentLoginError = 
        error?.errors?.[0]?.code === "user_reauthentication_required" || 
        errorMsg.toLowerCase().includes("reauthenticate") ||
        errorMsg.toLowerCase().includes("recent login") ||
        errorMsg.toLowerCase().includes("fresh login") ||
        errorMsg.toLowerCase().includes("requires-recent-login");

      toast({
        variant: "destructive",
        title: isRecentLoginError ? "Fresh Login Required" : "Error deleting account",
        description: isRecentLoginError 
          ? "For security reasons, you must freshly sign in before deleting your account. Please log out and sign back in, then try again." 
          : error instanceof Error ? error.message : "An error occurred",
      });
      console.error("Account deletion error:", error);
    } finally {
      setDeleting(false);
    }
  };

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
            <p className="text-sm italic text-indigo-600/80 dark:text-indigo-400/80 border-l-2 border-indigo-400 pl-3 py-0.5 mt-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              "Invest in yourself. You are your greatest asset."
            </p>
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

        {/* Danger Zone Card */}
        <Card className="border border-red-200/60 bg-red-50/10 dark:bg-red-950/5 mt-6 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 border-b border-red-100/60 dark:border-red-950/20">
            <CardTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="bg-amber-50/80 border border-amber-200/60 rounded-lg p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400">
              <span className="font-semibold">Security Note:</span> To delete your account, you must have logged in recently. If your login session is not fresh, Clerk requires you to log out and freshly log back in before executing this action.
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Delete Account</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanently delete your profile and all associated tasks, goals, and schedule data. This action cannot be undone.
                </p>
              </div>
              <Button 
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={deleting}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-500 font-normal shrink-0"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Custom Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden p-0">
            <div className="bg-gray-500 px-6 py-4 text-white">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-white" />
                  Confirm Account Deletion
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-100">
                  This action is permanent and cannot be undone.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Are you absolutely sure you want to delete your account? This will permanently delete your profile, goals, tasks, and schedule data from the database.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
                <span className="font-semibold flex items-center gap-1">
                  ⚠️ Security Requirement
                </span>
                <p>
                  To delete your account, you must have logged in recently. If your login session is old, please log out and freshly log back in first.
                </p>
              </div>
            </div>
            <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="w-full sm:w-auto border-slate-200 hover:bg-slate-100 text-slate-700 font-normal"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full sm:w-auto bg-gray-500 hover:bg-gray-400 font-normal text-white border-none"
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
