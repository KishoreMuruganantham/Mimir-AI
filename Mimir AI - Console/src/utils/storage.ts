// Firebase Storage utilities for file upload and management
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { getFirebaseStorage } from '@/config/firebase'

export interface UploadResult {
  url: string
  path: string
  name: string
  size: number
}

export interface UploadProgress {
  progress: number
  fileName: string
  completed: boolean
  error?: string
}

/**
 * Upload a single file to Firebase Storage
 * @param file - The file to upload
 * @param folderPath - The folder path in storage (e.g., 'documents/sector-name')
 * @param _onProgress - Optional progress callback (currently not used in Firebase uploadBytes)
 * @returns Promise with download URL and metadata
 */
export const uploadFileToStorage = async (
  file: File,
  folderPath: string = 'documents',
  _onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    const storage = getFirebaseStorage()
    
    // Create a unique filename with timestamp to avoid conflicts
    const timestamp = Date.now()
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${cleanFileName}`
    const filePath = `${folderPath}/${fileName}`
    
    // Create storage reference
    const storageRef = ref(storage, filePath)
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file)
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    return {
      url: downloadURL,
      path: filePath,
      name: fileName,
      size: file.size
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Upload multiple files to Firebase Storage
 * @param files - Array of files to upload
 * @param folderPath - The folder path in storage
 * @param onProgress - Optional progress callback for each file
 * @returns Promise with array of upload results
 */
export const uploadMultipleFiles = async (
  files: File[],
  folderPath: string = 'documents',
  onProgress?: (fileProgress: UploadProgress) => void
): Promise<UploadResult[]> => {
  const results: UploadResult[] = []
  const errors: string[] = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    try {
      // Report progress start
      onProgress?.({
        progress: 0,
        fileName: file.name,
        completed: false
      })
      
      const result = await uploadFileToStorage(
        file,
        folderPath,
        (progress) => {
          onProgress?.({
            progress,
            fileName: file.name,
            completed: false
          })
        }
      )
      
      results.push(result)
      
      // Report completion
      onProgress?.({
        progress: 100,
        fileName: file.name,
        completed: true
      })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`${file.name}: ${errorMessage}`)
      
      // Report error
      onProgress?.({
        progress: 0,
        fileName: file.name,
        completed: true,
        error: errorMessage
      })
    }
  }
  
  if (errors.length > 0 && results.length === 0) {
    throw new Error(`All uploads failed:\n${errors.join('\n')}`)
  }
  
  if (errors.length > 0) {
    console.warn('Some uploads failed:', errors)
  }
  
  return results
}

/**
 * Delete a file from Firebase Storage
 * @param filePath - The storage path of the file to delete
 */
export const deleteFileFromStorage = async (filePath: string): Promise<void> => {
  try {
    const storage = getFirebaseStorage()
    const fileRef = ref(storage, filePath)
    await deleteObject(fileRef)
  } catch (error) {
    console.error('Error deleting file:', error)
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate a folder path based on sector and department
 * @param sector - The sector name
 * @param department - The department name (optional)
 * @returns Formatted folder path
 */
export const generateFolderPath = (sector: string, department?: string): string => {
  const cleanSector = sector.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')
  if (department) {
    const cleanDepartment = department.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')
    return `documents/${cleanSector}/${cleanDepartment}`
  }
  return `documents/${cleanSector}`
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file type based on extension
 * @param filename - The filename
 * @returns File type classification
 */
export const getFileType = (filename: string): 'pdf' | 'docx' | 'txt' | 'xlsx' | 'pptx' | 'image' | 'video' | 'other' => {
  const ext = filename.toLowerCase().split('.').pop()
  switch (ext) {
    case 'pdf': return 'pdf'
    case 'docx':
    case 'doc': return 'docx'
    case 'txt': return 'txt'
    case 'xlsx':
    case 'xls': return 'xlsx'
    case 'pptx':
    case 'ppt': return 'pptx'
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp': return 'image'
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'wmv': return 'video'
    default: return 'other'
  }
}
