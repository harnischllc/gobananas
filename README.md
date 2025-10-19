# Go Bananas 🍌

A Flask-based web application that detects banana ripeness using computer vision and color analysis. Upload a photo or pick a color to get instant ripeness analysis based on the USDA banana color scale.

## 🚀 Features

- **Image Upload**: Upload banana photos for automatic ripeness detection
- **Color Picker**: Manually select banana color for instant analysis
- **7-Stage Ripeness Scale**: Based on USDA banana color classification
- **Days Until Peak**: Estimate when your banana will reach optimal ripeness
- **Mobile-Friendly**: Responsive design with camera capture support
- **Modern UI**: Beautiful, animated interface with smooth transitions
- **API Endpoints**: RESTful API for programmatic access

## 📋 Project Overview

Go Bananas uses computer vision to analyze the dominant color in banana images and maps it to a 7-stage ripeness scale. The algorithm extracts hue values from images, converts them to the HSV color space, and classifies ripeness based on scientifically-proven color ranges.

### Ripeness Stages

1. **Stage 1**: Green - Entirely green, firm and starchy
2. **Stage 2**: Light Green - Breaking toward yellow, still firm
3. **Stage 3**: Yellowish - Minimal green, begins to develop sweetness
4. **Stage 4**: More Yellow - Mostly yellow, starches converting to sugars
5. **Stage 5**: Yellow with Green Tips - Ideal for retail, peak for purchase
6. **Stage 6**: Yellow - Peak eating quality, aromatic and sweet
7. **Stage 7**: Yellow with Brown Flecks - Overripe, best for baking

## 🛠️ Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Local Setup

1. **Clone the repository:**
```bash
git clone https://github.com/harnischllc/gobananas.git
cd gobananas
```

2. **Create a virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Run the application:**
```bash
python app.py
```

5. **Open your browser:**
Navigate to `http://localhost:5000`

## 💻 Local Development

### Development Server

For development with auto-reload:
```bash
export FLASK_DEBUG=true
python app.py
```

### Project Structure

```
gobananas/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── Procfile              # Deployment configuration
├── templates/            # HTML templates
│   ├── index.html        # Main upload interface
│   ├── result.html       # Results display
│   └── about.html        # About page
├── static/               # Static assets
│   ├── css/style.css     # Custom styling
│   └── js/main.js        # Interactive JavaScript
└── utils/                # Utility modules
    └── color_detection.py # Color analysis algorithms
```

### API Endpoints

- `GET /` - Main application interface
- `POST /classify` - Process image/color and return results
- `POST /api/classify` - API endpoint returning JSON results
- `GET /about` - About page with algorithm details

## 🚀 Deployment to Render

### Prerequisites

- GitHub repository with your code
- Render account (free tier available)

### Deployment Steps

1. **Connect Repository:**
   - Log in to [Render](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build:**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`

3. **Environment Variables:**
   - No additional environment variables needed for basic deployment

4. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy your app

### Custom Domain (Optional)

1. In your Render dashboard, go to your service
2. Click "Custom Domains"
3. Add your domain and follow DNS configuration instructions

## 🔬 Algorithm Explanation

### Color Analysis Process

1. **Image Processing:**
   - Convert uploaded image to RGB format
   - Transform to HSV (Hue, Saturation, Value) color space
   - Extract dominant hue values from image pixels

2. **Hue Mapping:**
   - Map hue values (0-360°) to ripeness stages
   - Use scientifically-proven color ranges for each stage
   - Calculate confidence based on hue consistency

3. **Stage Classification:**
   - Stage 1 (Green): 60-120° hue
   - Stage 2 (Light Green): 45-60° hue
   - Stage 3 (Yellowish): 35-45° hue
   - Stage 4 (More Yellow): 25-35° hue
   - Stage 5 (Yellow Green Tips): 30-45° hue
   - Stage 6 (Yellow): 20-30° hue
   - Stage 7 (Brown Flecks): 0-20° hue

4. **Peak Estimation:**
   - Calculate average days between stages
   - Estimate time until optimal ripeness (Stage 6)
   - Provide stage-specific recommendations

### Technical Implementation

- **Computer Vision:** OpenCV for image processing
- **Color Analysis:** HSV color space for accurate hue extraction
- **Algorithm:** Dominant color clustering with confidence scoring
- **Validation:** File type, size, and color format validation

## 📚 Credits and Citations

### USDA Banana Color Scale

This application is based on the **USDA Banana Color Scale**, a scientifically-proven method for determining banana ripeness through visual color assessment.

**Reference:**
- USDA Agricultural Research Service
- "Banana Ripening Guide" - United States Department of Agriculture
- Color classification standards for commercial banana quality assessment

### Scientific Basis

The 7-stage color scale used in this application is derived from USDA research on banana ripening patterns and is widely used in commercial banana quality control and consumer guidance.

**Additional References:**
- Food and Agriculture Organization (FAO) banana quality standards
- Postharvest handling protocols for tropical fruits
- Colorimetry research on fruit ripening indicators

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 Python style guidelines
- Add tests for new features
- Update documentation as needed
- Ensure mobile responsiveness

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- USDA for the banana color classification standards
- OpenCV community for computer vision tools
- Flask team for the excellent web framework
- Bootstrap team for the responsive UI components

---

**Made with ❤️ for banana lovers everywhere!** 🍌
