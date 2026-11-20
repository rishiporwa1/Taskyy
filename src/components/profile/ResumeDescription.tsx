import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, PencilLine, Trash2, FileText, ExternalLink, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { analyzeResume } from "@/lib/resumeAnalyzer";

interface ResumeDescriptionProps {
  userId: string;
  resumeUrl: string | null;
  onResumeUpdated: () => void;
}

export function ResumeDescription({ userId, resumeUrl, onResumeUpdated }: ResumeDescriptionProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleteResumeLoading, setDeleteResumeLoading] = useState(false);

  function isValidFileType(file: File): boolean {
    const allowedExtensions = ["pdf", "doc", "docx"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    return fileExt ? allowedExtensions.includes(fileExt) : false;
  }

  const openResumeInNewWindow = () => {
    if (resumeUrl) window.open(resumeUrl, "_blank");
  };

  async function uploadResume(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!userId) throw new Error("No user");
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select a file to upload.");
      }

      const file = event.target.files[0];
      if (!isValidFileType(file)) {
        throw new Error("Unsupported format. Please upload a PDF, DOC, or DOCX document.");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(fileName);

      // Save URL first so profile refreshes with the file
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ resume_url: publicUrl, progress_score: null })
        .eq("id", userId);
      if (updateError) throw updateError;

      toast({
        title: "Resume uploaded",
        description: "Analyzing your resume — this takes a few seconds…",
      });

      onResumeUpdated();

      // Run analysis only for PDF (pdfjs can't parse .doc/.docx binary)
      if (fileExt === "pdf") {
        setAnalyzing(true);
        try {
          const result = await analyzeResume(publicUrl);
          await supabase
            .from("profiles")
            .update({ progress_score: result.score })
            .eq("id", userId);
          toast({
            title: `Resume scored: ${result.score}/100`,
            description: `${result.criteria.filter((c) => c.passed).length}/${result.criteria.length} ATS criteria passed.`,
          });
        } catch (err) {
          console.error("Resume analysis failed:", err);
          // Fallback: set a placeholder so the UI doesn't stay in "analyzing" state
          await supabase
            .from("profiles")
            .update({ progress_score: 0 })
            .eq("id", userId);
          toast({
            variant: "destructive",
            title: "Analysis failed",
            description: "Could not parse resume. Try re-uploading a text-based PDF.",
          });
        } finally {
          setAnalyzing(false);
          onResumeUpdated();
        }
      } else {
        // .doc/.docx — can't parse in browser, give a neutral score
        await supabase
          .from("profiles")
          .update({ progress_score: 55 })
          .eq("id", userId);
        toast({
          title: "DOC/DOCX uploaded",
          description: "Convert to PDF for a full ATS analysis.",
        });
        onResumeUpdated();
      }
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

      const { error: deleteError } = await supabase.storage
        .from("resumes")
        .remove([fileName]);
      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ resume_url: null, progress_score: null })
        .eq("id", userId);
      if (updateError) throw updateError;

      toast({ title: "Resume removed", description: "Your resume has been deleted." });
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary-dark" />
        <h3 className="text-lg font-bold text-slate-950">Professional Resume</h3>
        {analyzing && (
          <span className="flex items-center gap-1 text-xs text-amber-600 font-medium ml-auto">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Analyzing…
          </span>
        )}
      </div>

      {resumeUrl ? (
        <div className="animate-fade-in relative flex items-center justify-between p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 backdrop-blur-xs shadow-xs hover:shadow-md hover:border-emerald-200 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg shadow-inner">
              <FileText className="w-6 h-6" />
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
              disabled={uploading || analyzing}
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={uploadResume}
                disabled={uploading || analyzing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <PencilLine className="w-3.5 h-3.5 mr-1" />
              Replace
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={deleteResume}
              disabled={deleteResumeLoading || analyzing}
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
          <p className="text-xs text-slate-400 mt-1">PDF preferred for full ATS analysis (max 5MB)</p>

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
            {uploading ? "Uploading…" : "Select File"}
          </Button>
        </div>
      )}
    </div>
  );
}
