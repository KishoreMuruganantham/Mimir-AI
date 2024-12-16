"use client";

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/app/context/AuthContext';
import { storage } from '@/firebase/config'; // Make sure you have Firebase configured
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';

interface ApiKey {
  projectNumber: string;
  projectName: string;
  apiKey: string;
  created: string;
  plan: string;
}

// Add TabType type
type TabType = 'APIKEYS' | 'FILES' | 'Insights' | 'FILTERWORDS';

// Add this utility function
const truncateApiKey = (apiKey: string) => {
  if (apiKey.length > 12) {
    return `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 6)}`;
  }
  return apiKey;
};

export default function Page() {
  const { userEmail, userPassword, logout } = useAuth();
  const router = useRouter();
  
  // Add this useEffect for session check
  useEffect(() => {
    if (!userEmail || !userPassword) {
      router.push('/auth/login');
    }
  }, [userEmail, userPassword, router]);

  // Add logout button to header
  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [apiKeyName, setApiKeyName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [createdApiKey, setCreatedApiKey] = useState<ApiKey | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedKeyForUpload, setSelectedKeyForUpload] = useState<ApiKey | null>(null);
  const [rewriteMode, setRewriteMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('APIKEYS');
  const [showApiKeyPopup, setShowApiKeyPopup] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDomainForm, setShowDomainForm] = useState(false);
  const [domain, setDomain] = useState('');
  const [filterWords, setFilterWords] = useState<string[]>([]);

  // Add useEffect to handle session storage of API keys
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
    }
  }, [apiKeys]);

  // Add useEffect for session check and API keys loading
  useEffect(() => {
    if (!userEmail || !userPassword) {
      router.push('/auth/login');
    } else {
      // Load API keys from localStorage when component mounts
      const savedKeys = localStorage.getItem('apiKeys');
      if (savedKeys) {
        setApiKeys(JSON.parse(savedKeys));
      }
    }
  }, [userEmail, userPassword, router]);

  // Add a separate useEffect for initializing apiKeys from localStorage
  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      const savedKeys = localStorage.getItem('apiKeys');
      if (savedKeys) {
        setApiKeys(JSON.parse(savedKeys));
      }
    }
  }, []); // Empty dependency array means this runs once on mount

  // Add this useEffect to fetch filter words
  useEffect(() => {
    const fetchFilterWords = async () => {
      try {
        const response = await axios.post('https://mimirai-rag.onrender.com/get_filterwords', {
          email: userEmail
        });
        setFilterWords(response.data.filter_words);
      } catch (error) {
        console.error('Failed to fetch filter words:', error);
      }
    };

    fetchFilterWords();
  }, []); // Empty dependency array means this runs once on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check localStorage for existing keys
    const existingKeys = localStorage.getItem('apiKeys');
    if (existingKeys && JSON.parse(existingKeys).length > 0) {
      toast.error('Only one API key is allowed');
      setShowCreateForm(false);
      return;
    }

    try {
      // Create form data using stored credentials
      const formData = new URLSearchParams();
      formData.append('username', userEmail);
      formData.append('password', userPassword);


      // Make API call to get token
      const response = await axios.post('https://mimirai-rag.onrender.com/token', 
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const newApiKey: ApiKey = {
        projectNumber: Math.random().toString(36).substring(2, 6),
        projectName: apiKeyName,
        apiKey: response.data.access_token, // Use the token from response
        created: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        plan: 'Free of charge'
      };

      // Update both state and localStorage
      setApiKeys([newApiKey]);
      localStorage.setItem('apiKeys', JSON.stringify([newApiKey]));
      
      setApiKeyName('');
      setShowCreateForm(false);
      toast.success('API Key created successfully!');
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast.error('Failed to create API key. Please try again.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    setSelectedFiles(pdfFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    setSelectedFiles(pdfFiles);
  };

  const uploadToFirebase = async (file: File) => {
    const storageRef = ref(storage, `pdfs/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleUpload = async () => {
    if (apiKeys.length === 0) {
      toast.error('Please create an API key first');
      setShowCreateForm(true);
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Please select PDF files to upload');
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = selectedFiles.map(uploadToFirebase);
      const fileUrls = await Promise.all(uploadPromises);
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeys[0].apiKey.trim()}`
      };

      // Upload files
      const uploadResponse = await axios.post(
        'https://mimirai-rag.onrender.com/process', 
        {
          files: fileUrls,
          rewrite: rewriteMode
        },
        { 
          headers,
          validateStatus: function (status) {
            return status < 500;
          }
        }
      );

      if (uploadResponse.status === 401) {
        throw new Error('Invalid or expired API key');
      }

      // Only proceed with filter words check if process was successful
      if (uploadResponse.status === 200) {
        try {
          const filterWordsResponse = await axios.post('https://mimirai-rag.onrender.com/get_filterwords', {
            email: userEmail
          });
          
          setFilterWords(filterWordsResponse.data.filter_words);
          
          if (filterWordsResponse.data.filter_words.length > 0) {
            setActiveTab('FILTERWORDS');
            toast('Inappropriate content detected!', {
              icon: '⚠️',
              style: {
                background: '#FEF3C7',
                color: '#92400E',
              },
            });
          } else {
            toast.success('No inappropriate content detected');
          }
        } catch (error) {
          console.error('Failed to check filter words:', error);
          toast.error('Failed to check content for inappropriate words');
        }
      }

      console.log('API Response:', uploadResponse.data);
      toast.success('Files uploaded and processed successfully!');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      if (error.response?.status === 404) {
        toast.error('API endpoint not found. Please check the URL.');
      } else if (error.response?.status === 401) {
        toast.error('Unauthorized. Invalid API key or expired token.');
      } else {
        toast.error('Failed to upload files. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleApiKeyClick = (key: ApiKey) => {
    setSelectedApiKey(key);
    setShowApiKeyPopup(true);
  };

  const handleCopyApiKey = () => {
    if (selectedApiKey) {
      navigator.clipboard.writeText(selectedApiKey.apiKey);
      toast.success('API Key copied to clipboard!');
    }
  };

  const handleShareApiKey = () => {
    if (selectedApiKey) {
      // Implement share functionality here
      toast.success('Share functionality coming soon!');
    }
  };

  const handlePreviewFile = (file: File) => {
    setSelectedPreviewFile(file);
    setShowPreview(true);
  };

  const handleDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('https://mimirai-rag.onrender.com/add_domain', {
        email: userEmail,
        domain: domain
      });

      toast.success(response.data.message || 'Domain added successfully!');
      setShowDomainForm(false);
      setDomain('');
    } catch (error) {
      console.error('Failed to add domain:', error);
      toast.error(error.response?.data?.message || 'Failed to add domain. Please try again.');
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen text-white">
      {/* Professional Header Bar */}
      <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Admin Portal
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Add user profile section */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-sm font-medium">{userEmail?.[0]?.toUpperCase()}</span>
                </div>
                <span className="text-sm text-gray-300">{userEmail}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-start gap-1 p-1 bg-gray-800/50 backdrop-blur rounded-lg inline-block">
          {['APIKEYS', 'FILES', 'Insights', 'FILTERWORDS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as TabType)}
              className={`px-6 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area with Glass Effect */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-xl">
          {activeTab === 'APIKEYS' && (
            <div className="p-8">
              <div className="max-w-6xl mx-auto">
                {/* Header section with improved spacing and button styling */}
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-semibold text-white">API Keys</h2>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowDomainForm(true)}
                      className="px-6 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 font-medium shadow-lg shadow-purple-500/30 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      Add Domain
                    </button>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium shadow-lg shadow-blue-500/30 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create New API Key
                    </button>
                  </div>
                </div>

                {/* API Keys Table with enhanced styling */}
                <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-700">
                  <table className="w-full">
                    <thead className="bg-gray-750">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Project Number</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Project Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">API Key</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Created</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Plan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {apiKeys.map((key, index) => (
                        <tr 
                          key={index} 
                          className="hover:bg-gray-750 cursor-pointer transition-colors duration-150"
                          onClick={() => handleApiKeyClick(key)}
                        >
                          <td className="px-6 py-4 text-sm text-gray-300">{key.projectNumber}</td>
                          <td className="px-6 py-4 text-sm text-gray-300 font-medium">{key.projectName}</td>
                          <td className="px-6 py-4 text-sm text-gray-300 font-mono">{truncateApiKey(key.apiKey)}</td>
                          <td className="px-6 py-4 text-sm text-gray-300">{key.created}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
                              {key.plan}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Modal with enhanced styling */}
                {showCreateForm && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-gray-800 p-8 rounded-xl w-full max-w-md shadow-2xl border border-gray-700">
                      <h3 className="text-xl font-semibold mb-6">Create New API Key</h3>
                      <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                          <label className="block text-gray-300 mb-2 font-medium">Project Name</label>
                          <input
                            type="text"
                            value={apiKeyName}
                            onChange={(e) => setApiKeyName(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            placeholder="Enter project name"
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-4">
                          <button
                            type="button"
                            onClick={() => setShowCreateForm(false)}
                            className="px-6 py-2.5 text-gray-300 hover:text-white transition-colors duration-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-lg shadow-blue-500/30"
                          >
                            Create
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* API Key Popup with enhanced styling */}
                {showApiKeyPopup && selectedApiKey && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-gray-800 p-8 rounded-xl w-full max-w-md shadow-2xl border border-gray-700">
                      <h3 className="text-xl font-semibold mb-6">API Key Details</h3>
                      <div className="bg-gray-900 p-4 rounded-lg mb-6">
                        <p className="text-gray-400 text-sm mb-2">API Key</p>
                        <p className="text-gray-200 font-mono break-all">{selectedApiKey.apiKey}</p>
                      </div>
                      <div className="flex justify-end gap-4">
                        <button
                          onClick={handleCopyApiKey}
                          className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-lg shadow-blue-500/30 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </button>
                        <button
                          onClick={handleShareApiKey}
                          className="px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 shadow-lg shadow-green-500/30 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          Share
                        </button>
                        <button
                          onClick={() => setShowApiKeyPopup(false)}
                          className="px-6 py-2.5 text-gray-300 hover:text-white transition-colors duration-200"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Domain Modal */}
                {showDomainForm && (
                  <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700/50">
                      <h3 className="text-xl font-semibold mb-6">Add Domain</h3>
                      <form onSubmit={handleDomainSubmit}>
                        <div className="mb-6">
                          <label className="block text-gray-300 mb-2 font-medium">Domain</label>
                          <input
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                            placeholder="Enter domain (e.g., example.com)"
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-4">
                          <button
                            type="button"
                            onClick={() => setShowDomainForm(false)}
                            className="px-6 py-2.5 text-gray-300 hover:text-white transition-colors duration-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 shadow-lg shadow-purple-500/30"
                          >
                            Add Domain
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'FILES' && (
            <div className="p-8">
              <div className="max-w-6xl mx-auto">
                {/* Left side - Upload section */}
                <div className="w-full">
                  <div className="mb-8 flex justify-between items-center">
                    <h2 className="text-2xl font-semibold text-white">Upload Files</h2>
                    {showPreview && (
                      <button
                        onClick={() => setShowPreview(false)}
                        className="text-gray-400 hover:text-white flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Close Preview
                      </button>
                    )}
                  </div>

                  {/* Upload Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="bg-gray-800/50 rounded-xl p-12 mb-6 border-2 border-dashed border-gray-600 hover:border-blue-500 transition-colors duration-200 cursor-pointer"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf"
                      multiple
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center cursor-pointer">
                      <div className="w-16 h-16 mb-4 text-gray-400">
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-gray-400 mb-2">Drag and drop PDF files here or click to browse</p>
                      {selectedFiles.length > 0 && (
                        <p className="text-blue-400">{selectedFiles.length} files selected</p>
                      )}
                    </div>
                  </div>

                  {/* Selected Files List with preview badges */}
                  {selectedFiles.length > 0 && (
                    <div className="bg-gray-800/50 rounded-xl overflow-hidden mb-6 border border-gray-700">
                      <div className="divide-y divide-gray-700">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="text-blue-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-300 truncate">{file.name}</p>
                                <p className="text-gray-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handlePreviewFile(file)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium
                                  ${selectedPreviewFile === file 
                                    ? 'bg-blue-500 text-white' 
                                    : 'text-blue-400 border border-blue-400/50 hover:bg-blue-500/10'
                                  }`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {selectedPreviewFile === file ? 'Previewing' : 'Preview'}
                              </button>
                              <button
                                onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                                className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rewrite Toggle - Enhanced UI */}
                  <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-gray-200 font-medium text-lg">Rewrite Mode</span>
                        <p className="text-gray-400 text-sm mt-1">Enable to rewrite uploaded content in a different style</p>
                      </div>
                      <button
                        onClick={() => setRewriteMode(!rewriteMode)}
                        className={`relative inline-flex h-8 w-20 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                          rewriteMode ? 'bg-blue-500' : 'bg-gray-700'
                        }`}
                      >
                        <span
                          className={`absolute text-xs font-medium ${
                            rewriteMode 
                              ? 'left-2 text-white' 
                              : 'right-2 text-gray-300'
                          }`}
                        >
                          {rewriteMode ? 'Yes' : 'No'}
                        </span>
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                            rewriteMode ? 'translate-x-12' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Upload Button */}
                  <button
                    onClick={handleUpload}
                    disabled={isUploading || selectedFiles.length === 0}
                    className={`w-full py-3 rounded-lg font-medium shadow-lg transition-all duration-200 ${
                      isUploading || selectedFiles.length === 0
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600 shadow-green-500/30'
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Uploading...
                      </div>
                    ) : (
                      'Upload Files'
                    )}
                  </button>
                </div>
                {/* Replace the existing PDF Preview Overlay with this new full-screen modal */}
                {showPreview && selectedPreviewFile && (
                  <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    
                    {/* Modal Container */}
                    <div className="relative h-full flex flex-col">
                      {/* Header */}
                      <div className="bg-gray-900 border-b border-gray-700">
                        <div className="max-w-[95%] mx-auto py-4 px-6 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-blue-400">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-white">
                                {selectedPreviewFile.name}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {(selectedPreviewFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {/* Download Button */}
                            <button
                              onClick={() => {
                                const url = URL.createObjectURL(selectedPreviewFile);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = selectedPreviewFile.name;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download
                            </button>
                            
                            {/* Close Button */}
                            <button
                              onClick={() => setShowPreview(false)}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* PDF Viewer */}
                      <div className="flex-1 bg-gray-800 overflow-hidden">
                        <div className="h-full max-w-[95%] mx-auto py-6">
                          <div className="bg-white rounded-lg h-full shadow-2xl">
                            <iframe
                              src={URL.createObjectURL(selectedPreviewFile)}
                              className="w-full h-full"
                              title="PDF Preview"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Insights' && (
            <div className="p-8">
              <div className="text-center py-8">
                <div className="max-w-md mx-auto">
                  <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-400 text-lg">Insights feature coming soon...</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'FILTERWORDS' && (
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-white">Bad Words</h2>
              {filterWords.length > 0 ? (
                <ul className="list-disc list-inside text-gray-300">
                  {filterWords.map((word, index) => (
                    <li key={index}>{word}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No bad language detected</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Create API Key Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700/50">
            <h3 className="text-xl font-semibold mb-6">Create New API Key</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-300 mb-2 font-medium">Project Name</label>
                <input
                  type="text"
                  value={apiKeyName}
                  onChange={(e) => setApiKeyName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2.5 text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-lg shadow-blue-500/30"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
  