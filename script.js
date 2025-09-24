class VRBlog {
    constructor() {
        // GitHub configuration - MUST BE FIRST
        this.githubConfig = {
            owner: 'arttechleo',
            repo: 'thegoodbadugly',
            token: localStorage.getItem('githubToken') || null
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
        
        // Button elements
        this.addPostBtn = document.getElementById('add-post-btn');
        this.clearPostsBtn = document.getElementById('clear-posts-btn');
        this.logoutBtn = document.getElementById('logout-btn');
        this.adminLoginBtn = document.getElementById('admin-login-btn');
        
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
        this.adminControls = document.getElementById('admin-controls');
        this.adminLoginContainer = document.getElementById('admin-login');
        
        // Other elements
        this.themeToggle = document.getElementById('theme-toggle');
        this.aboutLink = document.getElementById('about-link');
        this.contactLink = document.getElementById('contact-link');

        this.initializeEventListeners();
        this.initializeTheme();
        this.setupMediaTypeSelectors();
        this.updateAdminUI();
        this.loadPosts();
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
        // Admin controls
        if (this.addPostBtn) {
            this.addPostBtn.addEventListener('click', () => this.openModal());
        }
        
        if (this.clearPostsBtn) {
            this.clearPostsBtn.addEventListener('click', () => this.clearAllPosts());
        }
        
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.logout());
        }
        
        if (this.adminLoginBtn) {
            this.adminLoginBtn.addEventListener('click', () => this.openAdminLoginModal());
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
        
        // Theme and navigation
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        if (this.aboutLink) {
            this.aboutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openAboutModal();
            });
        }
        
        if (this.contactLink) {
            this.contactLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openContactModal();
            });
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
        const mediaTypeSelects = document.querySelectorAll('[id$="-media-type"]');
        
        mediaTypeSelects.forEach(select => {
            const mediaInput = select.parentElement.querySelector('.media-input');
            
            select.addEventListener('change', (e) => {
                if (e.target.value === 'none') {
                    mediaInput.style.display = 'none';
                    mediaInput.required = false;
                } else {
                    mediaInput.style.display = 'block';
                    mediaInput.required = false;
                    
                    if (e.target.value === 'youtube') {
                        mediaInput.placeholder = 'YouTube URL';
                    } else {
                        mediaInput.placeholder = 'Image URL';
                    }
                }
            });
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
        const mediaInput = document.getElementById(`${section}-media`);
        
        if (media) {
            typeSelect.value = media.type;
            mediaInput.style.display = 'block';
            
            if (media.type === 'youtube') {
                // Convert embed URL back to regular YouTube URL for editing
                const videoId = media.url.split('/embed/')[1];
                mediaInput.value = `https://www.youtube.com/watch?v=${videoId}`;
            } else {
                mediaInput.value = media.url;
            }
        } else {
            typeSelect.value = 'none';
            mediaInput.style.display = 'none';
            mediaInput.value = '';
        }
    }

    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.postForm.reset();
        this.editingPostId = null;
        
        document.querySelectorAll('.media-input').forEach(input => {
            input.style.display = 'none';
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
                    <h2 class="post-title">${post.title}</h2>
                    <p class="post-date">Published on ${post.date}</p>
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
                        <div class="section-text">${post.good.content}</div>
                        ${post.good.media ? `<div class="section-media">${this.renderMedia(post.good.media)}</div>` : ''}
                    </div>
                </div>
                
                <div class="review-section">
                    <h3 class="section-title">The Bad</h3>
                    <div class="section-content">
                        <div class="section-text">${post.bad.content}</div>
                        ${post.bad.media ? `<div class="section-media">${this.renderMedia(post.bad.media)}</div>` : ''}
                    </div>
                </div>
                
                <div class="review-section">
                    <h3 class="section-title">The Ugly</h3>
                    <div class="section-content">
                        <div class="section-text">${post.ugly.content}</div>
                        ${post.ugly.media ? `<div class="section-media">${this.renderMedia(post.ugly.media)}</div>` : ''}
                    </div>
                </div>
            `;
        }

        document.getElementById('detail-title').textContent = post.title;
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
            await this.updateGitHubRepo();
            this.closePostDetailModal();
            this.renderPosts();
            alert('Review deleted successfully!');
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
                    'Authorization': `token ${token}`,
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

    updateAdminUI() {
        if (this.isAdminLoggedIn) {
            this.adminControls.style.display = 'flex';
            this.adminLoginContainer.style.display = 'none';
        } else {
            this.adminControls.style.display = 'none';
            this.adminLoginContainer.style.display = 'block';
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
            
            // Validate required fields
            const title = formData.get('title')?.trim();
            const goodContent = formData.get('good-content')?.trim();
            const badContent = formData.get('bad-content')?.trim();
            const uglyContent = formData.get('ugly-content')?.trim();
            
            if (!title || !goodContent || !badContent || !uglyContent) {
                throw new Error('Please fill in all required fields');
            }
            
            const postData = {
                id: this.editingPostId || Date.now(),
                title: title,
                date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                good: {
                    content: goodContent,
                    media: this.processMediaInput(formData.get('good-media-type'), formData.get('good-media'))
                },
                bad: {
                    content: badContent,
                    media: this.processMediaInput(formData.get('bad-media-type'), formData.get('bad-media'))
                },
                ugly: {
                    content: uglyContent,
                    media: this.processMediaInput(formData.get('ugly-media-type'), formData.get('ugly-media'))
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
            await this.updateGitHubRepo();
            
            // Update UI
            this.renderPosts();
            this.closeModal();
            
            // Success notification
            const message = isEditing ? 'Review updated successfully!' : 'Review published successfully!';
            
            // Use a more mobile-friendly notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(message);
            } else {
                alert(message);
            }
            
        } catch (error) {
            console.error('Error saving review:', error);
            
            // Show user-friendly error message
            const errorMessage = error.message.includes('fill in all') 
                ? error.message 
                : 'Error saving review. Please check your internet connection and try again.';
            
            alert(errorMessage);
            
            // Revert changes if it was a new post
            if (!isEditing) {
                this.posts.shift();
            }
        } finally {
            // Re-enable button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.pointerEvents = 'auto';
        }
    }

    async updateGitHubRepo() {
        if (!this.githubConfig.token) {
            throw new Error('No GitHub token available');
        }

        const maxRetries = 3;
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                // Get the current file to get its SHA (required for updates)
                const getCurrentFile = async () => {
                    try {
                        const response = await fetch(`https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}/contents/reviews.json`, {
                            headers: {
                                'Authorization': `token ${this.githubConfig.token}`,
                                'Accept': 'application/vnd.github.v3+json'
                            }
                        });
                        
                        if (response.ok) {
                            return await response.json();
                        } else if (response.status === 404) {
                            // File doesn't exist, we'll create it
                            return null;
                        } else {
                            throw new Error(`Failed to get current file: ${response.status}`);
                        }
                    } catch (error) {
                        console.error('Error getting current file:', error);
                        return null;
                    }
                };

                const currentFile = await getCurrentFile();
                
                // If file exists, merge with remote data to avoid conflicts
                if (currentFile && attempt === 0) {
                    try {
                        const remoteContent = atob(currentFile.content);
                        const remoteData = JSON.parse(remoteContent);
                        
                        // Simple merge strategy - keep local posts but update with any remote changes
                        if (remoteData.reviews && remoteData.reviews.length > 0) {
                            console.log('Merging with remote data...');
                            // You could implement more sophisticated merging here if needed
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
                
                // Prepare the update payload
                const payload = {
                    message: this.posts.length > 0 ? `Update reviews: ${this.posts[0].title}` : 'Clear all reviews',
                    content: content
                };
                
                // Add SHA if file exists (required for updates)
                if (currentFile && currentFile.sha) {
                    payload.sha = currentFile.sha;
                }
                
                // Update the file
                const response = await fetch(`https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}/contents/reviews.json`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${this.githubConfig.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    
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
                    
                    throw new Error(`GitHub API error: ${errorData.message || response.status}`);
                }
                
                return await response.json();
                
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

    async clearAllPosts() {
        if (!this.isAdminLoggedIn || !this.githubConfig.token) {
            alert('Admin access required.');
            return;
        }
        
        if (!confirm('Are you sure you want to delete all reviews? This action cannot be undone and will update your GitHub repository.')) {
            return;
        }
        
        try {
            this.posts = [];
            await this.updateGitHubRepo();
            this.renderPosts();
            alert('All reviews cleared successfully!');
        } catch (error) {
            console.error('Error clearing posts:', error);
            alert('Error clearing reviews. Please try again.');
        }
    }

    renderPosts() {
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

        this.posts.forEach(post => {
            const postElement = this.createPostElement(post);
            this.blogPostsContainer.appendChild(postElement);
        });
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
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
        };
        
        article.innerHTML = `
            <div class="post-header">
                <h2 class="post-title">${post.title}</h2>
                <p class="post-date">${post.date}</p>
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
        try {
            const response = await fetch(`https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}/contents/reviews.json`);
            
            if (response.ok) {
                const fileData = await response.json();
                const content = atob(fileData.content);
                const data = JSON.parse(content);
                this.posts = data.reviews || [];
            } else {
                console.log('No reviews.json found in repository, starting with empty posts');
                this.posts = [];
            }
        } catch (error) {
            console.log('Could not load posts from GitHub, using local storage:', error);
            const saved = localStorage.getItem('vrBlogPosts');
            this.posts = saved ? JSON.parse(saved) : [];
        }
        
        this.renderPosts();
    }
}

// Create global instance for button callbacks
let vrBlog;

document.addEventListener('DOMContentLoaded', () => {
    vrBlog = new VRBlog();
});