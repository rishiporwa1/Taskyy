import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ImageCropperModal } from "./ImageCropperModal";

interface ProfileAvatarProps {
  userId: string;
  avatarUrl: string | null;
  fullName: string | null;
  email?: string | null;
  badge?: React.ReactNode;
  onAvatarUpdated?: () => void;
  readOnly?: boolean;
}

export function ProfileAvatar({
  userId,
  avatarUrl,
  fullName,
  email,
  badge,
  onAvatarUpdated,
  readOnly = false,
}: ProfileAvatarProps) {
  const [uploading, setUploading] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  // Validate and read file
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) || !fileExt || !["png", "jpg", "jpeg", "webp"].includes(fileExt)) {
      toast({
        variant: "destructive",
        title: "Invalid file format",
        description: "Please select a PNG, JPG, JPEG, or WebP image file.",
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  // Upload cropped image to storage
  async function handleCropComplete(croppedFile: File) {
    try {
      setUploading(true);
      if (!userId) throw new Error("No user");

      const fileName = `${userId}-${Math.random()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, croppedFile);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
        })
        .eq("id", userId);
      if (updateError) throw updateError;

      toast({
        title: "Avatar updated",
        description: "Your avatar has been updated successfully.",
      });
      if (onAvatarUpdated) onAvatarUpdated();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error uploading avatar",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="group relative w-full overflow-hidden rounded-2xl bg-white shadow-md border border-slate-200/90 transition-all">
      {/* Long smooth expanding hover animation spanning across the whole card */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200/50 to-slate-100 transition-all duration-500 ease-in-out origin-left scale-x-0 group-hover:scale-x-100 pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-4 sm:gap-6 p-4 sm:p-5 relative z-10 w-full">
        {/* Avatar Photo */}
        <div className="relative shrink-0">
          <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-white shadow-md rounded-2xl">
            <AvatarImage src={avatarUrl || undefined} className="rounded-2xl object-cover" />
            <AvatarFallback className="text-2xl font-bold bg-slate-100 text-slate-800 rounded-2xl">
              {fullName?.split(" ").map((n) => n[0]).join("") || "?"}
            </AvatarFallback>
          </Avatar>

          {!readOnly && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-2xl">
              <Button size="icon" disabled={uploading} className="bg-black/60 backdrop-blur-sm cursor-pointer hover:bg-black/80">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Camera className="w-5 h-5 text-white" />
              </Button>
            </div>
          )}
        </div>

        {/* Name on the side of photo, with email just below */}
        <div className="flex flex-col justify-center gap-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {fullName || "Your Profile"}
            </h3>
            {badge}
          </div>
          {email && (
            <p className="text-xs sm:text-sm text-gray-500 font-normal">
              {email}
            </p>
          )}
        </div>
      </div>

      {cropperImage && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          onOpenChange={setIsCropperOpen}
          imageSrc={cropperImage}
          aspectRatio={1}
          cropShape="rect"
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
