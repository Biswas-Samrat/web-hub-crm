import api from './axios';

// Conversation
export const getConversation = (clientId) => api.get(`/conversations/${clientId}`);
export const addMessage = (clientId, data) => api.post(`/conversations/${clientId}/messages`, data);
export const insertMessage = (clientId, data) => api.post(`/conversations/${clientId}/messages/insert`, data);
export const editMessage = (clientId, messageId, data) => api.put(`/conversations/${clientId}/messages/${messageId}`, data);
export const deleteMessage = (clientId, messageId) => api.delete(`/conversations/${clientId}/messages/${messageId}`);
export const bulkUploadMessages = (clientId, messages) => api.post(`/conversations/${clientId}/bulk`, { messages });
export const clearConversation = (clientId) => api.delete(`/conversations/${clientId}/clear`);

// AI Analysis
export const analyzeConversation = (clientId) => api.post(`/conversations/${clientId}/analyze`);

// Media Upload & Gallery
export const uploadMedia = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000, // 5 min for large files
    onUploadProgress: onProgress,
  });
};

export const uploadMultipleMedia = (files, onProgress) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return api.post('/media/upload-multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
    onUploadProgress: onProgress,
  });
};

export const getMediaGallery = (params) => api.get('/media', { params });

export const deleteMediaApi = (idOrPublicId) => {
  if (typeof idOrPublicId === 'object') {
    return api.post('/media/delete', idOrPublicId);
  }
  return api.delete(`/media/${idOrPublicId}`);
};
