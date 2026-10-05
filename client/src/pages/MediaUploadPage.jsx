import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, Image as ImageIcon, FileText, Video, Headphones, Copy, Check,
  Trash2, X, Cloud, ArrowLeft, Search, RefreshCw, Eye, Download, HardDrive,
  Film, Music, FileSpreadsheet, Play
} from 'lucide-react';
import { uploadMedia, getMediaGallery, deleteMediaApi } from '../api/conversations';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import { format } from 'date-fns';

export default function MediaUploadPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' | 'upload'
  
  // Gallery state
  const [mediaList, setMediaList] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ totalFiles: 0, totalMB: '0.00', countByType: {} });
  const [previewMedia, setPreviewMedia] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const fileRef = useRef(null);
  const dropRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // ─── Fetch Media Gallery ──────────────────────────────────────────────────
  const fetchGallery = useCallback(async () => {
    setLoadingGallery(true);
    try {
      const params = {};
      if (filterType !== 'all') params.type = filterType;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await getMediaGallery(params);
      setMediaList(res.data.media || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch {
      toast.error('Failed to load media files.');
    } finally {
      setLoadingGallery(false);
    }
  }, [filterType, searchQuery]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // ─── Drag & Drop Handlers ─────────────────────────────────────────────────
  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList);
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeSelectedFile = (idx) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // ─── Handle Upload ────────────────────────────────────────────────────────
  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      setCurrentIndex(i);
      setProgress(Math.round((i / selectedFiles.length) * 100));
      try {
        await uploadMedia(selectedFiles[i], (progressEvent) => {
          const p = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(Math.round((i / selectedFiles.length) * 100 + (p / selectedFiles.length)));
        });
        successCount++;
      } catch (err) {
        toast.error(`Failed to upload ${selectedFiles[i].name}: ${err.response?.data?.message || err.message}`);
      }
    }

    setProgress(100);
    setCurrentIndex(-1);
    setSelectedFiles([]);
    setUploading(false);

    if (successCount > 0) {
      toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded to Cloudinary!`);
      fetchGallery();
      setActiveTab('gallery');
    }
  };

  // ─── Delete Media ─────────────────────────────────────────────────────────
  const handleDeleteMedia = async () => {
    if (!deleteConfirmItem) return;
    setDeleting(true);
    try {
      await deleteMediaApi(deleteConfirmItem._id);
      toast.success('Media removed successfully');
      setDeleteConfirmItem(null);
      if (previewMedia?._id === deleteConfirmItem._id) {
        setPreviewMedia(null);
      }
      fetchGallery();
    } catch {
      toast.error('Failed to delete media');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Copy Link Helper ─────────────────────────────────────────────────────
  const copyLink = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Direct link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── Download Helper ──────────────────────────────────────────────────────
  const handleDownload = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ─── Type Icon Helper ─────────────────────────────────────────────────────
  const getResourceIcon = (resourceType, size = 18) => {
    switch (resourceType) {
      case 'image':
        return <ImageIcon size={size} className="text-emerald-500" />;
      case 'video':
        return <Film size={size} className="text-blue-500" />;
      case 'audio':
        return <Music size={size} className="text-purple-500" />;
      default:
        return <FileText size={size} className="text-amber-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 px-2 sm:px-4">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-surface-100 text-surface-500 transition-all"
            title="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
              <Cloud size={26} className="text-brand-500" />
              Media & Cloudinary Hub
            </h1>
            <p className="text-sm text-surface-500 mt-0.5">
              Manage, preview, and download all photos, videos, and files stored on Cloudinary
            </p>
          </div>
        </div>

        {/* Quick Nav / Tab Switcher */}
        <div className="flex items-center gap-2 bg-surface-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'gallery'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            <ImageIcon size={14} />
            Media Gallery ({stats.totalFiles || mediaList.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm'
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            <Upload size={14} />
            Upload New Media
          </button>
        </div>
      </div>

      {/* ─── Cloud Storage Stats Bar ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card p-3.5 flex items-center gap-3 bg-white border border-surface-100 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <HardDrive size={20} className="text-brand-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Total Storage</p>
            <p className="text-base font-bold text-surface-900">{stats.totalMB || '0.00'} MB</p>
          </div>
        </div>

        <div className="card p-3.5 flex items-center gap-3 bg-white border border-surface-100 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <ImageIcon size={20} className="text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Images</p>
            <p className="text-base font-bold text-surface-900">{stats.countByType?.image || 0}</p>
          </div>
        </div>

        <div className="card p-3.5 flex items-center gap-3 bg-white border border-surface-100 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Film size={20} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Videos</p>
            <p className="text-base font-bold text-surface-900">{stats.countByType?.video || 0}</p>
          </div>
        </div>

        <div className="card p-3.5 flex items-center gap-3 bg-white border border-surface-100 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Music size={20} className="text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Audio</p>
            <p className="text-base font-bold text-surface-900">{stats.countByType?.audio || 0}</p>
          </div>
        </div>

        <div className="card p-3.5 flex items-center gap-3 bg-white border border-surface-100 shadow-xs col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet size={20} className="text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Documents</p>
            <p className="text-base font-bold text-surface-900">{stats.countByType?.document || 0}</p>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: MEDIA GALLERY ─────────────────────────────────────────── */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="card p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Type filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { key: 'all', label: 'All Files', icon: null },
                { key: 'image', label: 'Images', icon: ImageIcon },
                { key: 'video', label: 'Videos', icon: Video },
                { key: 'audio', label: 'Audio', icon: Headphones },
                { key: 'document', label: 'Documents', icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = filterType === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setFilterType(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      active
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    }`}
                  >
                    {Icon && <Icon size={13} />}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search and Refresh */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by file name..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface-50 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                onClick={fetchGallery}
                disabled={loadingGallery}
                className="p-2 rounded-lg border border-surface-200 hover:bg-surface-50 text-surface-600 transition-colors"
                title="Refresh Gallery"
              >
                <RefreshCw size={14} className={loadingGallery ? 'animate-spin text-brand-600' : ''} />
              </button>
            </div>
          </div>

          {/* Media Grid */}
          {loadingGallery ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-9 h-9 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-surface-500">Loading Cloudinary media...</p>
            </div>
          ) : mediaList.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto text-surface-400">
                <Cloud size={32} />
              </div>
              <h3 className="font-bold text-surface-800 text-sm">No media files found</h3>
              <p className="text-xs text-surface-400 max-w-sm mx-auto">
                {searchQuery || filterType !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Start uploading photos, videos, and documents to access them anywhere in the CRM.'}
              </p>
              <button
                onClick={() => setActiveTab('upload')}
                className="btn-sm btn-primary inline-flex items-center gap-1.5"
              >
                <Upload size={14} />
                Upload Your First File
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaList.map((item) => (
                <div
                  key={item._id}
                  className="group relative card overflow-hidden border border-surface-200/80 hover:border-brand-300 hover:shadow-md transition-all flex flex-col bg-white"
                >
                  {/* Thumbnail / Media Container */}
                  <div
                    className="relative w-full aspect-video bg-surface-100 overflow-hidden cursor-pointer flex items-center justify-center group-hover:brightness-95 transition-all"
                    onClick={() => setPreviewMedia(item)}
                  >
                    {item.resourceType === 'image' ? (
                      <img
                        src={item.url}
                        alt={item.originalName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : item.resourceType === 'video' ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
                        <video
                          src={item.url}
                          className="w-full h-full object-cover opacity-70"
                          preload="metadata"
                        />
                        <div className="absolute w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                          <Play size={18} className="fill-current ml-0.5" />
                        </div>
                      </div>
                    ) : item.resourceType === 'audio' ? (
                      <div className="flex flex-col items-center justify-center gap-2 p-4 text-purple-600">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <Headphones size={24} />
                        </div>
                        <span className="text-[11px] font-semibold text-purple-700">Audio Recording</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 p-4 text-amber-600">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                          <FileText size={24} />
                        </div>
                        <span className="text-[11px] font-semibold text-amber-700">
                          {item.format ? item.format.toUpperCase() : 'DOCUMENT'}
                        </span>
                      </div>
                    )}

                    {/* Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
                      {getResourceIcon(item.resourceType, 11)}
                      <span className="capitalize">{item.resourceType}</span>
                    </div>

                    {/* Hover Quick Preview Button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewMedia(item); }}
                        className="p-2 rounded-full bg-white/90 text-surface-800 hover:bg-white hover:scale-110 transition-all shadow-md"
                        title="View Full Preview"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(item.url, item.originalName); }}
                        className="p-2 rounded-full bg-white/90 text-surface-800 hover:bg-white hover:scale-110 transition-all shadow-md"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>

                  {/* File Metadata */}
                  <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-surface-900 truncate" title={item.originalName}>
                        {item.originalName || 'Unnamed Media'}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-surface-400 mt-1">
                        <span>{formatFileSize(item.bytes)}</span>
                        <span>{item.createdAt ? format(new Date(item.createdAt), 'd MMM yyyy') : ''}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-surface-100">
                      <button
                        onClick={() => copyLink(item.url, item._id)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                          copiedId === item._id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                        }`}
                        title="Copy Cloudinary Link"
                      >
                        {copiedId === item._id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === item._id ? 'Copied' : 'Copy Link'}</span>
                      </button>

                      <button
                        onClick={() => handleDownload(item.url, item.originalName)}
                        className="p-1.5 rounded-lg text-surface-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Download File"
                      >
                        <Download size={14} />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmItem(item)}
                        className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Media"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: UPLOAD NEW MEDIA ──────────────────────────────────────── */}
      {activeTab === 'upload' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Drop zone */}
          <div
            ref={dropRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-brand-500 bg-brand-50/60 scale-[1.01]'
                : 'border-surface-300 hover:border-brand-400 hover:bg-brand-50/20'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                isDragging ? 'bg-brand-100 scale-110' : 'bg-surface-100'
              }`}>
                <Upload size={30} className={isDragging ? 'text-brand-600' : 'text-surface-500'} />
              </div>
              <div>
                <p className="text-base font-bold text-surface-800">
                  {isDragging ? 'Drop files to upload!' : 'Drag & drop photos, videos or files here'}
                </p>
                <p className="text-xs text-surface-400 mt-1">
                  or click to browse from device
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                    JPG, PNG, WebP, GIF
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold">
                    MP4, WebM, MOV
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-semibold">
                    MP3, WAV, Voice Notes
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-semibold">
                    PDF, DOC, ZIP (up to 100MB)
                  </span>
                </div>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
            />
          </div>

          {/* Selected queue */}
          {selectedFiles.length > 0 && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-surface-900 text-sm flex items-center gap-2">
                  <span>Selected Files Queue ({selectedFiles.length})</span>
                </h3>
                <button
                  onClick={() => setSelectedFiles([])}
                  className="text-xs text-surface-400 hover:text-red-500 transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {selectedFiles.map((file, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
                      uploading && i === currentIndex
                        ? 'bg-brand-50 border-brand-300'
                        : 'bg-surface-50 border-surface-200/80'
                    }`}
                  >
                    {file.type.startsWith('image/') ? <ImageIcon size={18} className="text-emerald-500" /> :
                     file.type.startsWith('video/') ? <Video size={18} className="text-blue-500" /> :
                     file.type.startsWith('audio/') ? <Headphones size={18} className="text-purple-500" /> :
                     <FileText size={18} className="text-surface-400" />}

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-surface-800 truncate">{file.name}</p>
                      <p className="text-[10px] text-surface-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>

                    {uploading && i === currentIndex ? (
                      <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    ) : uploading && i < currentIndex ? (
                      <Check size={16} className="text-emerald-500" />
                    ) : !uploading ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSelectedFile(i); }}
                        className="p-1 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="w-full h-2.5 bg-surface-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-surface-500">
                    Uploading {currentIndex + 1} of {selectedFiles.length}... {progress}%
                  </p>
                </div>
              )}

              {!uploading && (
                <button
                  onClick={handleUploadAll}
                  className="btn-lg w-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <Cloud size={18} />
                  Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''} to Cloudinary
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Lightbox / Media Viewer Modal ─────────────────────────────────── */}
      {previewMedia && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewMedia(null)}
          title={previewMedia.originalName || 'Media Preview'}
          size="xl"
        >
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden bg-black/95 flex items-center justify-center min-h-[320px] max-h-[70vh]">
              {previewMedia.resourceType === 'image' ? (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.originalName}
                  className="max-h-[68vh] w-auto max-w-full object-contain mx-auto"
                />
              ) : previewMedia.resourceType === 'video' ? (
                <video
                  src={previewMedia.url}
                  controls
                  autoPlay
                  className="max-h-[68vh] w-full max-w-full rounded-xl"
                />
              ) : previewMedia.resourceType === 'audio' ? (
                <div className="p-8 text-center space-y-4 w-full max-w-md">
                  <div className="w-20 h-20 rounded-full bg-purple-900/50 text-purple-400 flex items-center justify-center mx-auto">
                    <Headphones size={36} />
                  </div>
                  <p className="text-white text-sm font-semibold truncate">{previewMedia.originalName}</p>
                  <audio src={previewMedia.url} controls autoPlay className="w-full" />
                </div>
              ) : (
                <div className="p-8 text-center space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-amber-900/40 text-amber-400 flex items-center justify-center mx-auto">
                    <FileText size={36} />
                  </div>
                  <p className="text-white text-sm font-semibold">{previewMedia.originalName}</p>
                  <p className="text-xs text-white/60">{formatFileSize(previewMedia.bytes)}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <input
                  value={previewMedia.url}
                  readOnly
                  className="text-xs px-3 py-2 bg-surface-100 rounded-xl border border-surface-200 text-surface-600 font-mono flex-1 focus:outline-none"
                  onClick={(e) => e.target.select()}
                />
                <button
                  onClick={() => copyLink(previewMedia.url, previewMedia._id)}
                  className="btn-sm btn-primary flex items-center gap-1.5"
                >
                  <Copy size={13} />
                  Copy URL
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewMedia.url, previewMedia.originalName)}
                  className="btn-sm btn-outline flex items-center gap-1.5"
                >
                  <Download size={14} />
                  Download
                </button>
                <button
                  onClick={() => {
                    const toDelete = previewMedia;
                    setPreviewMedia(null);
                    setDeleteConfirmItem(toDelete);
                  }}
                  className="btn-sm text-red-600 hover:bg-red-50 rounded-xl border border-red-200 flex items-center gap-1.5 font-semibold"
                >
                  <Trash2 size={14} />
                  Delete File
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Delete Confirmation Modal ────────────────────────────────────── */}
      {deleteConfirmItem && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmItem(null)}
          title="Delete Media File"
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-50 rounded-xl flex items-start gap-3">
              <Trash2 size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-800">Permanently delete this file?</p>
                <p className="text-xs text-red-600 mt-0.5 truncate max-w-[240px]">
                  "{deleteConfirmItem.originalName}"
                </p>
                <p className="text-[11px] text-red-500/80 mt-1">
                  This will remove the file from Cloudinary and your Media Hub.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                disabled={deleting}
                className="btn-md btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMedia}
                disabled={deleting}
                className="btn-md flex-1 bg-red-600 text-white hover:bg-red-700 font-bold rounded-xl"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
