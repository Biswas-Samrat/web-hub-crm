import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, Plus, Upload, Sparkles, Image as ImageIcon, Paperclip, MoreVertical,
  Edit3, Trash2, Check, X, ChevronDown, FileText, Link2, MessageCircle,
  Clock, DollarSign, Brain, TrendingUp, Target, AlertCircle, Copy, Download,
  User, RefreshCw, Play, Pause, Headphones, Film, Eye, ExternalLink, Camera
} from 'lucide-react';
import {
  getConversation, addMessage, insertMessage, editMessage as editMsgApi,
  deleteMessage, bulkUploadMessages, clearConversation, analyzeConversation,
  uploadMedia
} from '../api/conversations';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

// ─── Media Detection Helper ──────────────────────────────────────────────────
function parseMediaFromMessage(msg) {
  if (msg.mediaUrl) {
    let type = msg.messageType || 'document';
    if (type === 'text') {
      type = inferMediaTypeFromUrl(msg.mediaUrl);
    }
    return {
      hasMedia: true,
      mediaUrl: msg.mediaUrl,
      mediaName: msg.mediaName || inferFileNameFromUrl(msg.mediaUrl),
      mediaType: type,
      text: msg.content || '',
    };
  }

  // Check if content itself is or contains a URL
  const content = msg.content || '';
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = content.match(urlRegex);

  if (match && match.length > 0) {
    const url = match[0];
    const inferredType = inferMediaTypeFromUrl(url);
    if (inferredType !== 'text') {
      const remainingText = content.replace(url, '').trim();
      return {
        hasMedia: true,
        mediaUrl: url,
        mediaName: inferFileNameFromUrl(url),
        mediaType: inferredType,
        text: remainingText,
      };
    }
  }

  return {
    hasMedia: false,
    text: content,
  };
}

function inferMediaTypeFromUrl(url) {
  if (!url) return 'text';
  const cleanUrl = url.toLowerCase().split('?')[0];

  if (/\.(jpg|jpeg|png|webp|gif|svg|bmp|avif)$/i.test(cleanUrl) || cleanUrl.includes('/image/upload/')) {
    return 'image';
  }
  if (/\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(cleanUrl) || cleanUrl.includes('/video/upload/')) {
    return 'video';
  }
  if (/\.(mp3|wav|ogg|aac|m4a|weba)$/i.test(cleanUrl)) {
    return 'audio';
  }
  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt|csv)$/i.test(cleanUrl) || cleanUrl.includes('/raw/upload/')) {
    return 'document';
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return 'link';
  }
  return 'text';
}

function inferFileNameFromUrl(url) {
  if (!url) return 'Attachment';
  try {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1].split('?')[0];
    return decodeURIComponent(lastPart) || 'Attachment';
  } catch {
    return 'Attachment';
  }
}

// ─── Main ConversationPage Component ─────────────────────────────────────────
export default function ConversationPage() {
  const { id: clientId } = useParams();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [clientInfo, setClientInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [senderMode, setSenderMode] = useState('me');
  const [sending, setSending] = useState(false);
  const [uploadingChatMedia, setUploadingChatMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Modals & Sheets
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [insertAfterMsg, setInsertAfterMsg] = useState(null);
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [contextMenuMsg, setContextMenuMsg] = useState(null);
  const [activeMediaPreview, setActiveMediaPreview] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await getConversation(clientId);
      setConversation(res.data.conversation);
      setClientInfo(res.data.client);
    } catch {
      toast.error('Failed to load conversation.');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [clientId, navigate]);

  useEffect(() => { load(); }, [load]);

  // Auto-scroll to bottom on first load & new messages
  useEffect(() => {
    if (messagesEndRef.current && conversation?.messages?.length) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages?.length]);

  // ─── Send Message ──────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!messageText.trim()) return;
    setSending(true);
    try {
      const content = messageText.trim();
      const detectedType = inferMediaTypeFromUrl(content);

      await addMessage(clientId, {
        sender: senderMode,
        content: content,
        messageType: detectedType !== 'text' ? detectedType : 'text',
        mediaUrl: detectedType !== 'text' && detectedType !== 'link' ? content : undefined,
        messageDate: new Date(),
      });
      setMessageText('');
      await load();
    } catch {
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // ─── Quick Direct File Attachment in Compose Bar ───────────────────────────
  const handleDirectFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingChatMedia(true);
    setUploadProgress(0);

    try {
      const res = await uploadMedia(file, (progressEvent) => {
        const p = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(p);
      });

      const media = res.data.media;
      let detectedType = media.resourceType || 'document';
      if (detectedType === 'raw') detectedType = 'document';

      await addMessage(clientId, {
        sender: senderMode,
        content: messageText.trim() || undefined,
        messageType: detectedType,
        mediaUrl: media.url,
        mediaName: media.originalName || file.name,
        messageDate: new Date(),
      });

      setMessageText('');
      toast.success(`${file.name} uploaded & sent!`);
      await load();
    } catch (err) {
      toast.error('Media upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingChatMedia(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Edit message save ────────────────────────────────────────────────────
  const handleEditSave = async (editData) => {
    try {
      await editMsgApi(clientId, editData.messageId, {
        content: editData.content,
        sender: editData.sender,
        messageDate: editData.messageDate,
        mediaUrl: editData.mediaUrl,
        mediaName: editData.mediaName,
        messageType: editData.messageType || 'text',
      });
      setEditingMessage(null);
      await load();
      toast.success('Message updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to edit message.');
    }
  };

  // ─── Delete message ───────────────────────────────────────────────────────
  const handleDelete = async (messageId) => {
    try {
      await deleteMessage(clientId, messageId);
      setContextMenuMsg(null);
      if (activeMediaPreview?.messageId === messageId) {
        setActiveMediaPreview(null);
      }
      await load();
      toast.success('Message deleted');
    } catch {
      toast.error('Failed to delete message.');
    }
  };

  // ─── Insert message anywhere in between ───────────────────────────────────
  const handleInsertSubmit = async (insertData) => {
    try {
      await insertMessage(clientId, {
        sender: insertData.sender,
        content: insertData.content,
        messageType: insertData.messageType || 'text',
        mediaUrl: insertData.mediaUrl,
        mediaName: insertData.mediaName,
        messageDate: insertData.messageDate || new Date(),
        afterMessageId: insertData.afterMessageId,
      });
      setInsertAfterMsg(null);
      setShowInsertModal(false);
      await load();
      toast.success('Message inserted into conversation');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to insert message.');
    }
  };

  // ─── AI Analysis ──────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!conversation?.messages?.length) {
      toast.error('Please add at least one message before analyzing.');
      return;
    }
    setAnalyzing(true);
    try {
      const res = await analyzeConversation(clientId);
      setConversation(prev => ({ ...prev, aiInsights: res.data.insights }));
      setShowAiInsights(true);
      toast.success('AI Conversation Analysis Complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── Clear conversation ───────────────────────────────────────────────────
  const handleClear = async () => {
    try {
      await clearConversation(clientId);
      setShowClearConfirm(false);
      await load();
      toast.success('Conversation cleared');
    } catch {
      toast.error('Failed to clear conversation.');
    }
  };

  // ─── Group messages by date ───────────────────────────────────────────────
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages?.forEach((msg) => {
      const date = new Date(msg.messageDate || msg.createdAt);
      const key = format(date, 'yyyy-MM-dd');
      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  };

  const formatDateLabel = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, d MMMM yyyy');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-surface-500 text-sm">Loading conversation...</p>
        </div>
      </div>
    );
  }

  const messages = conversation?.messages || [];
  const groupedMessages = groupMessagesByDate(messages);
  const hasInsights = !!conversation?.aiInsights?.summary;

  return (
    <div className="conv-page flex flex-col h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] bg-gradient-to-b from-surface-50 to-white">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="conv-header flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-xl border-b border-surface-100 sticky top-0 z-20">
        <button
          onClick={() => navigate(`/clients/${clientId}`)}
          className="p-2 -ml-2 rounded-xl hover:bg-surface-100 text-surface-500 transition-all"
          title="Back to client details"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm text-white font-bold text-sm">
          {clientInfo?.businessName?.charAt(0) || 'C'}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-surface-900 text-sm truncate">
            {clientInfo?.businessName || 'Messenger Conversation'}
          </h2>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <p className="text-xs text-surface-400">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Prominent AI Insights Button */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing || messages.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all ${
              analyzing
                ? 'bg-violet-100 text-violet-700 cursor-wait'
                : hasInsights
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-md hover:scale-[1.02] active:scale-95'
                : 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:shadow-md hover:scale-[1.02] active:scale-95'
            } disabled:opacity-40 disabled:hover:scale-100`}
            title="Analyze Conversation with AI"
          >
            {analyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-amber-200" />
                <span>{hasInsights ? 'View AI Insights' : 'AI Analysis'}</span>
              </>
            )}
          </button>

          {/* Quick Insert SMS Button */}
          <button
            onClick={() => {
              setInsertAfterMsg(messages[messages.length - 1] || null);
              setShowInsertModal(true);
            }}
            className="p-2 rounded-xl hover:bg-surface-100 text-surface-600 transition-all"
            title="Insert SMS"
          >
            <Plus size={18} />
          </button>

          {/* More actions dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-xl hover:bg-surface-100 text-surface-500 transition-all"
            >
              <MoreVertical size={18} />
            </button>

            {showActions && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowActions(false)} />
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-surface-100 py-1.5 z-40 animate-in fade-in slide-in-from-top-1">
                  <button
                    onClick={() => {
                      setShowActions(false);
                      setInsertAfterMsg(messages[messages.length - 1] || null);
                      setShowInsertModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                  >
                    <Plus size={16} className="text-blue-500" />
                    Insert Missing SMS
                  </button>
                  <button
                    onClick={() => { setShowActions(false); setShowBulkUpload(true); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                  >
                    <Upload size={16} className="text-brand-500" />
                    Bulk Upload JSON / Paste
                  </button>
                  <button
                    onClick={() => { setShowActions(false); setShowMediaUpload(true); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                  >
                    <ImageIcon size={16} className="text-emerald-500" />
                    Upload Media (Cloudinary)
                  </button>
                  <button
                    onClick={() => { setShowActions(false); handleAnalyze(); }}
                    disabled={analyzing || messages.length === 0}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors disabled:opacity-40"
                  >
                    <Brain size={16} className="text-violet-500" />
                    {analyzing ? 'Analyzing...' : 'AI Conversation Analysis'}
                  </button>
                  <button
                    onClick={() => { setShowActions(false); handleExportJSON(); }}
                    disabled={messages.length === 0}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors disabled:opacity-40"
                  >
                    <Download size={16} className="text-sky-500" />
                    Export Chat as JSON
                  </button>
                  <div className="border-t border-surface-100 my-1" />
                  <button
                    onClick={() => { setShowActions(false); setShowClearConfirm(true); }}
                    disabled={messages.length === 0}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    <Trash2 size={16} />
                    Clear All Messages
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── AI Quick Insights Banner ──────────────────────────────────── */}
      {hasInsights && (
        <button
          onClick={() => setShowAiInsights(true)}
          className="mx-3 mt-2 px-4 py-2.5 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl flex items-center gap-3 hover:shadow-md transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-white" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs font-semibold text-violet-700 flex items-center gap-1">
              <span>AI Insights Available</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-violet-200 text-violet-800 rounded font-normal">Tap to view</span>
            </p>
            <p className="text-xs text-violet-600/80 truncate">{conversation.aiInsights.summary}</p>
          </div>
          {conversation.aiInsights.finalPrice?.amount && (
            <div className="flex-shrink-0 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
              {conversation.aiInsights.finalPrice.currency || '£'}{conversation.aiInsights.finalPrice.amount}
            </div>
          )}
          <ChevronDown size={14} className="text-violet-400 group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* ─── Messages Area ────────────────────────────────────────────── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
        onClick={() => setContextMenuMsg(null)}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
              <MessageCircle size={36} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-800 mb-1">No messages recorded yet</h3>
              <p className="text-sm text-surface-400 max-w-xs">
                Start typing messages, attach photos/videos, paste copied chat from Messenger, or upload a JSON backup.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => inputRef.current?.focus()}
                className="btn-sm btn-primary"
              >
                <Send size={14} />
                Type a Message
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-sm bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Camera size={14} />
                Attach Photo / Video
              </button>
              <button
                onClick={() => setShowBulkUpload(true)}
                className="btn-sm btn-outline"
              >
                <Upload size={14} />
                Bulk Upload / Paste
              </button>
            </div>
          </div>
        ) : (
          groupedMessages.map(([dateKey, msgs]) => (
            <div key={dateKey}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <div className="px-3.5 py-1 bg-surface-100/90 backdrop-blur-sm rounded-full text-xs text-surface-500 font-medium shadow-sm border border-surface-200/50">
                  {formatDateLabel(dateKey)}
                </div>
              </div>

              {msgs.map((msg, idx) => (
                <div key={msg._id || idx}>
                  <MessageBubble
                    msg={msg}
                    onEdit={() => setEditingMessage(msg)}
                    onDelete={() => handleDelete(msg._id)}
                    onOpenPreview={(mediaData) => setActiveMediaPreview({ ...mediaData, messageId: msg._id })}
                    onInsertAfter={() => {
                      setInsertAfterMsg(msg);
                      setShowInsertModal(true);
                    }}
                    contextMenuMsg={contextMenuMsg}
                    setContextMenuMsg={setContextMenuMsg}
                  />

                  {/* Subtle Insert Divider between messages */}
                  <div className="relative group/insert my-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-full h-px bg-surface-200" />
                    <button
                      onClick={() => {
                        setInsertAfterMsg(msg);
                        setShowInsertModal(true);
                      }}
                      className="absolute bg-white hover:bg-blue-50 text-surface-500 hover:text-blue-600 border border-surface-200 hover:border-blue-300 rounded-full px-2.5 py-0.5 text-[11px] font-medium shadow-sm transition-all flex items-center gap-1"
                    >
                      <Plus size={11} /> Insert SMS here
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Compose Bar ──────────────────────────────────────────────── */}
      <div className="conv-compose bg-white/95 backdrop-blur-xl border-t border-surface-100 px-3 py-2.5 safe-area-bottom shadow-sm">
        {/* Sender toggle & quick actions */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-400 font-medium">Sender:</span>
            <button
              onClick={() => setSenderMode(senderMode === 'me' ? 'them' : 'me')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                senderMode === 'me'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-purple-600 text-white shadow-sm'
              }`}
            >
              <User size={12} />
              {senderMode === 'me' ? 'Me (You)' : 'Client (Them)'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingChatMedia}
              className="text-xs text-surface-600 hover:text-emerald-600 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-emerald-50 transition-colors font-medium"
              title="Attach photo, video or audio note directly"
            >
              <Paperclip size={13} className="text-emerald-600" />
              <span>Attach File</span>
            </button>
            <button
              onClick={() => {
                setInsertAfterMsg(messages[messages.length - 1] || null);
                setShowInsertModal(true);
              }}
              className="text-xs text-surface-600 hover:text-blue-600 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-blue-50 transition-colors font-medium"
            >
              <Plus size={13} className="text-blue-600" />
              <span>Insert SMS</span>
            </button>
          </div>
        </div>

        {/* Uploading progress indicator */}
        {uploadingChatMedia && (
          <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-emerald-800 truncate">Uploading media to Cloudinary...</p>
              <div className="w-full h-1.5 bg-emerald-200 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700">{uploadProgress}%</span>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-end gap-2">
          {/* Hidden File Picker */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleDirectFileUpload}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingChatMedia}
            className="w-11 h-11 rounded-2xl bg-surface-100 hover:bg-emerald-50 text-surface-600 hover:text-emerald-600 flex items-center justify-center transition-colors flex-shrink-0"
            title="Attach Image / Video / Audio"
          >
            <Camera size={19} />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder={
                senderMode === 'me'
                  ? 'Type message sent by you (or paste a media link)...'
                  : 'Type message sent by client (or paste a media link)...'
              }
              className="w-full resize-none rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-surface-400 min-h-[44px] max-h-[120px]"
              rows={1}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!messageText.trim() || sending}
            className="w-11 h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none flex-shrink-0"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>

      {/* ─── Modals ──────────────────────────────────────────────────── */}
      {/* Lightbox / Media Viewer Modal */}
      {activeMediaPreview && (
        <MediaViewerModal
          media={activeMediaPreview}
          onClose={() => setActiveMediaPreview(null)}
          onDeleteMessage={activeMediaPreview.messageId ? () => handleDelete(activeMediaPreview.messageId) : null}
        />
      )}

      {/* Edit Message Modal */}
      {editingMessage && (
        <EditMessageModal
          message={editingMessage}
          onClose={() => setEditingMessage(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Insert Message Modal */}
      {showInsertModal && (
        <InsertMessageModal
          referenceMessage={insertAfterMsg}
          onClose={() => {
            setShowInsertModal(false);
            setInsertAfterMsg(null);
          }}
          onInsert={handleInsertSubmit}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          clientId={clientId}
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => { setShowBulkUpload(false); load(); }}
        />
      )}

      {/* Media Upload Modal */}
      {showMediaUpload && (
        <MediaUploadModal
          onClose={() => setShowMediaUpload(false)}
          onMediaInserted={load}
        />
      )}

      {/* AI Insights Modal */}
      {showAiInsights && conversation?.aiInsights && (
        <AiInsightsModal
          insights={conversation.aiInsights}
          onClose={() => setShowAiInsights(false)}
          onReanalyze={handleAnalyze}
          analyzing={analyzing}
        />
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <Modal isOpen={true} onClose={() => setShowClearConfirm(false)} title="Clear Conversation" size="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">This action is permanent</p>
                <p className="text-xs text-red-600 mt-1">
                  All {messages.length} messages and AI insights will be removed from this client.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowClearConfirm(false)} className="btn-md btn-outline flex-1">
                Cancel
              </button>
              <button onClick={handleClear} className="btn-md flex-1 bg-red-600 text-white hover:bg-red-700 rounded-xl font-medium">
                Delete All
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );

  // ─── Export JSON helper ───────────────────────────────────────────────
  function handleExportJSON() {
    const exportData = messages.map((m) => ({
      sender: m.sender,
      content: m.content,
      messageType: m.messageType,
      mediaUrl: m.mediaUrl || undefined,
      mediaName: m.mediaName || undefined,
      messageDate: m.messageDate,
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${clientInfo?.businessName || clientId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported conversation as JSON');
  }
}

// ─── Message Bubble Component ──────────────────────────────────────────────────
function MessageBubble({
  msg, onEdit, onDelete, onOpenPreview, onInsertAfter, contextMenuMsg, setContextMenuMsg
}) {
  const isMe = msg.sender === 'me';
  const time = format(new Date(msg.messageDate || msg.createdAt), 'h:mm a');
  const isContextOpen = contextMenuMsg === msg._id;
  const parsed = parseMediaFromMessage(msg);

  const handleDownloadFile = (url, name) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'file';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderMediaContent = () => {
    if (!parsed.hasMedia) return null;

    const { mediaUrl, mediaName, mediaType } = parsed;

    // IMAGE
    if (mediaType === 'image') {
      return (
        <div className="mt-2 group/media relative rounded-xl overflow-hidden max-w-[290px] border border-black/10 bg-black/5">
          <img
            src={mediaUrl}
            alt={mediaName}
            className="w-full h-auto max-h-[300px] object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPreview({ url: mediaUrl, originalName: mediaName, resourceType: 'image' });
            }}
          />
          {/* Hover Action Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none group-hover/media:pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenPreview({ url: mediaUrl, originalName: mediaName, resourceType: 'image' });
              }}
              className="p-2 rounded-full bg-white/95 text-surface-800 hover:scale-110 transition-transform shadow-md"
              title="View Full Size"
            >
              <Eye size={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadFile(mediaUrl, mediaName);
              }}
              className="p-2 rounded-full bg-white/95 text-surface-800 hover:scale-110 transition-transform shadow-md"
              title="Download Image"
            >
              <Download size={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 rounded-full bg-red-600 text-white hover:scale-110 transition-transform shadow-md"
              title="Delete Photo"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      );
    }

    // VIDEO
    if (mediaType === 'video') {
      return (
        <div className="mt-2 rounded-xl overflow-hidden max-w-[320px] bg-slate-950 border border-black/20 shadow-md">
          <div className="relative group/video">
            <video
              src={mediaUrl}
              controls
              className="w-full h-auto max-h-[280px] rounded-t-xl"
              preload="metadata"
            />
          </div>
          {/* Video bottom control bar */}
          <div className="p-2.5 bg-slate-900 flex items-center justify-between gap-2 text-white">
            <span className="text-[11px] font-medium truncate flex-1 opacity-90">{mediaName}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPreview({ url: mediaUrl, originalName: mediaName, resourceType: 'video' });
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Popout Video Player"
              >
                <Eye size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadFile(mediaUrl, mediaName);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Download Video"
              >
                <Download size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white transition-colors"
                title="Delete Video"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // AUDIO
    if (mediaType === 'audio') {
      return (
        <div className={`mt-2 p-3 rounded-xl border max-w-[280px] ${
          isMe
            ? 'bg-white/15 border-white/20 text-white'
            : 'bg-purple-50 border-purple-200 text-purple-950'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isMe ? 'bg-white/20' : 'bg-purple-200 text-purple-800'
            }`}>
              <Headphones size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{mediaName || 'Voice Note / Audio'}</p>
              <span className="text-[10px] opacity-75">Audio Recording</span>
            </div>
          </div>
          <audio src={mediaUrl} controls className="w-full h-8" preload="metadata" />
          <div className="flex items-center justify-end gap-1.5 mt-2 pt-1 border-t border-current/10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadFile(mediaUrl, mediaName);
              }}
              className="text-[11px] font-semibold flex items-center gap-1 hover:underline opacity-90"
            >
              <Download size={11} /> Download
            </button>
            <span className="opacity-40">•</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-[11px] font-semibold flex items-center gap-1 hover:underline text-red-400 hover:text-red-600"
            >
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
      );
    }

    // DOCUMENT / LINK
    return (
      <div className={`mt-2 p-2.5 rounded-xl border max-w-[280px] flex items-center justify-between gap-2 transition-all ${
        isMe
          ? 'bg-white/15 border-white/25 text-white hover:bg-white/20'
          : 'bg-surface-50 border-surface-200 text-surface-800 hover:bg-surface-100'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isMe ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
          }`}>
            {mediaType === 'link' ? <Link2 size={16} /> : <FileText size={16} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate">{mediaName || 'Attachment'}</p>
            <span className="text-[10px] opacity-70">
              {mediaType === 'link' ? 'Web Link' : 'File Document'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadFile(mediaUrl, mediaName);
            }}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
            title="Download / Open File"
          >
            <Download size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex mb-2 group relative ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[88%] sm:max-w-[70%]`}>
        {/* Desktop Hover Action Floating Bar */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 hidden sm:group-hover:flex items-center gap-1 z-10 px-2 py-1 bg-white/95 backdrop-blur-md rounded-full shadow-md border border-surface-200 ${
            isMe ? '-left-28' : '-right-28'
          }`}
        >
          <button
            onClick={onEdit}
            className="p-1 text-surface-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Edit message"
          >
            <Edit3 size={13} />
          </button>
          <button
            onClick={onInsertAfter}
            className="p-1 text-surface-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
            title="Insert SMS after this"
          >
            <Plus size={13} />
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(msg.content || msg.mediaUrl || '');
              toast.success('Copied to clipboard');
            }}
            className="p-1 text-surface-600 hover:text-surface-900 hover:bg-surface-100 rounded-full transition-colors"
            title="Copy text"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-surface-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Delete message"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Bubble */}
        <div
          className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed transition-all cursor-pointer ${
            isMe
              ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md shadow-sm active:scale-[0.99]'
              : 'bg-white text-surface-800 rounded-bl-md shadow-sm border border-surface-200/80 active:scale-[0.99]'
          }`}
          onClick={() => setContextMenuMsg(isContextOpen ? null : msg._id)}
        >
          {parsed.text && (
            <p className="whitespace-pre-wrap break-words">{parsed.text}</p>
          )}
          {renderMediaContent()}
        </div>

        {/* Footer: Time + Mobile-Visible Actions Bar */}
        <div className={`flex items-center gap-2 mt-1 px-1 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-surface-400">{time}</span>
          {msg.isEdited && (
            <span className="text-[10px] text-surface-400 italic">• edited</span>
          )}

          {/* Quick-Access Mobile Action Icons */}
          <div className="flex items-center gap-1 sm:hidden">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1 text-surface-400 hover:text-blue-600 active:text-blue-600 rounded transition-colors"
              title="Edit"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onInsertAfter(); }}
              className="p-1 text-surface-400 hover:text-emerald-600 active:text-emerald-600 rounded transition-colors"
              title="Insert after"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 text-red-400 hover:text-red-600 active:text-red-600 rounded transition-colors"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setContextMenuMsg(isContextOpen ? null : msg._id); }}
              className="p-1 text-surface-400 hover:text-surface-700 rounded transition-colors"
              title="Options"
            >
              <MoreVertical size={12} />
            </button>
          </div>
        </div>

        {/* Mobile Slide-Up Action Sheet / Menu */}
        {isContextOpen && (
          <>
            <div className="fixed inset-0 bg-black/30 z-30 sm:hidden" onClick={() => setContextMenuMsg(null)} />
            <div
              className="fixed sm:absolute bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-0 sm:top-full z-40 bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl sm:shadow-xl border border-surface-200 py-3 sm:py-1.5 sm:w-48 animate-in slide-in-from-bottom-5 sm:slide-in-from-top-1"
            >
              <div className="sm:hidden px-4 pb-2 mb-1 border-b border-surface-100 flex items-center justify-between">
                <span className="text-xs font-bold text-surface-700">Message Options</span>
                <button onClick={() => setContextMenuMsg(null)} className="p-1 text-surface-400">
                  <X size={16} />
                </button>
              </div>
              <button
                onClick={() => { onEdit(); setContextMenuMsg(null); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs sm:text-xs font-medium text-surface-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <Edit3 size={15} className="text-blue-500" /> Edit Message
              </button>
              <button
                onClick={() => { onInsertAfter(); setContextMenuMsg(null); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs sm:text-xs font-medium text-surface-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                <Plus size={15} className="text-emerald-500" /> Insert SMS After
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(msg.content || msg.mediaUrl || '');
                  setContextMenuMsg(null);
                  toast.success('Copied text');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs sm:text-xs font-medium text-surface-700 hover:bg-surface-50 transition-colors"
              >
                <Copy size={15} className="text-surface-400" /> Copy Content
              </button>
              <div className="border-t border-surface-100 my-1" />
              <button
                onClick={() => { onDelete(); setContextMenuMsg(null); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs sm:text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={15} className="text-red-500" /> Delete Message / Media
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Lightbox / Media Viewer Modal for Chat ──────────────────────────────────
function MediaViewerModal({ media, onClose, onDeleteMessage }) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = media.url;
    a.download = media.originalName || 'download';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(media.url);
    toast.success('Media URL copied!');
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={media.originalName || 'Media Player'} size="xl">
      <div className="space-y-4">
        <div className="rounded-2xl overflow-hidden bg-black/95 flex items-center justify-center min-h-[300px] max-h-[70vh]">
          {media.resourceType === 'image' ? (
            <img
              src={media.url}
              alt={media.originalName}
              className="max-h-[68vh] w-auto max-w-full object-contain mx-auto"
            />
          ) : media.resourceType === 'video' ? (
            <video
              src={media.url}
              controls
              autoPlay
              className="max-h-[68vh] w-full max-w-full rounded-xl"
            />
          ) : media.resourceType === 'audio' ? (
            <div className="p-8 text-center space-y-4 w-full max-w-md">
              <div className="w-16 h-16 rounded-full bg-purple-900/50 text-purple-400 flex items-center justify-center mx-auto">
                <Headphones size={32} />
              </div>
              <p className="text-white text-sm font-semibold truncate">{media.originalName}</p>
              <audio src={media.url} controls autoPlay className="w-full" />
            </div>
          ) : (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-900/40 text-amber-400 flex items-center justify-center mx-auto">
                <FileText size={32} />
              </div>
              <p className="text-white text-sm font-semibold">{media.originalName}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input
              value={media.url}
              readOnly
              className="text-xs px-3 py-2 bg-surface-100 rounded-xl border border-surface-200 text-surface-600 font-mono flex-1 focus:outline-none"
              onClick={(e) => e.target.select()}
            />
            <button onClick={copyUrl} className="btn-sm btn-primary flex items-center gap-1.5">
              <Copy size={13} /> Copy Link
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleDownload} className="btn-sm btn-outline flex items-center gap-1.5">
              <Download size={14} /> Download
            </button>
            {onDeleteMessage && (
              <button
                onClick={onDeleteMessage}
                className="btn-sm text-red-600 hover:bg-red-50 rounded-xl border border-red-200 flex items-center gap-1.5 font-semibold"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Edit Message Modal ────────────────────────────────────────────────────────
function EditMessageModal({ message, onClose, onSave }) {
  const [content, setContent] = useState(message.content || '');
  const [sender, setSender] = useState(message.sender || 'me');
  const [mediaUrl, setMediaUrl] = useState(message.mediaUrl || '');
  const [mediaName, setMediaName] = useState(message.mediaName || '');
  const [messageType, setMessageType] = useState(message.messageType || 'text');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  
  const d = new Date(message.messageDate || message.createdAt);
  const pad = (n) => String(n).padStart(2, '0');
  const defaultDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const [dateStr, setDateStr] = useState(defaultDateStr);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadMedia(file);
      setMediaUrl(res.data.media.url);
      setMediaName(res.data.media.originalName || file.name);
      setMessageType(res.data.media.resourceType || 'image');
      toast.success('File uploaded to Cloudinary!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl.trim()) {
      toast.error('Message content or media link is required');
      return;
    }
    onSave({
      messageId: message._id,
      content: content.trim(),
      sender,
      mediaUrl: mediaUrl.trim() || undefined,
      mediaName: mediaName.trim() || undefined,
      messageType: mediaUrl.trim() ? (messageType === 'text' ? inferMediaTypeFromUrl(mediaUrl) : messageType) : 'text',
      messageDate: new Date(dateStr),
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Message" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sender toggle */}
        <div>
          <label className="block text-xs font-semibold text-surface-700 mb-1.5">Sender</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSender('me')}
              className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                sender === 'me'
                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                  : 'border-surface-200 text-surface-600 hover:bg-surface-50'
              }`}
            >
              👤 Me (You)
            </button>
            <button
              type="button"
              onClick={() => setSender('them')}
              className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                sender === 'them'
                  ? 'bg-purple-50 border-purple-500 text-purple-700 font-semibold'
                  : 'border-surface-200 text-surface-600 hover:bg-surface-50'
              }`}
            >
              👥 Client (Them)
            </button>
          </div>
        </div>

        {/* Message Text */}
        <div>
          <label className="block text-xs font-semibold text-surface-700 mb-1.5">Message Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full text-sm p-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            placeholder="Edit message text..."
            autoFocus
          />
        </div>

        {/* Date / Timestamp */}
        <div>
          <label className="block text-xs font-semibold text-surface-700 mb-1.5">Date & Time</label>
          <input
            type="datetime-local"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Media URL + Upload File */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-surface-700">Media Attachment</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              <Paperclip size={12} />
              {uploading ? 'Uploading...' : 'Upload new file'}
            </button>
          </div>
          <input
            type="text"
            value={mediaUrl}
            onChange={(e) => {
              setMediaUrl(e.target.value);
              setMessageType(inferMediaTypeFromUrl(e.target.value));
            }}
            placeholder="https://res.cloudinary.com/... or paste link"
            className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <input
            ref={fileRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-md btn-outline flex-1">
            Cancel
          </button>
          <button type="submit" className="btn-md btn-primary flex-1">
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Insert Message Modal ──────────────────────────────────────────────────────
function InsertMessageModal({ referenceMessage, onClose, onInsert }) {
  const [content, setContent] = useState('');
  const [sender, setSender] = useState('them');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaName, setMediaName] = useState('');
  const [messageType, setMessageType] = useState('text');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const defaultDate = referenceMessage
    ? new Date(new Date(referenceMessage.messageDate || referenceMessage.createdAt).getTime() + 60000)
    : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const defaultDateStr = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(defaultDate.getDate())}T${pad(defaultDate.getHours())}:${pad(defaultDate.getMinutes())}`;
  const [dateStr, setDateStr] = useState(defaultDateStr);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadMedia(file);
      setMediaUrl(res.data.media.url);
      setMediaName(res.data.media.originalName || file.name);
      setMessageType(res.data.media.resourceType || 'image');
      toast.success('File uploaded to Cloudinary!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl.trim()) {
      toast.error('Message content or media link is required');
      return;
    }
    onInsert({
      afterMessageId: referenceMessage?._id,
      content: content.trim(),
      sender,
      mediaUrl: mediaUrl.trim() || undefined,
      mediaName: mediaName.trim() || undefined,
      messageType: mediaUrl.trim() ? (messageType === 'text' ? inferMediaTypeFromUrl(mediaUrl) : messageType) : 'text',
      messageDate: new Date(dateStr),
    });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={referenceMessage ? 'Insert SMS in Conversation' : 'Add New SMS'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {referenceMessage && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
            <span className="font-semibold">Inserting after: </span>
            <span className="italic truncate block text-blue-700 mt-0.5">
              "{referenceMessage.content?.substring(0, 60)}..."
            </span>
          </div>
        )}

        {/* Sender toggle */}
        <div>
          <label className="block text-xs font-semibold text-surface-700 mb-1.5">Who sent this SMS?</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSender('me')}
              className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                sender === 'me'
                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                  : 'border-surface-200 text-surface-600 hover:bg-surface-50'
              }`}
            >
              👤 Me (You)
            </button>
            <button
              type="button"
              onClick={() => setSender('them')}
              className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                sender === 'them'
                  ? 'bg-purple-50 border-purple-500 text-purple-700 font-semibold'
                  : 'border-surface-200 text-surface-600 hover:bg-surface-50'
              }`}
            >
              👥 Client (Them)
            </button>
          </div>
        </div>

        {/* Message Content */}
        <div>
          <label className="block text-xs font-semibold text-surface-700 mb-1.5">Message Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full text-sm p-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            placeholder="Type or paste the missed SMS here..."
            autoFocus
          />
        </div>

        {/* Date / Timestamp */}
        <div>
          <label className="block text-xs font-semibold text-surface-700 mb-1.5">Date & Time</label>
          <input
            type="datetime-local"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Media attachment */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-surface-700">Media Attachment (Optional)</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              <Paperclip size={12} />
              {uploading ? 'Uploading...' : 'Upload file to Cloudinary'}
            </button>
          </div>
          <input
            type="text"
            value={mediaUrl}
            onChange={(e) => {
              setMediaUrl(e.target.value);
              setMessageType(inferMediaTypeFromUrl(e.target.value));
            }}
            placeholder="https://res.cloudinary.com/... or paste URL"
            className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <input
            ref={fileRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-md btn-outline flex-1">
            Cancel
          </button>
          <button type="submit" className="btn-md btn-primary flex-1">
            Insert SMS
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Bulk Upload Modal ─────────────────────────────────────────────────────────
function BulkUploadModal({ clientId, onClose, onSuccess }) {
  const [jsonText, setJsonText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState('paste');
  const fileRef = useRef(null);

  const sampleJSON = JSON.stringify([
    {
      sender: "me",
      content: "Hello! I saw your dental clinic page on Facebook.",
      messageDate: "2024-01-15T10:00:00Z",
      messageType: "text"
    },
    {
      sender: "them",
      content: "Hi! Yes, we need a modern appointment booking website.",
      messageDate: "2024-01-15T10:05:00Z",
      messageType: "text"
    },
    {
      sender: "me",
      content: "Great! Our packages start at £350 including mobile design & SEO.",
      messageDate: "2024-01-15T10:10:00Z",
      messageType: "text"
    },
    {
      sender: "them",
      content: "Sounds fair! Can you share some live demo examples?",
      messageDate: "2024-01-15T10:15:00Z",
      messageType: "text"
    },
    {
      sender: "me",
      content: "Here is a preview screenshot of a recent dental clinic website.",
      mediaUrl: "https://res.cloudinary.com/dj7ongatv/image/upload/v1/demo.jpg",
      mediaName: "dental-demo.jpg",
      messageType: "image",
      messageDate: "2024-01-15T10:20:00Z"
    }
  ], null, 2);

  const samplePlainText = `Me: Hello! I saw your business page on Facebook.
Client: Hi! Yes, we need a new website for our business.
Me: Great! We can design a modern website for £350 with SEO and mobile responsiveness.
Client: Sounds perfect. Let's do it!`;

  const handleFileLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setJsonText(ev.target.result);
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    try {
      let messages = [];

      if (jsonText.trim().startsWith('[') || jsonText.trim().startsWith('{')) {
        const parsed = JSON.parse(jsonText);
        messages = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const lines = jsonText.split('\n').filter(l => l.trim().length > 0);
        messages = lines.map((line, idx) => {
          const lower = line.toLowerCase();
          let sender = 'them';
          let content = line;
          if (lower.startsWith('me:') || lower.startsWith('you:')) {
            sender = 'me';
            content = line.replace(/^(me|you):\s*/i, '');
          } else if (lower.startsWith('client:') || lower.startsWith('them:')) {
            sender = 'them';
            content = line.replace(/^(client|them):\s*/i, '');
          }
          const baseDate = new Date(Date.now() - (lines.length - idx) * 60000);
          return { sender, content: content.trim(), messageDate: baseDate, messageType: 'text' };
        });
      }

      if (messages.length === 0) {
        toast.error('No messages found to upload');
        return;
      }

      setUploading(true);
      await bulkUploadMessages(clientId, messages);
      toast.success(`Imported ${messages.length} messages successfully!`);
      onSuccess();
    } catch (err) {
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Bulk Upload Conversation" size="lg">
      <div className="space-y-4">
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
            <span className="text-xs font-bold text-blue-900">💡 Demo Formats:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setJsonText(sampleJSON)}
                className="px-2.5 py-1 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                📋 Load Sample JSON
              </button>
              <button
                type="button"
                onClick={() => setJsonText(samplePlainText)}
                className="px-2.5 py-1 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                💬 Load Sample Messenger Text
              </button>
            </div>
          </div>
          <p className="text-[11px] text-blue-700 leading-normal">
            Paste a <strong>JSON array</strong> or plain <strong>Messenger chat text</strong> (with <code>Me:</code> or <code>Client:</code> per line).
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMode('paste')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === 'paste' ? 'bg-blue-600 text-white shadow-xs' : 'bg-surface-100 text-surface-600'
            }`}
          >
            📋 Paste Text / JSON
          </button>
          <button
            onClick={() => setMode('file')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === 'file' ? 'bg-blue-600 text-white shadow-xs' : 'bg-surface-100 text-surface-600'
            }`}
          >
            📁 Upload JSON File
          </button>
        </div>

        {mode === 'file' ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-surface-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 transition-all"
          >
            <FileText size={32} className="mx-auto text-surface-400 mb-2" />
            <p className="text-sm font-medium text-surface-600">Click to select .json file</p>
            <input ref={fileRef} type="file" accept=".json" onChange={handleFileLoad} className="hidden" />
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={9}
              className="w-full text-xs font-mono p-3 rounded-xl border border-surface-200 bg-surface-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              placeholder={`Paste JSON array or plain text lines like:\nMe: Hi, how can I help?\nClient: I need a website for my business.`}
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="btn-md btn-outline flex-1">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!jsonText.trim() || uploading}
            className="btn-md btn-primary flex-1 gap-2"
          >
            {uploading ? 'Importing...' : 'Import Messages'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Media Upload Modal (Cloudinary) ───────────────────────────────────────────
function MediaUploadModal({ onClose, onMediaInserted }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef(null);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setResults([]);
  };

  const handleUploadAll = async () => {
    setUploading(true);
    setResults([]);
    const uploaded = [];

    for (let i = 0; i < files.length; i++) {
      try {
        setProgress(Math.round(((i) / files.length) * 100));
        const res = await uploadMedia(files[i]);
        uploaded.push(res.data.media);
      } catch (err) {
        uploaded.push({ error: true, originalName: files[i].name, message: err.message });
      }
    }

    setProgress(100);
    setResults(uploaded);
    setUploading(false);
    toast.success(`Uploaded ${uploaded.filter((r) => !r.error).length} of ${files.length} files`);
    if (onMediaInserted) onMediaInserted();
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Upload Media to Cloudinary" size="lg">
      <div className="space-y-4">
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-xs text-emerald-800">
            <strong>💡 Cloudinary Storage:</strong> Upload images, videos, audio notes, or documents. Copy the resulting link to paste into any message.
          </p>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-surface-300 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
        >
          <ImageIcon size={32} className="mx-auto text-surface-400 mb-2" />
          <p className="text-sm font-medium text-surface-600">
            Click to select files
          </p>
          <p className="text-xs text-surface-400 mt-1">
            Images, videos, audio, PDFs, documents
          </p>
          <input
            ref={fileRef}
            type="file"
            multiple
            onChange={handleFiles}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
          />
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-surface-700">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
            <div className="max-h-[160px] overflow-y-auto space-y-1.5">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-surface-50 rounded-lg text-xs">
                  {file.type.startsWith('image/') ? <ImageIcon size={14} className="text-emerald-500" /> :
                   file.type.startsWith('video/') ? <Film size={14} className="text-blue-500" /> :
                   <Paperclip size={14} className="text-surface-400" />}
                  <span className="truncate flex-1 text-surface-700">{file.name}</span>
                  <span className="text-[10px] text-surface-400">
                    {(file.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-center text-surface-500">Uploading to Cloudinary... {progress}%</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-surface-700">✅ Uploaded Files</p>
            <div className="max-h-[220px] overflow-y-auto space-y-2">
              {results.map((r, i) => (
                <div key={i} className={`p-3 rounded-xl border ${
                  r.error ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  {r.error ? (
                    <p className="text-xs text-red-600">❌ {r.originalName}: {r.message}</p>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-emerald-800 truncate mr-2">
                          {r.originalName}
                        </span>
                        <button
                          onClick={() => copyLink(r.url)}
                          className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-colors flex-shrink-0"
                        >
                          <Copy size={10} />
                          Copy Link
                        </button>
                      </div>
                      <input
                        value={r.url}
                        readOnly
                        className="w-full text-[10px] px-2 py-1.5 bg-white rounded border border-emerald-200 text-surface-600 font-mono"
                        onClick={(e) => e.target.select()}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {files.length > 0 && results.length === 0 && (
          <button
            onClick={handleUploadAll}
            disabled={uploading}
            className="btn-lg w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>
    </Modal>
  );
}

// ─── AI Insights Modal ──────────────────────────────────────────────────────────
function AiInsightsModal({ insights, onClose, onReanalyze, analyzing }) {
  const sentimentColors = {
    positive: 'bg-emerald-100 text-emerald-700',
    neutral: 'bg-surface-100 text-surface-700',
    negative: 'bg-red-100 text-red-700',
    mixed: 'bg-amber-100 text-amber-700',
  };

  const interestColors = {
    very_low: 'bg-red-100 text-red-700',
    low: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-emerald-100 text-emerald-700',
    very_high: 'bg-green-100 text-green-700',
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="✨ AI Conversation Insights" size="md">
      <div className="space-y-4">
        {/* Summary */}
        <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={16} className="text-violet-600" />
            <span className="text-xs font-bold text-violet-700 uppercase tracking-wide">Summary</span>
          </div>
          <p className="text-sm text-violet-950 leading-relaxed">{insights.summary}</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wide mb-1">Sentiment</p>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${sentimentColors[insights.sentiment] || sentimentColors.neutral}`}>
              {insights.sentiment}
            </span>
          </div>
          <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wide mb-1">Interest Level</p>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${interestColors[insights.clientInterestLevel] || interestColors.medium}`}>
              {insights.clientInterestLevel?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Final price */}
        {insights.finalPrice?.amount && (
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Final / Agreed Budget</span>
            </div>
            <p className="text-2xl font-bold text-emerald-800">
              {insights.finalPrice.currency === 'GBP' ? '£' :
               insights.finalPrice.currency === 'USD' ? '$' :
               insights.finalPrice.currency === 'EUR' ? '€' :
               insights.finalPrice.currency + ' '}
              {insights.finalPrice.amount?.toLocaleString()}
            </p>
            {insights.finalPrice.context && (
              <p className="text-xs text-emerald-600 mt-1">{insights.finalPrice.context}</p>
            )}
          </div>
        )}

        {/* Prices discussed */}
        {insights.pricesDiscussed?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-surface-700 mb-2 flex items-center gap-1.5">
              <DollarSign size={13} />
              Prices Mentioned
            </p>
            <div className="space-y-1.5">
              {insights.pricesDiscussed.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-surface-50 rounded-lg border border-surface-100 text-xs">
                  <span className="font-semibold text-surface-800">
                    {p.currency === 'GBP' ? '£' : p.currency === 'USD' ? '$' : p.currency === 'EUR' ? '€' : p.currency + ' '}
                    {p.amount?.toLocaleString()}
                  </span>
                  <span className="text-surface-500 truncate max-w-[60%] text-right">{p.context}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key topics */}
        {insights.keyTopics?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-surface-700 mb-2 flex items-center gap-1.5">
              <Target size={13} />
              Key Topics
            </p>
            <div className="flex flex-wrap gap-1.5">
              {insights.keyTopics.map((topic, i) => (
                <span key={i} className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium border border-brand-200">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action items */}
        {insights.actionItems?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-surface-700 mb-2 flex items-center gap-1.5">
              <TrendingUp size={13} />
              Recommended Next Steps
            </p>
            <ul className="space-y-1.5">
              {insights.actionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-surface-700">
                  <span className="w-4 h-4 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Analyzed date */}
        {insights.analyzedAt && (
          <p className="text-[10px] text-center text-surface-400">
            Last analyzed: {format(new Date(insights.analyzedAt), 'd MMM yyyy, h:mm a')}
          </p>
        )}

        <button
          onClick={onReanalyze}
          disabled={analyzing}
          className="btn-md w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
        >
          {analyzing ? (
            <span className="flex items-center gap-2 justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Re-analyzing with AI...
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              <RefreshCw size={15} />
              Re-analyze Conversation
            </span>
          )}
        </button>
      </div>
    </Modal>
  );
}
