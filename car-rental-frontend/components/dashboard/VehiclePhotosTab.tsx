// components/dashboard/VehiclePhotosTab.tsx
"use client"
import { useState, useRef } from "react"
import { Upload, X, Loader2, ImageIcon, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import { updateVehicle, type Vehicle } from "@/lib/vehicles.api"

/* ─── tokens ─────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const G_GLOW  = "rgba(34,197,94,0.22)"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

interface VehiclePhotosTabProps {
  vehicle: Vehicle
  onUpdate: () => void
}

export function VehiclePhotosTab({ vehicle, onUpdate }: VehiclePhotosTabProps) {
  // ── all state & logic unchanged ──────────────────────────────
  const [uploading, setUploading]         = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls]     = useState<string[]>([])
  const [dragActive, setDragActive]       = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image`); return false }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is too large (max 5MB)`); return false }
      return true
    })
    if (validFiles.length === 0) return
    const newUrls = validFiles.map(f => URL.createObjectURL(f))
    setPreviewUrls(prev => [...prev, ...newUrls])
    setSelectedFiles(prev => [...prev, ...validFiles])
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file => {
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image`); return false }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is too large (max 5MB)`); return false }
      return true
    })
    if (validFiles.length === 0) return
    const newUrls = validFiles.map(f => URL.createObjectURL(f))
    setPreviewUrls(prev => [...prev, ...newUrls])
    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  const handleDragOver  = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setDragActive(true) }
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setDragActive(true) }
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setDragActive(false) }
  const handleAreaClick = () => { fileInputRef.current?.click() }

  const removeSelectedFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) { toast.error("Please select at least one photo"); return }
    setUploading(true)
    try {
      const base64Photos = await Promise.all(selectedFiles.map(file =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      ))
      const currentPhotos = vehicle.photos || []
      const response = await updateVehicle(vehicle.id, { photos: [...currentPhotos, ...base64Photos] })
      if (response.success) {
        toast.success("Photos uploaded successfully!")
        setSelectedFiles([]); setPreviewUrls([])
        onUpdate()
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error("Failed to upload photos")
    } finally { setUploading(false) }
  }

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return
    try {
      const updatedPhotos = (vehicle.photos || []).filter(url => url !== photoUrl)
      const response = await updateVehicle(vehicle.id, { photos: updatedPhotos })
      if (response.success) { toast.success("Photo deleted successfully!"); onUpdate() }
    } catch (error: any) {
      console.error("Delete error:", error)
      toast.error("Failed to delete photo")
    }
  }
  // ────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: FONT, color: "#fff", display: "flex", flexDirection: "column", gap: 28 }}>
      <style>{`@keyframes vp-spin { to { transform:rotate(360deg); } }`}</style>

      {/* header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 4 }}>Vehicle Photos</h2>
        <p style={{ fontSize: 13, color: "#9CA3AF" }}>Upload and manage photos of this vehicle</p>
      </div>

      {/* ── drop zone ── */}
      <div
        onClick={handleAreaClick}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          borderRadius: 16, padding: "36px 24px", cursor: "pointer",
          border: `2px dashed ${dragActive ? GREEN : BORDER}`,
          background: dragActive ? "rgba(34,197,94,0.06)" : SURFACE,
          textAlign: "center", transition: "all 0.22s",
        }}
        onMouseEnter={e => { if (!dragActive) e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)" }}
        onMouseLeave={e => { if (!dragActive) e.currentTarget.style.borderColor = BORDER }}
      >
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: "none" }} />

        {/* upload icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 14, margin: "0 auto 16px",
          background: dragActive ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${dragActive ? "rgba(34,197,94,0.3)" : BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.22s",
          boxShadow: dragActive ? `0 0 20px ${G_GLOW}` : "none",
        }}>
          <Upload size={22} color={dragActive ? GREEN : "#6B7280"} />
        </div>

        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Upload Vehicle Photos</h3>
        <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 4 }}>Drag and drop images here, or click to browse</p>
        <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 18 }}>Supports: JPG, PNG, GIF (Max 5MB each)</p>

        <button
          type="button"
          onClick={e => { e.stopPropagation(); handleAreaClick() }}
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, fontFamily: FONT, fontSize: 13, fontWeight: 600, background: "transparent", border: `1px solid ${BORDER}`, color: "#9CA3AF", cursor: "pointer", transition: "all 0.18s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#fff" }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#9CA3AF" }}
        >
          <Upload size={13} /> Choose Files
        </button>

        {/* selected previews */}
        {previewUrls.length > 0 && (
          <div style={{ marginTop: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF" }}>{selectedFiles.length} file(s) selected</span>
              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, border: "none", fontFamily: FONT, fontSize: 12, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer", background: uploading ? "rgba(34,197,94,0.35)" : GREEN, color: "#fff", transition: "all 0.2s" }}
              >
                {uploading ? (
                  <><span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "vp-spin 0.7s linear infinite" }} /> Uploading…</>
                ) : <><Upload size={12} /> Upload All</>}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
              {previewUrls.map((url, i) => (
                <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden" }}>
                  <img src={url} alt={`Preview ${i + 1}`} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                  <button
                    onClick={e => { e.stopPropagation(); removeSelectedFile(i) }}
                    style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 6, background: "rgba(239,68,68,0.9)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <X size={11} color="#fff" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── existing photos ── */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Current Photos</h3>

        {!vehicle.photos || vehicle.photos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 24px", borderRadius: 14, border: `1px dashed ${BORDER}` }}>
            <ImageIcon size={32} color="#4B5563" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "#9CA3AF", fontSize: 14 }}>No photos uploaded yet</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
            {vehicle.photos.map((photo, i) => (
              <div key={i} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}` }}
                onMouseEnter={e => (e.currentTarget.querySelector(".photo-overlay") as HTMLElement)!.style.opacity = "1"}
                onMouseLeave={e => (e.currentTarget.querySelector(".photo-overlay") as HTMLElement)!.style.opacity = "0"}
              >
                <img src={photo} alt={`${vehicle.brand} ${vehicle.model} - Photo ${i + 1}`} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />

                {/* hover overlay */}
                <div className="photo-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", opacity: 0, transition: "opacity 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeletePhoto(photo) }}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "none", fontFamily: FONT, fontSize: 12, fontWeight: 600, background: "rgba(239,68,68,0.9)", color: "#fff", cursor: "pointer" }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>

                {/* main photo badge */}
                {i === 0 && (
                  <div style={{ position: "absolute", top: 8, left: 8, padding: "2px 8px", borderRadius: 6, background: GREEN, fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>
                    Main Photo
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}