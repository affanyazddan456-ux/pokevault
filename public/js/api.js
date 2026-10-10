// ============================================================
//  PokéVault — API Client
// ============================================================

const API = {
  base: '/api',

  async _req(method, path, body, isFormData = false) {
    const opts = {
      method,
      credentials: 'include',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);

    const res  = await fetch(this.base + path, opts);
    const data = await res.json();

    if (!res.ok) {
      // Preserve full error object as JSON string for special errors (e.g. suspended)
      const err = new Error(data.error || 'Request failed');
      err.data  = data;
      err.status = res.status;
      throw err;
    }
    return data;
  },

  get(path)                { return this._req('GET', path); },
  post(path, body)         { return this._req('POST', path, body); },
  put(path, body)          { return this._req('PUT', path, body); },
  delete(path)             { return this._req('DELETE', path); },
  postForm(path, formData) { return this._req('POST', path, formData, true); },

  // Auth
  auth: {
    signup: d  => API.post('/auth/signup', d),
    login:  d  => API.post('/auth/login', d),
    logout: () => API.post('/auth/logout'),
    me:     () => API.get('/auth/me'),
  },

  // Cards
  cards: {
    list:      (q = {}) => API.get('/cards?' + new URLSearchParams(q).toString()),
    mine:      ()       => API.get('/cards/my'),
    byUser:    id       => API.get(`/cards/user/${id}`),
    get:       id       => API.get(`/cards/${id}`),
    upload:    fd       => API.postForm('/cards', fd),
    update:    (id, d)  => API.put(`/cards/${id}`, d),
    delete:    id       => API.delete(`/cards/${id}`),
    favorite:  id       => API.post(`/cards/${id}/favorite`),
  },

  // Users
  users: {
    get:          id => API.get(`/users/${id}`),
    leaderboard:  () => API.get('/users/leaderboard'),
    updateProfile:(d) => API.put('/users/me/profile', d),
    uploadAvatar: fd  => API.postForm('/users/me/avatar', fd),
    notifications: () => API.get('/users/me/notifications'),
    markAllRead:   () => API.put('/users/me/notifications/read'),
  },

  // Trades
  trades: {
    list:     ()         => API.get('/trades'),
    get:      id         => API.get(`/trades/${id}`),
    create:   d          => API.post('/trades', d),
    respond:  (id, act)  => API.put(`/trades/${id}/respond`, { action: act }),
    cancel:   id         => API.put(`/trades/${id}/cancel`),
  },

  // Auctions
  auctions: {
    list:   (q = {}) => API.get('/auctions?' + new URLSearchParams(q).toString()),
    get:    id       => API.get(`/auctions/${id}`),
    create: d        => API.post('/auctions', d),
    bid:    (id, a)  => API.post(`/auctions/${id}/bid`, { amount: a }),
    cancel: id       => API.delete(`/auctions/${id}`),
  },

  // Stats
  stats: {
    community: () => API.get('/stats'),
  },

  // Reports
  reports: {
    submit: d => API.post('/reports', d),
  },

  // Messages / Chat
  messages: {
    conversations: ()                   => API.get('/messages/conversations'),
    get:           (partnerId)          => API.get(`/messages/${partnerId}`),
    send:          (partnerId, body)    => API.post(`/messages/${partnerId}`, body),
  },

  // Appeals
  appeals: {
    submit:  (body)  => API.post('/appeals', body),
    list:    ()      => API.get('/appeals'),
    approve: (id, note) => API.put(`/appeals/${id}/approve`, { note }),
    reject:  (id, note) => API.put(`/appeals/${id}/reject`,  { note }),
  },

  // Admin
  admin: {
    users:           ()   => API.get('/admin/users'),
    stats:           ()   => API.get('/admin/stats'),
    reports:         ()   => API.get('/admin/reports'),
    suspend:         id   => API.put(`/admin/users/${id}/suspend`),
    suspendTimed:    (id,h,reason) => API.put(`/admin/users/${id}/suspend`, { hours: h, reason }),
    makeAdmin:       id   => API.put(`/admin/users/${id}/makeadmin`),
    deleteCard:      id   => API.delete(`/admin/cards/${id}`),
    suspendCard:     id   => API.put(`/admin/cards/${id}/suspend`),
    resolve:         id   => API.put(`/admin/reports/${id}/resolve`),
    announcements:   ()   => API.get('/admin/announcements'),
    createAnn:       d    => API.post('/admin/announcements', d),
    deleteAnn:       id   => API.delete(`/admin/announcements/${id}`),
  },
};
