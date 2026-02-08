// components/dashboard/VehiclePhotosTab.tsx
"use client"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import toast from "react-hot-toast"
import { updateVehicle, type Vehicle } from "@/lib/vehicles.api"

interface VehiclePhotosTabProps {
  vehicle: Vehicle
  onUpdate: () => void
}

export function VehiclePhotosTab({ vehicle, onUpdate }: VehiclePhotosTabProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection (from click)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
   
    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })
    if (validFiles.length === 0) return
    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file))
    setPreviewUrls(prev => [...prev, ...newPreviewUrls])
    setSelectedFiles(prev => [...prev, ...validFiles])
    // Reset input
    e.target.value = ''
  }

  // Handle drop (drag and drop)
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
   
    // Validate files (same logic as handleFileSelect)
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })
    if (validFiles.length === 0) return
    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file))
    setPreviewUrls(prev => [...prev, ...newPreviewUrls])
    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  // Drag handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  // Trigger file input click
  const handleAreaClick = () => {
    fileInputRef.current?.click()
  }

  // Remove selected file
  const removeSelectedFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Upload photos
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one photo')
      return
    }
    setUploading(true)
    try {
      // Convert files to base64 for demo (in production, upload to cloud storage)
      const base64Photos = await Promise.all(
        selectedFiles.map(file => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
        })
      )
      // Update vehicle with new photos
      const currentPhotos = vehicle.photos || []
      const response = await updateVehicle(vehicle.id, {
        photos: [...currentPhotos, ...base64Photos],
      })
      if (response.success) {
        toast.success('Photos uploaded successfully!')
        setSelectedFiles([])
        setPreviewUrls([])
        onUpdate() // Refresh vehicle data
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('Failed to upload photos')
    } finally {
      setUploading(false)
    }
  }

  // Delete existing photo
  const handleDeletePhoto = async (photoUrl: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return
    }
    try {
      const updatedPhotos = (vehicle.photos || []).filter(url => url !== photoUrl)
      const response = await updateVehicle(vehicle.id, {
        photos: updatedPhotos,
      })
      if (response.success) {
        toast.success('Photo deleted successfully!')
        onUpdate()
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Failed to delete photo')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Vehicle Photos</h2>
        <p className="text-muted-foreground">Upload and manage photos of this vehicle</p>
      </div>
      {/* Upload Area */}
      <div 
        className={`rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        }`}
        onClick={handleAreaClick}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`rounded-full p-4 transition-colors ${
              dragActive ? 'bg-primary' : 'bg-primary/10'
            }`}>
              <Upload className={`w-8 h-8 ${dragActive ? 'text-primary-foreground' : 'text-primary'}`} />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Upload Vehicle Photos</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop images here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Supports: JPG, PNG, GIF (Max 5MB each)
          </p>
          <Button type="button" variant="outline" className="cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </Button>
        </div>
        {/* Selected Files Preview */}
        {previewUrls.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">{selectedFiles.length} file(s) selected</p>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                size="sm"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload All
                  </>
                )}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSelectedFile(index)
                    }}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Existing Photos */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Photos</h3>
        {!vehicle.photos || vehicle.photos.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No photos uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {vehicle.photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo}
                  alt={`${vehicle.brand} ${vehicle.model} - Photo ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg border border-border"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePhoto(photo)
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
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