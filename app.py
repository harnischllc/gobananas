from flask import Flask, render_template, request, jsonify
import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from config import config
from utils.color_detection import (
    detect_banana_ripeness, 
    extract_dominant_color, 
    hex_to_hue, 
    hue_to_stage, 
    estimate_days_until_peak,
    STAGE_INFO
)
from utils.validators import validate_uploaded_file, validate_hex_color, ValidationError

# Load environment variables
load_dotenv()

# Initialize app with config
config_name = os.environ.get('FLASK_ENV', 'production')
app = Flask(__name__)
app.config.from_object(config[config_name])

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=[app.config['RATELIMIT_DEFAULT']],
    enabled=app.config['RATELIMIT_ENABLED']
)

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

@app.after_request
def add_security_headers(response):
    """Add security headers to all responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    # CSP for external resources
    csp = (
        "default-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "font-src 'self' https://cdnjs.cloudflare.com; "
        "img-src 'self' data: blob:;"
    )
    response.headers['Content-Security-Policy'] = csp
    
    return response

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

@app.route('/api/docs')
def api_docs():
    """Simple API documentation page for available endpoints"""
    return render_template('api_docs.html')

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
@limiter.limit("30 per minute")
def classify_banana():
    """Handle both image upload and color picker for banana classification."""
    try:
        # Determine input type
        has_image = 'image' in request.files and request.files['image'].filename
        has_color = request.form.get('color')
        
        if not has_image and not has_color:
            return render_template('result.html', 
                error='Please upload an image or select a color')
        
        # Process based on input type
        if has_image:
            file = request.files['image']
            try:
                validate_uploaded_file(file)
                ripeness_result = detect_banana_ripeness(file)
                hue = ripeness_result['dominant_hue']
            except ValidationError as e:
                return render_template('result.html', error=str(e))
        else:
            try:
                hex_color = validate_hex_color(request.form.get('color'))
                hue = hex_to_hue(hex_color)
            except ValidationError as e:
                return render_template('result.html', error=str(e))
        
        # Classify
        stage = hue_to_stage(hue)
        stage_info = STAGE_INFO.get(stage, "Unknown stage")
        days_until_peak = estimate_days_until_peak(stage)
        
        result = {
            'stage': stage,
            'stage_info': stage_info,
            'days_until_peak': days_until_peak,
            'hue': round(hue, 1),
            'success': True
        }
        
        app.logger.info(f'Classification success: Stage {stage}')
        return render_template('result.html', result=result)
    
    except Exception as e:
        app.logger.error(f'Unexpected error: {str(e)}', exc_info=True)
        return render_template('result.html', 
            error='An unexpected error occurred. Please try again.')

@app.route('/api/classify', methods=['POST'])
@limiter.limit("60 per minute")
def api_classify_banana():
    """API endpoint for banana classification returning JSON responses."""
    try:
        # Determine input type
        has_image = 'image' in request.files and request.files['image'].filename
        has_color = (request.is_json and 'color' in request.json and request.json['color']) or ('color' in request.form and request.form['color'])
        
        if not has_image and not has_color:
            return jsonify({'error': 'Please provide either an image file or a hex color value'}), 400
        
        # Process based on input type
        if has_image:
            file = request.files['image']
            try:
                validate_uploaded_file(file)
                ripeness_result = detect_banana_ripeness(file)
                hue = ripeness_result['dominant_hue']
            except ValidationError as e:
                return jsonify({'error': str(e)}), 400
        else:
            try:
                hex_color = request.json.get('color') if request.is_json else request.form.get('color')
                hex_color = validate_hex_color(hex_color)
                hue = hex_to_hue(hex_color)
            except ValidationError as e:
                return jsonify({'error': str(e)}), 400
        
        # Classify
        stage = hue_to_stage(hue)
        stage_info = STAGE_INFO.get(stage, "Unknown stage")
        days_until_peak = estimate_days_until_peak(stage)
        
        result = {
            'stage': stage,
            'stage_info': stage_info,
            'days_until_peak': days_until_peak,
            'hue': round(hue, 1),
            'success': True
        }
        
        app.logger.info(f'API Classification success: Stage {stage}')
        return jsonify(result)
    
    except Exception as e:
        app.logger.error(f'API Unexpected error: {str(e)}', exc_info=True)
        return jsonify({'error': 'An unexpected error occurred. Please try again.'}), 500

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

if __name__ == '__main__':
    # Configure for production
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    
    app.run(debug=debug_mode, host=host, port=port)
