import api from './axios';

export const getTodayFollowUps = () => api.get('/follow-ups/today');
export const getOverdueFollowUps = () => api.get('/follow-ups/overdue');
export const getUpcomingFollowUps = () => api.get('/follow-ups/upcoming');
