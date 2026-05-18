import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

export default api;
