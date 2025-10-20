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

        // Banana slider elements
        this.bananaSlider = document.getElementById('bananaSlider');
        this.bananaStage = document.getElementById('bananaStage');
        this.bananaSprites = document.querySelectorAll('.banana-sprite');
        this.selectedBananaSprite = document.getElementById('selectedBananaSprite');
        this.selectedBananaStage = document.getElementById('selectedBananaStage');
        this.selectedBananaDescription = document.getElementById('selectedBananaDescription');

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

        // Banana slider events
        if (this.bananaSlider) {
            this.bananaSlider.addEventListener('input', (e) => this.handleSliderChange(e));
            this.bananaSlider.addEventListener('change', (e) => this.handleSliderChange(e));
        }

        // Banana sprite click events
        if (this.bananaSprites && this.bananaSprites.length) {
            this.bananaSprites.forEach(sprite => {
                sprite.addEventListener('click', (e) => this.handleBananaImageClick(e));
            });
        }

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
            this.hasColor = false; // Clear color state
            this.clearColorSelection(); // Clear color UI
            this.updateSubmitButtonState();
            this.updateMethodIndicator(); // Update visual feedback
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
        this.updateMethodIndicator(); // Update visual feedback
        
        // Add smooth transition
        this.uploadArea.style.opacity = '0';
        this.uploadArea.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            this.uploadArea.style.transition = 'all 0.3s ease-out';
            this.uploadArea.style.opacity = '1';
            this.uploadArea.style.transform = 'scale(1)';
        }, 50);
    }

    
    handleSliderChange(e) {
        const stage = parseInt(e.target.value);
        this.updateBananaSelection(stage);
    }

    handleBananaImageClick(e) {
        e.preventDefault();
        
        // Get the sprite (handle clicks on child elements)
        const sprite = e.target.closest('.banana-sprite');
        if (!sprite) return;
        
        const stage = parseInt(sprite.getAttribute('data-stage'));
        
        // Update slider value
        if (this.bananaSlider) {
            this.bananaSlider.value = stage;
        }
        
        this.updateBananaSelection(stage);
    }

    updateBananaSelection(stage) {
        // Stage data mapping
        const stageData = {
            1: { color: '#228B22', name: 'Stage 1: Green', description: 'Very firm, not sweet yet' },
            2: { color: '#32CD32', name: 'Stage 2: Light Green', description: 'Still firm, slightly sweet' },
            3: { color: '#9ACD32', name: 'Stage 3: Yellowish', description: 'Perfect for eating fresh' },
            4: { color: '#ADFF2F', name: 'Stage 4: Light Yellow', description: 'Sweet and soft' },
            5: { color: '#FFD700', name: 'Stage 5: Golden', description: 'Very sweet, ideal for eating' },
            6: { color: '#FFA500', name: 'Stage 6: Overripe', description: 'Perfect for baking' }
        };
        
        const data = stageData[stage];
        if (!data) return;
        
        // Update hidden inputs
        if (this.colorPicker) {
            this.colorPicker.value = data.color;
        }
        if (this.bananaStage) {
            this.bananaStage.value = stage;
        }
        
        // Update active sprite
        if (this.bananaSprites) {
            this.bananaSprites.forEach(sprite => {
                sprite.classList.remove('active');
                if (parseInt(sprite.getAttribute('data-stage')) === stage) {
                    sprite.classList.add('active');
                }
            });
        }
        
        // Update selected banana display
        if (this.selectedBananaSprite) {
            const position = -(stage - 1) * 80; // 80px per banana in selected display
            this.selectedBananaSprite.style.backgroundPosition = `${position}px 0`;
            
            // Add animation
            this.selectedBananaSprite.style.transform = 'scale(1.1)';
            setTimeout(() => {
                this.selectedBananaSprite.style.transform = 'scale(1)';
            }, 200);
        }
        
        if (this.selectedBananaStage) {
            this.selectedBananaStage.textContent = data.name;
        }
        
        if (this.selectedBananaDescription) {
            this.selectedBananaDescription.textContent = data.description;
        }
        
        this.hasColor = true;
        this.hasImage = false; // Clear image state
        this.removeImage(); // Clear image if present
        this.updateSubmitButtonState();
        this.updateMethodIndicator(); // Update visual feedback
        
        this.showSuccessMessage('Banana ripeness selected!');
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
        this.hasImage = false; // Clear image state
        this.removeImage(); // Clear image if present
        this.updateSubmitButtonState();
        this.updateMethodIndicator(); // Update visual feedback
        this.showSuccessMessage('Color selected!');
    }

    clearColorSelection() {
        // Reset slider to default stage 3
        if (this.bananaSlider) {
            this.bananaSlider.value = 3;
        }
        
        // Reset to default stage 3
        this.updateBananaSelection(3);
    }

    updateMethodIndicator() {
        const imageActive = document.getElementById('imageActive');
        const colorActive = document.getElementById('colorActive');
        const neitherActive = document.getElementById('neitherActive');
        
        if (imageActive) imageActive.classList.toggle('d-none', !this.hasImage);
        if (colorActive) colorActive.classList.toggle('d-none', this.hasImage || !this.hasColor);
        if (neitherActive) neitherActive.classList.toggle('d-none', this.hasImage || this.hasColor);
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

