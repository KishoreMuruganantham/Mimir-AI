import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/contexts/ToastContext'
import { uploadMultipleFiles, generateFolderPath, formatFileSize, getFileType, type UploadProgress, type UploadResult } from '@/utils/storage'
import { knowledgeBaseApi } from '@/services/api'
import { 
  Upload,
  FileText,
  File,
  Image,
  Video,
  Database,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Plus,
  X
} from 'lucide-react'

// Types for knowledge base management
interface KnowledgeDocument {
  id: string
  name: string
  type: 'pdf' | 'docx' | 'txt' | 'xlsx' | 'pptx' | 'image' | 'video' | 'other'
  size: string
  uploadDate: string
  lastModified: string
  sector: string
  department: string
  uploadedBy: string
  status: 'processing' | 'active' | 'failed' | 'archived'
  description: string
  tags: string[]
  accessLevel: 'public' | 'department' | 'restricted'
  tokenId?: string
  documentCount?: number
  file?: File
  previewUrl?: string
  storageUrl?: string
  storagePath?: string
  usage: {
    queries: number
    lastAccessed: string
  }
}

// File Preview Card Component
interface FilePreviewCardProps {
  file: KnowledgeDocument
  onRemove: () => void
}

const FilePreviewCard: React.FC<FilePreviewCardProps> = ({ file, onRemove }) => {
  const [showFullPreview, setShowFullPreview] = useState(false)
  
  const getFileIcon = (type: KnowledgeDocument['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />
      case 'txt':
        return <File className="h-5 w-5 text-gray-500" />
      case 'xlsx':
        return <Database className="h-5 w-5 text-green-500" />
      case 'pptx':
        return <File className="h-5 w-5 text-orange-500" />
      case 'image':
        return <Image className="h-5 w-5 text-purple-500" />
      case 'video':
        return <Video className="h-5 w-5 text-pink-500" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const handlePreview = () => {
    if (file.file) {
      if (file.type === 'image') {
        setShowFullPreview(true)
      } else if (file.type === 'txt') {
        // Read text file content
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          // Show text content in a modal or new window
          const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head>
                  <title>${file.name} - Text Preview</title>
                  <style>
                    body { 
                      font-family: 'Segoe UI', Arial, sans-serif; 
                      padding: 20px; 
                      line-height: 1.6; 
                      max-width: 800px;
                      margin: 0 auto;
                      background: #f9f9f9;
                    }
                    .header {
                      background: white;
                      padding: 20px;
                      border-radius: 8px;
                      margin-bottom: 20px;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .content {
                      background: white;
                      padding: 20px;
                      border-radius: 8px;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    pre { 
                      white-space: pre-wrap; 
                      word-wrap: break-word; 
                      background: #f8f9fa; 
                      padding: 15px; 
                      border-radius: 5px;
                      border-left: 4px solid #007acc;
                      font-family: 'Courier New', monospace;
                      font-size: 14px;
                    }
                    .file-info {
                      color: #666;
                      font-size: 14px;
                    }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h2 style="margin: 0 0 10px 0; color: #333;">${file.name}</h2>
                    <div class="file-info">
                      Size: ${file.size} • Type: ${file.type.toUpperCase()} • Last Modified: ${new Date(file.lastModified).toLocaleString()}
                    </div>
                  </div>
                  <div class="content">
                    <pre>${content.length > 10000 ? content.substring(0, 10000) + '\\n\\n... (Content truncated for preview)' : content}</pre>
                  </div>
                </body>
              </html>
            `)
            newWindow.document.close()
          }
        }
        reader.readAsText(file.file)
      } else if (file.type === 'pdf') {
        // For PDF files, create a blob URL and open in new tab
        const url = URL.createObjectURL(file.file)
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.location.href = url
        }
      } else {
        // For other file types, show detailed file information
        const newWindow = window.open('', '_blank', 'width=600,height=400')
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>File Information - ${file.name}</title>
                <style>
                  body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    padding: 30px; 
                    background: #f5f5f5;
                    margin: 0;
                  }
                  .info-card {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    max-width: 500px;
                    margin: 0 auto;
                  }
                  h2 { color: #333; margin-bottom: 20px; }
                  .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid #eee;
                  }
                  .info-row:last-child { border-bottom: none; }
                  .label { font-weight: 600; color: #555; }
                  .value { color: #333; }
                  .file-icon {
                    width: 64px;
                    height: 64px;
                    background: #007acc;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 24px;
                    font-weight: bold;
                    margin: 0 auto 20px;
                  }
                </style>
              </head>
              <body>
                <div class="info-card">
                  <div class="file-icon">${file.type.toUpperCase()}</div>
                  <h2>${file.name}</h2>
                  <div class="info-row">
                    <span class="label">File Size:</span>
                    <span class="value">${file.size}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">File Type:</span>
                    <span class="value">${file.type.toUpperCase()}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Last Modified:</span>
                    <span class="value">${new Date(file.lastModified).toLocaleString()}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">MIME Type:</span>
                    <span class="value">${file.file?.type || 'Unknown'}</span>
                  </div>
                  <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      Full preview not available for ${file.type.toUpperCase()} files.<br>
                      File will be processed after upload.
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `)
          newWindow.document.close()
        }
      }
    }
  }

  return (
    <div className="p-4 border-b last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {getFileIcon(file.type)}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-sm text-muted-foreground">{file.size}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                {file.type.toUpperCase()}
              </span>
              {file.type === 'image' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  ✓ Preview Available
                </span>
              )}
              {file.type === 'txt' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  ✓ Text Preview
                </span>
              )}
              {file.type === 'pdf' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                  ✓ PDF Preview
                </span>
              )}
              {file.file && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                  {new Date(file.lastModified).toLocaleDateString()}
                </span>
              )}
            </div>
            {/* File metadata */}
            {file.file && (
              <div className="mt-2 text-xs text-muted-foreground">
                MIME: {file.file.type || 'Unknown'} • Modified: {new Date(file.lastModified).toLocaleString()}
              </div>
            )}
          </div>
          
          {/* Image thumbnail */}
          {file.type === 'image' && file.previewUrl && (
            <div className="flex-shrink-0">
              <img
                src={file.previewUrl}
                alt={file.name}
                className="w-16 h-16 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                onClick={() => setShowFullPreview(true)}
              />
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handlePreview}
            title="Preview file"
          >
            <Eye className="h-4 w-4 mr-1" /> Preview
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700"
            title="Remove file"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Full Image Preview Modal */}
      {showFullPreview && file.type === 'image' && file.previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={() => setShowFullPreview(false)}
              className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={file.previewUrl}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs opacity-75">{file.size}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


export default function KnowledgeBase() {
  const [selectedSector, setSelectedSector] = useState<string>('general')
  const [rewrite, setRewrite] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [apiTokens, setApiTokens] = useState<Array<{ token: string; name: string }>>([])
  const [selectedTokenId, setSelectedTokenId] = useState<string>('')
  const [selectedFiles, setSelectedFiles] = useState<KnowledgeDocument[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: UploadProgress }>({})
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  // Load stored API tokens from localStorage
  useEffect(() => {
    const storedTokens = localStorage.getItem('apiTokens')
    if (storedTokens) {
      const tokens = JSON.parse(storedTokens)
      setApiTokens(tokens)
      if (tokens.length > 0 && !selectedTokenId) {
        setSelectedTokenId(tokens[0].token)
      }
    }
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const newDocuments = files.map(file => {
      // Create preview URL for images and PDFs
      let previewUrl: string | null = null
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file)
      } else if (file.type === 'application/pdf') {
        previewUrl = URL.createObjectURL(file)
      }
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: getFileType(file.name),
        size: formatFileSize(file.size),
        uploadDate: new Date().toISOString(),
        lastModified: new Date(file.lastModified).toISOString(),
        sector: selectedSector,
        department: '',
        uploadedBy: '',
        status: 'processing',
        description: '',
        tags: [],
        accessLevel: 'public',
        file,
        previewUrl,
        usage: {
          queries: 0,
          lastAccessed: 'Never'
        }
      } as KnowledgeDocument
    })

    setSelectedFiles(prev => [...prev, ...newDocuments])
  }

  // Cleanup preview URLs when component unmounts or files are removed
  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl)
        }
      })
    }
  }, [selectedFiles])

  const removeSelectedFile = (id: string) => {
    setSelectedFiles(prev => {
      const updatedFiles = prev.filter(file => file.id !== id)
      // Clean up any created preview URLs
      const removedFile = prev.find(file => file.id === id)
      if (removedFile?.previewUrl) {
        URL.revokeObjectURL(removedFile.previewUrl)
      }
      return updatedFiles
    })
  }

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) {
      addToast({
        title: 'No Files Selected',
        description: 'Please select files to upload',
        type: 'error'
      })
      return
    }

    if (!selectedTokenId) {
      addToast({
        title: 'No API Key Selected',
        description: 'Please select an API key before uploading',
        type: 'error'
      })
      return
    }

    setIsUploading(true)
    setProcessingStatus('uploading')
    setUploadProgress({})

    try {
      // Extract files from selected documents
      const filesToUpload = selectedFiles
        .filter(doc => doc.file)
        .map(doc => doc.file!)

      if (filesToUpload.length === 0) {
        throw new Error('No valid files to upload')
      }

      // Generate folder path based on selected sector
      const folderPath = generateFolderPath(selectedSector)

      // Upload files to Firebase Storage
      const uploadResults: UploadResult[] = await uploadMultipleFiles(
        filesToUpload,
        folderPath,
        (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [progress.fileName]: progress
          }))
        }
      )

      // Extract URLs for processing
      const fileUrls = uploadResults.map(result => result.url)

      addToast({
        title: 'Upload Successful',
        description: `${uploadResults.length} file(s) uploaded to storage`,
        type: 'success'
      })

      // Update processing status
      setProcessingStatus('processing')

      // Send URLs to processing API
      const processResponse = await knowledgeBaseApi.processDocuments(fileUrls, rewrite, selectedTokenId)

      if (processResponse.success) {
        setProcessingStatus('completed')

        addToast({
          title: 'Processing Complete',
          description: `${fileUrls.length} document(s) processed successfully`,
          type: 'success'
        })

        // Clear selected files after successful upload and processing
        setSelectedFiles([])
        setUploadProgress({})

      } else {
        throw new Error('Document processing failed')
      }

    } catch (error) {
      setProcessingStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload and process files'
      
      addToast({
        title: 'Upload/Processing Failed',
        description: errorMessage,
        type: 'error'
      })

      console.error('Upload/Processing error:', error)
    } finally {
      setIsUploading(false)
      // Reset status after a delay
      setTimeout(() => {
        setProcessingStatus('idle')
      }, 3000)
    }
  }

  const getFileIcon = (type: KnowledgeDocument['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />
      case 'txt':
        return <File className="h-5 w-5 text-gray-500" />
      case 'xlsx':
        return <Database className="h-5 w-5 text-green-500" />
      case 'pptx':
        return <File className="h-5 w-5 text-orange-500" />
      case 'image':
        return <Image className="h-5 w-5 text-purple-500" />
      case 'video':
        return <Video className="h-5 w-5 text-pink-500" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base Upload</h1>
          <p className="text-muted-foreground">
            Upload and process documents for AI knowledge base
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Documents
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.xlsx,.pptx,.jpg,.jpeg,.png"
        />
      </div>

      {/* Bulk Upload Section */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
            <CardDescription>Upload multiple documents at once with custom settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* File Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Files</label>
                <div className="flex items-center space-x-4">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.xlsx,.pptx,.jpg,.jpeg,.png"
                  />
                </div>
              </div>

              {/* Selected Files List with Enhanced Preview */}
              {selectedFiles.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          selectedFiles.forEach(file => {
                            if (file.type === 'image' && file.previewUrl) {
                              window.open(file.previewUrl, '_blank')
                            }
                          })
                        }}
                        disabled={!selectedFiles.some(f => f.type === 'image')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview All Images
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFiles([])}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear All
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                    {selectedFiles.map((file) => (
                      <FilePreviewCard 
                        key={file.id}
                        file={file}
                        onRemove={() => setSelectedFiles(files => files.filter(f => f.id !== file.id))}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* File Upload Section */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="fileInput"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF, DOCX, TXT, XLSX, PPTX, Images (up to 50MB)</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      id="fileInput"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleFileSelect}
                      accept=".pdf,.docx,.txt,.xlsx,.pptx,.jpg,.jpeg,.png,.gif"
                    />
                  </label>
                </div>

                {/* File Preview Section */}
                {selectedFiles.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Selected Files ({selectedFiles.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedFiles.map((file) => (
                        <div key={file.id} className="relative group">
                          <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                            <div className="flex items-center mb-2">
                              {file.type === 'image' && file.previewUrl ? (
                                <img
                                  src={file.previewUrl}
                                  alt={file.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              ) : (
                                <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
                                  {getFileIcon(file.type)}
                                </div>
                              )}
                              <div className="ml-3 flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{file.size}</p>
                              </div>
                              <button
                                onClick={() => removeSelectedFile(file.id)}
                                className="p-1 hover:bg-gray-100 rounded-full"
                                disabled={isUploading}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>

                            {/* Progress indicator for each file */}
                            {uploadProgress[file.name] && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                  <span>
                                    {uploadProgress[file.name].completed 
                                      ? (uploadProgress[file.name].error ? 'Error' : 'Completed')
                                      : 'Uploading...'
                                    }
                                  </span>
                                  <span>{uploadProgress[file.name].progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      uploadProgress[file.name].error
                                        ? 'bg-red-500'
                                        : uploadProgress[file.name].completed
                                        ? 'bg-green-500'
                                        : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${uploadProgress[file.name].progress}%` }}
                                  />
                                </div>
                                {uploadProgress[file.name].error && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {uploadProgress[file.name].error}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Processing Status */}
                {processingStatus !== 'idle' && (
                  <div className="mt-6 p-4 rounded-lg border bg-gray-50">
                    <div className="flex items-center mb-2">
                      {processingStatus === 'uploading' && (
                        <>
                          <Clock className="w-5 h-5 text-blue-500 mr-2" />
                          <span className="font-medium">Uploading files to storage...</span>
                        </>
                      )}
                      {processingStatus === 'processing' && (
                        <>
                          <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                          <span className="font-medium">Processing documents...</span>
                        </>
                      )}
                      {processingStatus === 'completed' && (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          <span className="font-medium">Processing completed successfully!</span>
                        </>
                      )}
                      {processingStatus === 'error' && (
                        <>
                          <XCircle className="w-5 h-5 text-red-500 mr-2" />
                          <span className="font-medium">Processing failed</span>
                        </>
                      )}
                    </div>
                    
                    {processingStatus === 'uploading' && (
                      <p className="text-sm text-gray-600">
                        Files are being uploaded to Firebase Storage...
                      </p>
                    )}
                    {processingStatus === 'processing' && (
                      <p className="text-sm text-gray-600">
                        Documents are being processed by the AI system. This may take a few moments...
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Upload Settings */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Target Sector</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                  >
                    <option value="general">General</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">API Key</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedTokenId}
                    onChange={(e) => setSelectedTokenId(e.target.value)}
                  >
                    <option value="">Select API Key</option>
                    {apiTokens.map((token) => (
                      <option key={token.token} value={token.token}>
                        {token.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={rewrite}
                      onChange={(e) => setRewrite(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Enable content rewriting</span>
                  </label>
                </div>
              </div>

              {/* Upload Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={handleBulkUpload}
                  disabled={isUploading || selectedFiles.length === 0}
                  className="relative"
                >
                  {isUploading ? (
                    <>
                      {processingStatus === 'uploading' && (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      )}
                      {processingStatus === 'processing' && (
                        <>
                          <Zap className="mr-2 h-4 w-4 animate-pulse" />
                          Processing...
                        </>
                      )}
                      {processingStatus === 'completed' && (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Completed!
                        </>
                      )}
                      {processingStatus === 'error' && (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Failed
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {selectedFiles.length} file(s)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}