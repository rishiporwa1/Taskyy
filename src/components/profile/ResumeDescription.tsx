import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, PencilLine, Trash2, FileText, Save, ExternalLink, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface ResumeDescriptionProps {
  userId: string;
  resumeUrl: string | null;
  onResumeUpdated: () => void;
}

export function ResumeDescription({ userId, resumeUrl, onResumeUpdated }: ResumeDescriptionProps) {
  const [uploading, setUploading] = useState(false);
  const [deleteResumeLoading, setDeleteResumeLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(
    "Your resume helps showcase your skills and experience. Upload a PDF resume to share your professional background."
  );

  // Validate file is PDF or Word document
  function isValidFileType(file: File): boolean {
    const allowedExtensions = ["pdf", "doc", "docx"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    return fileExt ? allowedExtensions.includes(fileExt) : false;
  }

  const openResumeInNewWindow = () => {
    if (resumeUrl) {
      window.open(resumeUrl, "_blank");
    }
  };

  async function uploadResume(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!userId) throw new Error("No user");
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select a file to upload.");
      }

      const file = event.target.files[0];
      
      // Enforce professional document formats only
      if (!isValidFileType(file)) {
        throw new Error("Unsupported format. Please upload a PDF, DOC, or DOCX document.");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(fileName);

      // Update profile with new resume URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ resume_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;
      
      toast({
        title: "Resume uploaded successfully",
        description: "Your professional resume has been updated.",
      });
      onResumeUpdated();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error uploading resume",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setUploading(false);
    }
  }

  async function deleteResume() {
    try {
      setDeleteResumeLoading(true);
      if (!userId || !resumeUrl) throw new Error("No user or resume");

      const fileName = resumeUrl.split("/").pop();
      if (!fileName) throw new Error("Invalid resume URL");

      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from("resumes")
        .remove([fileName]);

      if (deleteError) throw deleteError;

      // Update profile to remove resume URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ resume_url: null })
        .eq("id", userId);

      if (updateError) throw updateError;
      
      toast({
        title: "Resume removed",
        description: "Your resume has been deleted successfully.",
      });
      onResumeUpdated();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting resume",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setDeleteResumeLoading(false);
    }
  }

  function saveDescription() {
    toast({
      title: "Description updated",
      description: "Your resume description has been updated successfully.",
    });
    setIsEditing(false);
  }

  return (
    <div className="space-y-4">
      {/* Title & Edit Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-dark" />
          <h3 className="text-lg font-bold text-slate-950">Professional Resume</h3>
        </div>
        {!isEditing && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setIsEditing(true)} 
            className="text-slate-500 hover:text-primary-dark h-8 px-2"
          >
            <PencilLine className="w-4 h-4 mr-1" />
            Edit Info
          </Button>
        )}
      </div>

      {/* Description Section */}
      <div className="transition-all duration-300">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] text-sm focus-visible:ring-ring bg-white"
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="bg-white hover:bg-slate-50">
                Cancel
              </Button>
              <Button size="sm" onClick={saveDescription} className="bg-gray-500 hover:bg-gray-400 text-white font-normal">
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600 leading-relaxed bg-white/60 p-3 rounded-lg border border-slate-200/50">
            {description}
          </p>
        )}
      </div>

      {/* Resume Card Display */}
      {resumeUrl ? (
        <div className="animate-fade-in relative flex items-center justify-between p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 backdrop-blur-xs shadow-xs hover:shadow-md hover:border-emerald-200 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg shadow-inner">
              <FileText className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-800">Professional_Resume.pdf</p>
                <span className="flex items-center gap-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Uploaded
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">PDF / DOCX Document • Ready to share</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={openResumeInNewWindow}
              size="sm"
              variant="outline"
              className="h-8 border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              View
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="relative h-8 border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={uploadResume}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <PencilLine className="w-3.5 h-3.5 mr-1" />
              Replace
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={deleteResume}
              disabled={deleteResumeLoading}
              className="h-8 border-red-100 bg-white hover:bg-red-50 text-red-500 hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-white/30 backdrop-blur-xs hover:bg-white/50 hover:border-primary/50 transition-all duration-300 group/dropzone">
          <div className="p-3 bg-white shadow-xs rounded-full group-hover/dropzone:scale-110 group-hover/dropzone:text-primary text-slate-400 transition-transform duration-300">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-700 mt-3">Upload your resume</p>
          <p className="text-xs text-slate-400 mt-1">Supports PDF, DOC, or DOCX (max 5MB)</p>
          
          <Button 
            size="sm" 
            disabled={uploading} 
            className="relative mt-4 h-9 px-4 rounded-lg bg-gray-500 hover:bg-gray-400 text-white font-normal shadow-sm text-xs sm:text-sm"
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={uploadResume}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {uploading ? "Uploading..." : "Select File"}
          </Button>
        </div>
      )}
    </div>
  );
}
