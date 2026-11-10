
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
  onAvatarUpdated: () => void;
}

export function ProfileAvatar({
  userId,
  avatarUrl,
  fullName,
  onAvatarUpdated
}: ProfileAvatarProps) {
  const [uploading, setUploading] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  // Validate and read file
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    
    // Allowed image MIME types and extensions
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    
    if (!allowedTypes.includes(file.type) || !fileExt || !["png", "jpg", "jpeg", "webp"].includes(fileExt)) {
      toast({
        variant: "destructive",
        title: "Invalid file format",
        description: "Please select a PNG, JPG, JPEG, or WebP image file.",
      });
      event.target.value = ""; // clear input
      return;
    }

    // Read file as data URL to pass to cropper
    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
    event.target.value = ""; // clear input so user can select same file again if needed
  }

  // Upload cropped image to storage
  async function handleCropComplete(croppedFile: File) {
    try {
      setUploading(true);
      if (!userId) throw new Error("No user");

      const fileName = `${userId}-${Math.random()}.jpg`; // Canvas outputs jpeg format

      // Upload file to storage
      const {
        error: uploadError
      } = await supabase.storage.from("avatars").upload(fileName, croppedFile);
      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Update profile with new avatar URL
      const {
        error: updateError
      } = await supabase.from("profiles").update({
        avatar_url: publicUrl
      }).eq("id", userId);
      if (updateError) throw updateError;
      
      toast({
        title: "Avatar updated",
        description: "Your avatar has been updated successfully."
      });
      onAvatarUpdated();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error uploading avatar",
        description: error instanceof Error ? error.message : "An error occurred"
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="group relative w-full mx-auto px-4">
      <div className="absolute inset-0 bg-slate-200 rounded-lg transition-all duration-300 ease-in-out origin-left scale-x-0 group-hover:scale-x-100" />
      <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-6 p-6 py-[24px] px-[24px] relative">
        <div className="relative">
          <Avatar className="h-32 w-32 border-4 border-white shadow-md rounded-lg">
            <AvatarImage src={avatarUrl || undefined} className="rounded-lg object-cover" />
            <AvatarFallback className="text-2xl rounded-lg">
              {fullName?.split(" ").map(n => n[0]).join("") || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" disabled={uploading} className="bg-black/50 backdrop-blur-sm">
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
              <Camera className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200">
            {fullName || "Your Profile"}
          </h3>
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
