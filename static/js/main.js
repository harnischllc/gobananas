// Go Bananas - Enhanced Interactive JavaScript

class BananaRipenessApp {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.initializeAnimations();
    }

    initializeElements() {
        // Form elements
        this.form = document.getElementById('bananaForm');
        this.fileInput = document.getElementById('bananaImage');
        this.submitBtn = document.getElementById('submitBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        
        // Upload area elements
        this.uploadArea = document.getElementById('uploadArea');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImg = document.getElementById('previewImg');
        this.removeImageBtn = document.getElementById('removeImage');
        
        // Color picker elements
        this.colorPicker = document.getElementById('colorPicker');
        this.hexInput = document.getElementById('hexInput');
        this.colorSwatch = document.getElementById('colorSwatch');
        this.colorHex = document.getElementById('colorHex');
        
        // State management
        this.hasImage = false;
        this.hasColor = false;
        this.isSubmitting = false;
    }

    bindEvents() {
        // Upload area events
        if (this.uploadArea) {
            this.uploadArea.addEventListener('click', () => this.triggerFileInput());
            this.setupDragAndDrop();
        }

        // File input events
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        }

        // Remove image button
        if (this.removeImageBtn) {
            this.removeImageBtn.addEventListener('click', () => this.removeImage());
        }

        // Color picker events
        if (this.colorPicker) {
            this.colorPicker.addEventListener('input', (e) => this.handleColorChange(e));
        }

        if (this.hexInput) {
            this.hexInput.addEventListener('input', (e) => this.handleHexInput(e));
            this.hexInput.addEventListener('blur', (e) => this.validateHexInput(e));
        }

        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Touch events for mobile
        this.setupTouchEvents();
    }

    initializeAnimations() {
        // Add fade-in animation to cards
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 200);
        });

        // Add pulse animation to banana emoji
        const bananaEmoji = document.querySelector('h1');
        if (bananaEmoji && bananaEmoji.textContent.includes('🍌')) {
            bananaEmoji.style.animation = 'bounce 2s infinite';
        }
    }

    triggerFileInput() {
        if (this.fileInput) {
            this.fileInput.click();
        }
    }

    handleFileSelection(e) {
        const file = e.target.files[0];
        if (file) {
            this.validateAndPreviewImage(file);
        }
    }

    validateAndPreviewImage(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showAlert('Please select a valid image file (PNG, JPG, JPEG, GIF, BMP)', 'danger');
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showAlert('Image file is too large. Please select an image smaller than 10MB.', 'danger');
            return;
        }

        this.previewImage(file);
    }

    previewImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImg.src = e.target.result;
            this.imagePreview.classList.remove('d-none');
            this.uploadArea.classList.add('d-none');
            
            // Add smooth transition
            this.imagePreview.style.opacity = '0';
            this.imagePreview.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                this.imagePreview.style.transition = 'all 0.3s ease-out';
                this.imagePreview.style.opacity = '1';
                this.imagePreview.style.transform = 'scale(1)';
            }, 50);

            this.hasImage = true;
            this.updateSubmitButtonState();
            this.showSuccessMessage('Image uploaded successfully!');
        };
        
        reader.onerror = () => {
            this.showAlert('Error reading image file. Please try again.', 'danger');
        };
        
        reader.readAsDataURL(file);
    }

    removeImage() {
        this.fileInput.value = '';
        this.imagePreview.classList.add('d-none');
        this.uploadArea.classList.remove('d-none');
        this.hasImage = false;
        this.updateSubmitButtonState();
        
        // Add smooth transition
        this.uploadArea.style.opacity = '0';
        this.uploadArea.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            this.uploadArea.style.transition = 'all 0.3s ease-out';
            this.uploadArea.style.opacity = '1';
            this.uploadArea.style.transform = 'scale(1)';
        }, 50);
    }

    handleColorChange(e) {
        const color = e.target.value;
        this.hexInput.value = color.substring(1); // Remove # symbol
        this.updateColorSwatch(color);
        this.hasColor = true;
        this.updateSubmitButtonState();
    }

    handleHexInput(e) {
        const hex = e.target.value.replace('#', '');
        
        // Validate hex format
        if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
            const color = '#' + hex;
            this.colorPicker.value = color;
            this.updateColorSwatch(color);
            this.hasColor = true;
            this.updateSubmitButtonState();
            
            // Add visual feedback
            this.hexInput.style.borderColor = '#4CAF50';
            setTimeout(() => {
                this.hexInput.style.borderColor = '';
            }, 1000);
        } else if (hex.length === 6) {
            // Invalid hex format
            this.hexInput.style.borderColor = '#F44336';
            this.hasColor = false;
            this.updateSubmitButtonState();
        }
    }

    validateHexInput(e) {
        const hex = e.target.value.replace('#', '');
        if (hex.length > 0 && !/^[0-9A-Fa-f]{6}$/.test(hex)) {
            this.showAlert('Please enter a valid 6-digit hex color code', 'warning');
            this.hexInput.focus();
        }
    }

    updateColorSwatch(color) {
        const swatchColor = this.colorSwatch.querySelector('.swatch-color');
        if (swatchColor) {
            swatchColor.style.backgroundColor = color;
            
            // Add animation
            swatchColor.style.transform = 'scale(1.1)';
            setTimeout(() => {
                swatchColor.style.transform = 'scale(1)';
            }, 200);
        }
        
        if (this.colorHex) {
            this.colorHex.textContent = color.toUpperCase();
        }
    }

    setupDragAndDrop() {
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });

        this.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.fileInput.files = files;
                this.validateAndPreviewImage(files[0]);
            }
        });
    }

    setupTouchEvents() {
        // Add touch feedback for mobile devices
        const touchElements = document.querySelectorAll('.btn, .upload-area, .color-swatch');
        
        touchElements.forEach(element => {
            element.addEventListener('touchstart', (e) => {
                element.style.transform = 'scale(0.95)';
            });
            
            element.addEventListener('touchend', (e) => {
                setTimeout(() => {
                    element.style.transform = '';
                }, 150);
            });
        });
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        this.setLoadingState(true);
        this.submitForm();
    }

    validateForm() {
        if (!this.hasImage && !this.hasColor) {
            this.showAlert('Please upload an image or select a color to analyze!', 'warning');
            return false;
        }

        return true;
    }

    updateSubmitButtonState() {
        if (this.submitBtn) {
            const isValid = this.hasImage || this.hasColor;
            this.submitBtn.disabled = !isValid || this.isSubmitting;
            
            if (isValid) {
                this.submitBtn.classList.add('btn-warning');
                this.submitBtn.classList.remove('btn-secondary');
            } else {
                this.submitBtn.classList.add('btn-secondary');
                this.submitBtn.classList.remove('btn-warning');
            }
        }
    }

    setLoadingState(loading) {
        this.isSubmitting = loading;
        
        if (this.submitBtn) {
            this.submitBtn.disabled = loading;
            
            if (loading) {
                this.loadingSpinner.classList.remove('d-none');
                this.submitBtn.innerHTML = `
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Analyzing...
                `;
            } else {
                this.loadingSpinner.classList.add('d-none');
                this.submitBtn.innerHTML = `
                    <i class="fas fa-search me-2"></i>
                    Analyze Ripeness
                `;
            }
        }
        
        this.updateSubmitButtonState();
    }

    submitForm() {
        const formData = new FormData(this.form);
        
        fetch('/classify', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        })
        .then(html => {
            // Smooth transition to result page
            this.showTransition(() => {
                document.body.innerHTML = html;
            });
        })
        .catch(error => {
            console.error('Error:', error);
            this.showAlert('An error occurred while processing your request. Please try again.', 'danger');
            this.setLoadingState(false);
        });
    }

    showTransition(callback) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #FFE135 0%, #4CAF50 100%);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        overlay.innerHTML = `
            <div style="text-align: center; color: white;">
                <div class="spinner-border text-white mb-3" style="width: 3rem; height: 3rem;"></div>
                <h4>Analyzing your banana...</h4>
                <p>Please wait while we process your image</p>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 50);
        
        setTimeout(() => {
            callback();
        }, 1000);
    }

    showAlert(message, type) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show fade-in`;
        alertDiv.innerHTML = `
            <i class="fas fa-${this.getAlertIcon(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at the top of the container
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);
        }
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.style.opacity = '0';
                alertDiv.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    alertDiv.remove();
                }, 300);
            }
        }, 5000);
    }

    showSuccessMessage(message) {
        this.showAlert(message, 'success');
    }

    getAlertIcon(type) {
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new BananaRipenessApp();
});

// Add custom CSS for enhanced interactions
const style = document.createElement('style');
style.textContent = `
    .fade-in {
        animation: fadeIn 0.5s ease-out;
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .drag-over {
        border-color: #4CAF50 !important;
        background: rgba(76, 175, 80, 0.1) !important;
        transform: scale(1.02) !important;
    }
    
    .btn:active {
        transform: scale(0.95);
    }
    
    .upload-area:active {
        transform: scale(0.98);
    }
    
    .color-swatch:active {
        transform: scale(0.95);
    }
    
    .form-control:focus {
        transform: scale(1.02);
        box-shadow: 0 0 0 0.3rem rgba(255, 225, 53, 0.25);
    }
    
    .swatch-color {
        transition: all 0.3s ease;
    }
    
    .swatch-color:hover {
        transform: scale(1.1);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    }
    
    .img-thumbnail {
        transition: all 0.3s ease;
    }
    
    .img-thumbnail:hover {
        transform: scale(1.05);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
    }
`;
document.head.appendChild(style);
