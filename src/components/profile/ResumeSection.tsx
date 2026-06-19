
import { ResumeDescription } from "./ResumeDescription";

interface ResumeSectionProps {
  userId: string;
  resumeUrl: string | null;
  onResumeUpdated: () => void;
}

export function ResumeSection({ userId, resumeUrl, onResumeUpdated }: ResumeSectionProps) {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm shadow-xs p-4 sm:p-5 transition-all duration-300 hover:shadow-sm">
      <ResumeDescription
        userId={userId}
        resumeUrl={resumeUrl}
        onResumeUpdated={onResumeUpdated}
      />
    </div>
  );
}
