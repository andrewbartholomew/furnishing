import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : 'https://furnishing-judv.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Items
export const getItems = async (params = {}) => {
  const response = await api.get('/items', { params });
  return response.data;
};

export const getItem = async (id) => {
  const response = await api.get(`/items/${id}`);
  return response.data;
};

export const createItem = async (data) => {
  const response = await api.post('/items', data);
  return response.data;
};

export const updateItem = async (id, fields) => {
  const response = await api.patch(`/items/${id}`, fields);
  return response.data;
};

export const deleteItem = async (id) => {
  const response = await api.delete(`/items/${id}`);
  return response.data;
};

export const toggleStar = async (id) => {
  const response = await api.post(`/items/${id}/star`);
  return response.data;
};

// Queue
export const getQueuedItems = async () => {
  const response = await api.get('/items/queue');
  return response.data;
};

export const promoteQueueItem = async (id, data) => {
  const response = await api.post(`/queue/${id}/promote`, data);
  return response.data;
};

// Rooms
export const getRooms = async () => {
  const response = await api.get('/rooms');
  return response.data;
};

// Upload
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const uploadImageFromUrl = async (url) => {
  const response = await api.post('/upload/from-url', { url });
  return response.data;
};

// Design Advisor
export const analyzeRoom = async (roomSlug, photoUrls) => {
  const response = await api.post('/design/analyze', { room_slug: roomSlug, photo_urls: photoUrls });
  return response.data;
};

export const getRoomAnalysis = async (roomSlug) => {
  const response = await api.get(`/design/analyses/${roomSlug}`);
  return response.data;
};

export const updateElementStatus = async (elementId, status) => {
  const response = await api.patch(`/design/elements/${elementId}`, { status });
  return response.data;
};

export const createDesignProject = async (analysisId, name, userContext, anchorItems) => {
  const response = await api.post('/design/projects', {
    analysis_id: analysisId,
    name,
    user_context: userContext,
    anchor_items: anchorItems,
  });
  return response.data;
};

export const getDesignProject = async (id) => {
  const response = await api.get(`/design/projects/${id}`);
  return response.data;
};

export const listDesignProjects = async (roomSlug) => {
  const params = roomSlug ? { room_slug: roomSlug } : {};
  const response = await api.get('/design/projects', { params });
  return response.data;
};

export default api;
