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
        this.quickColors = document.querySelectorAll('.quick-colors [data-color]');
        this.colorGuideCircles = document.querySelectorAll('.color-circle');

        // Mobile camera buttons
        this.btnUploadFile = document.getElementById('btnUploadFile');
        this.btnTakePhoto = document.getElementById('btnTakePhoto');
        
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

        // Distinct upload/take photo buttons
        if (this.btnUploadFile) {
            this.btnUploadFile.addEventListener('click', () => this.triggerFileInput());
        }
        if (this.btnTakePhoto) {
            this.btnTakePhoto.addEventListener('click', () => this.triggerCameraCapture());
        }

        // Remove image button
        if (this.removeImageBtn) {
            this.removeImageBtn.addEventListener('click', () => this.removeImage());
        }

        // Banana color button events
        const colorButtons = document.querySelectorAll('.banana-color-btn');
        colorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleBananaColorClick(e));
        });

        // Quick preset colors
        if (this.quickColors && this.quickColors.length) {
            this.quickColors.forEach(btn => {
                btn.addEventListener('click', () => this.applyPresetColor(btn.getAttribute('data-color')));
            });
        }

        // Interactive color guide
        if (this.colorGuideCircles && this.colorGuideCircles.length) {
            this.colorGuideCircles.forEach(circle => {
                circle.addEventListener('click', () => this.applyPresetColor(this.getComputedBackgroundColor(circle)));
            });
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
        // Clear prior animation timeout if any
        if (this._swatchTimeoutId) {
            clearTimeout(this._swatchTimeoutId);
            this._swatchTimeoutId = null;
        }
        reader.onload = (e) => {
            this.previewImg.src = e.target.result;
            this.imagePreview.classList.remove('d-none');
            this.uploadArea.classList.add('d-none');
            
            // Add smooth transition
            this.imagePreview.style.opacity = '0';
            this.imagePreview.style.transform = 'scale(0.8)';
            
            this._swatchTimeoutId = setTimeout(() => {
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

    
    handleBananaColorClick(e) {
        e.preventDefault();
        
        // Get the button (handle clicks on child elements)
        const button = e.target.closest('.banana-color-btn');
        if (!button) return;
        
        const color = button.getAttribute('data-color');
        const stage = button.getAttribute('data-stage');
        
        // Update hidden input
        const colorInput = document.getElementById('colorPicker');
        if (colorInput) {
            colorInput.value = color;
        }
        
        // Update active state
        document.querySelectorAll('.banana-color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Update selected display
        const selectedSwatch = document.getElementById('selectedSwatch');
        const selectedStage = document.getElementById('selectedStage');
        const selectedHex = document.getElementById('selectedHex');
        
        if (selectedSwatch) {
            selectedSwatch.style.backgroundColor = color;
            // Add animation
            selectedSwatch.style.transform = 'scale(1.1)';
            setTimeout(() => {
                selectedSwatch.style.transform = 'scale(1)';
            }, 200);
        }
        
        if (selectedStage) {
            selectedStage.textContent = stage;
        }
        
        if (selectedHex) {
            selectedHex.textContent = color.toUpperCase();
        }
        
        this.hasColor = true;
        this.updateSubmitButtonState();
        
        this.showSuccessMessage('Color selected!');
    }

    applyPresetColor(color) {
        if (!color) return;
        // Update hidden input
        const colorInput = document.getElementById('colorPicker');
        if (colorInput) {
            colorInput.value = color;
        }
        // Update selected display (no stage info from guide)
        const selectedSwatch = document.getElementById('selectedSwatch');
        const selectedHex = document.getElementById('selectedHex');
        if (selectedSwatch) {
            selectedSwatch.style.backgroundColor = color;
            selectedSwatch.style.transform = 'scale(1.1)';
            setTimeout(() => {
                selectedSwatch.style.transform = 'scale(1)';
            }, 200);
        }
        if (selectedHex) {
            selectedHex.textContent = color.toUpperCase();
        }
        this.hasColor = true;
        this.updateSubmitButtonState();
        this.showSuccessMessage('Color selected!');
    }

    getComputedBackgroundColor(el) {
        const style = window.getComputedStyle(el);
        const rgb = style.backgroundColor;
        // Convert rgb(a) to hex
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!match) return null;
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        const toHex = (v) => ('0' + v.toString(16)).slice(-2).toUpperCase();
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    triggerCameraCapture() {
        // Prefer facingMode if supported
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            this.triggerFileInput(); // fallback to file input
            return;
        }
        this.triggerFileInput();
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
            if (!navigator.onLine) {
                this.showAlert('No internet connection. Please check your network.', 'danger');
            } else {
                this.showAlert('Server error. Please try again later.', 'danger');
            }
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

