"use client";

import { useState, useEffect } from "react";
import { FileVideo, Film } from "lucide-react";
import { VideoUploader } from "@/components/video-uploader";
import { VideoPlayer } from "@/components/video-player";
import { ProcessingStatus } from "@/components/processing-status";
import { ThemeToggle } from "@/components/theme-toggle";
// import { pollForTranscodedVideo } from "@/lib/api";
import { toast } from "sonner";

export default function Home() {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Poll for the transcoded video URL when videoId changes
  useEffect(() => {
    if (!videoId) return;

    setIsProcessing(true);

    const pollInterval = 5000; // 5 seconds
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (60 * 5 seconds)

    const poll = async () => {
      try {
        attempts++;
        //const url = await pollForTranscodedVideo(videoId);
        const url = "abc";
        if (url) {
          setVideoUrl(url);
          setIsProcessing(false);
          toast("Processing complete", {
            description: "Your video is ready to play",
          });
          return;
        }

        // If we've reached max attempts, stop polling
        if (attempts >= maxAttempts) {
          setIsProcessing(false);
          toast.error("Processing timeout", {
            description:
              "Video processing is taking longer than expected. Please try again later.",
          });
          return;
        }

        // Continue polling
        setTimeout(poll, pollInterval);
      } catch (error) {
        console.error("Error polling for video:", error);
        setIsProcessing(false);
        toast.error("Processing failed", {
          description: "There was a problem processing your video",
        });
      }
    };

    poll();

    // Cleanup
    return () => {
      setIsProcessing(false);
    };
  }, [videoId, toast]);

  const handleUploadComplete = (id: string) => {
    setVideoId(id);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Film className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">HLS Video Transcoder</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Introduction */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">
              Convert Your Videos to HLS Format
            </h2>
            <p className="text-muted-foreground">
              Upload a video file (up to 50MB) and we'll convert it to HLS
              format for adaptive streaming
            </p>
          </div>

          {/* Video player (shown when video is ready) */}
          {videoUrl && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Your Transcoded Video</h3>
              <VideoPlayer src={videoUrl} />
            </div>
          )}

          {/* Processing status */}
          <ProcessingStatus isProcessing={isProcessing} />

          {/* Upload section (hidden when processing or video is ready) */}
          {!isProcessing && !videoUrl && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Upload Your Video</h3>
              <VideoUploader onUploadComplete={handleUploadComplete} />
            </div>
          )}

          {/* Instructions */}
          <div className="bg-muted rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">How It Works</h3>
            <ol className="space-y-2 list-decimal list-inside">
              <li>Select a video file (MP4, MOV, AVI, or MKV) up to 50MB</li>
              <li>Upload the video to our secure server</li>
              <li>Wait while we transcode your video to HLS format</li>
              <li>Play your video with adaptive streaming</li>
            </ol>
            <p className="text-sm text-muted-foreground">
              HLS (HTTP Live Streaming) allows your video to adapt to different
              network conditions, providing the best quality possible based on
              the viewer's connection speed.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} HLS Video Transcoder. All rights
            reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
