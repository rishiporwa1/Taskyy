
import { useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Image } from "lucide-react"; // Changed from Upload to Image icon
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ImageCropperModal } from "./ImageCropperModal";

interface ProfileCoverProps {
  userId: string;
  coverUrl: string | null;
  onCoverUpdated: () => void;
}

export function ProfileCover({ userId, coverUrl, onCoverUpdated }: ProfileCoverProps) {
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

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
    event.target.value = ""; // clear input
  }

  async function handleCropComplete(croppedFile: File) {
    try {
      setUploading(true);
      if (!userId) throw new Error("No user");

      const fileName = `cover-${userId}-${Math.random()}.jpg`; // Canvas outputs jpeg format

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(fileName, croppedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("covers")
        .getPublicUrl(fileName);

      // Update profile with new cover URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;
      
      toast({
        title: "Cover image updated",
        description: "Your cover image has been updated successfully.",
      });
      onCoverUpdated();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error uploading cover image",
        description: error instanceof Error ? error.message : "An error occurred",
      });
      console.error("Cover upload error:", error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative w-full overflow-hidden rounded-t-lg group">
      <AspectRatio ratio={32 / 9} className={coverUrl ? "" : "bg-gradient-to-r from-primary-dark to-primary"}>
        {coverUrl && (
          <img 
            src={coverUrl} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/10" />
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            size="icon" 
            disabled={uploading}
            className="bg-black/50 backdrop-blur-sm"
          >
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Image className="w-5 h-5" />
          </Button>
        </div>
      </AspectRatio>

      {cropperImage && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          onOpenChange={setIsCropperOpen}
          imageSrc={cropperImage}
          aspectRatio={32 / 9}
          cropShape="rect"
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}

