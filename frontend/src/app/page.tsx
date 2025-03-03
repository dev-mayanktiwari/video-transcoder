"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import { VideoUploader } from "@/components/video-uploader";
import { VideoPlayer } from "@/components/video-player";
import { ProcessingStatus } from "@/components/processing-status";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUploadComplete = (url: string) => {
    setVideoUrl(url);
    setIsProcessing(false);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Film className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold"> FRAMEFLUX </h1>
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

          {/* Processing status (only shown when processing) */}
          {isProcessing && <ProcessingStatus isProcessing={isProcessing} />}

          {/* Upload section (always visible for now) */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Upload Your Video</h3>
            <VideoUploader onUploadComplete={handleUploadComplete} />
          </div>

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
          <p className="mt-2">
            Made with ❤ by{" "}
            <a href="https://github.com/dev-mayanktiwari">
              <b>
                {" "}
                <u>Mayank Tiwari</u>
              </b>
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
