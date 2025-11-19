import { Loader2, Youtube, CheckCircle2 } from "lucide-react";
import { buildYouTubeThumbnailUrl } from "@/utils/youtubeDetector";

interface TranscriptPanelProps {
  videoId: string;
  videoUrl: string;
  isLoading: boolean;
  cached?: boolean;
}

const TranscriptPanel = ({ videoId, videoUrl, isLoading, cached }: TranscriptPanelProps) => {
  const thumbnailUrl = buildYouTubeThumbnailUrl(videoId, 'hq');

  return (
    <div className="space-y-4">
      {/* Video Preview */}
      <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
        <img 
          src={thumbnailUrl} 
          alt="YouTube video thumbnail"
          className="w-full aspect-video object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Youtube className="w-16 h-16 text-white opacity-90" />
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Transcribing video... this may take 10-30 seconds</span>
          </div>
        ) : cached ? (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>Using cached transcript</span>
          </div>
        ) : null}

        {isLoading && (
          <div className="text-xs text-muted-foreground">
            Generating kid-friendly lesson...
          </div>
        )}
      </div>

      {/* Video Link */}
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <Youtube className="w-4 h-4" />
        Open video on YouTube
      </a>
    </div>
  );
};

export default TranscriptPanel;
