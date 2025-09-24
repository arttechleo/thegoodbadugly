// Node.js script to generate individual pages from reviews.json
// Run with: node generate-pages.js

const fs = require('fs');
const path = require('path');

// Configuration
const REVIEWS_FILE = 'reviews.json';
const TEMPLATE_FILE = 'review-template.html';
const OUTPUT_DIR = 'reviews';

// Utility functions
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function renderMedia(media) {
    if (!media) return '';
    
    if (media.type === 'youtube') {
        return `<div class="section-media"><iframe src="${media.url}" allowfullscreen loading="lazy" title="YouTube video"></iframe></div>`;
    } else if (media.type === 'image') {
        return `<div class="section-media"><img src="${media.url}" alt="Review media" loading="lazy" onerror="this.parentElement.innerHTML='<span>Image failed to load</span>'"></div>`;
    }
    
    return '';
}

function generatePrevNextLinks(reviews, currentIndex) {
    let links = '';
    
    if (currentIndex > 0) {
        const prevReview = reviews[currentIndex - 1];
        const prevSlug = slugify(prevReview.title);
        links += `<a href="reviews/${prevSlug}.html" class="nav-button">← Previous: ${prevReview.title}</a>`;
    }
    
    if (currentIndex < reviews.length - 1) {
        const nextReview = reviews[currentIndex + 1];
        const nextSlug = slugify(nextReview.title);
        links += `<a href="reviews/${nextSlug}.html" class="nav-button">Next: ${nextReview.title} →</a>`;
    }
    
    return links;
}

function generatePage(review, template, reviews, currentIndex) {
    const slug = slugify(review.title);
    const description = `Review of ${review.title}: ${review.good.content.substring(0, 150)}...`;
    
    let html = template
        .replace(/{{TITLE}}/g, review.title)
        .replace(/{{DESCRIPTION}}/g, description)
        .replace(/{{DATE}}/g, review.date)
        .replace(/{{GOOD_CONTENT}}/g, review.good.content)
        .replace(/{{BAD_CONTENT}}/g, review.bad.content)
        .replace(/{{UGLY_CONTENT}}/g, review.ugly.content)
        .replace(/{{GOOD_MEDIA}}/g, renderMedia(review.good.media))
        .replace(/{{BAD_MEDIA}}/g, renderMedia(review.bad.media))
        .replace(/{{UGLY_MEDIA}}/g, renderMedia(review.ugly.media))
        .replace(/{{PREV_NEXT_LINKS}}/g, generatePrevNextLinks(reviews, currentIndex));
    
    return { html, slug };
}

function updateIndexPage(reviews) {
    // Update the main index.html to link to individual pages instead of modals
    const indexPath = 'index.html';
    
    if (!fs.existsSync(indexPath)) {
        console.log('index.html not found, skipping update');
        return;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf-8');
    
    // Add a script to modify the click behavior
    const scriptToAdd = `
    <script>
        // Override click behavior to navigate to individual pages
        document.addEventListener('DOMContentLoaded', () => {
            const posts = document.querySelectorAll('.blog-post');
            posts.forEach((post, index) => {
                post.style.cursor = 'pointer';
                post.addEventListener('click', (e) => {
                    e.preventDefault();
                    const title = post.querySelector('.post-title').textContent;
                    const slug = title.toLowerCase()
                        .replace(/[^\\w\\s-]/g, '')
                        .replace(/[\\s_-]+/g, '-')
                        .replace(/^-+|-+$/g, '');
                    window.location.href = \`reviews/\${slug}.html\`;
                });
            });
        });
    </script>`;
    
    // Insert before closing body tag if not already present
    if (!indexContent.includes('// Override click behavior')) {
        indexContent = indexContent.replace('</body>', scriptToAdd + '\\n</body>');
        fs.writeFileSync(indexPath, indexContent);
        console.log('Updated index.html with navigation links');
    }
}

// Main function
function generateAllPages() {
    try {
        // Read reviews data
        if (!fs.existsSync(REVIEWS_FILE)) {
            console.error(`Error: ${REVIEWS_FILE} not found`);
            process.exit(1);
        }
        
        const reviewsData = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf-8'));
        const reviews = reviewsData.reviews || [];
        
        if (reviews.length === 0) {
            console.log('No reviews found in reviews.json');
            return;
        }
        
        // Read template
        if (!fs.existsSync(TEMPLATE_FILE)) {
            console.error(`Error: ${TEMPLATE_FILE} not found`);
            process.exit(1);
        }
        
        const template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');
        
        // Create output directory
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR);
        }
        
        // Generate pages
        const generatedPages = [];
        reviews.forEach((review, index) => {
            const { html, slug } = generatePage(review, template, reviews, index);
            const filename = `${slug}.html`;
            const filepath = path.join(OUTPUT_DIR, filename);
            
            fs.writeFileSync(filepath, html);
            generatedPages.push({ title: review.title, slug, filename });
            console.log(`Generated: ${filepath}`);
        });
        
        // Generate sitemap
        generateSitemap(generatedPages);
        
        // Update index page
        updateIndexPage(reviews);
        
        console.log(`\\n✅ Generated ${generatedPages.length} pages successfully!`);
        console.log('Pages created in ./reviews/ directory');
        
    } catch (error) {
        console.error('Error generating pages:', error);
        process.exit(1);
    }
}

function generateSitemap(pages) {
    const baseUrl = 'https://yourusername.github.io/your-repo-name'; // Update this
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>`;
    
    pages.forEach(page => {
        sitemap += `
    <url>
        <loc>${baseUrl}/reviews/${page.slug}.html</loc>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`;
    });
    
    sitemap += `
</urlset>`;
    
    fs.writeFileSync('sitemap.xml', sitemap);
    console.log('Generated sitemap.xml');
}

// Run the generator
generateAllPages();