"use client";

import { useState, useRef } from "react";
import { Upload, FileVideo, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { getPresignedUrl } from "@/utils/apiClient";
// import {
//   getPresignedUrl,
//   uploadToPresignedUrl,
//   notifyVideoUploaded,
// } from "@/lib/api";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
const ALLOWED_FILE_TYPES = [
  "video/mp4",
];

export function VideoUploader({
  onUploadComplete,
}: {
  onUploadComplete: (videoId: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setError("Please select a valid video file (MP4, MOV, AVI, MKV)");
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size must be less than 50MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    const preSignedUrl = "As";
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Get presigned URL from backend
      const presignedUrl = await getPresignedUrl();

      // Upload file to presigned URL with progress tracking
      await uploadFileWithProgress(preSignedUrl, file);

      // Notify backend that upload is complete
      // const { videoId } = await notifyVideoUploaded(file.name);

      toast.success("Upload successful", {
        description: "Your video is now being processed",
      });

      // Reset state
      setFile(null);
      setUploadProgress(100);

      // Notify parent component that upload is complete
      // onUploadComplete(videoId);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload video. Please try again.");
      toast.error("Upload failed", {
        description: "There was a problem uploading your video",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFileWithProgress = async (presignedUrl: string, file: File) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100
          );
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
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
              disabled={isUploading}
            />

            <FileVideo className="h-12 w-12 text-muted-foreground mb-4" />

            <div className="text-center">
              <p className="text-lg font-medium mb-1">
                {file ? file.name : "Select a video to upload"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                MP4, MOV, AVI or MKV (max. 50MB)
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
                disabled={isUploading}
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
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">
                  File selected: {file.name}
                </span>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={isUploading || !file}
                className="w-full"
              >
                {isUploading ? "Uploading..." : "Upload Video"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
