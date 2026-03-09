import api from './api';

export const clientService = {
    getAll: () => api.get('/clients').then(res => res.data),
    create: (data) => api.post('/clients', data).then(res => res.data),
    delete: (id) => api.delete(`/clients/${id}`).then(res => res.data),
};

export const vfdService = {
    getAll: () => api.get('/vfds').then(res => res.data),
    getModels: () => api.get('/vfds/models').then(res => res.data),
    create: (data) => api.post('/vfds', data).then(res => res.data),
    createModel: (data) => api.post('/vfds/models', data).then(res => res.data),
    deleteModel: (id) => api.delete(`/vfds/models/${id}`).then(res => res.data),
};

export const repairService = {
    getAll: (includeHidden = false) => api.get(`/repairs${includeHidden ? '?all=true' : ''}`).then(res => res.data),
    getById: (id) => api.get(`/repairs/${id}`).then(res => res.data),
    create: (data) => api.post('/repairs', data).then(res => res.data),
    updateStatus: (id, status) => api.put(`/repairs/${id}/status`, { status }).then(res => res.data),
    updateData: (id, data) => api.put(`/repairs/${id}/data`, data).then(res => res.data),
    updateComponentState: (id, componentData) => api.post(`/repairs/${id}/components`, componentData).then(res => res.data),
    updateVisibility: (id, isHidden) => api.put(`/repairs/${id}/visibility`, { is_hidden: isHidden }).then(res => res.data),
    delete: (id) => api.delete(`/repairs/${id}`).then(res => res.data),
    downloadPDF: (id) => api.get(`/repairs/${id}/pdf`, { responseType: 'blob' }).then(res => res.data),
};

export const imageService = {
    upload: (repairId, file, stepName = 'General') => {
        const formData = new FormData();
        formData.append('repair_id', repairId);
        formData.append('image', file);
        formData.append('step_name', stepName);
        return api.post('/images/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => res.data);
    },
    getByRepair: (repairId) => api.get(`/images/repair/${repairId}`).then(res => res.data),
    delete: (id) => api.delete(`/images/${id}`).then(res => res.data),
};

export const userService = {
    getAll: () => api.get('/auth').then(res => res.data),
    create: (data) => api.post('/auth/register', data).then(res => res.data),
    update: (id, data) => api.put(`/auth/${id}`, data).then(res => res.data),
    delete: (id) => api.delete(`/auth/${id}`).then(res => res.data),
    checkSetupStatus: () => api.get('/auth/setup-status').then(res => res.data),
    setup: (data) => api.post('/auth/setup', data).then(res => res.data),
};

export const emailService = {
    sendNotification: (repairId, data) => api.post(`/email/repair/${repairId}`, data).then(res => res.data),
};
