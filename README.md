
```
 _____                            _             ____
|_   _|                          | |           / __ \
  | |  _ __ ___  _ __   __ _ _ __| | __ _ _ __ | |  | |_ __ __ _ _ __   __ _  ___
  | | | '_ ` _ \| '_ \ / _` | '__| |/ _` | '_ \| |  | | '__/ _` | '_ \ / _` |/ __|
 _| |_| | | | | | |_) | (_| | |  | | (_| | | | | |__| | | | (_| | | | | (_| | (__
|_____|_| |_| |_| .__/ \__,_|_|  |_|\__,_|_| |_|\____/|_|  \__,_|_| |_|\__,_|\___|
                | |
                |_|
```

# Imperial Scan - CCTV Security Testing Platform

A comprehensive CCTV security testing platform that integrates multiple penetration testing tools with a modern React dashboard and Shinobi NVR capabilities.

## 🔧 Technologies

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Flask (Python)
- **NVR**: Shinobi Systems
- **Security Tools**: OpenCCTV, EyePwn, Ingram, Cameradar, IPCamSearch

## 🚀 Quick Start

### Prerequisites

- Node.js & npm (for frontend)
- Python 3.8+ (for backend)
- Git

### Frontend Setup (Lovable)

This project is built with Lovable. You can either:

**Option 1: Use Lovable (Recommended)**
1. Visit the [Lovable Project](https://lovable.dev/projects/3f331eb6-d740-405e-9af7-1b1d461907e2)
2. Start making changes directly in the browser

**Option 2: Local Development**
```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

1. **Create backend directory**
```bash
mkdir server
cd server
```

2. **Install Python dependencies**
```bash
pip install flask flask-cors requests
```

3. **Clone security tools**
```bash
# OpenCCTV
git clone https://github.com/DanMcInerney/OpenCCTV.git

# EyePwn
git clone https://github.com/BullsEye0/EyePwn.git

# Ingram
git clone https://github.com/mauri870/Ingram.git

# Cameradar (requires Go)
go install github.com/Ullaakut/cameradar/cmd/cameradar@latest

# IPCam Search Protocol
git clone https://github.com/mcw0/ipcam_search_protocol.git

# Shinobi NVR
git clone https://gitlab.com/Shinobi-Systems/Shinobi.git
```

4. **Create Flask server**
```bash
# Create app.py in server directory
touch app.py
```

5. **Add the following code to app.py**:
```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import os

app = Flask(__name__)
CORS(app)

def run_tool(cmd_args, cwd=None):
    """Execute a command and return JSON response"""
    try:
        proc = subprocess.run(
            cmd_args, 
            capture_output=True, 
            text=True, 
            cwd=cwd,
            timeout=300
        )
        
        if proc.returncode != 0:
            return {'error': proc.stderr.strip() or 'Command failed'}
        
        # Try to parse as JSON, fallback to raw output
        try:
            return json.loads(proc.stdout)
        except json.JSONDecodeError:
            return {'output': proc.stdout.strip()}
            
    except subprocess.TimeoutExpired:
        return {'error': 'Command timed out'}
    except Exception as e:
        return {'error': str(e)}

@app.route('/scan')
def scan():
    """OpenCCTV network scan"""
    network = request.args.get('network', '192.168.1.0/24')
    return jsonify(run_tool([
        'python3', 'OpenCCTV/opencctv.py', 
        '--network', network, '--json'
    ]))

@app.route('/discover')
def discover():
    """Ingram camera discovery"""
    network = request.args.get('network', '192.168.1.0/24')
    return jsonify(run_tool([
        'python3', 'Ingram/ingram.py', 
        '--subnet', network, '--json'
    ]))

@app.route('/cameradar')
def cameradar():
    """Cameradar RTSP brute force"""
    network = request.args.get('network', '192.168.1.0/24')
    return jsonify(run_tool([
        'cameradar', '--addresses', network, '--json'
    ]))

@app.route('/exploit', methods=['POST'])
def exploit():
    """EyePwn camera exploitation"""
    data = request.get_json()
    target = data.get('target') if data else None
    
    if not target:
        return jsonify({'error': 'Target IP required'})
    
    return jsonify(run_tool([
        'python3', 'EyePwn/eyePwn.py', 
        '--target', target, '--json'
    ]))

@app.route('/search-protocol')
def search_protocol():
    """IPCam search protocol"""
    return jsonify(run_tool([
        'python3', 'ipcam_search_protocol/search.py', '--json'
    ]))

@app.route('/shinobi')
def shinobi():
    """Shinobi NVR management"""
    action = request.args.get('action', 'status')
    
    if action == 'status':
        return jsonify(run_tool([
            'node', 'Shinobi/camera.js'
        ], cwd='Shinobi'))
    elif action == 'start':
        return jsonify(run_tool([
            'node', 'Shinobi/shinobi.js'
        ], cwd='Shinobi'))
    else:
        return jsonify({'error': 'Invalid action'})

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Imperial Scan API is running'})

if __name__ == '__main__':
    print("Starting Imperial Scan Flask Server...")
    print("Frontend should be running on http://localhost:8080")
    print("API will be available on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
```

6. **Start the Flask server**
```bash
python app.py
```

### Shinobi NVR Setup (Optional)

1. **Install Shinobi dependencies**
```bash
cd server/Shinobi
npm install
```

2. **Configure Shinobi**
```bash
# Copy configuration files
cp conf.sample.json conf.json
cp super.sample.json super.json

# Edit configurations as needed
nano conf.json
```

3. **Start Shinobi**
```bash
node shinobi.js
```

## 🎯 Usage

1. **Start both servers**:
   - Frontend: `npm run dev` (port 8080)
   - Backend: `python server/app.py` (port 5000)

2. **Access the dashboard**: http://localhost:8080

3. **Select a tool** from the left panel:
   - **Camera Discovery**: Find IP cameras using Ingram
   - **CCTV Network Scan**: Scan for vulnerable CCTV using OpenCCTV
   - **RTSP Attack**: Brute force RTSP streams with Cameradar
   - **Camera Exploitation**: Exploit vulnerabilities with EyePwn
   - **Shinobi NVR**: Manage NVR platform

4. **Run tools** and view results in real-time

## 📁 Project Structure

```
ImperialScan/
├── src/                      # React frontend
│   ├── components/
│   │   ├── VideoPlayerDashboard.tsx
│   │   ├── CameraToolPanel.tsx
│   │   ├── ToolStatusPanel.tsx
│   │   └── CameraList.tsx
│   └── pages/
├── server/                   # Flask backend
│   ├── app.py               # Main Flask application
│   ├── OpenCCTV/           # CCTV scanning tool
│   ├── EyePwn/              # Camera exploitation
│   ├── Ingram/              # Camera discovery
│   ├── ipcam_search_protocol/ # IP camera search
│   └── Shinobi/            # NVR platform
└── README.md
```

## 🔒 Security Tools Integration

### OpenCCTV
- Network scanning for CCTV devices
- Vulnerability detection
- Device fingerprinting

### EyePwn
- Camera exploitation framework
- Vulnerability testing
- Credential attacks

### Ingram
- Mass camera discovery
- Shodan integration
- Geolocation mapping

### Cameradar
- RTSP brute forcing
- Stream discovery
- Authentication bypass

### IPCam Search Protocol
- Protocol-level camera discovery
- Network reconnaissance
- Device enumeration

### Shinobi NVR
- Open-source NVR platform
- Camera management
- Stream recording and monitoring

## 🚀 Deployment

### Frontend (Lovable)
1. Click the "Publish" button in Lovable
2. Your app will be deployed to a Lovable subdomain
3. Optional: Connect a custom domain in Project Settings

### Backend (Self-hosted)
1. Deploy Flask app to your preferred hosting service
2. Update CORS settings for production
3. Configure environment variables
4. Set up process management (PM2, systemd, etc.)

## 🔧 Configuration

### Environment Variables
```bash
# Backend configuration
FLASK_ENV=production
CORS_ORIGINS=https://yourdomain.com
API_TIMEOUT=300

# Tool-specific settings
SHODAN_API_KEY=your_shodan_key
CAMERADAR_TIMEOUT=60
```

### Security Considerations
- Use this tool only on networks you own or have permission to test
- Follow responsible disclosure practices
- Comply with local laws and regulations
- Keep tools updated for latest security patches

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational and authorized security testing purposes only.

## 🆘 Support

- **Lovable Documentation**: https://docs.lovable.dev/
- **GitHub Issues**: Create an issue for bugs or feature requests
- **Security Tools**: Refer to individual tool documentation

## ⚠️ Disclaimer

This tool is intended for authorized security testing only. Users are responsible for ensuring they have proper authorization before scanning or testing any networks or devices. The developers are not responsible for any misuse of this software.
