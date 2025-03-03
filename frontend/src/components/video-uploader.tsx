"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileVideo,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  getPresignedUrl,
  uploadToPresignedUrl,
  getPlaybackUrl,
} from "@/utils/apiClient";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = ["video/mp4"];

export function VideoUploader({
  onUploadComplete,
}: {
  onUploadComplete: (videoUrl: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setError("Invalid file type. Only MP4 is allowed.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size exceeds 50MB limit.");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      // Step 1: Get presigned URL
      const response = await getPresignedUrl();
      const preSignedUrl = response.data.presignedUrl;
      const videoId = response.data.videoId;

      // Step 2: Upload file
      await uploadToPresignedUrl(preSignedUrl, file);

      setIsUploading(false);
      setIsProcessing(true);
      toast.success("Upload successful", {
        description: "Your video is now being processed",
      });

      // Step 3: Poll for processed video URL
      pollForVideo(videoId);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload video. Please try again.");
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const pollForVideo = async (videoId: string) => {
    const pollInterval = 7000; // 7 seconds
    let attempts = 0;
    const maxAttempts = 85; // ~10 minutes

    const poll = async () => {
      try {
        attempts++;
        const response = await getPlaybackUrl(videoId);

        if (response.data?.link?.videoLink) {
          // Video is ready
          const url = response.data.link.videoLink;
          setVideoUrl(url);
          setIsProcessing(false);
          toast.success("Video is ready to play!");
          onUploadComplete(url);
          return;
        }

        // Continue polling if under max attempts
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          // Timeout after max attempts
          toast.error("Video processing is taking too long");
          setIsProcessing(false);
        }
      } catch (error: any) {
        // Handle specific "not ready yet" error
        if (
          error.response?.status === 404 &&
          error.response?.data?.message === "Video not generated yet"
        ) {
          if (attempts < maxAttempts) {
            setTimeout(poll, pollInterval);
          } else {
            toast.error("Video processing timed out");
            setIsProcessing(false);
          }
        } else {
          // Other errors
          console.error("Polling error:", error);
          setIsProcessing(false);
        }
      }
    };

    poll();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 w-full flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
            onClick={triggerFileInput}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/*"
              className="hidden"
              disabled={isUploading || isProcessing}
            />

            <FileVideo className="h-12 w-12 text-muted-foreground mb-4" />

            <div className="text-center">
              <p className="text-lg font-medium mb-1">
                {file ? file.name : "Select a video to upload"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                MP4 format, max 50MB
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
                disabled={isUploading || isProcessing}
              >
                <Upload className="mr-2 h-4 w-4" />
                Select Video
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {file && !error && (
            <div className="w-full space-y-4">
              {isUploading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="text-sm font-medium">Uploading...</span>
                </div>
              ) : isProcessing ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
                  <span className="text-sm font-medium">
                    Processing video... This may take a few minutes.
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">
                    File selected: {file.name}
                  </span>
                </div>
              )}

              {!isUploading && !isProcessing && !videoUrl && (
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || isProcessing || !file}
                  className="w-full"
                >
                  Upload Video
                </Button>
              )}
            </div>
          )}

          {videoUrl && (
            <div className="w-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
              <h3 className="font-bold text-lg mb-2 flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                Video ready for streaming🎉!
              </h3>

              {/* <Button
                onClick={() => window.open(videoUrl, "_blank")}
                className="w-full bg-green-600 hover:bg-green-700 mb-2"
              >
                <Play className="mr-2 h-5 w-5" />
                Play Video
              </Button>

              <p className="text-sm text-center">
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {videoUrl}
                </a>
              </p> */}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
