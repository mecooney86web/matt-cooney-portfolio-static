// Admin Panel JavaScript for Cloudflare Workers-backed Portfolio
// Password is stored locally and sent with each request to the backend

// Configuration
const PASSWORD_KEY = 'admin_password';

let currentData = null;
let draggedElement = null;

// ============================================
// Worker API Calls
// ============================================

async function loadDataFromWorker() {
  const password = getPassword();
  const response = await fetch('/api/data', {
    method: 'GET',
    headers: {
      'X-Admin-Password': password
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to load data: ${response.statusText}`);
  }
  return await response.json();
}

async function saveDataToWorker(data) {
  const password = getPassword();
  const response = await fetch('/api/data', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Password': password
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`Failed to save data: ${response.statusText}`);
  }
  return await response.json();
}

async function verifyPassword(password) {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  return response.ok;
}

// ============================================
// Authentication & Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  if (isAuthenticated()) {
    initAdmin();
  } else {
    showLoginScreen();
  }

  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('site-info-form').addEventListener('submit', handleSiteInfoUpdate);
  document.getElementById('add-video-form').addEventListener('submit', handleAddVideo);
  document.getElementById('edit-video-form').addEventListener('submit', handleEditVideo);
});

function isAuthenticated() {
  return !!localStorage.getItem(PASSWORD_KEY);
}

function getPassword() {
  return localStorage.getItem(PASSWORD_KEY);
}

function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-panel').style.display = 'none';
}

function showAdminPanel() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'block';
}

async function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById('admin-password').value.trim();
  const errorEl = document.getElementById('login-error');

  if (!password) {
    errorEl.textContent = 'Please enter a password';
    return;
  }

  try {
    const isValid = await verifyPassword(password);
    if (!isValid) {
      errorEl.textContent = 'Invalid password';
      return;
    }

    localStorage.setItem(PASSWORD_KEY, password);
    errorEl.textContent = '';
    initAdmin();
  } catch (error) {
    console.error('Login failed:', error);
    errorEl.textContent = 'Login failed. Please try again.';
  }
}

function handleLogout() {
  localStorage.removeItem(PASSWORD_KEY);
  currentData = null;
  showLoginScreen();
  document.getElementById('admin-password').value = '';
}

async function initAdmin() {
  showAdminPanel();

  try {
    await loadData();
  } catch (error) {
    console.error('Failed to initialize admin:', error);
    showNotification('Failed to load data. Please check your password.', 'error');
    handleLogout();
  }
}

// ============================================
// Data Loading & Display
// ============================================

async function loadData() {
  try {
    currentData = await loadDataFromWorker();
    displaySiteInfo(currentData.siteInfo);
    displayFeaturedVideo(currentData.featured);
    displayVideoList(currentData.gallery);
  } catch (error) {
    console.error('Failed to load data:', error);
    showNotification('Failed to load videos', 'error');
    throw error;
  }
}

function displaySiteInfo(siteInfo) {
  document.getElementById('site-name').value = siteInfo.name || '';
  document.getElementById('site-email').value = siteInfo.email || '';
  document.getElementById('site-location').value = siteInfo.location || '';
  document.getElementById('site-bio').value = siteInfo.bio || '';
}

function displayFeaturedVideo(video) {
  const container = document.getElementById('featured-video');

  if (!video) {
    container.innerHTML = '<p class="empty-state">No featured video selected</p>';
    return;
  }

  const thumbnailUrl = video.customThumbnail || `https://vumbnail.com/${video.vimeoId}.jpg`;

  container.innerHTML = `
    <div class="featured-video-card">
      <div class="thumbnail" style="background-image: url('${thumbnailUrl}')"></div>
      <div class="info">
        <h3>${video.title || 'Untitled'}</h3>
        <p>Vimeo ID: ${video.vimeoId}</p>
        ${video.description ? `<p>${video.description}</p>` : ''}
      </div>
      <button class="btn-danger" onclick="removeFeatured()">REMOVE FEATURED</button>
    </div>
  `;
}

function displayVideoList(videos) {
  const container = document.getElementById('video-list');

  if (!videos || videos.length === 0) {
    container.innerHTML = '<p class="empty-state">No videos yet. Add one above!</p>';
    return;
  }

  container.innerHTML = videos.map(video => {
    const thumbnailUrl = video.customThumbnail || `https://vumbnail.com/${video.vimeoId}.jpg`;
    const isFeatured = currentData.featured && currentData.featured.id === video.id;

    return `
      <div class="video-card" draggable="true" data-id="${video.id}">
        <div class="drag-handle">⋮⋮</div>
        <div class="thumbnail" style="background-image: url('${thumbnailUrl}')"></div>
        <div class="info">
          <h3>${video.title || 'Untitled'}</h3>
          <p>Vimeo ID: ${video.vimeoId}</p>
          ${video.description ? `<p>${video.description}</p>` : ''}
        </div>
        <div class="actions">
          ${!isFeatured ? `<button class="btn-secondary" onclick="setFeatured('${video.id}')">SET FEATURED</button>` : '<span class="featured-badge">FEATURED</span>'}
          <button class="btn-secondary" onclick="editVideo('${video.id}')">EDIT</button>
          <button class="btn-danger" onclick="deleteVideo('${video.id}')">DELETE</button>
        </div>
      </div>
    `;
  }).join('');

  setupDragAndDrop();
}

// ============================================
// Site Info Update
// ============================================

async function handleSiteInfoUpdate(e) {
  e.preventDefault();

  const siteInfo = {
    name: document.getElementById('site-name').value.trim(),
    email: document.getElementById('site-email').value.trim(),
    location: document.getElementById('site-location').value.trim(),
    bio: document.getElementById('site-bio').value.trim()
  };

  try {
    currentData.siteInfo = siteInfo;
    await saveDataToWorker(currentData);
    showNotification('Site information updated successfully!');
  } catch (error) {
    console.error('Failed to update site info:', error);
    showNotification('Failed to update site information', 'error');
  }
}

// ============================================
// Video Management
// ============================================

async function handleAddVideo(e) {
  e.preventDefault();

  const vimeoId = document.getElementById('vimeo-id').value.trim();
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();

  if (!vimeoId) {
    showNotification('Vimeo ID is required', 'error');
    return;
  }

  const newVideo = {
    id: Date.now().toString(),
    vimeoId: vimeoId,
    title: title || `Video ${currentData.gallery.length + 1}`,
    description: description || ''
  };

  try {
    currentData.gallery.push(newVideo);
    await saveDataToWorker(currentData);

    document.getElementById('add-video-form').reset();
    displayVideoList(currentData.gallery);
    showNotification('Video added successfully!');
  } catch (error) {
    console.error('Failed to add video:', error);
    showNotification('Failed to add video', 'error');
  }
}

function editVideo(id) {
  const video = currentData.gallery.find(v => v.id === id);
  if (!video) return;

  document.getElementById('edit-video-id').value = video.id;
  document.getElementById('edit-title').value = video.title || '';
  document.getElementById('edit-description').value = video.description || '';

  document.getElementById('edit-modal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
  document.getElementById('edit-video-form').reset();
}

async function handleEditVideo(e) {
  e.preventDefault();

  const id = document.getElementById('edit-video-id').value;
  const title = document.getElementById('edit-title').value.trim();
  const description = document.getElementById('edit-description').value.trim();

  const video = currentData.gallery.find(v => v.id === id);
  if (!video) return;

  try {
    video.title = title;
    video.description = description;

    if (currentData.featured && currentData.featured.id === id) {
      currentData.featured.title = title;
      currentData.featured.description = description;
    }

    await saveDataToWorker(currentData);

    closeEditModal();
    displayVideoList(currentData.gallery);
    displayFeaturedVideo(currentData.featured);
    showNotification('Video updated successfully!');
  } catch (error) {
    console.error('Failed to update video:', error);
    showNotification('Failed to update video', 'error');
  }
}

async function deleteVideo(id) {
  if (!confirm('Are you sure you want to delete this video?')) return;

  try {
    currentData.gallery = currentData.gallery.filter(v => v.id !== id);

    if (currentData.featured && currentData.featured.id === id) {
      currentData.featured = null;
    }

    await saveDataToWorker(currentData);

    displayVideoList(currentData.gallery);
    displayFeaturedVideo(currentData.featured);
    showNotification('Video deleted successfully!');
  } catch (error) {
    console.error('Failed to delete video:', error);
    showNotification('Failed to delete video', 'error');
  }
}

async function setFeatured(id) {
  const video = currentData.gallery.find(v => v.id === id);
  if (!video) return;

  try {
    currentData.featured = { ...video };
    await saveDataToWorker(currentData);

    displayFeaturedVideo(currentData.featured);
    displayVideoList(currentData.gallery);
    showNotification('Featured video updated!');
  } catch (error) {
    console.error('Failed to set featured:', error);
    showNotification('Failed to set featured video', 'error');
  }
}

async function removeFeatured() {
  if (!confirm('Remove featured video?')) return;

  try {
    currentData.featured = null;
    await saveDataToWorker(currentData);

    displayFeaturedVideo(null);
    displayVideoList(currentData.gallery);
    showNotification('Featured video removed');
  } catch (error) {
    console.error('Failed to remove featured:', error);
    showNotification('Failed to remove featured video', 'error');
  }
}

// ============================================
// Drag and Drop Reordering
// ============================================

function setupDragAndDrop() {
  const videoItems = document.querySelectorAll('.video-card');

  videoItems.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);
  });
}

function handleDragStart(e) {
  draggedElement = this;
  this.style.opacity = '0.4';
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  if (draggedElement !== this) {
    const allItems = [...document.querySelectorAll('.video-card')];
    const draggedIndex = allItems.indexOf(draggedElement);
    const targetIndex = allItems.indexOf(this);

    const newGallery = [...currentData.gallery];
    const [draggedVideo] = newGallery.splice(draggedIndex, 1);
    newGallery.splice(targetIndex, 0, draggedVideo);

    currentData.gallery = newGallery;

    saveReorder();
  }

  return false;
}

function handleDragEnd(e) {
  this.style.opacity = '1';

  const items = document.querySelectorAll('.video-card');
  items.forEach(item => {
    item.classList.remove('over');
  });
}

async function saveReorder() {
  try {
    await saveDataToWorker(currentData);
    displayVideoList(currentData.gallery);
    showNotification('Videos reordered successfully!');
  } catch (error) {
    console.error('Failed to reorder videos:', error);
    showNotification('Failed to reorder videos', 'error');
    loadData();
  }
}

// ============================================
// Notifications
// ============================================

function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.style.display = 'block';

  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}
