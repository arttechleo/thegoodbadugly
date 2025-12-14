# The Good, The Bad, The Ugly - VR/MR Experience Reviews

A static blog site for reviewing Virtual and Mixed Reality experiences, with posts persisted directly to GitHub.

## Features

- **GitHub-Powered Persistence**: All posts are saved directly to the `master` branch in the GitHub repository
- **GitHub Pages Integration**: Automatic deployment via GitHub Actions when content changes
- **Cross-Device Sync**: Posts are available across all devices and platforms
- **Admin Interface**: Create, edit, and delete reviews through a web interface
- **Static Site Generation**: Generate individual HTML pages for each review
- **Responsive Design**: Works on desktop and mobile devices

## How It Works

1. **Post Creation**: When you publish a review through the admin interface, it's saved to `reviews.json` on the `master` branch via GitHub API
2. **Persistence**: Posts are committed and pushed directly to the repository
3. **Loading**: On page load, posts are fetched from the `master` branch (or loaded from the static file on GitHub Pages)
4. **Auto-Deployment**: GitHub Actions automatically rebuilds and deploys the site when `reviews.json` is updated
5. **Static Generation**: The workflow runs `generate-pages.js` to create individual HTML pages for each review

## Setup

### Prerequisites

- A GitHub repository (this project)
- Node.js 12+ (for static page generation)
- A GitHub Personal Access Token with repository write permissions

### Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/arttechleo/thegoodbadugly.git
   cd thegoodbadugly
   ```

2. **Open the site**:
   - Simply open `index.html` in a web browser, or
   - Serve it with a local web server (e.g., `python -m http.server 8000`)

3. **Login as Admin**:
   - Click the hamburger menu (☰) → "Admin Login"
   - Enter your GitHub Personal Access Token
   - The token must have `repo` scope permissions

### Creating a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "VR Blog Admin")
4. Select the `repo` scope (full control of private repositories)
5. Click "Generate token"
6. Copy the token (starts with `ghp_`) and use it in the admin login

**Important**: Keep your token secure! Never commit it to the repository.

## Usage

### Creating a Review

1. Log in with your GitHub token
2. Click "Add New Review" from the menu
3. Fill in:
   - **Project Title**: The name of the VR/MR experience
   - **The Good**: What works well
   - **The Bad**: What needs improvement
   - **The Ugly**: What's broken or concerning
4. Optionally add media (images or YouTube videos) to each section
5. Click "Publish Review"

The review will be:
- Saved to `reviews.json` on the `master` branch
- Committed and pushed to GitHub automatically
- GitHub Actions will automatically rebuild and deploy the site
- Available on the live site after deployment completes (usually 1-2 minutes)
- Available on all devices/platforms

### Editing/Deleting Reviews

- Click on any review to view details
- If logged in, you'll see "Edit Post" and "Delete Post" buttons
- Edit: Modify the review and click "Update Review"
- Delete: Confirm deletion to remove the review

### Generating Static Pages

To generate individual HTML pages for each review:

```bash
npm run build:pages
```

Or directly:

```bash
node generate-pages.js
```

This will:
- Read `reviews.json` from the current directory
- Generate individual HTML pages in the `reviews/` directory
- Create a `sitemap.xml` file
- Update `index.html` with navigation links

**Note**: Make sure `reviews.json` exists in the root directory. The file is stored on the `master` branch.

## Project Structure

```
thegoodbadugly/
├── index.html              # Main blog page
├── review-template.html    # Template for individual review pages
├── script.js               # Main JavaScript (handles UI and GitHub API)
├── style.css               # Stylesheet
├── generate-pages.js       # Static page generator
├── reviews.json            # Posts data (on `posts` branch)
├── reviews/                # Generated individual review pages (gitignored)
├── sitemap.xml             # Generated sitemap (gitignored)
└── package.json            # Node.js dependencies and scripts
```

## GitHub Pages Deployment

The site uses GitHub Actions to automatically build and deploy:

1. **Workflow**: `.github/workflows/pages.yml`
   - Triggers on pushes to `master` branch
   - Builds the site and generates static pages
   - Deploys to GitHub Pages

2. **Build Process**:
   - Checks out the repository
   - Runs `generate-pages.js` to create individual review pages
   - Uploads artifacts for deployment

3. **Deployment**:
   - Automatically deploys to GitHub Pages
   - Usually completes within 1-2 minutes after a push

## Branch Strategy

- **`master`**: Main branch containing both site code and content (`reviews.json`)
  - This is the branch that GitHub Pages serves from
  - All posts are saved directly to this branch for simplicity and compatibility

## Troubleshooting

### Posts disappear after refresh

- **Check**: Ensure you're logged in with a valid GitHub token
- **Check**: Open browser console (F12) and look for error messages
- **Check**: Verify your token has `repo` permissions
- **Check**: That the commit was successful (check GitHub repository for new commits)
- **Check**: That GitHub Actions workflow completed successfully

### "GitHub API error" when saving

- **Solution**: Ensure your GitHub token has repository write permissions (`repo` scope)
- **Solution**: Check that you have push access to the repository
- **Solution**: Verify the repository name and owner are correct in `script.js`
- **Solution**: Check your internet connection

### Posts not loading

- **Check**: Browser console for API errors
- **Check**: Network tab to see if GitHub API calls are failing
- **Check**: That `reviews.json` exists on the `master` branch
- **Check**: GitHub Pages deployment status (Actions tab)
- **Try**: Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- **Note**: If GitHub API fails, the site will try to load from the static `reviews.json` file

### Static page generation fails

- **Check**: That `reviews.json` exists in the current directory
- **Check**: That `review-template.html` exists
- **Check**: Node.js version (requires 12+)

## Development

### Local Development

1. Open `index.html` in a browser (or use a local server: `python -m http.server 8000`)
2. Use browser DevTools (F12) to debug
3. Check console for API calls and errors
4. Monitor Network tab to see GitHub API requests

### Testing GitHub Integration

1. Log in with your GitHub token
2. Create a test post
3. Check browser console for success/error messages
4. Verify the commit appears in GitHub (master branch)
5. Check GitHub Actions tab to see deployment status
6. Wait for deployment to complete, then refresh the live site

### Environment Setup

No environment variables are needed for the frontend. The GitHub token is stored in browser `localStorage` after login.

For the GitHub Actions workflow:
- No additional setup required
- Uses GitHub's built-in Pages deployment
- Automatically has access to repository contents

## Security Notes

- **Never commit** your GitHub token to the repository
- Tokens are stored in browser `localStorage` (client-side only)
- The token is sent to GitHub API over HTTPS
- Consider using environment-specific tokens for different deployments

## License

ISC

## Contributing

This is a personal project, but suggestions and improvements are welcome!
