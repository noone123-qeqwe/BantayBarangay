"use client";

import React, { useState, useRef } from "react";
import { Camera, Image as ImageIcon, X, AlertCircle, Loader2, Info, RefreshCw, Plus, Sparkles, MapPin } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface UploadedPhoto {
  url: string;
  type: "BEFORE" | "IN_PROGRESS" | "RESOLUTION";
  caption?: string;
}

interface PhotoUploaderProps {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  maxPhotos?: number;
  photoType?: "BEFORE" | "IN_PROGRESS" | "RESOLUTION";
  onExifLocation?: (coords: { latitude: number; longitude: number }) => void;
}

export default function PhotoUploader({
  photos,
  onChange,
  maxPhotos = 4,
  photoType = "BEFORE",
  onExifLocation,
}: PhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (replaceIndex === null && photos.length + files.length > maxPhotos) {
      setUploadError(`You can upload up to ${maxPhotos} photos.`);
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      if (replaceIndex !== null) {
        // Replace existing photo
        const file = files[0];
        if (file.size > 5 * 1024 * 1024) throw new Error("Photo exceeds 5MB limit.");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", photoType);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed.");

        const updated = [...photos];
        updated[replaceIndex] = { url: data.url, type: photoType };
        onChange(updated);
        showToast("Photo replaced successfully", "success");
        setReplaceIndex(null);
      } else {
        // Append new photos
        const newPhotos: UploadedPhoto[] = [...photos];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`"${file.name}" exceeds 5MB. Please choose a smaller photo.`);
          }

          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", photoType);

          const res = await fetch("/api/upload", { method: "POST", body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Upload failed.");

          newPhotos.push({ url: data.url, type: photoType });
        }
        onChange(newPhotos);
        showToast("Photo uploaded successfully", "success");
      }
    } catch (err: any) {
      console.error("Photo upload error:", err);
      setUploadError(err.message || "We couldn't upload your photo. Please try again.");
      showToast(err.message || "Failed to upload photo", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onChange(updated);
    showToast("Photo removed", "info");
  };

  const triggerReplace = (index: number) => {
    setReplaceIndex(index);
    fileInputRef.current?.click();
  };

  return (
    <div>
      {/* Privacy Notice Card */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          padding: "12px 16px",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--primary-light)",
          color: "var(--primary-dark)",
          fontSize: "0.813rem",
          marginBottom: "18px",
          border: "1px solid rgba(2, 132, 199, 0.25)",
        }}
      >
        <Info size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <strong>Photo Privacy Advisory:</strong> Ensure photos show the community infrastructure problem clearly. Avoid capturing faces, car license plates, or private residence interiors.
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={replaceIndex === null}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Two Clear Large Action Cards: Take Photo vs Choose from Gallery */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
        <button
          type="button"
          onClick={() => {
            setReplaceIndex(null);
            cameraInputRef.current?.click();
          }}
          disabled={isUploading || photos.length >= maxPhotos}
          style={{
            padding: "20px 14px",
            borderRadius: "var(--radius-lg)",
            border: "2px dashed var(--primary)",
            backgroundColor: "var(--primary-light)",
            cursor: photos.length >= maxPhotos ? "not-allowed" : "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            textAlign: "center",
            transition: "all 0.2s ease",
            opacity: photos.length >= maxPhotos ? 0.6 : 1,
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px var(--primary-glow)",
            }}
          >
            <Camera size={22} />
          </div>
          <strong style={{ fontSize: "0.938rem", color: "var(--primary-dark)" }}>Take Photo</strong>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Use device camera</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setReplaceIndex(null);
            fileInputRef.current?.click();
          }}
          disabled={isUploading || photos.length >= maxPhotos}
          style={{
            padding: "20px 14px",
            borderRadius: "var(--radius-lg)",
            border: "2px dashed var(--border-medium)",
            backgroundColor: "var(--bg-subtle)",
            cursor: photos.length >= maxPhotos ? "not-allowed" : "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            textAlign: "center",
            transition: "all 0.2s ease",
            opacity: photos.length >= maxPhotos ? 0.6 : 1,
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              backgroundColor: "var(--border-medium)",
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ImageIcon size={22} />
          </div>
          <strong style={{ fontSize: "0.938rem", color: "var(--text-primary)" }}>Choose from Gallery</strong>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Browse JPEG, PNG, WebP</span>
        </button>
      </div>

      {/* Quick Demo Photo Option */}
      {photos.length < maxPhotos && (
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          <button
            type="button"
            onClick={() => {
              const sample = {
                url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800",
                type: photoType,
                caption: "On-site evidence photo showing defect and street curb",
              };
              onChange([...photos, sample]);
              if (onExifLocation) {
                onExifLocation({ latitude: 14.58410, longitude: 121.06180 });
              }
              showToast("Sample photo attached with auto-detected GPS (14.58410, 121.06180)", "success");
            }}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Sparkles size={13} color="var(--primary)" />
            <span>Attach Sample Demonstration Photo (Simulate Camera GPS)</span>
          </button>
        </div>
      )}

      {/* Uploading Status Bar */}
      {isUploading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--primary-light)",
            color: "var(--primary-dark)",
            marginBottom: "18px",
            fontWeight: 700,
            fontSize: "0.875rem",
          }}
        >
          <Loader2 size={18} className="spin" />
          <span>Processing and uploading photo evidence...</span>
        </div>
      )}

      {/* Error Alert */}
      {uploadError && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--priority-critical-bg)",
            color: "var(--priority-critical)",
            fontSize: "0.875rem",
            marginBottom: "18px",
            fontWeight: 600,
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Thumbnails Gallery with Preview, Replace & Removal */}
      {photos.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.813rem", fontWeight: 700, color: "var(--text-secondary)" }}>
              Attached Photos ({photos.length} of {maxPhotos})
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "14px",
            }}
          >
            {photos.map((photo, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  border: "2px solid var(--border-medium)",
                  backgroundColor: "var(--bg-subtle)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <img
                  src={photo.url}
                  alt={`Proof preview ${idx + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />

                {/* Actions Overlay */}
                <div
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    display: "flex",
                    gap: "4px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => triggerReplace(idx)}
                    title="Replace photo"
                    aria-label={`Replace photo ${idx + 1}`}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(15, 23, 42, 0.8)",
                      color: "#ffffff",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    }}
                  >
                    <RefreshCw size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    title="Remove photo"
                    aria-label={`Remove photo ${idx + 1}`}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(220, 38, 38, 0.9)",
                      color: "#ffffff",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
