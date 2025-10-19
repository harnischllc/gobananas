from flask import Flask, render_template, request, jsonify
import os
from utils.color_detection import (
    detect_banana_ripeness, 
    extract_dominant_color, 
    hex_to_hue, 
    hue_to_stage, 
    estimate_days_until_peak,
    STAGE_INFO
)

app = Flask(__name__)

@app.route('/')
def index():
    """Main page for banana ripeness detection"""
    return render_template('index.html')

@app.route('/classify', methods=['POST'])
def classify_banana():
    """Handle both image upload and color picker for banana classification"""
    try:
        result = {}
        
        # Check if image file is provided
        if 'image' in request.files and request.files['image'].filename:
            file = request.files['image']
            
            # Validate file type
            if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                return render_template('result.html', 
                                     error='Please upload a valid image file (PNG, JPG, JPEG, GIF, or BMP)')
            
            # Read image data
            image_data = file.read()
            file.seek(0)  # Reset file pointer
            
            # Extract dominant hue from image
            hue = extract_dominant_color(image_data)
            
        # Check if color hex value is provided
        elif 'color' in request.form and request.form['color']:
            hex_color = request.form['color']
            
            # Validate hex color format
            if not is_valid_hex_color(hex_color):
                return render_template('result.html', 
                                     error='Please provide a valid hex color (e.g., #FF0000 or FF0000)')
            
            # Convert hex color to hue
            hue = hex_to_hue(hex_color)
            
        else:
            return render_template('result.html', 
                                 error='Please provide either an image file or a hex color value')
        
        # Classify the banana based on hue
        stage = hue_to_stage(hue)
        stage_info = STAGE_INFO.get(stage, "Unknown stage")
        days_until_peak = estimate_days_until_peak(stage)
        
        # Prepare result data
        result = {
            'stage': stage,
            'stage_info': stage_info,
            'days_until_peak': days_until_peak,
            'hue': round(hue, 1),
            'success': True
        }
        
        return render_template('result.html', result=result)
    
    except Exception as e:
        print(f"Error in classification: {str(e)}")
        return render_template('result.html', 
                             error=f'An error occurred while processing your request: {str(e)}')

@app.route('/api/classify', methods=['POST'])
def api_classify_banana():
    """API endpoint for banana classification"""
    try:
        result = {}
        
        # Check if image file is provided
        if 'image' in request.files and request.files['image'].filename:
            file = request.files['image']
            
            # Validate file type
            if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                return jsonify({'error': 'Please upload a valid image file (PNG, JPG, JPEG, GIF, or BMP)'}), 400
            
            # Read image data
            image_data = file.read()
            file.seek(0)  # Reset file pointer
            
            # Extract dominant hue from image
            hue = extract_dominant_color(image_data)
            
        # Check if color hex value is provided
        elif 'color' in request.json and request.json['color']:
            hex_color = request.json['color']
            
            # Validate hex color format
            if not is_valid_hex_color(hex_color):
                return jsonify({'error': 'Please provide a valid hex color (e.g., #FF0000 or FF0000)'}), 400
            
            # Convert hex color to hue
            hue = hex_to_hue(hex_color)
            
        else:
            return jsonify({'error': 'Please provide either an image file or a hex color value'}), 400
        
        # Classify the banana based on hue
        stage = hue_to_stage(hue)
        stage_info = STAGE_INFO.get(stage, "Unknown stage")
        days_until_peak = estimate_days_until_peak(stage)
        
        # Prepare result data
        result = {
            'stage': stage,
            'stage_info': stage_info,
            'days_until_peak': days_until_peak,
            'hue': round(hue, 1),
            'success': True
        }
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Error in API classification: {str(e)}")
        return jsonify({'error': f'An error occurred while processing your request: {str(e)}'}), 500

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
    hex_color = hex_color.lstrip('#')
    
    # Check if it's 3 or 6 characters long and contains only valid hex characters
    if len(hex_color) in [3, 6] and all(c in '0123456789ABCDEFabcdef' for c in hex_color):
        return True
    
    return False

if __name__ == '__main__':
    # Configure for production
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    
    app.run(debug=debug_mode, host=host, port=port)
