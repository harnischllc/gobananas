# Go Bananas - Banana Ripeness Detection App

A Flask-based web application that detects the ripeness level of bananas using computer vision and color analysis.

## Features

- Upload banana images for ripeness analysis
- Real-time ripeness detection based on color patterns
- RESTful API endpoints for integration
- Modern, responsive web interface
- Deployable to Heroku and other cloud platforms

## Installation

1. Clone the repository:
```bash
git clone https://github.com/harnischllc/gobananas.git
cd gobananas
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

## Usage

1. Open your browser and navigate to `http://localhost:5000`
2. Upload an image of a banana
3. Get instant ripeness analysis results

## API Endpoints

- `GET /` - Main application interface
- `POST /detect` - Process banana image and return results page
- `POST /api/detect` - API endpoint returning JSON results

## Deployment

The app is configured for easy deployment to Heroku with the included `Procfile`.

## Technology Stack

- Flask (Python web framework)
- OpenCV (Computer vision)
- Pillow (Image processing)
- HTML/CSS/JavaScript (Frontend)
- Bootstrap (UI framework)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
