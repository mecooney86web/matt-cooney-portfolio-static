// Admin Panel JavaScript for GitHub-backed Portfolio
// Uses GitHub API to read/write portfolio data

// Configuration - UPDATE THESE VALUES
const GITHUB_OWNER = 'supersecretinternetstuff';
const GITHUB_REPO = 'matt-cooney-portfolio-static';
const TOKEN_KEY = 'github_token';

let githubStorage = null;
let currentData = null;
let draggedElement = null;

// ============================================
// Authentication & Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (isAuthenticated()) {
        initAdmin();
    } else {
        showLoginScreen();
    }

    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Site info form
    document.getElementById('site-info-form').addEventListener('submit', handleSiteInfoUpdate);

    // Add video form
    document.getElementById('add-video-form').addEventListener('submit', handleAddVideo);

    // Edit video form
    document.getElementById('edit-video-form').addEventListener('submit', handleEditVideo);
});

function isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
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
    const token = document.getElementById('github-token').value.trim();
    const errorEl = document.getElementById('login-error');

    if (!token) {
        errorEl.textContent = 'Please enter a GitHub token';
        return;
    }

    // Test token by trying to fetch data
    try {
        const testStorage = new GitHubStorage(GITHUB_OWNER, GITHUB_REPO, token);
        await testStorage.getData();

        // Token works, save it
        localStorage.setItem(TOKEN_KEY, token);
        errorEl.textContent = '';
        initAdmin();
    } catch (error) {
        console.error('Login failed:', error);
        errorEl.textContent = 'Invalid token or repository not accessible';
    }
}

function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    githubStorage = null;
    currentData = null;
    showLoginScreen();
    document.getElementById('github-token').value = '';
}

async function initAdmin() {
    showAdminPanel();
    githubStorage = new GitHubStorage(GITHUB_OWNER, GITHUB_REPO, getToken());

    try {
        await loadData();
    } catch (error) {
        console.error('Failed to initialize admin:', error);
        showNotification('Failed to load data. Please check your token.', 'error');
        handleLogout();
    }
}

// ============================================
// Data Loading & Display
// ============================================

async function loadData() {
    try {
        currentData = await githubStorage.getData();
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
        <div class="featured-video-item">
            <div class="video-thumbnail" style="background-image: url('${thumbnailUrl}')"></div>
            <div class="video-info">
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
            <div class="video-item" draggable="true" data-id="${video.id}">
                <div class="drag-handle">⋮⋮</div>
                <div class="video-thumbnail" style="background-image: url('${thumbnailUrl}')"></div>
                <div class="video-info">
                    <h3>${video.title || 'Untitled'}</h3>
                    <p>Vimeo ID: ${video.vimeoId}</p>
                    ${video.description ? `<p>${video.description}</p>` : ''}
                </div>
                <div class="video-actions">
                    ${!isFeatured ? `<button class="btn-secondary" onclick="setFeatured('${video.id}')">SET FEATURED</button>` : '<span class="featured-badge">FEATURED</span>'}
                    <button class="btn-secondary" onclick="editVideo('${video.id}')">EDIT</button>
                    <button class="btn-danger" onclick="deleteVideo('${video.id}')">DELETE</button>
                </div>
            </div>
        `;
    }).join('');

    // Add drag and drop listeners
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
        await githubStorage.saveData(currentData);
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
        await githubStorage.saveData(currentData);

        // Reset form
        document.getElementById('add-video-form').reset();

        // Refresh display
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

        // Update featured if it's the same video
        if (currentData.featured && currentData.featured.id === id) {
            currentData.featured.title = title;
            currentData.featured.description = description;
        }

        await githubStorage.saveData(currentData);

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

        // Remove from featured if it was featured
        if (currentData.featured && currentData.featured.id === id) {
            currentData.featured = null;
        }

        await githubStorage.saveData(currentData);

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
        await githubStorage.saveData(currentData);

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
        await githubStorage.saveData(currentData);

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
    const videoItems = document.querySelectorAll('.video-item');

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
        const allItems = [...document.querySelectorAll('.video-item')];
        const draggedIndex = allItems.indexOf(draggedElement);
        const targetIndex = allItems.indexOf(this);

        // Reorder the array
        const newGallery = [...currentData.gallery];
        const [draggedVideo] = newGallery.splice(draggedIndex, 1);
        newGallery.splice(targetIndex, 0, draggedVideo);

        currentData.gallery = newGallery;

        // Save to GitHub
        saveReorder();
    }

    return false;
}

function handleDragEnd(e) {
    this.style.opacity = '1';

    const items = document.querySelectorAll('.video-item');
    items.forEach(item => {
        item.classList.remove('over');
    });
}

async function saveReorder() {
    try {
        await githubStorage.saveData(currentData);
        displayVideoList(currentData.gallery);
        showNotification('Videos reordered successfully!');
    } catch (error) {
        console.error('Failed to reorder videos:', error);
        showNotification('Failed to reorder videos', 'error');
        // Reload data to reset to correct order
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
