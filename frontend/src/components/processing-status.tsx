"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProcessingStatusProps {
  isProcessing: boolean;
}

export function ProcessingStatus({ isProcessing }: ProcessingStatusProps) {
  const [progress, setProgress] = useState(0);

  // Simulate progress for better UX
  useEffect(() => {
    if (!isProcessing) {
      setProgress(0);
      return;
    }

    // Reset progress when processing starts
    setProgress(0);

    // Simulate progress up to 95% (the last 5% will be when we actually get the video URL)
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        // Slow down as we get closer to 95%
        const increment = Math.max(0.5, (95 - prevProgress) / 20);
        const newProgress = Math.min(95, prevProgress + increment);

        // If we're close to 95%, slow down even more
        if (newProgress > 90) {
          return Math.min(95, prevProgress + 0.2);
        }

        return newProgress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing]);

  if (!isProcessing) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="font-medium">Processing your video...</span>
          </div>

          <div className="w-full space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              This may take a few minutes depending on the video size
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
