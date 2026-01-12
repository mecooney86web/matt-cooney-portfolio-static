# Matt Cooney Portfolio - Static Site

A static video portfolio site powered by GitHub as a backend. No servers, no databases, just HTML/CSS/JS and the GitHub API.

## Features

- **Static Site**: Pure HTML/CSS/JavaScript, works on any hosting
- **GitHub Backend**: All data stored in `data/videos.json` in the repo
- **Admin Panel**: Manage videos, site info, and featured content
- **Token Authentication**: Secure GitHub Personal Access Token login
- **Drag & Drop**: Reorder videos easily
- **No Dependencies**: No build process, no npm, just upload and go

## Setup Instructions

### 1. Create GitHub Repository

1. Go to GitHub and create a new public repository
2. Name it `matt-cooney-portfolio-static` (or your preferred name)
3. Don't initialize with README (we'll push this code)

### 2. Get GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → [Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name: "Portfolio Admin"
4. Select scope: **repo** (Full control of private repositories)
5. Click "Generate token"
6. **COPY THE TOKEN** - you won't see it again!

### 3. Update Configuration

Edit these files with your GitHub info:

**`js/portfolio.js` (lines 2-4):**
```javascript
const GITHUB_OWNER = 'your-github-username';
const GITHUB_REPO = 'your-repo-name';
const GITHUB_BRANCH = 'main';
```

**`js/admin.js` (lines 5-6):**
```javascript
const GITHUB_OWNER = 'your-github-username';
const GITHUB_REPO = 'your-repo-name';
```

### 4. Push to GitHub

```bash
cd /path/to/matt-cooney-static
git init
git add .
git commit -m "Initial commit - static portfolio site"
git branch -M main
git remote add origin https://github.com/your-username/your-repo-name.git
git push -u origin main
```

### 5. Deploy to Hosting

#### Option A: GitHub Pages (Free)
1. Go to your repo → Settings → Pages
2. Source: Deploy from branch → `main` → `/ (root)`
3. Click Save
4. Site will be live at `https://your-username.github.io/your-repo-name/`

#### Option B: GoDaddy (Your Existing Hosting)
1. Connect to your hosting via FTP
2. Upload all files to your web directory
3. Site will be live at your domain

#### Option C: Netlify/Vercel Static (Free)
1. Connect your GitHub repo
2. Build settings: None needed (it's static!)
3. Publish directory: `/` (root)

### 6. Use Admin Panel

1. Go to `your-site.com/admin.html`
2. Enter your GitHub Personal Access Token
3. Token is stored in browser localStorage (never on a server)
4. Manage your portfolio!

## File Structure

```
matt-cooney-static/
├── index.html              # Main portfolio page
├── admin.html              # Admin panel
├── css/
│   ├── styles.css          # Portfolio styles
│   └── admin.css           # Admin panel styles
├── js/
│   ├── portfolio.js        # Portfolio display logic
│   ├── admin.js            # Admin panel logic
│   └── github-api.js       # GitHub API wrapper
└── data/
    └── videos.json         # Portfolio data (managed via admin)
```

## How It Works

### Public Portfolio Page
- Fetches `videos.json` from GitHub using public API
- No authentication needed
- Displays featured video and gallery
- Works on any hosting, any device

### Admin Panel
- Uses GitHub Personal Access Token for authentication
- Token stored in browser localStorage
- Reads/writes `videos.json` directly via GitHub API
- Each change creates a new commit in your repo
- All operations happen client-side (no server needed)

### Data Storage
All data is stored in `data/videos.json`:

```json
{
  "siteInfo": {
    "name": "Matt Cooney",
    "email": "mecooney86@gmail.com",
    "location": "New York, NY",
    "bio": "Your professional bio"
  },
  "featured": {
    "id": "123",
    "vimeoId": "651151362",
    "title": "Featured Video",
    "description": "Description"
  },
  "gallery": [
    {
      "id": "123",
      "vimeoId": "651151362",
      "title": "Video Title",
      "description": "Description"
    }
  ]
}
```

## Admin Features

- **Site Information**: Update name, email, location, bio
- **Add Videos**: Enter Vimeo ID, title, description
- **Edit Videos**: Update title and description
- **Delete Videos**: Remove videos from gallery
- **Reorder Videos**: Drag and drop to reorder
- **Set Featured**: Choose which video appears in featured section
- **Version Control**: Every change tracked in Git history

## Security

- GitHub token only stored in your browser
- Token never exposed to server (there is no server!)
- Token can be revoked anytime from GitHub settings
- All changes logged in Git commit history
- Public portfolio doesn't require authentication

## Troubleshooting

### "Failed to load videos" in admin
- Check your GitHub token is valid
- Verify token has `repo` scope
- Confirm GITHUB_OWNER and GITHUB_REPO are correct

### Videos not showing on public site
- Confirm data/videos.json exists in repo
- Check browser console for errors
- Verify GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH are correct

### Changes not appearing immediately
- GitHub API has caching (~60 seconds)
- GitHub Pages rebuilds can take 1-2 minutes
- Hard refresh your browser (Cmd+Shift+R / Ctrl+Shift+F5)

## Custom Domain (GoDaddy)

If deploying to GoDaddy with custom domain:

1. Upload all files via FTP to your web root
2. Ensure `index.html` is in the root directory
3. Domain should point to your hosting (already configured)
4. Site will be live at your domain immediately

## License

Personal portfolio site for Matt Cooney.

## Support

For issues or questions, contact mecooney86@gmail.com
