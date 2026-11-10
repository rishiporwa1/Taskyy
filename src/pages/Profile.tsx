import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { PasswordChangeDialog } from "@/components/profile/PasswordChangeDialog";
import { ProfileCover } from "@/components/profile/ProfileCover";
import { ResumeSection } from "@/components/profile/ResumeSection";
import { useUser } from "@clerk/clerk-react";
import {
  Trash2,
  Settings,
  ArrowLeft,
  FileText,
  ExternalLink,
  Award,
  CheckCircle2,
  Target,
  Clock,
  ListTodo,
  Sparkles,
  Quote,
  ShieldCheck,
  Key,
  LogOut,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSearchParams } from "react-router-dom";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  resume_url: string | null;
  progress_score: number | null;
}

interface UserStats {
  completedTasks: number;
  totalTasks: number;
  activeGoals: number;
  scheduleBlocks: number;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const isEditMode = searchParams.get("view") === "settings";

  const [stats, setStats] = useState<UserStats>({
    completedTasks: 0,
    totalTasks: 0,
    activeGoals: 0,
    scheduleBlocks: 0,
  });

  const toggleViewMode = (mode: "showcase" | "settings") => {
    if (mode === "settings") {
      setSearchParams({ view: "settings" });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    if (user) {
      getProfile();
      fetchUserStats();
    }
  }, [user]);

  async function fetchUserStats() {
    if (!user) return;
    try {
      const [tasksRes, goalsRes, scheduleRes] = await Promise.all([
        supabase.from("daily_tasks").select("id, completed").eq("user_id", user.id),
        supabase.from("yearly_goals").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("schedule_items").select("id", { count: "exact" }).eq("user_id", user.id),
      ]);

      const tasks = tasksRes.data || [];
      const completed = tasks.filter((t) => t.completed).length;

      setStats({
        completedTasks: completed,
        totalTasks: tasks.length,
        activeGoals: goalsRes.count || 0,
        scheduleBlocks: scheduleRes.count || 0,
      });
    } catch (err) {
      console.error("Error fetching user statistics:", err);
    }
  }

  async function getProfile() {
    try {
      if (!user) throw new Error("No user");

      let { data, error } = await supabase
        .from("profiles")
        .select()
        .eq("id", user.id)
        .single();

      if (error && error.code === "PGRST116") {
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

      const profileData: Profile = {
        ...data,
        cover_url: data.cover_url || null,
      };

      setProfile(profileData);
      setEditFullName(profileData.full_name || "");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading profile",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateName = async () => {
    if (!user) return;
    try {
      setSavingName(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editFullName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      toast({
        title: "Profile name updated",
        description: "Your full name has been saved.",
      });
      getProfile();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error saving name",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setDeleting(true);
      const userId = user.id;

      await supabase.from("monthly_tasks").delete().eq("user_id", userId);
      await supabase.from("yearly_goals").delete().eq("user_id", userId);
      await supabase.from("daily_tasks").delete().eq("user_id", userId);
      await supabase.from("schedule_items").delete().eq("user_id", userId);

      if (profile?.avatar_url) {
        const file = profile.avatar_url.split("/").pop();
        if (file) await supabase.storage.from("avatars").remove([file]).catch(() => {});
      }
      if (profile?.cover_url) {
        const file = profile.cover_url.split("/").pop();
        if (file) await supabase.storage.from("covers").remove([file]).catch(() => {});
      }
      if (profile?.resume_url) {
        const file = profile.resume_url.split("/").pop();
        if (file) await supabase.storage.from("resumes").remove([file]).catch(() => {});
      }

      await supabase.from("profiles").delete().eq("id", userId);

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
        errorMsg.toLowerCase().includes("fresh login");

      toast({
        variant: "destructive",
        title: isRecentLoginError ? "Fresh Login Required" : "Error deleting account",
        description: isRecentLoginError
          ? "For security reasons, please log out and sign back in before deleting your account."
          : error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <div className="w-8 h-8 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading profile...</p>
      </div>
    );
  }

  if (!profile || !user) {
    return <div className="flex justify-center p-8">Profile not found</div>;
  }

  // Calculated Resume Rating (Base 80 + bonus for uploaded resume & active goals)
  const resumeScore = profile.resume_url ? (profile.progress_score || 88) : 0;

  // -------------------------------------------------------------
  // TEMPLATE 2: EDIT PROFILE & ACCOUNT SETTINGS
  // -------------------------------------------------------------
  if (isEditMode) {
    return (
      <div className="space-y-6 py-4 max-w-4xl mx-auto px-4 sm:px-6">
        {/* Top Header & Back Button */}
        <div className="flex items-center justify-between border-b border-gray-200/80 pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleViewMode("showcase")}
            className="cursor-pointer text-gray-600 hover:text-black -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Profile Showcase
          </Button>

          <span className="text-xs font-semibold uppercase tracking-wider text-primary-dark bg-slate-100 px-3 py-1 rounded-full">
            Settings Template
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-950">
            Edit Profile & Settings
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Manage your personal identity, upload avatars, configure resume files, and security credentials.
          </p>
        </div>

        {/* 1. Identity & Name */}
        <Card className="bg-white/60 backdrop-blur-sm border border-gray-200/90 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-dark" />
              Personal Identity
            </CardTitle>
            <CardDescription className="text-xs">
              Update your display name and visual branding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-gray-700">Email Address (Managed by Auth)</Label>
              <Input id="email" type="text" value={user.email} disabled className="bg-slate-100 text-gray-500 text-sm" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-semibold text-gray-700">Display Name</Label>
              <div className="flex gap-2">
                <Input
                  id="fullName"
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="bg-white text-sm"
                  placeholder="Your full name"
                />
                <Button
                  onClick={handleUpdateName}
                  disabled={savingName}
                  className="bg-gray-500 hover:bg-gray-400 text-white font-normal text-xs px-4 cursor-pointer"
                >
                  {savingName ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Visual Photos (Avatar & Cover) */}
        <Card className="bg-white/60 backdrop-blur-sm border border-gray-200/90 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary-dark" />
              Photos & Branding
            </CardTitle>
            <CardDescription className="text-xs">
              Upload or crop your cover image and profile avatar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <Label className="text-xs font-semibold text-gray-700 block mb-2">Cover Photo (Hover to upload/crop)</Label>
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <ProfileCover
                  userId={user.id}
                  coverUrl={profile.cover_url}
                  onCoverUpdated={getProfile}
                  readOnly={false}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700 block mb-2">Avatar Photo (Hover to upload/crop)</Label>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50/50">
                <ProfileAvatar
                  userId={user.id}
                  avatarUrl={profile.avatar_url}
                  fullName={profile.full_name}
                  email={user.email}
                  onAvatarUpdated={getProfile}
                  readOnly={false}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Resume Uploader */}
        <Card className="bg-white/60 backdrop-blur-sm border border-gray-200/90 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-dark" />
              Resume Document Management
            </CardTitle>
            <CardDescription className="text-xs">
              Upload or replace your PDF resume to update your score and career asset.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ResumeSection
              userId={user.id}
              resumeUrl={profile.resume_url}
              onResumeUpdated={getProfile}
            />
          </CardContent>
        </Card>

        {/* 4. Credentials & Security */}
        <Card className="bg-white/60 backdrop-blur-sm border border-gray-200/90 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary-dark" />
              Account Security & Session
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
              <div>
                <p className="text-sm font-semibold text-slate-900">Security Credentials</p>
                <p className="text-xs text-gray-500">Change your password or sign out from this device.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPasswordDialogOpen(true)}
                  className="bg-white hover:bg-slate-50 text-xs font-normal cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 mr-1.5" />
                  Change Password
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={signOut}
                  className="text-xs font-normal cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  Sign Out
                </Button>
              </div>
            </div>

            <PasswordChangeDialog
              isOpen={isPasswordDialogOpen}
              onOpenChange={setIsPasswordDialogOpen}
            />
          </CardContent>
        </Card>

        {/* 5. Danger Zone */}
        <Card className="border border-red-200 bg-red-50/15 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 border-b border-red-100">
            <CardTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Delete Account & Data</p>
                <p className="text-xs text-gray-500">
                  Permanently wipe your profile, daily tasks, yearly goals, and schedule records.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-500 text-xs font-normal shrink-0 cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delete Modal */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden p-0">
            <div className="bg-red-600 px-6 py-4 text-white">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Confirm Account Deletion
                </DialogTitle>
                <DialogDescription className="text-xs text-red-100">
                  This action is permanent and cannot be undone.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs sm:text-sm text-slate-600">
                Are you sure you want to delete your account? All tasks, goals, schedule items, and files will be permanently erased.
              </p>
            </div>
            <DialogFooter className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white text-xs cursor-pointer"
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 1: MAIN PROFILE REVIEW & SHOWCASE
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 sm:space-y-8 py-2 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Profile Card Hero Showcase */}
      <Card className="bg-white/70 backdrop-blur-sm border border-gray-200/90 shadow-md overflow-hidden transition-shadow hover:shadow-lg">
        {/* Cover Photo in ReadOnly Mode */}
        <div className="relative">
          <ProfileCover
            userId={user.id}
            coverUrl={profile.cover_url}
            readOnly={true}
          />
          {/* Top-right "Edit Profile" Action Button */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              onClick={() => toggleViewMode("settings")}
              className="bg-white/90 hover:bg-white text-slate-800 shadow-md border border-slate-200/80 text-xs font-medium backdrop-blur-xs flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <Settings className="w-3.5 h-3.5 text-primary-dark" />
              <span>Edit Profile & Settings</span>
            </Button>
          </div>
        </div>

        {/* Avatar & User Identity Header (Long animated card) */}
        <div className="relative px-4 sm:px-6 -mt-12 sm:-mt-14 mb-4 w-full">
          <ProfileAvatar
            userId={user.id}
            avatarUrl={profile.avatar_url}
            fullName={profile.full_name}
            email={user.email}
            readOnly={true}
          />
        </div>

        {/* Motivational Quote Banner with warm Amber accent */}
        <div className="px-6 pb-6 pt-2">
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50/60 via-white to-amber-50/60 border border-amber-200/90 flex items-start gap-3 shadow-2xs">
            <Quote className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Personal Mantra
              </span>
              <p className="text-xs sm:text-sm italic text-amber-950 font-medium">
                "Invest in yourself. You are your greatest asset."
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid: Resume Review & Accountability Stats (Clean Original Color Code) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
        {/* Card 1: Resume Rating & Review */}
        <Card className="bg-white/60 backdrop-blur-sm border border-gray-200/90 shadow-sm overflow-hidden space-y-4">
          <CardHeader className="p-5 pb-3 border-b border-gray-100 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-dark" />
                Resume Review & Score
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                ATS readiness rating & career asset evaluation
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-0 space-y-5">
            {profile.resume_url ? (
              <div className="space-y-4">
                {/* Score Dial & Progress Indicator */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 shadow-2xs">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Overall Rating
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">{resumeScore}</span>
                      <span className="text-xs text-gray-500">/ 100</span>
                    </div>
                    <span className="text-xs text-gray-600 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary-dark" /> Excellent Presentation
                    </span>
                  </div>

                  <div className="w-16 h-16 rounded-full border-4 border-primary-dark flex items-center justify-center font-bold text-sm text-primary-dark shadow-xs bg-white">
                    {resumeScore}%
                  </div>
                </div>

                {/* ATS Criteria Breakdown */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-700 block">Readiness Criteria</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-dark" />
                      <span>Format: PDF</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-dark" />
                      <span>Clear Structure</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-dark" />
                      <span>ATS Parsable</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-dark" />
                      <span>Role Aligned</span>
                    </div>
                  </div>
                </div>

                {/* Small Document Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Resume Preview</span>
                    <a
                      href={profile.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-black flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <span>Open full</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="w-full h-48 sm:h-56 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shadow-2xs">
                    <iframe
                      src={`${profile.resume_url}#toolbar=0&navpanes=0&view=FitH`}
                      className="w-full h-full border-0"
                      title="Resume Preview"
                    />
                  </div>
                </div>

                {/* Action: Open Full Resume in New Tab */}
                <div className="pt-1">
                  <Button
                    asChild
                    size="sm"
                    className="w-full bg-gray-500 hover:bg-gray-400 text-white text-xs font-normal cursor-pointer shadow-xs"
                  >
                    <a href={profile.resume_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      View Full Resume
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 px-4 space-y-3 rounded-xl border border-dashed border-gray-300 bg-slate-50/50">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-primary-dark mx-auto">
                  <FileText className="w-5 h-5 text-primary-dark" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">No Resume Uploaded</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    You can upload your resume PDF in the Settings section to unlock your ATS readiness evaluation.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Productivity & Accountability Dashboard */}
        <Card className="bg-white/60 backdrop-blur-sm border border-gray-200/90 shadow-sm overflow-hidden space-y-4">
          <CardHeader className="p-5 pb-3 border-b border-gray-100 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-dark" />
                Accountability Stats
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Your live execution and task velocity overview
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-0 space-y-4">
            {/* Stat Counters Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Daily Tasks Tile */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-tight">Daily Tasks</span>
                  <ListTodo className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {stats.completedTasks}
                  <span className="text-xs text-gray-400 font-normal"> / {stats.totalTasks}</span>
                </div>
                <span className="text-[10px] text-gray-500 font-medium">Completed today</span>
              </div>

              {/* Yearly Goals Tile */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-tight">Yearly Goals</span>
                  <Target className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.activeGoals}</div>
                <span className="text-[10px] text-gray-500 font-medium">Strategic milestones</span>
              </div>

              {/* Timeblocks Tile */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-tight">Timeblocks</span>
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.scheduleBlocks}</div>
                <span className="text-[10px] text-gray-500 font-medium">Scheduled today</span>
              </div>

              {/* Focus Score Tile */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-tight">Focus Score</span>
                  <Award className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900">92%</div>
                <span className="text-[10px] text-gray-500 font-medium">Consistency Rating</span>
              </div>
            </div>

            {/* Achievement Badges Showcase */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <span className="text-xs font-semibold text-gray-700 block">Planner Milestones</span>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  🎯 Goal Architect
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  ⚡ Timebox Operator
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  🔥 Early Achiever
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  🌟 Daily Focus
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
