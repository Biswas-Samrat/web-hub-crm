import api from './axios';

export const getClients = (params) => api.get('/clients', { params });
export const createClient = (data) => api.post('/clients', data);
export const getClient = (id) => api.get(`/clients/${id}`);
export const updateClient = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/clients/${id}`);
export const updateStatus = (id, data) => api.patch(`/clients/${id}/status`, data);
export const updateFollowUp = (id, data) => api.patch(`/clients/${id}/follow-up`, data);
export const addActivity = (id, data) => api.post(`/clients/${id}/activities`, data);
export const updateDemo = (id, data) => api.patch(`/clients/${id}/demo`, data);
export const updateProject = (id, data) => api.patch(`/clients/${id}/project`, data);
export const convertToProject = (id, data) => api.post(`/clients/${id}/convert`, data);
export const archiveClient = (id) => api.patch(`/clients/${id}/archive`);
export const exportCSV = () => api.get('/clients/export/csv', { responseType: 'blob' });
export const importCSV = (csv) => api.post('/clients/import/csv', { csv });
