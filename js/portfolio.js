// Portfolio configuration - UPDATE THESE VALUES
const GITHUB_OWNER = 'mecooney86web'; // Your GitHub username
const GITHUB_REPO = 'matt-cooney-portfolio-static'; // Your repo name
const GITHUB_BRANCH = 'main'; // Branch name

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load portfolio data and display
async function loadPortfolio() {
    try {
        // Fetch data from GitHub (public, no auth needed)
        const data = await GitHubStorage.getPublicData(GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH);

        displaySiteInfo(data.siteInfo);

        if (data.featured) {
            displayFeaturedVideo(data.featured);
        }

        if (data.gallery && data.gallery.length > 0) {
            displayGallery(data.gallery);
        }
    } catch (error) {
        console.error('Failed to load portfolio:', error);
        document.querySelector('main').innerHTML = '<p>Failed to load portfolio. Please try again later.</p>';
    }
}

function displaySiteInfo(siteInfo) {
    document.querySelector('h1').textContent = siteInfo.name || 'MATT COONEY';
    const email = siteInfo.email || 'mecooney86@gmail.com';
    document.querySelector('.contact a').href = `mailto:${email}`;
    document.querySelector('.contact a').textContent = email;
    document.querySelector('.contact span:last-child').textContent = siteInfo.location || 'New York, NY';

    // Preserve line breaks in bio - escape HTML first to prevent XSS
    const bioText = siteInfo.bio || 'Video editor and cinematographer specializing in documentary, commercial, and narrative work. Based in New York City.';
    const escapedBio = escapeHtml(bioText);
    document.querySelector('.header-bio p').innerHTML = escapedBio.replace(/\n/g, '<br>');
}

function displayFeaturedVideo(video) {
    const featuredSection = document.getElementById('featured');
    const thumbnailUrl = video.customThumbnail || `https://vumbnail.com/${video.vimeoId}.jpg`;

    featuredSection.innerHTML = `
        <h2>Featured</h2>
        <div class="video-container" data-vimeo-id="${video.vimeoId}" onclick="playFeaturedVideo('${video.vimeoId}')">
            <div class="video-thumbnail" style="background-image: url('${thumbnailUrl}')"></div>
            <div class="video-play-button"></div>
        </div>
    `;
}

function displayGallery(videos) {
    const gallerySection = document.getElementById('gallery');
    gallerySection.innerHTML = videos.map((video, index) => {
        const thumbnailUrl = video.customThumbnail || `https://vumbnail.com/${video.vimeoId}.jpg`;
        return `
            <div class="video-item">
                <div class="video-container" data-vimeo-id="${escapeHtml(video.vimeoId)}" data-index="${index}" onclick="playGalleryVideo(this)">
                    <div class="video-thumbnail" style="background-image: url('${thumbnailUrl}')"></div>
                    <div class="video-play-button"></div>
                </div>
                ${video.title ? `<h3>${escapeHtml(video.title)}</h3>` : ''}
                ${video.description ? `<p>${escapeHtml(video.description)}</p>` : ''}
            </div>
        `;
    }).join('');
}

function playFeaturedVideo(vimeoId) {
    const container = document.querySelector('#featured .video-container');
    container.innerHTML = `
        <iframe src="https://player.vimeo.com/video/${vimeoId}?autoplay=1"
            width="100%"
            height="100%"
            frameborder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen>
        </iframe>
    `;
}

function playGalleryVideo(element) {
    const vimeoId = element.getAttribute('data-vimeo-id');
    element.innerHTML = `
        <iframe src="https://player.vimeo.com/video/${vimeoId}?autoplay=1"
            width="100%"
            height="100%"
            frameborder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen>
        </iframe>
    `;
}

// Set copyright year
document.getElementById('year').textContent = new Date().getFullYear();

// Load portfolio on page load
loadPortfolio();
