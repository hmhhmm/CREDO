// Real camera-based QR scanning — opens the device camera (same getUserMedia pattern
// SimuHireChatScreen already uses for its integrity-monitoring preview) and decodes frames
// with jsQR, a pure-JS canvas decoder with no native dependency. Returns the first
// successfully decoded string; the camera stream is stopped as soon as a code is found or
// the hook unmounts. Nothing is recorded or uploaded — frames are read into an in-memory
// canvas only, long enough to decode.
import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export type ScannerStatus = "idle" | "requesting" | "scanning" | "denied" | "unsupported" | "found";

export function useQrScanner(active: boolean) {
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [decoded, setDecoded] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
    if (result?.data) {
      setDecoded(result.data);
      setStatus("found");
      stop();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [stop]);

  useEffect(() => {
    if (!active) {
      stop();
      setStatus("idle");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    setDecoded(null);
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus("scanning");
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        if (!cancelled) setStatus("denied");
      });
    return () => {
      cancelled = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick/stop are stable via useCallback with fixed deps
  }, [active]);

  const reset = useCallback(() => {
    setDecoded(null);
    setStatus(active ? "scanning" : "idle");
  }, [active]);

  return { status, decoded, videoRef, reset };
}

// CREDO QR codes encode a public profile URL — /card/{candidateId} for a candidate's
// namecard, /company/{employerId} for an employer's. Pulls the id + which kind out of a
// decoded string; returns null for anything that isn't a recognized CREDO URL (a QR code
// pointed at something else entirely).
export function parseCredoQrUrl(raw: string): { kind: "candidate" | "employer"; id: string } | null {
  const match = raw.match(/\/(card|company)\/([^/?#]+)/);
  if (!match) return null;
  return { kind: match[1] === "card" ? "candidate" : "employer", id: match[2] };
}
