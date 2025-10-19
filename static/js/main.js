// Go Bananas - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('bananaForm');
    const fileInput = document.getElementById('bananaImage');
    const detectBtn = document.getElementById('detectBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultContainer = document.getElementById('resultContainer');

    // Form submission handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const file = fileInput.files[0];
        if (!file) {
            showAlert('Please select an image file first!', 'warning');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showAlert('Please select a valid image file (JPG, PNG, GIF)!', 'danger');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Image file is too large. Please select an image smaller than 5MB.', 'danger');
            return;
        }

        // Show loading state
        setLoadingState(true);
        
        // Submit form
        submitForm();
    });

    // File input change handler
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Preview image
            previewImage(file);
        }
    });

    function submitForm() {
        const formData = new FormData(form);
        
        fetch('/detect', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error('Network response was not ok');
        })
        .then(html => {
            // Redirect to result page
            document.body.innerHTML = html;
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('An error occurred while processing your image. Please try again.', 'danger');
            setLoadingState(false);
        });
    }

    function previewImage(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Create preview element
            let preview = document.getElementById('imagePreview');
            if (!preview) {
                preview = document.createElement('div');
                preview.id = 'imagePreview';
                preview.className = 'mt-3 text-center';
                form.appendChild(preview);
            }
            
            preview.innerHTML = `
                <img src="${e.target.result}" class="img-thumbnail" style="max-width: 200px; max-height: 200px;" alt="Preview">
                <div class="mt-2">
                    <small class="text-muted">Selected: ${file.name} (${formatFileSize(file.size)})</small>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }

    function setLoadingState(loading) {
        detectBtn.disabled = loading;
        if (loading) {
            loadingSpinner.classList.remove('d-none');
            detectBtn.innerHTML = '<span class="spinner-border spinner-border-sm" id="loadingSpinner"></span> Processing...';
        } else {
            loadingSpinner.classList.add('d-none');
            detectBtn.innerHTML = 'Detect Ripeness';
        }
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert before the form
        form.parentNode.insertBefore(alertDiv, form);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Drag and drop functionality
    const dropZone = form;
    
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            fileInput.dispatchEvent(new Event('change'));
        }
    });
});

// Add CSS for drag and drop
const style = document.createElement('style');
style.textContent = `
    .drag-over {
        background-color: rgba(255, 215, 0, 0.1) !important;
        border: 2px dashed #ffd700 !important;
    }
`;
document.head.appendChild(style);
