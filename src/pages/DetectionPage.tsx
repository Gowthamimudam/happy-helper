import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Square, Volume2, VolumeX, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHandDetection } from "@/hooks/useHandDetection";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import GestureResultDisplay from "@/components/GestureResult";
import HandCanvas from "@/components/HandCanvas";

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

export default function DetectionPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLoading, isRunning, gesture, landmarks, error, start, stop } = useHandDetection();
  const { speak, stopSpeaking } = useTextToSpeech();
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [history, setHistory] = useState<string[]>([]);

  // Speak detected gesture — triggered by detection which starts after user click (Start button)
  useEffect(() => {
    if (gesture && gesture.gesture !== "Unknown" && gesture.confidence > 0.5 && speechEnabled && isRunning) {
      speak(gesture.gesture.split(" / ")[0]);
    }
  }, [gesture, speechEnabled, speak, isRunning]);

  // Track gesture history
  useEffect(() => {
    if (gesture && gesture.gesture !== "Unknown" && gesture.confidence > 0.5) {
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        if (last === gesture.gesture) return prev;
        return [...prev.slice(-19), gesture.gesture];
      });
    }
  }, [gesture]);

  const handleStart = useCallback(async () => {
    if (videoRef.current) {
      await start(videoRef.current);
    }
  }, [start]);

  const handleStop = useCallback(() => {
    stop();
    stopSpeaking();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
  }, [stop, stopSpeaking]);

  return (
    <div className="container pt-24 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl"
      >
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold font-display">
            Gesture <span className="text-gradient">Detection</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Position your hand in front of the camera
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* Camera view */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative aspect-[4/3] bg-muted">
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ transform: "scaleX(-1)" }}
                playsInline
                muted
              />
              <HandCanvas
                landmarks={landmarks}
                width={VIDEO_WIDTH}
                height={VIDEO_HEIGHT}
              />
              {!isRunning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="scanline absolute inset-0" />
                  <div className="relative z-10 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10">
                      {isLoading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      ) : (
                        <Play className="h-8 w-8 text-primary ml-1" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {isLoading ? "Loading AI model..." : "Press Start to begin"}
                    </p>
                  </div>
                </div>
              )}

              {/* Status indicator */}
              {isRunning && (
                <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 backdrop-blur-sm border border-border">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs font-mono text-accent">LIVE</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 border-t border-border p-4">
              {!isRunning ? (
                <Button
                  onClick={handleStart}
                  disabled={isLoading}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Detection
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleStop}
                  variant="destructive"
                  className="flex-1"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className="border-border"
              >
                {speechEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Current gesture */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Detected Gesture
              </h3>
              <GestureResultDisplay gesture={gesture} isSpeaking={speechEnabled} />
            </div>

            {/* History */}
            <div className="rounded-2xl border border-border bg-card p-4 flex-1">
              <h3 className="mb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                History
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No gestures yet</p>
                ) : (
                  history.map((g, i) => (
                    <motion.span
                      key={`${g}-${i}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-md bg-secondary px-2 py-1 text-xs font-mono text-secondary-foreground"
                    >
                      {g}
                    </motion.span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
