# Go Bananas Mobile App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert Go Bananas from a Flask web app into a Capacitor-wrapped mobile app with camera capture, enhanced ripeness data, user feedback learning system, ripeness alerts, and freemium monetization — publishable to both App Store and Play Store.

**Architecture:** Capacitor wraps the existing HTML/CSS/JS frontend. Flask backend on Render gains a PostgreSQL database for feedback storage and user accounts. The frontend switches from server-rendered pages to a single-page app calling the JSON API. Capacitor plugins provide native camera and push notifications.

**Tech Stack:** Capacitor 6, Flask, PostgreSQL (Render add-on), @capacitor/camera, @capacitor/push-notifications, capacitor-purchases (RevenueCat for in-app purchases)

**Security note:** All dynamic HTML rendering must use safe DOM construction (createElement/textContent) rather than innerHTML to prevent XSS. The existing codebase uses innerHTML in some places — these should be refactored during implementation.

---

## Phase 1: Backend Foundation

### Task 1: Add PostgreSQL database models

**Files:**
- Create: `models.py`
- Create: `migrations/init_db.py`
- Modify: `requirements.txt`
- Modify: `app.py:1-26` (add db init)

**Step 1: Add database dependencies to requirements.txt**

Add these lines to `requirements.txt`:
```
Flask-SQLAlchemy==3.1.1
Flask-Migrate==4.0.5
psycopg2-binary==2.9.9
```

**Step 2: Install dependencies**

Run: `pip3 install -r requirements.txt`

**Step 3: Create models.py with database schema**

```python
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = db.Column(db.String(255), unique=True, nullable=False)
    preferred_stage = db.Column(db.Float, nullable=True)  # learned preference
    is_premium = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    scans = db.relationship('Scan', backref='user', lazy=True)

class Scan(db.Model):
    __tablename__ = 'scans'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    hue_detected = db.Column(db.Float, nullable=False)
    stage_predicted = db.Column(db.Integer, nullable=False)
    stage_corrected = db.Column(db.Integer, nullable=True)  # user correction
    feedback = db.Column(db.String(10), nullable=True)  # 'up' or 'down'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Alert(db.Model):
    __tablename__ = 'alerts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    scan_id = db.Column(db.Integer, db.ForeignKey('scans.id'), nullable=False)
    target_stage = db.Column(db.Integer, nullable=False)
    notify_at = db.Column(db.DateTime, nullable=False)
    push_token = db.Column(db.String(255), nullable=False)
    sent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

**Step 4: Create migrations/init_db.py**

```python
"""Initialize database tables."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from models import db

with app.app_context():
    db.create_all()
    print("Database tables created successfully.")
```

**Step 5: Wire database into app.py**

Add import after line 9:
```python
from models import db, User, Scan, Alert
```

Add after `app.config.from_object(config[config_name])`:
```python
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL', 'sqlite:///gobananas.db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
```

**Step 6: Add DATABASE_URL to .env.example**

Add: `DATABASE_URL=sqlite:///gobananas.db`

**Step 7: Test that the app still starts**

Run: `cd "/Users/ericharnisch/Go Bananas" && FLASK_ENV=development python3 -c "from app import app; from models import db; print('DB init OK')"`

**Step 8: Commit**

```bash
git add models.py migrations/ requirements.txt app.py .env.example
git commit -m "feat: add PostgreSQL database models for users, scans, and alerts"
```

---

### Task 2: Add feedback and learning API endpoints

**Files:**
- Modify: `app.py` (add new routes)
- Create: `utils/learning.py`
- Create: `tests/test_learning.py`

**Step 1: Create tests/test_learning.py**

```python
import pytest
from utils.learning import compute_adjusted_boundaries, compute_user_preference

def test_no_corrections_returns_default_boundaries():
    corrections = []
    boundaries = compute_adjusted_boundaries(corrections)
    assert boundaries[1] == (60, 120)  # stage 1 default

def test_corrections_shift_boundary():
    corrections = [{'hue': 55, 'corrected_stage': 1}] * 20
    boundaries = compute_adjusted_boundaries(corrections)
    assert boundaries[1][0] < 60  # lower bound shifted down

def test_user_preference_no_data():
    result = compute_user_preference([])
    assert result is None

def test_user_preference_with_feedback():
    feedbacks = [
        {'stage': 5, 'feedback': 'up'},
        {'stage': 5, 'feedback': 'up'},
        {'stage': 6, 'feedback': 'down'},
    ]
    result = compute_user_preference(feedbacks)
    assert result == 5
```

**Step 2: Run tests to verify they fail**

Run: `cd "/Users/ericharnisch/Go Bananas" && python3 -m pytest tests/test_learning.py -v`
Expected: FAIL (module not found)

**Step 3: Create utils/learning.py**

```python
"""Learning system for improving ripeness predictions from user feedback."""

from utils.constants import HUE_RANGES

def compute_adjusted_boundaries(corrections):
    """Adjust hue-to-stage boundaries based on aggregate user corrections."""
    boundaries = dict(HUE_RANGES)
    
    if len(corrections) < 10:
        return boundaries
    
    stage_hues = {}
    for c in corrections:
        stage = c['corrected_stage']
        if stage not in stage_hues:
            stage_hues[stage] = []
        stage_hues[stage].append(c['hue'])
    
    for stage, hues in stage_hues.items():
        if len(hues) < 5:
            continue
        observed_min = min(hues)
        observed_max = max(hues)
        current_min, current_max = boundaries.get(stage, (0, 360))
        new_min = current_min * 0.7 + observed_min * 0.3
        new_max = current_max * 0.7 + observed_max * 0.3
        boundaries[stage] = (round(new_min, 1), round(new_max, 1))
    
    return boundaries


def compute_user_preference(feedbacks):
    """Determine a user's preferred ripeness stage from their feedback history."""
    if len(feedbacks) < 2:
        return None
    
    stage_scores = {}
    for f in feedbacks:
        stage = f['stage']
        if stage not in stage_scores:
            stage_scores[stage] = 0
        if f['feedback'] == 'up':
            stage_scores[stage] += 1
        else:
            stage_scores[stage] -= 1
    
    if not stage_scores:
        return None
    
    return max(stage_scores, key=stage_scores.get)
```

**Step 4: Run tests to verify they pass**

Run: `cd "/Users/ericharnisch/Go Bananas" && python3 -m pytest tests/test_learning.py -v`
Expected: ALL PASS

**Step 5: Add feedback API endpoints to app.py**

Add before `if __name__ == '__main__':`:

```python
@app.route('/api/feedback', methods=['POST'])
@limiter.limit("30 per minute")
def submit_feedback():
    """Submit user feedback on a scan result."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'JSON body required'}), 400
        
        scan = Scan(
            user_id=data.get('user_id'),
            hue_detected=data['hue'],
            stage_predicted=data['stage_predicted'],
            stage_corrected=data.get('stage_corrected'),
            feedback=data.get('feedback')
        )
        db.session.add(scan)
        db.session.commit()
        
        return jsonify({'success': True, 'scan_id': scan.id})
    except KeyError as e:
        return jsonify({'error': f'Missing field: {e}'}), 400
    except Exception as e:
        app.logger.error(f'Feedback error: {str(e)}', exc_info=True)
        return jsonify({'error': 'Failed to save feedback'}), 500


@app.route('/api/user', methods=['POST'])
def register_device():
    """Register or retrieve a user by device ID."""
    try:
        data = request.get_json()
        if not data or 'device_id' not in data:
            return jsonify({'error': 'device_id required'}), 400
        
        user = User.query.filter_by(device_id=data['device_id']).first()
        if not user:
            user = User(device_id=data['device_id'])
            db.session.add(user)
            db.session.commit()
        
        return jsonify({
            'user_id': user.id,
            'is_premium': user.is_premium,
            'preferred_stage': user.preferred_stage
        })
    except Exception as e:
        app.logger.error(f'User registration error: {str(e)}', exc_info=True)
        return jsonify({'error': 'Failed to register device'}), 500
```

**Step 6: Commit**

```bash
git add utils/learning.py tests/test_learning.py app.py
git commit -m "feat: add feedback API endpoints and learning system"
```

---

### Task 3: Upgrade ripeness knowledge in constants.py

**Files:**
- Modify: `utils/constants.py`

**Step 1: Replace contents with enriched data**

Replace the entire contents of `utils/constants.py` with enriched USDA-based data including STAGE_INFO, DURATION_RANGES, HUE_RANGES, RECOMMENDATIONS, STORAGE_TIPS, and NUTRITION dicts. Each stage gets starch/sugar percentages, GI index, resistant starch level, antioxidant level, and detailed storage/use recommendations.

**Step 2: Update API response to include new data**

In `app.py`, add to the imports:
```python
from utils.constants import STAGE_INFO, STORAGE_TIPS, NUTRITION
```

Add to the result dict in `api_classify_banana()`:
```python
'storage_tips': STORAGE_TIPS,
'nutrition': NUTRITION.get(stage, {}),
```

**Step 3: Run existing tests**

Run: `cd "/Users/ericharnisch/Go Bananas" && python3 -m pytest tests/ -v`

**Step 4: Commit**

```bash
git add utils/constants.py app.py
git commit -m "feat: enrich ripeness data with nutrition, storage tips, starch/sugar ratios"
```

---

## Phase 2: Frontend — SPA + API-Driven

### Task 4: Convert frontend to call JSON API instead of server-rendered pages

**Files:**
- Modify: `static/js/main.js` (switch form submit to fetch JSON, render results client-side using safe DOM methods)
- Modify: `templates/index.html` (add result display area, feedback UI)

**Step 1: Update submitForm() in main.js to use /api/classify**

Replace fetch to `/classify` with fetch to `/api/classify`, parse JSON response, call `this.displayResult(data)`.

**Step 2: Add displayResult() using safe DOM construction**

Use `document.createElement()` and `element.textContent` instead of innerHTML. Build the result card, stage display, nutrition info, and feedback buttons programmatically.

**Step 3: Add submitFeedback() method**

POST to `/api/feedback` with user_id from localStorage, hue, stage, and feedback ('up'/'down').

**Step 4: Add saveToHistory() method**

Save scan results to localStorage for recent history display.

**Step 5: Add result area div to index.html**

Add `<div id="resultArea" class="d-none"></div>` before the "How It Works" card.

**Step 6: Expose app instance globally**

```javascript
window.bananaApp = new BananaRipenessApp();
```

**Step 7: Test in browser — verify inline results with feedback**

**Step 8: Commit**

```bash
git add static/js/main.js templates/index.html
git commit -m "feat: convert frontend to SPA calling JSON API with inline results and feedback"
```

---

## Phase 3: Capacitor Mobile Shell

### Task 5: Initialize Capacitor project

**Files:**
- Create: `package.json`
- Create: `capacitor.config.ts`

**Step 1: Initialize npm and install Capacitor**

```bash
cd "/Users/ericharnisch/Go Bananas"
npm init -y
npm install @capacitor/core @capacitor/cli
npx cap init "Go Bananas" "com.harnischllc.gobananas" --web-dir=static
```

**Step 2: Install platform packages and plugins**

```bash
npm install @capacitor/ios @capacitor/android
npm install @capacitor/camera @capacitor/push-notifications @capacitor/preferences
npx cap add ios
npx cap add android
```

**Step 3: Configure capacitor.config.ts**

Set `server.url` to `https://gobananas-cmml.onrender.com` so the app loads from the remote server. Configure Camera and PushNotifications plugins.

**Step 4: Sync Capacitor**

```bash
npx cap sync
```

**Step 5: Commit**

```bash
git add package.json package-lock.json capacitor.config.ts ios/ android/ .gitignore
git commit -m "feat: initialize Capacitor project with iOS and Android platforms"
```

---

### Task 6: Add native camera capture

**Files:**
- Modify: `static/js/main.js` (update triggerCameraCapture with Capacitor Camera)
- Create: `static/js/capacitor-bridge.js`

**Step 1: Create capacitor-bridge.js**

Provides `takePhoto()` and `pickFromGallery()` functions that use Capacitor Camera when available, fall back to file input on web.

**Step 2: Update triggerCameraCapture() in main.js**

Check for `window.Capacitor`, use Camera.getPhoto() with CameraSource.Camera, convert base64 result to File object for upload via DataTransfer API.

**Step 3: Add base64ToBlob() helper to main.js**

Converts base64 string to Blob for file upload compatibility.

**Step 4: Sync and test**

```bash
npx cap sync
```

**Step 5: Commit**

```bash
git add static/js/capacitor-bridge.js static/js/main.js
git commit -m "feat: add native camera capture via Capacitor with web fallback"
```

---

### Task 7: Add device registration on app startup

**Files:**
- Modify: `static/js/main.js`

**Step 1: Add registerDevice() call to constructor**

On app load, generate or retrieve a device UUID from localStorage, POST to `/api/user`, store returned user_id and premium status.

**Step 2: Commit**

```bash
git add static/js/main.js
git commit -m "feat: auto-register device on app launch for user tracking"
```

---

## Phase 4: Build and Test on Device

### Task 8: Build and test iOS app

**Step 1:** `npx cap sync`
**Step 2:** `npx cap open ios`
**Step 3:** In Xcode — sign with personal Apple ID, select device/simulator, Run
**Step 4:** Test checklist: UI loads, camera works, slider works, results display, feedback submits, history persists
**Step 5:** Commit any Xcode config changes

---

### Task 9: Build and test Android APK

**Step 1:** `npx cap open android`
**Step 2:** Build APK in Android Studio
**Step 3:** Install on device, run same test checklist
**Step 4:** Commit any Android config changes

---

## Phase 5: Premium Features (Post-MVP)

### Task 10: Add push notification support for ripeness alerts

**Files:**
- Modify: `static/js/main.js` (alert scheduling UI)
- Modify: `app.py` (alert endpoints)

Add `/api/alerts` endpoint. Add "Remind me when ready" button (premium only) to result display. Request push permission via Capacitor PushNotifications plugin. Backend calculates notify_at based on estimated days to target stage.

---

### Task 11: Add privacy policy page and app store assets

**Files:**
- Create: `templates/privacy.html`
- Modify: `app.py` (add /privacy route)

Create privacy policy covering data collection practices. Prepare screenshots at required dimensions for both stores.

---

## Task Summary

| # | Task | Phase | Depends On |
|---|------|-------|-----------|
| 1 | PostgreSQL database models | Backend | — |
| 2 | Feedback + learning API | Backend | 1 |
| 3 | Enriched ripeness data | Backend | — |
| 4 | Frontend SPA with feedback UI | Frontend | 2 |
| 5 | Initialize Capacitor | Mobile | — |
| 6 | Native camera capture | Mobile | 5 |
| 7 | Device registration | Mobile | 4, 5 |
| 8 | Test iOS build | Testing | 6, 7 |
| 9 | Test Android build | Testing | 6, 7 |
| 10 | Push notification alerts | Premium | 8, 9 |
| 11 | Privacy policy + store assets | Publishing | 10 |

**Parallelizable:** Tasks 1+3+5 can run simultaneously. Tasks 8+9 can run simultaneously.
