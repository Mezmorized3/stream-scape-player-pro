# Imperial Scan - CCTV Security Testing Platform

A comprehensive CCTV security testing platform that integrates multiple penetration testing tools with a modern React dashboard and Shinobi NVR capabilities.

## 🔧 Technologies

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Flask (Python)
- **NVR**: Shinobi Systems
- **Security Tools**: OpenCCTV, EyePwn, Ingram, Cameradar, IPCamSearch, xray, Kamerka, Search_Viewer, cctv-ddns-shodan-censys

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
pip install flask flask-cors requests beautifulsoup4 googlesearch-python shodan censys dnspython
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

# xray (requires Go)
go install github.com/evilsocket/xray/cmd/xray@latest

# Kamerka (Python)
pip install kamerka

# cctv-ddns
git clone https://github.com/zveriu/cctv-ddns-shodan-censys.git cctv-ddns
cd cctv-ddns && pip install -r requirements.txt && cd ..

# IPCam Search Protocol
git clone https://github.com/mcw0/ipcam_search_protocol.git
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
import requests
import shodan
import censys

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
    country_code = request.args.get('country')

    if country_code:
        ip_ranges = get_country_ips(country_code)
        if not ip_ranges:
            return jsonify({'error': f'Could not get IP ranges for {country_code}'})
        
        # NOTE: Scanning all ranges is a long task!
        # This example just returns the first 5 ranges for demonstration.
        # A real implementation needs a background task queue (e.g., Celery).
        results = []
        for network in ip_ranges[:5]: # Limiting to 5 for demo
            result_data = run_tool(['python3', 'Ingram/ingram.py', '--subnet', network, '--json'])
            # run_tool returns a list on success, or a dict with 'error' on failure
            if isinstance(result_data, list):
                results.extend(result_data)
            elif isinstance(result_data, dict) and 'error' in result_data:
                # Optional: log the error for this specific range
                print(f"Error scanning {network}: {result_data['error']}")
        return jsonify(results)

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

@app.route('/xray')
def xray():
    """Xray network reconnaissance"""
    country_code = request.args.get('country')
    network = request.args.get('network')

    target = network
    if country_code:
        ip_ranges = get_country_ips(country_code)
        if not ip_ranges:
            return jsonify({'error': f'Could not get IP ranges for {country_code}'})
        # NOTE: For demonstration, we'll scan the first range.
        # A real implementation needs a task queue for full country scans.
        target = ip_ranges[0]
    
    if not target:
        target = '192.168.1.0/24' # Default if no target specified

    # Assumes xray is in the system's PATH.
    return jsonify(run_tool(['xray', '-json', target]))

@app.route('/kamerka')
def kamerka():
    """Kamerka RTSP stream finder"""
    shodan_key = request.args.get('shodan_key')
    if not shodan_key:
        return jsonify({'error': 'Shodan API key is required for this tool.'})

    country_code = request.args.get('country')
    network = request.args.get('network')

    cmd = ['kamerka', '--json', '--shodan-key', shodan_key]
    
    if country_code:
        cmd.extend(['-c', country_code])
    elif network:
        cmd.extend(['-a', network])
    else:
        return jsonify({'error': 'A target country or network is required.'})

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

@app.route('/ddns-scan', methods=['POST'])
def ddns_scan():
    """cctv-ddns-shodan-censys DDNS scanner"""
    data = request.get_json()
    if not data or 'hostnames' not in data:
        return jsonify({'error': 'Hostnames are required'})

    hostnames = data['hostnames']
    
    # Write hostnames to a temporary file
    temp_file_path = 'cctv-ddns/hostnames.tmp.txt'
    with open(temp_file_path, 'w') as f:
        f.write(hostnames)
    
    cmd = [
        'python3', 'cctv-ddns/cctv-ddns.py',
        '--file', 'hostnames.tmp.txt'
    ]

    if data.get('shodan_key'):
        cmd.extend(['--shodan-key', data['shodan_key']])
    if data.get('censys_id') and data.get('censys_secret'):
        cmd.extend([
            '--censys-id', data['censys_id'],
            '--censys-secret', data['censys_secret']
        ])

    # The tool's output is not clean JSON, so we handle it as raw text
    # It prints JSON objects per line, but run_tool expects a single JSON object.
    # We will grab raw output.
    tool_dir = 'cctv-ddns'
    
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=os.path.abspath(tool_dir),
            timeout=300
        )
        if proc.returncode != 0:
             return jsonify({'error': proc.stderr.strip() or 'Command failed'})
        
        # The tool prints JSON objects line-by-line. Let's wrap them in an array.
        output_lines = proc.stdout.strip().split('\n')
        json_lines = [line for line in output_lines if line.strip().startswith('{')]
        
        # This might still fail if there's other text, but it's a good attempt
        try:
            json_output = json.loads(f'[{",".join(json_lines)}]')
            return jsonify(json_output)
        except json.JSONDecodeError:
            # Fallback to raw output if JSON parsing fails
            return jsonify({'output': proc.stdout.strip()})

    except subprocess.TimeoutExpired:
        return jsonify({'error': 'DDNS Scan command timed out'})
    except Exception as e:
        return jsonify({'error': str(e)})
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.route('/search-viewer')
def search_viewer():
    """Search_Viewer OSINT tool"""
    query = request.args.get('query')
    if not query:
        return jsonify({'error': 'Query parameter is required'})

    # Define the path to the Search_Viewer tool
    tool_dir = 'Search_Viewer'
    script_path = os.path.join(tool_dir, 'search_viewer.py')
    html_output_path = os.path.join(tool_dir, 'search_viewer.html')

    # Run the tool. It generates an HTML file.
    cmd = ['python3', script_path, query]
    
    try:
        # We run this within the tool's directory for it to find its files
        proc = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            cwd=os.path.abspath(tool_dir),
            timeout=300
        )

        logs = proc.stdout.strip()
        error_log = proc.stderr.strip() if proc.returncode != 0 else None

        html_content = None
        if os.path.exists(html_output_path):
            with open(html_output_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            os.remove(html_output_path)

        response = {'output': logs}
        if html_content:
            response['html_content'] = html_content
        if error_log:
            # If there's an error, send it back to the frontend
            response['error'] = (response.get('error', '') + ' ' + error_log).strip()
        
        return jsonify(response)

    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Search_Viewer command timed out'})
    except Exception as e:
        return jsonify({'error': str(e)})

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
   - **X-Ray Scan**: Network reconnaissance with xray
   - **RTSP Attack**: Brute force RTSP streams with Cameradar
   - **Kamerka Scan**: Discover RTSP streams using Shodan
   - **Camera Exploitation**: Exploit vulnerabilities with EyePwn
   - **DDNS Scan**: Find cameras from a list of DDNS hostnames
   - **Shinobi NVR**: Manage NVR platform
   - **Search Viewer**: OSINT data collection and graph generation

4. **Choose a target**:
   - Select a country from the dropdown to scan its public IP ranges.
   - Or, manually enter a specific network/subnet (e.g., `192.168.1.0/24`).
   - For Search Viewer, enter a search query.

5. **Run tools** and view results in real-time.

## Country-Based Scanning

The dashboard now supports selecting a target country for scans. This feature works by passing a `country` query parameter (e.g., `?country=US`) to the backend API endpoints.

To handle this, you need to update your `app.py` to fetch IP ranges for the given country code and process them.

### 1. Add Helper Function to `app.py`

First, add a helper function to fetch IP blocks from a service like IPdeny. Make sure you have `requests` installed (`pip install requests`).

```python
import requests
# ... other imports

IPDENY_URL = "http://www.ipdeny.com/ipblocks/data/countries/{}.zone"

def get_country_ips(country_code):
    """Fetches IP blocks for a given country."""
    if not country_code or len(country_code) != 2:
        return None
    try:
        # Fetch the .zone file containing CIDR blocks
        response = requests.get(IPDENY_URL.format(country_code.lower()), timeout=10)
        response.raise_for_status()
        # Return a list of IP ranges
        return response.text.strip().split('\n')
    except requests.RequestException as e:
        print(f"Error fetching IP data for {country_code}: {e}")
        return None
```

### 2. Update Flask Routes

Next, modify your API routes to handle the `country` parameter. Here's an example for the `/discover` route:

```python
@app.route('/discover')
def discover():
    """Ingram camera discovery"""
    country_code = request.args.get('country')

    if country_code:
        ip_ranges = get_country_ips(country_code)
        if not ip_ranges:
            return jsonify({'error': f'Could not get IP ranges for {country_code}'})
        
        # NOTE: Scanning all ranges is a long task!
        # This example just returns the first 5 ranges for demonstration.
        # A real implementation needs a background task queue (e.g., Celery).
        results = []
        for network in ip_ranges[:5]: # Limiting to 5 for demo
            result_data = run_tool(['python3', 'Ingram/ingram.py', '--subnet', network, '--json'])
            # run_tool returns a list on success, or a dict with 'error' on failure
            if isinstance(result_data, list):
                results.extend(result_data)
            elif isinstance(result_data, dict) and 'error' in result_data:
                # Optional: log the error for this specific range
                print(f"Error scanning {network}: {result_data['error']}")
        return jsonify(results)

    network = request.args.get('network', '192.168.1.0/24')
    return jsonify(run_tool([
        'python3', 'Ingram/ingram.py', 
        '--subnet', network, '--json'
    ]))
```

### ⚠️ Important: Handling Long-Running Scans

Scanning all IP ranges for an entire country can take hours and will **cause the server to time out** on a standard HTTP request. The example above only scans the first 5 IP ranges for demonstration purposes.

For a production-ready application, you must implement a **background task queue** (like [Celery](https://docs.celeryq.dev/en/stable/) with Redis or RabbitMQ) to handle these long-running jobs asynchronously. The API endpoint should start the background job and immediately return a job ID. The frontend can then poll another endpoint for the status and results of that job.

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
│   ├── Search_Viewer/       # OSINT graph tool
│   └── Shinobi/            # NVR platform
│   └── cctv-ddns/          # DDNS scanner
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

### xray
- Network OSINT reconnaissance
- Port and service discovery
- Banner grabbing and fingerprinting

### Kamerka
- Discovers RTSP streams from around the world
- Uses Shodan search engine
- Can search by country or network

### Search_Viewer
- OSINT data collection from search engines
- Generates interactive graphs of connections
- Useful for mapping relationships and discovering information

### cctv-ddns-shodan-censys
- Finds CCTV cameras via DDNS hostnames
- Integrates with Shodan and Censys for extra data
- Requires a list of hostnames to scan

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

## 📄 License

This project is for educational and authorized security testing purposes only.

## 🆘 Support

- **Lovable Documentation**: https://docs.lovable.dev/
- **GitHub Issues**: Create an issue for bugs or feature requests
- **Security Tools**: Refer to individual tool documentation

## ⚠️ Disclaimer

This tool is intended for authorized security testing only. Users are responsible for ensuring they have proper authorization before scanning or testing any networks or devices. The developers are not responsible for any misuse of this software.
