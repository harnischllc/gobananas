"""Input validation utilities"""
from werkzeug.datastructures import FileStorage
from config import Config
import logging

logger = logging.getLogger(__name__)

class ValidationError(Exception):
    """Custom validation error"""
    pass

def validate_uploaded_file(file: FileStorage) -> None:
    """
    Validate uploaded image file.
    
    Args:
        file: Flask file object
        
    Raises:
        ValidationError: If file is invalid
    """
    if not file or not file.filename:
        raise ValidationError('No file selected')
    
    # Check extension
    filename_lower = file.filename.lower()
    if not any(filename_lower.endswith(ext) for ext in Config.ALLOWED_EXTENSIONS):
        allowed = ', '.join(Config.ALLOWED_EXTENSIONS)
        raise ValidationError(f'Invalid file type. Allowed: {allowed}')
    
    # Check size
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    
    if size > Config.MAX_CONTENT_LENGTH:
        max_mb = Config.MAX_CONTENT_LENGTH / (1024 * 1024)
        raise ValidationError(f'File too large. Max size: {max_mb}MB')
    
    logger.debug(f'Validated file: {file.filename}, size: {size} bytes')

def validate_hex_color(hex_color: str) -> str:
    """
    Validate and normalize hex color.
    
    Args:
        hex_color: Hex color string
        
    Returns:
        str: Normalized hex color (without #)
        
    Raises:
        ValidationError: If color is invalid
    """
    if not isinstance(hex_color, str):
        raise ValidationError('Color must be a string')
    
    # Remove # if present
    hex_color = hex_color.lstrip('#').strip()
    
    # Expand 3-char to 6-char
    if len(hex_color) == 3:
        hex_color = ''.join([c*2 for c in hex_color])
    
    # Validate length and characters
    if len(hex_color) != 6:
        raise ValidationError('Hex color must be 3 or 6 characters')
    
    if not all(c in '0123456789ABCDEFabcdef' for c in hex_color):
        raise ValidationError('Invalid hex color characters')
    
    logger.debug(f'Validated hex color: #{hex_color}')
    return hex_color
