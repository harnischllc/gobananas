from flask import Flask, render_template, request, jsonify
import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime
from utils.color_detection import (
    detect_banana_ripeness, 
    extract_dominant_color, 
    hex_to_hue, 
    hue_to_stage, 
    estimate_days_until_peak,
    STAGE_INFO
)

app = Flask(__name__)

# Configure logging
if not app.debug:
    if not os.path.exists('logs'):
        os.mkdir('logs')
    file_handler = RotatingFileHandler('logs/gobananas.log', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Go Bananas app startup')

# Configure app logger for development
app.logger.setLevel(logging.DEBUG)

@app.route('/')
def index():
    """Main page for banana ripeness detection"""
    app.logger.info('Main page accessed')
    return render_template('index.html')

@app.route('/ping')
def ping():
    """
    Simple ping endpoint for quick health checks.
    
    Returns:
        Simple text response
    """
    app.logger.info('Ping endpoint accessed')
    return 'pong', 200

@app.route('/about')
def about():
    """About page with information about the banana ripeness detection technology"""
    return render_template('about.html')

@app.route('/health')
def health_check():
    """
    Health check endpoint to prevent Render spin-down.
    
    Returns:
        JSON response with status and timestamp
    """
    app.logger.info('Health check endpoint accessed')
    return {
        'status': 'ok', 
        'timestamp': datetime.now().isoformat(),
        'service': 'Go Bananas',
        'version': '1.0.0'
    }

@app.route('/classify', methods=['POST'])
def classify_banana():
    """
    Handle both image upload and color picker for banana classification.
    
    This endpoint processes either uploaded images or hex color values to determine
    banana ripeness using computer vision and color analysis.
    
    Returns:
        Rendered result.html template with classification results or error messages.
    """
    try:
        app.logger.info('Classification request received')
        result = {}
        
        # Check if image file is provided
        if 'image' in request.files and request.files['image'].filename:
            app.logger.debug('Processing image upload')
            file = request.files['image']
            
            # Validate file type
            allowed_extensions = ('.png', '.jpg', '.jpeg', '.gif', '.bmp')
            if not file.filename.lower().endswith(allowed_extensions):
                app.logger.warning(f'Invalid file type attempted: {file.filename}')
                return render_template('result.html', 
                                     error='Please upload a valid image file (PNG, JPG, JPEG, GIF, or BMP)')
            
            # Validate file size (max 10MB)
            max_size = 10 * 1024 * 1024  # 10MB
            file.seek(0, 2)  # Seek to end
            file_size = file.tell()
            file.seek(0)  # Reset to beginning
            
            if file_size > max_size:
                app.logger.warning(f'File too large: {file_size} bytes')
                return render_template('result.html', 
                                     error='Image file is too large. Please select an image smaller than 10MB.')
            
            # Read image data
            try:
                image_data = file.read()
                file.seek(0)  # Reset file pointer
                app.logger.debug(f'Successfully read image data: {len(image_data)} bytes')
            except Exception as e:
                app.logger.error(f'Error reading image file: {str(e)}')
                return render_template('result.html', 
                                     error='Error reading image file. Please try again.')
            
            # Extract dominant hue from image
            try:
                hue = extract_dominant_color(image_data)
                app.logger.info(f'Extracted hue from image: {hue:.2f}°')
            except Exception as e:
                app.logger.error(f'Error extracting color from image: {str(e)}')
                return render_template('result.html', 
                                     error='Error analyzing image colors. Please try a different image.')
            
        # Check if color hex value is provided
        elif 'color' in request.form and request.form['color']:
            app.logger.debug('Processing color picker input')
            hex_color = request.form['color']
            
            # Validate hex color format
            if not is_valid_hex_color(hex_color):
                app.logger.warning(f'Invalid hex color format: {hex_color}')
                return render_template('result.html', 
                                     error='Please provide a valid hex color (e.g., #FF0000 or FF0000)')
            
            # Convert hex color to hue
            try:
                hue = hex_to_hue(hex_color)
                app.logger.info(f'Converted hex color {hex_color} to hue: {hue:.2f}°')
            except Exception as e:
                app.logger.error(f'Error converting hex color: {str(e)}')
                return render_template('result.html', 
                                     error='Error processing color value. Please try again.')
            
        else:
            app.logger.warning('No valid input provided (image or color)')
            return render_template('result.html', 
                                 error='Please provide either an image file or a hex color value')
        
        # Validate hue value
        if not isinstance(hue, (int, float)) or hue < 0 or hue > 360:
            app.logger.error(f'Invalid hue value: {hue}')
            return render_template('result.html', 
                                 error='Invalid color analysis result. Please try again.')
        
        # Classify the banana based on hue
        try:
            stage = hue_to_stage(hue)
            stage_info = STAGE_INFO.get(stage, "Unknown stage")
            days_until_peak = estimate_days_until_peak(stage)
            
            app.logger.info(f'Classification result: Stage {stage}, Days until peak: {days_until_peak}')
            
        except Exception as e:
            app.logger.error(f'Error in classification logic: {str(e)}')
            return render_template('result.html', 
                                 error='Error in classification process. Please try again.')
        
        # Prepare result data
        result = {
            'stage': stage,
            'stage_info': stage_info,
            'days_until_peak': days_until_peak,
            'hue': round(hue, 1),
            'success': True
        }
        
        app.logger.info('Classification completed successfully')
        return render_template('result.html', result=result)
    
    except Exception as e:
        app.logger.error(f'Unexpected error in classification: {str(e)}', exc_info=True)
        return render_template('result.html', 
                             error='An unexpected error occurred. Please try again later.')

@app.route('/api/classify', methods=['POST'])
def api_classify_banana():
    """
    API endpoint for banana classification returning JSON responses.
    
    This endpoint provides programmatic access to the banana ripeness detection
    functionality, returning structured JSON data instead of rendered templates.
    
    Returns:
        JSON response with classification results or error messages.
    """
    try:
        app.logger.info('API classification request received')
        result = {}
        
        # Check if image file is provided
        if 'image' in request.files and request.files['image'].filename:
            app.logger.debug('Processing API image upload')
            file = request.files['image']
            
            # Validate file type
            allowed_extensions = ('.png', '.jpg', '.jpeg', '.gif', '.bmp')
            if not file.filename.lower().endswith(allowed_extensions):
                app.logger.warning(f'API: Invalid file type attempted: {file.filename}')
                return jsonify({'error': 'Please upload a valid image file (PNG, JPG, JPEG, GIF, or BMP)'}), 400
            
            # Validate file size (max 10MB)
            max_size = 10 * 1024 * 1024  # 10MB
            file.seek(0, 2)  # Seek to end
            file_size = file.tell()
            file.seek(0)  # Reset to beginning
            
            if file_size > max_size:
                app.logger.warning(f'API: File too large: {file_size} bytes')
                return jsonify({'error': 'Image file is too large. Please select an image smaller than 10MB.'}), 400
            
            # Read image data
            try:
                image_data = file.read()
                file.seek(0)  # Reset file pointer
                app.logger.debug(f'API: Successfully read image data: {len(image_data)} bytes')
            except Exception as e:
                app.logger.error(f'API: Error reading image file: {str(e)}')
                return jsonify({'error': 'Error reading image file. Please try again.'}), 500
            
            # Extract dominant hue from image
            try:
                hue = extract_dominant_color(image_data)
                app.logger.info(f'API: Extracted hue from image: {hue:.2f}°')
            except Exception as e:
                app.logger.error(f'API: Error extracting color from image: {str(e)}')
                return jsonify({'error': 'Error analyzing image colors. Please try a different image.'}), 500
            
        # Check if color hex value is provided in JSON
        elif request.is_json and 'color' in request.json and request.json['color']:
            app.logger.debug('Processing API color picker input')
            hex_color = request.json['color']
            
            # Validate hex color format
            if not is_valid_hex_color(hex_color):
                app.logger.warning(f'API: Invalid hex color format: {hex_color}')
                return jsonify({'error': 'Please provide a valid hex color (e.g., #FF0000 or FF0000)'}), 400
            
            # Convert hex color to hue
            try:
                hue = hex_to_hue(hex_color)
                app.logger.info(f'API: Converted hex color {hex_color} to hue: {hue:.2f}°')
            except Exception as e:
                app.logger.error(f'API: Error converting hex color: {str(e)}')
                return jsonify({'error': 'Error processing color value. Please try again.'}), 500
            
        else:
            app.logger.warning('API: No valid input provided (image or color)')
            return jsonify({'error': 'Please provide either an image file or a hex color value'}), 400
        
        # Validate hue value
        if not isinstance(hue, (int, float)) or hue < 0 or hue > 360:
            app.logger.error(f'API: Invalid hue value: {hue}')
            return jsonify({'error': 'Invalid color analysis result. Please try again.'}), 500
        
        # Classify the banana based on hue
        try:
            stage = hue_to_stage(hue)
            stage_info = STAGE_INFO.get(stage, "Unknown stage")
            days_until_peak = estimate_days_until_peak(stage)
            
            app.logger.info(f'API: Classification result: Stage {stage}, Days until peak: {days_until_peak}')
            
        except Exception as e:
            app.logger.error(f'API: Error in classification logic: {str(e)}')
            return jsonify({'error': 'Error in classification process. Please try again.'}), 500
        
        # Prepare result data
        result = {
            'stage': stage,
            'stage_info': stage_info,
            'days_until_peak': days_until_peak,
            'hue': round(hue, 1),
            'success': True
        }
        
        app.logger.info('API: Classification completed successfully')
        return jsonify(result)
    
    except Exception as e:
        app.logger.error(f'API: Unexpected error in classification: {str(e)}', exc_info=True)
        return jsonify({'error': 'An unexpected error occurred. Please try again later.'}), 500

@app.route('/detect', methods=['POST'])
def detect_ripeness():
    """Legacy endpoint to process banana image and detect ripeness"""
    try:
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400
        
        # Process the image
        ripeness_result = detect_banana_ripeness(file)
        
        return render_template('result.html', result=ripeness_result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/detect', methods=['POST'])
def api_detect_ripeness():
    """Legacy API endpoint for banana ripeness detection"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400
        
        ripeness_result = detect_banana_ripeness(file)
        
        return jsonify(ripeness_result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def is_valid_hex_color(hex_color):
    """
    Validate if a string is a valid hex color.
    
    Args:
        hex_color (str): Hex color string to validate
        
    Returns:
        bool: True if valid hex color, False otherwise
    """
    try:
        if not isinstance(hex_color, str):
            return False
            
        hex_color = hex_color.lstrip('#')
        
        # Check if it's 3 or 6 characters long and contains only valid hex characters
        if len(hex_color) in [3, 6] and all(c in '0123456789ABCDEFabcdef' for c in hex_color):
            return True
        
        return False
    except Exception as e:
        app.logger.error(f'Error validating hex color: {str(e)}')
        return False

if __name__ == '__main__':
    # Configure for production
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    
    app.run(debug=debug_mode, host=host, port=port)
