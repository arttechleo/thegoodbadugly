// Handle media type selection to show/hide appropriate inputs
function setupMediaTypeHandlers() {
    const sections = ['good', 'bad', 'ugly'];
    
    sections.forEach(section => {
        const mediaTypeSelect = document.getElementById(`${section}-media-type`);
        const urlInput = document.getElementById(`${section}-media-url`);
        const fileWrapper = document.querySelector(`#${section}-media-file`).parentElement;
        
        function updateMediaInputs() {
            const mediaType = mediaTypeSelect.value;
            
            if (mediaType === 'none') {
                urlInput.classList.remove('show');
                fileWrapper.classList.remove('show');
            } else if (mediaType === 'image') {
                urlInput.classList.add('show');
                fileWrapper.classList.add('show');
                urlInput.placeholder = 'Enter image URL';
            } else if (mediaType === 'youtube') {
                urlInput.classList.add('show');
                fileWrapper.classList.remove('show');
                urlInput.placeholder = 'Enter YouTube URL';
            }
        }
        
        mediaTypeSelect.addEventListener('change', updateMediaInputs);
        updateMediaInputs(); // Initialize on page load
    });
}

// Convert file to data URL (base64)
function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Get media URL from either file upload or URL input
async function getMediaUrl(section) {
    const mediaType = document.getElementById(`${section}-media-type`).value;
    
    if (mediaType === 'none') {
        return null;
    }
    
    const fileInput = document.getElementById(`${section}-media-file`);
    const urlInput = document.getElementById(`${section}-media-url`);
    
    // If a file is uploaded, use it (convert to data URL)
    if (fileInput.files && fileInput.files.length > 0) {
        try {
            const dataURL = await fileToDataURL(fileInput.files[0]);
            return dataURL;
        } catch (error) {
            console.error('Error reading file:', error);
            return urlInput.value || null;
        }
    }
    
    // Otherwise, use the URL input value
    return urlInput.value || null;
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    setupMediaTypeHandlers();
});
