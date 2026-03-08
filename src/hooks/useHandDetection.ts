import { useCallback, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { classifyGesture, type GestureResult, type Landmark } from "@/lib/gestureClassifier";

export function useHandDetection() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [gesture, setGesture] = useState<GestureResult | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[][] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastGestureTimeRef = useRef(0);

  const initialize = useCallback(async () => {
    if (handLandmarkerRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });
    } catch (e) {
      console.error("Failed to initialize HandLandmarker:", e);
      setError("Failed to load AI model. Please refresh and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startCamera = useCallback(async (video: HTMLVideoElement) => {
    videoRef.current = video;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
    } catch (e) {
      console.error("Camera error:", e);
      setError("Camera access denied. Please allow camera permissions.");
    }
  }, []);

  const detectFrame = useCallback(() => {
    const video = videoRef.current;
    const landmarker = handLandmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    const now = performance.now();
    const results = landmarker.detectForVideo(video, now);

    if (results.landmarks && results.landmarks.length > 0) {
      const lm = results.landmarks[0] as Landmark[];
      const handedness = results.handednesses?.[0]?.[0]?.categoryName ?? "Right";
      setLandmarks(results.landmarks as Landmark[][]);

      // Throttle gesture updates to avoid flicker
      if (now - lastGestureTimeRef.current > 300) {
        const result = classifyGesture(lm, handedness);
        setGesture(result);
        lastGestureTimeRef.current = now;
      }
    } else {
      setLandmarks(null);
      if (now - lastGestureTimeRef.current > 1000) {
        setGesture(null);
      }
    }

    animationFrameRef.current = requestAnimationFrame(detectFrame);
  }, []);

  const start = useCallback(async (video: HTMLVideoElement) => {
    await initialize();
    await startCamera(video);
    setIsRunning(true);
    animationFrameRef.current = requestAnimationFrame(detectFrame);
  }, [initialize, startCamera, detectFrame]);

  const stop = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsRunning(false);
    setGesture(null);
    setLandmarks(null);
  }, []);

  return { isLoading, isRunning, gesture, landmarks, error, start, stop };
}
