class VRBlog {
    constructor() {
        // GitHub configuration - MUST BE FIRST
        this.githubConfig = {
            owner: 'arttechleo',
            repo: 'thegoodbadugly',
            token: localStorage.getItem('githubToken') || null,
            contentBranch: 'master' // Branch for storing posts (use master for GitHub Pages compatibility)
        };

        this.posts = [];
        this.isAdminLoggedIn = this.checkAdminStatus();
        this.editingPostId = null; // Track which post is being edited
        
        // Mobile debugging - log to console and store in localStorage for debugging
        this.debug = {
            log: (message, data) => {
                console.log(`[VRBlog Mobile Debug] ${message}`, data);
                const logs = JSON.parse(localStorage.getItem('vrBlogDebugLogs') || '[]');
                logs.push({ time: new Date().toISOString(), message, data });
                // Keep only last 10 logs
                if (logs.length > 10) logs.shift();
                localStorage.setItem('vrBlogDebugLogs', JSON.stringify(logs));
            }
        };
        
        this.debug.log('Blog initialized', { 
            isMobile: window.innerWidth <= 768,
            userAgent: navigator.userAgent,
            isLoggedIn: this.isAdminLoggedIn
        });
        
        // Modal elements
        this.modal = document.getElementById('post-modal');
        this.aboutModal = document.getElementById('about-modal');
        this.contactModal = document.getElementById('contact-modal');
        this.adminLoginModal = document.getElementById('admin-login-modal');
        this.postDetailModal = document.getElementById('post-detail-modal');
        
        // Hamburger menu elements
        this.hamburgerMenu = document.getElementById('hamburger-menu');
        this.menuOverlay = document.getElementById('menu-overlay');
        this.closeMenuBtn = document.getElementById('close-menu');
        
        // Menu items
        this.menuAboutLink = document.getElementById('menu-about-link');
        this.menuContactLink = document.getElementById('menu-contact-link');
        this.menuAdminLogin = document.getElementById('menu-admin-login');
        this.menuAddPost = document.getElementById('menu-add-post');
        this.menuLogout = document.getElementById('menu-logout');
        
        // Close button elements
        this.closeBtn = document.querySelector('.close');
        this.closeAboutBtn = document.querySelector('.close-about');
        this.closeContactBtn = document.querySelector('.close-contact');
        this.closeAdminLoginBtn = document.querySelector('.close-admin-login');
        this.closePostDetailBtn = document.querySelector('.close-post-detail');
        
        // Form elements
        this.postForm = document.getElementById('post-form');
        this.adminLoginForm = document.getElementById('admin-login-form');
        
        // Container elements
        this.blogPostsContainer = document.getElementById('blog-posts');
        
        // Other elements
        this.themeToggle = document.getElementById('theme-toggle');

        this.initializeEventListeners();
        this.initializeTheme();
        this.setupMediaTypeSelectors();
        this.updateAdminUI();
        this.loadPosts();
    }

    sanitizeText(text) {
        if (text == null) return '';
        return String(text)
            .replace(/\\n/g, ' ')  // turns literal "\n" into a space
            .replace(/\n/g, ' ')   // turns real newline characters into a space
            .trim();
    }

    checkAdminStatus() {
        if (!this.githubConfig) {
            return false;
        }
        const hasValidToken = localStorage.getItem('githubToken') && localStorage.getItem('vrBlogAdminStatus') === 'true';
        if (hasValidToken) {
            this.githubConfig.token = localStorage.getItem('githubToken');
        }
        return hasValidToken;
    }

    initializeEventListeners() {
        // Hamburger menu - use click with passive touch handling
        if (this.hamburgerMenu) {
            this.hamburgerMenu.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openMenu();
            }, { passive: false });
        }
        
        if (this.closeMenuBtn) {
            this.closeMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeMenu();
            }, { passive: false });
        }
        
        if (this.menuOverlay) {
            this.menuOverlay.addEventListener('click', (e) => {
                if (e.target === this.menuOverlay) {
                    this.closeMenu();
                }
            });
        }
        
        // Menu items
        if (this.menuAboutLink) {
            this.menuAboutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMenu();
                this.openAboutModal();
            });
        }
        
        if (this.menuContactLink) {
            this.menuContactLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMenu();
                this.openContactModal();
            });
        }
        
        if (this.menuAdminLogin) {
            this.menuAdminLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMenu();
                this.openAdminLoginModal();
            });
        }
        
        if (this.menuAddPost) {
            this.menuAddPost.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMenu();
                this.openModal();
            });
        }
        
        if (this.menuLogout) {
            this.menuLogout.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMenu();
                this.logout();
            });
        }
        
        // Modal close buttons
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (this.closeAboutBtn) {
            this.closeAboutBtn.addEventListener('click', () => this.closeAboutModal());
        }
        
        if (this.closeContactBtn) {
            this.closeContactBtn.addEventListener('click', () => this.closeContactModal());
        }
        
        if (this.closeAdminLoginBtn) {
            this.closeAdminLoginBtn.addEventListener('click', () => this.closeAdminLoginModal());
        }
        
        if (this.closePostDetailBtn) {
            this.closePostDetailBtn.addEventListener('click', () => this.closePostDetailModal());
        }
        
        // Form submissions
        if (this.postForm) {
            this.postForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        if (this.adminLoginForm) {
            this.adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        }
        
        // Theme toggle - use click with passive touch handling
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleTheme();
            }, { passive: false });
        }
        
        // Window click events for closing modals
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
            if (e.target === this.aboutModal) {
                this.closeAboutModal();
            }
            if (e.target === this.contactModal) {
                this.closeContactModal();
            }
            if (e.target === this.adminLoginModal) {
                this.closeAdminLoginModal();
            }
            if (e.target === this.postDetailModal) {
                this.closePostDetailModal();
            }
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close menu if open
                if (this.menuOverlay && this.menuOverlay.classList.contains('active')) {
                    this.closeMenu();
                    return;
                }
                // Close modals
                if (this.modal && this.modal.style.display === 'block') {
                    this.closeModal();
                }
                if (this.aboutModal && this.aboutModal.style.display === 'block') {
                    this.closeAboutModal();
                }
                if (this.contactModal && this.contactModal.style.display === 'block') {
                    this.closeContactModal();
                }
                if (this.adminLoginModal && this.adminLoginModal.style.display === 'block') {
                    this.closeAdminLoginModal();
                }
                if (this.postDetailModal && this.postDetailModal.style.display === 'block') {
                    this.closePostDetailModal();
                }
            }
        });
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('vrBlogTheme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('vrBlogTheme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '○' : '●';
        }
    }

    setupMediaTypeSelectors() {
        const sections = ['good', 'bad', 'ugly'];
        
        sections.forEach(section => {
            const mediaTypeSelect = document.getElementById(`${section}-media-type`);
            const urlInput = document.getElementById(`${section}-media-url`);
            const fileInput = document.getElementById(`${section}-media-file`);
            const fileWrapper = fileInput ? fileInput.parentElement : null;
            
            if (mediaTypeSelect && urlInput) {
                const updateMediaInputs = () => {
                    const mediaType = mediaTypeSelect.value;
                    
                    if (mediaType === 'none') {
                        urlInput.classList.remove('show');
                        if (fileWrapper) fileWrapper.classList.remove('show');
                    } else if (mediaType === 'image') {
                        urlInput.classList.add('show');
                        if (fileWrapper) fileWrapper.classList.add('show');
                        urlInput.placeholder = 'Enter image URL';
                    } else if (mediaType === 'youtube') {
                        urlInput.classList.add('show');
                        if (fileWrapper) fileWrapper.classList.remove('show');
                        urlInput.placeholder = 'Enter YouTube URL';
                    }
                };
                
                mediaTypeSelect.addEventListener('change', updateMediaInputs);
                updateMediaInputs(); // Initialize on page load
            }
        });
    }

    openModal(editPost = null) {
        this.editingPostId = editPost ? editPost.id : null;
        
        if (editPost) {
            // Pre-fill form for editing
            document.getElementById('title').value = editPost.title;
            document.getElementById('good-content').value = editPost.good.content;
            document.getElementById('bad-content').value = editPost.bad.content;
            document.getElementById('ugly-content').value = editPost.ugly.content;
            
            // Set media types and URLs
            this.setMediaFields('good', editPost.good.media);
            this.setMediaFields('bad', editPost.bad.media);
            this.setMediaFields('ugly', editPost.ugly.media);
            
            // Update modal title and button
            document.querySelector('#post-modal h3').textContent = 'Edit Review';
            document.querySelector('#post-form .submit-btn').textContent = 'Update Review';
        } else {
            // Reset for new post
            document.querySelector('#post-modal h3').textContent = 'Add New Review';
            document.querySelector('#post-form .submit-btn').textContent = 'Publish Review';
        }

        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Mobile-friendly focus - delay and check if element exists
        setTimeout(() => {
            const titleInput = document.getElementById('title');
            if (titleInput && window.innerWidth > 768) {
                // Only auto-focus on desktop to prevent mobile keyboard issues
                titleInput.focus();
            }
        }, 300); // Longer delay for mobile
    }

    setMediaFields(section, media) {
        const typeSelect = document.getElementById(`${section}-media-type`);
        const urlInput = document.getElementById(`${section}-media-url`);
        const fileInput = document.getElementById(`${section}-media-file`);
        const fileWrapper = fileInput ? fileInput.parentElement : null;
        
        if (media) {
            typeSelect.value = media.type;
            urlInput.classList.add('show');
            
            if (media.type === 'youtube') {
                // Convert embed URL back to regular YouTube URL for editing
                const videoId = media.url.split('/embed/')[1];
                if (videoId) {
                    urlInput.value = `https://www.youtube.com/watch?v=${videoId}`;
                } else {
                    urlInput.value = media.url;
                }
                if (fileWrapper) fileWrapper.classList.remove('show');
            } else {
                // Check if it's a data URL (base64) - if so, we can't edit it, just show message
                if (media.url.startsWith('data:')) {
                    urlInput.value = '';
                    urlInput.placeholder = 'Previously uploaded image (cannot be edited)';
                } else {
                    urlInput.value = media.url;
                }
                if (fileWrapper) fileWrapper.classList.add('show');
            }
            
            // Clear file input
            if (fileInput) fileInput.value = '';
        } else {
            typeSelect.value = 'none';
            urlInput.classList.remove('show');
            if (fileWrapper) fileWrapper.classList.remove('show');
            urlInput.value = '';
            if (fileInput) fileInput.value = '';
        }
    }

    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.postForm.reset();
        this.editingPostId = null;
        
        // Hide all media inputs
        document.querySelectorAll('.media-input-url').forEach(input => {
            input.classList.remove('show');
        });
        document.querySelectorAll('.media-input-file-label-wrapper').forEach(wrapper => {
            wrapper.classList.remove('show');
        });
    }

    openAboutModal() {
        this.aboutModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeAboutModal() {
        this.aboutModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    openContactModal() {
        this.contactModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeContactModal() {
        this.contactModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    openAdminLoginModal() {
        this.adminLoginModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Mobile-friendly focus handling
        setTimeout(() => {
            const tokenInput = document.getElementById('github-token');
            if (tokenInput && window.innerWidth > 768) {
                // Only auto-focus on desktop
                tokenInput.focus();
            }
        }, 300);
    }

    closeAdminLoginModal() {
        this.adminLoginModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.adminLoginForm.reset();
    }

    openPostDetailModal(post) {
        const detailBody = document.getElementById('post-detail-body');
        if (detailBody) {
            detailBody.innerHTML = `
                <div class="post-header">
                    <h2 class="post-title">${this.sanitizeText(post.title)}</h2>
                    <p class="post-date">Published on ${this.sanitizeText(post.date)}</p>
                    ${this.isAdminLoggedIn ? `
                        <div class="admin-post-actions">
                            <button onclick="vrBlog.editPost(${post.id})" class="edit-post-btn">Edit Post</button>
                            <button onclick="vrBlog.deletePost(${post.id})" class="delete-post-btn">Delete Post</button>
                        </div>
                    ` : ''}
                </div>
                
                <div class="review-section">
                    <h3 class="section-title">The Good</h3>
                    <div class="section-content">
                        <div class="section-text">${this.sanitizeText(post.good.content)}</div>
                        ${post.good.media ? `<div class="section-media">${this.renderMedia(post.good.media)}</div>` : ''}
                    </div>
                </div>
                
                <div class="review-section">
                    <h3 class="section-title">The Bad</h3>
                    <div class="section-content">
                        <div class="section-text">${this.sanitizeText(post.bad.content)}</div>
                        ${post.bad.media ? `<div class="section-media">${this.renderMedia(post.bad.media)}</div>` : ''}
                    </div>
                </div>
                
                <div class="review-section">
                    <h3 class="section-title">The Ugly</h3>
                    <div class="section-content">
                        <div class="section-text">${this.sanitizeText(post.ugly.content)}</div>
                        ${post.ugly.media ? `<div class="section-media">${this.renderMedia(post.ugly.media)}</div>` : ''}
                    </div>
                </div>
            `;
        }

        document.getElementById('detail-title').textContent = this.sanitizeText(post.title);
        this.postDetailModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closePostDetailModal() {
        this.postDetailModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    editPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            this.closePostDetailModal();
            this.openModal(post);
        }
    }

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            return;
        }

        try {
            this.posts = this.posts.filter(post => post.id !== postId);
            const result = await this.updateGitHubRepo();
            this.closePostDetailModal();
            this.renderPosts();
            
            const commitInfo = result?.commit
                ? ` (commit ${result.commit.sha.substring(0, 7)})`
                : '';

            alert(`✅ Review deleted successfully${commitInfo}.`);
            
            // Refresh posts after a delay to ensure consistency
            setTimeout(() => {
                console.log('Refreshing posts after deletion...');
                this.loadPosts();
            }, 2000);
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Error deleting review. Please try again.');
        }
    }

    handleAdminLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(this.adminLoginForm);
        const githubToken = formData.get('github-token');
        
        if (!githubToken || !githubToken.startsWith('ghp_')) {
            alert('Please enter a valid GitHub Personal Access Token (starts with ghp_)');
            return;
        }
        
        // Test the token by making a simple GitHub API call
        this.testGitHubToken(githubToken);
    }

    async testGitHubToken(token) {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                
                // Store token securely
                this.githubConfig.token = token;
                localStorage.setItem('githubToken', token);
                
                // Update login status
                this.isAdminLoggedIn = true;
                localStorage.setItem('vrBlogAdminStatus', 'true');
                
                this.updateAdminUI();
                this.closeAdminLoginModal();
                
                alert(`Successfully logged in as ${userData.login}! You can now add reviews directly to your GitHub repository.`);
            } else {
                alert('Invalid GitHub token. Please check your token and try again.');
                document.getElementById('github-token').focus();
            }
        } catch (error) {
            alert('Error connecting to GitHub. Please check your internet connection and try again.');
            console.error('GitHub API error:', error);
        }
    }

    logout() {
        this.isAdminLoggedIn = false;
        localStorage.removeItem('vrBlogAdminStatus');
        localStorage.removeItem('githubToken');
        this.githubConfig.token = null;
        this.updateAdminUI();
    }

    openMenu() {
        if (this.menuOverlay && this.hamburgerMenu) {
            this.menuOverlay.classList.add('active');
            this.hamburgerMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeMenu() {
        if (this.menuOverlay && this.hamburgerMenu) {
            this.menuOverlay.classList.remove('active');
            this.hamburgerMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    updateAdminUI() {
        if (this.isAdminLoggedIn) {
            // Show admin menu items
            if (this.menuAddPost) this.menuAddPost.style.display = 'block';
            if (this.menuLogout) this.menuLogout.style.display = 'block';
            // Hide login menu item
            if (this.menuAdminLogin) this.menuAdminLogin.style.display = 'none';
        } else {
            // Hide admin menu items
            if (this.menuAddPost) this.menuAddPost.style.display = 'none';
            if (this.menuLogout) this.menuLogout.style.display = 'none';
            // Show login menu item
            if (this.menuAdminLogin) this.menuAdminLogin.style.display = 'block';
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent any event bubbling issues on mobile
        
        if (!this.isAdminLoggedIn || !this.githubConfig.token) {
            alert('Please log in with your GitHub token first.');
            return;
        }
        
        const submitBtn = e.target.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        const isEditing = this.editingPostId !== null;
        
        // Disable button and show loading state
        submitBtn.textContent = isEditing ? 'Updating...' : 'Publishing...';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.style.pointerEvents = 'none';
        
        try {
            const formData = new FormData(this.postForm);
            
            // Validate required fields - use optional chaining like working version
            const title = formData.get('title')?.trim();
            const goodContent = formData.get('good-content')?.trim();
            const badContent = formData.get('bad-content')?.trim();
            const uglyContent = formData.get('ugly-content')?.trim();
            
            if (!title || !goodContent || !badContent || !uglyContent) {
                throw new Error('Please fill in all required fields');
            }
            
            // Get media URLs (async for file uploads)
            const goodMedia = await this.getMediaUrl('good');
            const badMedia = await this.getMediaUrl('bad');
            const uglyMedia = await this.getMediaUrl('ugly');
            
            // Build post data - match working version structure but preserve date when editing
            let postDate;
            if (isEditing) {
                const existingPost = this.posts.find(p => p.id === this.editingPostId);
                postDate = existingPost ? existingPost.date : new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } else {
                postDate = new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            
            const postData = {
                id: this.editingPostId || Date.now(),
                title: title,
                date: postDate,
                good: {
                    content: goodContent,
                    media: this.processMediaInput(formData.get('good-media-type'), goodMedia)
                },
                bad: {
                    content: badContent,
                    media: this.processMediaInput(formData.get('bad-media-type'), badMedia)
                },
                ugly: {
                    content: uglyContent,
                    media: this.processMediaInput(formData.get('ugly-media-type'), uglyMedia)
                }
            };

            if (isEditing) {
                // Update existing post
                const postIndex = this.posts.findIndex(p => p.id === this.editingPostId);
                if (postIndex !== -1) {
                    this.posts[postIndex] = postData;
                }
            } else {
                // Add new post
                this.posts.unshift(postData);
            }
            
            // Update GitHub repository
            const result = await this.updateGitHubRepo();
            
            // Update UI immediately with the current posts
            this.renderPosts();
            this.closeModal();
            
            // Success notification with details
            const commitInfo = result?.commit
                ? ` (commit ${result.commit.sha.substring(0, 7)})`
                : '';
            const message = isEditing 
                ? `✅ Review updated successfully! Saved to GitHub repository${commitInfo}.` 
                : `✅ Review published successfully! Saved to GitHub repository${commitInfo}. The site will update automatically after GitHub Pages rebuilds (1-2 minutes).`;
            
            alert(message);
            
            // Also log to console for debugging
            console.log('Post saved successfully:', {
                commit: result?.commit?.sha,
                branch: 'master',
                postCount: this.posts.length
            });
            
            // Force a reload of posts after a short delay to ensure we have the latest
            // This helps with cross-device sync
            setTimeout(() => {
                console.log('Refreshing posts to ensure latest data...');
                this.loadPosts();
            }, 2000);
            
        } catch (error) {
            console.error('Error saving review:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                isEditing: isEditing,
                postsCount: this.posts.length
            });
            
            // Revert changes if it was a new post (before showing error)
            if (!isEditing && this.posts.length > 0) {
                this.posts.shift();
            }
            
            // Show user-friendly error message
            let errorMessage = '❌ Error saving review. ';
            if (error.message.includes('fill in all')) {
                errorMessage = error.message;
            } else if (error.message.includes('Post not found')) {
                errorMessage = error.message;
            } else if (error.message.includes('No GitHub token')) {
                errorMessage += 'Please log in with your GitHub token first.';
            } else if (error.message.includes('GitHub API error')) {
                errorMessage += 'GitHub API error: ';
                errorMessage += error.message.replace('GitHub API error: ', '');
                errorMessage += ' Please check: Your GitHub token is valid and has "repo" permissions, you have write access to the repository, and your internet connection is working.';
            } else if (error.message.includes('Failed to create')) {
                errorMessage += error.message;
            } else {
                errorMessage += error.message || 'Unknown error occurred.';
                errorMessage += ' Please check your internet connection and try again.';
            }
            
            alert(errorMessage);
        } finally {
            // Re-enable button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.pointerEvents = 'auto';
        }
    }

    // Get the default branch (master/main) of the repository
    async getDefaultBranch() {
        try {
            const response = await fetch(`https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}`, {
                headers: {
                    'Authorization': `Bearer ${this.githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to get repository info');
            }
            
            const repoInfo = await response.json();
            return repoInfo.default_branch || 'master';
        } catch (error) {
            console.warn('Could not determine default branch, using master:', error);
            return 'master';
        }
    }

    async updateGitHubRepo() {
        if (!this.githubConfig.token) {
            throw new Error('No GitHub token available');
        }

        // Get the default branch (master/main) - this is what GitHub Pages serves from
        const targetBranch = await this.getDefaultBranch();
        console.log(`Saving to default branch: ${targetBranch}`);

        const maxRetries = 3;
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                // Get the current file from the default branch
                let currentFile = null;
                
                try {
                    const fileResponse = await fetch(`https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}/contents/reviews.json?ref=${targetBranch}`, {
                        headers: {
                            'Authorization': `Bearer ${this.githubConfig.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });
                    
                    if (fileResponse.ok) {
                        currentFile = await fileResponse.json();
                    } else if (fileResponse.status !== 404) {
                        throw new Error(`Failed to get current file: ${fileResponse.status}`);
                    }
                } catch (error) {
                    console.error('Error getting current file:', error);
                    // If it's a 404, file doesn't exist yet, which is fine
                    if (!error.message.includes('404')) {
                        throw error;
                    }
                }
                
                // If file exists and we're on first attempt, merge remote posts with local changes
                // This prevents losing posts that were added by other sessions/devices
                if (currentFile && attempt === 0) {
                    try {
                        const remoteContent = atob(currentFile.content.replace(/\s/g, ''));
                        const remoteData = JSON.parse(remoteContent);
                        
                        // Merge strategy: combine remote and local posts, avoiding duplicates by ID
                        if (remoteData.reviews && remoteData.reviews.length > 0) {
                            const localPostIds = new Set(this.posts.map(p => p.id));
                            const mergedPosts = [...this.posts]; // Start with local posts (they have our latest changes)
                            
                            // Add remote posts that don't exist in our local array
                            remoteData.reviews.forEach(remotePost => {
                                if (!localPostIds.has(remotePost.id)) {
                                    mergedPosts.push(remotePost);
                                }
                            });
                            
                            // Use merged posts for saving
                            this.posts = mergedPosts;
                            console.log(`Merged: ${mergedPosts.length} total posts (${remoteData.reviews.length} remote, ${localPostIds.size} local additions/changes)`);
                        }
                    } catch (error) {
                        console.warn('Could not parse remote data, proceeding with local data:', error);
                    }
                }
                
                // Prepare the new content
                const reviewsData = {
                    reviews: this.posts,
                    lastUpdated: new Date().toISOString(),
                    totalReviews: this.posts.length
                };
                
                const content = btoa(JSON.stringify(reviewsData, null, 2));
                
                // Generate commit message
                let commitMessage;
                if (this.posts.length === 0) {
                    commitMessage = 'Clear all reviews';
                } else if (this.posts.length === 1) {
                    commitMessage = `Add review: ${this.posts[0].title}`;
                } else {
                    const newPosts = this.posts.slice(0, 3).map(p => p.title).join(', ');
                    commitMessage = `Update reviews (${this.posts.length} total): ${newPosts}${this.posts.length > 3 ? '...' : ''}`;
                }
                
                const payload = {
                    message: commitMessage,
                    content: content,
                    branch: targetBranch
                };
                
                // Add SHA if file exists (required for updates)
                if (currentFile && currentFile.sha) {
                    payload.sha = currentFile.sha;
                }
                
                // Update the file on the default branch
                const response = await fetch(`https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}/contents/reviews.json`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.githubConfig.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    let errorData;
                    try {
                        errorData = await response.json();
                    } catch (e) {
                        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
                    }
                    
                    // Log detailed error for debugging
                    console.error('GitHub API error response:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorData,
                        targetBranch: targetBranch,
                        hasSha: !!(currentFile && currentFile.sha)
                    });
                    
                    // If it's a SHA mismatch, retry with fresh data
                    if (errorData.message && errorData.message.includes('does not match')) {
                        attempt++;
                        console.log(`SHA mismatch, retrying... (attempt ${attempt}/${maxRetries})`);
                        
                        if (attempt < maxRetries) {
                            // Wait a bit before retrying
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            continue;
                        }
                    }
                    
                    const errorMsg = errorData.message || `HTTP ${response.status}`;
                    throw new Error(`GitHub API error: ${errorMsg} (Status: ${response.status})`);
                }
                
                const result = await response.json();
                console.log(`✅ Successfully saved ${this.posts.length} reviews to ${targetBranch} branch`);
                console.log(`Commit SHA: ${result.commit.sha}`);
                return result;
                
            } catch (error) {
                attempt++;
                if (attempt >= maxRetries) {
                    throw error;
                } else {
                    console.log(`Error occurred, retrying... (attempt ${attempt}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
    }

    // Convert file to data URL (base64)
    async fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Get media URL from either file upload or URL input
    async getMediaUrl(section) {
        const mediaTypeSelect = document.getElementById(`${section}-media-type`);
        const mediaType = mediaTypeSelect ? mediaTypeSelect.value : null;
        
        if (!mediaType || mediaType === 'none') {
            return null;
        }
        
        const fileInput = document.getElementById(`${section}-media-file`);
        const urlInput = document.getElementById(`${section}-media-url`);
        
        // If a file is uploaded, use it (convert to data URL)
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            try {
                const dataURL = await this.fileToDataURL(fileInput.files[0]);
                return dataURL;
            } catch (error) {
                console.error('Error reading file:', error);
                return (urlInput && urlInput.value) ? urlInput.value : null;
            }
        }
        
        // Otherwise, use the URL input value
        return (urlInput && urlInput.value) ? urlInput.value : null;
    }

    processMediaInput(type, url) {
        if (type === 'none' || !url) {
            return null;
        }

        if (type === 'youtube') {
            return {
                type: 'youtube',
                url: this.convertYouTubeUrl(url)
            };
        } else if (type === 'image') {
            return {
                type: 'image',
                url: url
            };
        }

        return null;
    }

    convertYouTubeUrl(url) {
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/)?([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return `https://www.youtube.com/embed/${match[1]}`;
            }
        }

        return url;
    }


    renderPosts() {
        if (!this.blogPostsContainer) {
            console.error('Blog posts container not found');
            return;
        }
        
        // Clear the container
        this.blogPostsContainer.innerHTML = '';
        
        if (this.posts.length === 0) {
            this.blogPostsContainer.innerHTML = `
                <div class="no-posts">
                    <h3>No reviews yet</h3>
                    <p>Add your first VR/MR experience review.</p>
                </div>
            `;
            return;
        }

        // Sort posts by date (newest first) - using ID as fallback if date is same
        const sortedPosts = [...this.posts].sort((a, b) => {
            // Try to parse dates, fallback to ID comparison
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateB.getTime() - dateA.getTime(); // Newest first
            }
            return (b.id || 0) - (a.id || 0); // Fallback to ID
        });

        sortedPosts.forEach(post => {
            const postElement = this.createPostElement(post);
            this.blogPostsContainer.appendChild(postElement);
        });
        
        console.log(`Rendered ${sortedPosts.length} posts`);
    }

    createPostElement(post) {
        const article = document.createElement('article');
        article.className = 'blog-post';
        article.style.cursor = 'pointer';
        
        // Add click event to open detailed modal
        article.addEventListener('click', () => {
            this.openPostDetailModal(post);
        });
        
        // Truncate content for preview
        const truncateText = (text, maxLength = 150) => {
            const sanitized = this.sanitizeText(text);
            if (sanitized.length <= maxLength) return sanitized;
            return sanitized.substring(0, maxLength) + '...';
        };
        
        article.innerHTML = `
            <div class="post-header">
                <h2 class="post-title">${this.sanitizeText(post.title)}</h2>
                <p class="post-date">${this.sanitizeText(post.date)}</p>
                <p class="read-more-hint">Click to read full review</p>
            </div>
            
            <div class="review-section">
                <h3 class="section-title">The Good</h3>
                <div class="section-content">
                    <div class="section-text">${truncateText(post.good.content)}</div>
                    ${post.good.media ? `<div class="section-media">${this.renderMedia(post.good.media)}</div>` : ''}
                </div>
            </div>
            
            <div class="review-section">
                <h3 class="section-title">The Bad</h3>
                <div class="section-content">
                    <div class="section-text">${truncateText(post.bad.content)}</div>
                    ${post.bad.media ? `<div class="section-media">${this.renderMedia(post.bad.media)}</div>` : ''}
                </div>
            </div>
            
            <div class="review-section">
                <h3 class="section-title">The Ugly</h3>
                <div class="section-content">
                    <div class="section-text">${truncateText(post.ugly.content)}</div>
                    ${post.ugly.media ? `<div class="section-media">${this.renderMedia(post.ugly.media)}</div>` : ''}
                </div>
            </div>
        `;
        
        return article;
    }

    renderMedia(media) {
        if (!media) {
            return '';
        }

        if (media.type === 'youtube') {
            return `<iframe src="${media.url}" allowfullscreen loading="lazy" title="YouTube video"></iframe>`;
        } else if (media.type === 'image') {
            return `<img src="${media.url}" alt="Review media" loading="lazy" onerror="this.parentElement.innerHTML='Image failed to load'">`;
        }

        return '';
    }

    async loadPosts() {
        // For GitHub Pages, prioritize loading from the static file first
        // This avoids CORS issues and is faster
        const cacheBuster = `?t=${Date.now()}`;
        
        try {
            // First, try loading from the static file (works on GitHub Pages)
            const directResponse = await fetch(`./reviews.json${cacheBuster}`, { 
                cache: 'no-store',
                method: 'GET'
            });
            
            if (directResponse.ok) {
                try {
                    const data = await directResponse.json();
                    if (data && data.reviews && Array.isArray(data.reviews)) {
                        this.posts = data.reviews;
                        console.log(`✅ Loaded ${this.posts.length} posts from static reviews.json`);
                        this.renderPosts();
                        return; // Success, exit early
                    }
                } catch (parseError) {
                    console.warn('Error parsing static reviews.json, trying GitHub API...', parseError);
                }
            }
        } catch (e) {
            console.log('Static file not available, trying GitHub API...');
        }
        
        // Fallback: Try GitHub API (without Cache-Control header to avoid CORS issues)
        try {
            // Determine the default branch
            let targetBranch = 'master';
            
            try {
                const repoResponse = await fetch(`https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}`, {
                    method: 'GET'
                    // No custom headers to avoid CORS issues
                });
                if (repoResponse.ok) {
                    const repoInfo = await repoResponse.json();
                    targetBranch = repoInfo.default_branch || 'master';
                }
            } catch (e) {
                console.log('Could not determine default branch, using master');
            }
            
            // Load from the default branch (no Cache-Control header - causes CORS issues)
            const response = await fetch(`https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}/contents/reviews.json?ref=${targetBranch}`, {
                method: 'GET'
                // No custom headers - GitHub API doesn't allow Cache-Control in CORS preflight
            });
            
            if (response.ok) {
                const fileData = await response.json();
                
                // Validate that we have content
                if (!fileData.content) {
                    console.warn('GitHub API response missing content field');
                    this.posts = [];
                } else {
                    try {
                        const content = atob(fileData.content.replace(/\s/g, '')); // Remove whitespace from base64
                        
                        // Validate that content is not empty
                        if (!content || content.trim() === '') {
                            console.warn('Decoded content is empty');
                            this.posts = [];
                        } else {
                            const data = JSON.parse(content);
                            this.posts = data.reviews || [];
                            console.log(`✅ Loaded ${this.posts.length} posts from GitHub API (branch: ${targetBranch})`);
                        }
                    } catch (parseError) {
                        console.error('Error parsing reviews.json content:', parseError);
                        this.posts = [];
                    }
                }
            } else if (response.status === 404) {
                console.log(`No reviews.json found in ${targetBranch} branch`);
                this.posts = [];
            } else {
                console.warn(`Failed to load posts from GitHub API (${response.status}):`, response.statusText);
                this.posts = [];
            }
        } catch (error) {
            console.error('Could not load posts from GitHub API:', error);
            // If we already tried static file and it failed, posts will be empty
            if (this.posts.length === 0) {
                console.warn('Could not load posts from any source, starting with empty posts');
            }
        }
        
        this.renderPosts();
    }
}

// Create global instance for button callbacks
let vrBlog;

document.addEventListener('DOMContentLoaded', () => {
    vrBlog = new VRBlog();
});
