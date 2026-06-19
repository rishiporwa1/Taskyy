import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Move, ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropperModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  aspectRatio: number; // e.g. 1 for avatar, 32/9 for cover
  cropShape: "circle" | "rect";
  onCropComplete: (file: File) => void;
}

export function ImageCropperModal({
  isOpen,
  onOpenChange,
  imageSrc,
  aspectRatio,
  cropShape,
  onCropComplete,
}: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.01);
  const [maxZoom, setMaxZoom] = useState(4);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [bgColor, setBgColor] = useState("rgb(15, 23, 42)");

  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Touch zoom helper refs
  const initialTouchDist = useRef<number | null>(null);
  const initialTouchZoom = useRef<number>(1);

  // Sync state into a ref to prevent stale closures in event listeners
  const stateRef = useRef({ zoom, minZoom, maxZoom, position });
  useEffect(() => {
    stateRef.current = { zoom, minZoom, maxZoom, position };
  }, [zoom, minZoom, maxZoom, position]);

  // Reset states when the modal is reopened or a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false);
      setBgColor("rgb(15, 23, 42)");
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Compute boundaries and clamp position to prevent empty borders
  const clampPosition = useCallback((x: number, y: number, currentZoom: number) => {
    const img = imageRef.current;
    const viewport = viewportRef.current;
    if (!img || !viewport) return { x, y };

    const rectV = viewport.getBoundingClientRect();
    const imgWidth = img.naturalWidth * currentZoom;
    const imgHeight = img.naturalHeight * currentZoom;

    const minX = imgWidth > rectV.width ? -(imgWidth - rectV.width) / 2 : 0;
    const maxX = imgWidth > rectV.width ? (imgWidth - rectV.width) / 2 : 0;

    const minY = imgHeight > rectV.height ? -(imgHeight - rectV.height) / 2 : 0;
    const maxY = imgHeight > rectV.height ? (imgHeight - rectV.height) / 2 : 0;

    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  }, []);

  // Keep event listeners stable by reading state from stateRef
  const handleWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const zoomStep = 0.08;
    const direction = e.deltaY < 0 ? 1 : -1;
    const current = stateRef.current;
    const targetZoom = Math.min(Math.max(current.zoom + direction * zoomStep, current.minZoom), current.maxZoom);
    
    const clamped = clampPosition(current.position.x, current.position.y, targetZoom);
    setZoom(targetZoom);
    setPosition(clamped);
  }, [clampPosition]);

  const handleTouchMoveNative = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault(); // Stop default browser pinch-to-zoom
    }
  }, []);

  // Callback ref to bind native listeners (wheel and touchmove) with { passive: false }
  const setViewportRef = useCallback((node: HTMLDivElement | null) => {
    if (viewportRef.current) {
      viewportRef.current.removeEventListener("wheel", handleWheelNative);
      viewportRef.current.removeEventListener("touchmove", handleTouchMoveNative);
    }
    
    viewportRef.current = node;
    
    if (node) {
      node.addEventListener("wheel", handleWheelNative, { passive: false });
      node.addEventListener("touchmove", handleTouchMoveNative, { passive: false });
    }
  }, [handleWheelNative, handleTouchMoveNative]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const viewport = viewportRef.current;
    if (!img || !viewport) return;

    const rectV = viewport.getBoundingClientRect();
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    // Minimum zoom required to completely fill the viewport (no margins/black bars)
    const coverZoom = Math.max(rectV.width / naturalWidth, rectV.height / naturalHeight);
    const computedMinZoom = coverZoom;
    const computedMaxZoom = coverZoom * 4;

    setMinZoom(computedMinZoom);
    setMaxZoom(computedMaxZoom);
    
    // Default to coverZoom so it starts filled and cannot be zoomed out further
    setZoom(coverZoom);
    setPosition({ x: 0, y: 0 });

    // Sample background color from the corner pixel to seamlessly fill margins in the preview container
    let sampledColor = "rgb(15, 23, 42)";
    try {
      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = 1;
      sampleCanvas.height = 1;
      const sampleCtx = sampleCanvas.getContext("2d");
      if (sampleCtx) {
        sampleCtx.drawImage(img, 0, 0, 1, 1, 0, 0, 1, 1);
        const imgData = sampleCtx.getImageData(0, 0, 1, 1).data;
        const [r, g, b, a] = imgData;
        if (a > 0) {
          sampledColor = `rgb(${r}, ${g}, ${b})`;
        }
      }
    } catch (e) {
      console.warn("Failed to sample image background color", e);
    }
    setBgColor(sampledColor);
    setImageLoaded(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageLoaded) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageLoaded) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    const clamped = clampPosition(newX, newY, zoom);
    setPosition(clamped);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!imageLoaded) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
      initialTouchDist.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false); // Stop dragging when pinching
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      initialTouchDist.current = Math.sqrt(dx * dx + dy * dy);
      initialTouchZoom.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!imageLoaded) return;
    if (e.touches.length === 1 && isDragging) {
      const newX = e.touches[0].clientX - dragStart.current.x;
      const newY = e.touches[0].clientY - dragStart.current.y;
      const clamped = clampPosition(newX, newY, zoom);
      setPosition(clamped);
    } else if (e.touches.length === 2 && initialTouchDist.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const currentDist = Math.sqrt(dx * dx + dy * dy);
      if (initialTouchDist.current > 0) {
        const factor = currentDist / initialTouchDist.current;
        const newZoom = Math.min(Math.max(initialTouchZoom.current * factor, minZoom), maxZoom);
        const clamped = clampPosition(position.x, position.y, newZoom);
        setZoom(newZoom);
        setPosition(clamped);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    initialTouchDist.current = null;
  };

  const handleCrop = () => {
    const imageEl = imageRef.current;
    const viewportEl = viewportRef.current;
    if (!imageEl || !viewportEl) return;

    const rectI = imageEl.getBoundingClientRect();
    const rectV = viewportEl.getBoundingClientRect();

    // Map screen crop coordinates directly to target canvas coordinates
    const canvasScale = (aspectRatio === 1 ? 400 : 1200) / rectV.width;
    const targetWidth = aspectRatio === 1 ? 400 : 1200;
    const targetHeight = aspectRatio === 1 ? 400 : Math.round(1200 / aspectRatio);

    let destX = (rectI.left - rectV.left) * canvasScale;
    let destY = (rectI.top - rectV.top) * canvasScale;
    let destWidth = rectI.width * canvasScale;
    let destHeight = rectI.height * canvasScale;

    // Safety clamping: If the image is intended to cover the target dimensions,
    // prevent sub-pixel rounding errors from exposing any background lines at the edges.
    if (destX > 0) destX = 0;
    if (destY > 0) destY = 0;
    if (destX + destWidth < targetWidth) {
      destWidth = targetWidth - destX;
    }
    if (destY + destHeight < targetHeight) {
      destHeight = targetHeight - destY;
    }

    // Create target canvas
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill background with the sampled color
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Draw the image with correct position and dimensions onto canvas
    ctx.drawImage(imageEl, destX, destY, destWidth, destHeight);

    // Export cropped image as blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], "cropped-image.jpg", {
            type: "image/jpeg",
          });
          onCropComplete(croppedFile);
          onOpenChange(false);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-6 gap-6">
        <DialogHeader>
          <DialogTitle>Adjust Image</DialogTitle>
        </DialogHeader>

        {/* Viewport Container (acts as both cropping area and outer wrapper) */}
        <div
          ref={setViewportRef}
          className="relative mx-auto border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden cursor-move select-none"
          style={{
            width: "100%",
            maxWidth: aspectRatio === 1 ? "300px" : "750px",
            aspectRatio: `${aspectRatio}`,
            borderRadius: cropShape === "circle" ? "50%" : (aspectRatio === 1 ? "12px" : "6px"),
            backgroundColor: bgColor,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Direct preview of image inside the container */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop preview"
            onLoad={handleImageLoad}
            className="absolute max-w-none max-h-none select-none pointer-events-none"
            style={{
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              opacity: imageLoaded ? 1 : 0,
            }}
          />
          
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
              Loading preview...
            </div>
          )}

          {imageLoaded && (
            <div className="absolute bottom-2 right-2 text-white/60 text-[10px] pointer-events-none flex items-center gap-1 z-20 bg-slate-950/60 px-2 py-0.5 rounded backdrop-blur-xs">
              <Move className="w-3 h-3" /> Drag to position, Scroll/Pinch to zoom
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4 border-slate-100 dark:border-slate-800">
          {/* Zoom controls on the left */}
          <div className="flex items-center gap-3 w-full sm:w-[320px] shrink-0">
            <span className="text-xs font-medium text-slate-500 shrink-0">Zoom</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => {
                const targetZoom = Math.min(Math.max(zoom - 0.1, minZoom), maxZoom);
                const clamped = clampPosition(position.x, position.y, targetZoom);
                setZoom(targetZoom);
                setPosition(clamped);
              }}
              disabled={!imageLoaded}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Slider
              min={minZoom}
              max={maxZoom}
              step={(maxZoom - minZoom) / 100 || 0.01}
              value={[zoom]}
              onValueChange={(val) => {
                const targetZoom = val[0];
                const clamped = clampPosition(position.x, position.y, targetZoom);
                setZoom(targetZoom);
                setPosition(clamped);
              }}
              disabled={!imageLoaded}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => {
                const targetZoom = Math.min(Math.max(zoom + 0.1, minZoom), maxZoom);
                const clamped = clampPosition(position.x, position.y, targetZoom);
                setZoom(targetZoom);
                setPosition(clamped);
              }}
              disabled={!imageLoaded}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-slate-500 w-8 text-right shrink-0">{Math.round(zoom * 100)}%</span>
          </div>

          {/* Action buttons on the right */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleCrop} disabled={!imageLoaded} className="flex-1 sm:flex-none">
              Save & Upload
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

