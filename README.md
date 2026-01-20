# ClimateGuard - Integrated Climate Safety Platform

An integrated platform for monitoring heatwaves, urban flooding, air quality, and water pollution in Indian cities.

## Features

### 1. Heatwave Module
- Real-time temperature and heat index monitoring
- Color-coded alert levels (Green/Yellow/Orange/Red)
- Nearby cooling centers and hospitals
- Health guidelines and emergency first aid

### 2. Urban Flooding Module
- Flood risk assessment and mapping
- Citizen-reported waterlogging
- Safe route suggestions
- Emergency contacts

### 3. Air Quality Module
- Real-time AQI monitoring
- Pollutant breakdown (PM2.5, PM10, NO2, etc.)
- Health recommendations
- Bio-remediation suggestions

### 4. Water Quality Module
- Water quality index for rivers, lakes, tap water
- Safety parameters and standards
- Bio-remediation methods
- Pollution reporting

## Tech Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS
- React Router
- Leaflet Maps
- Recharts
- Lucide Icons

**Backend:**
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- Node-cron for scheduled tasks

**Data Sources:**
- India Meteorological Department (IMD)
- Central Pollution Control Board (CPCB)
- OpenWeather API

## Project Structure

```
climate-guard/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── context/
    │   └── App.jsx
    ├── package.json
    └── index.html
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- OpenWeather API Key

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# - MONGODB_URI
# - JWT_SECRET
# - OPENWEATHER_API_KEY

# Start server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Heatwave
- `GET /api/heatwave/current/:city` - Current conditions
- `GET /api/heatwave/forecast/:city` - 7-day forecast
- `GET /api/heatwave/cooling-centers/:city` - Nearby facilities
- `GET /api/heatwave/guidelines` - Safety guidelines

### Flood
- `GET /api/flood/current/:city` - Current data
- `GET /api/flood/risk-map/:city` - Flood-prone areas
- `GET /api/flood/safe-routes/:city` - Safe routes
- `POST /api/flood/report-waterlogging` - Report issue

### Air Quality
- `GET /api/air-quality/current/:city` - Current AQI
- `GET /api/air-quality/pollutants/:city` - Pollutant details
- `GET /api/air-quality/health-recommendations/:city` - Health advice
- `GET /api/air-quality/bio-remediation/:city` - Natural solutions

### Water Quality
- `GET /api/water-quality/current/:city` - Water quality data
- `GET /api/water-quality/tap-water/:city` - Tap water quality
- `GET /api/water-quality/standards` - BIS standards
- `POST /api/water-quality/report` - Report pollution

### Alerts
- `GET /api/alerts/active/:city` - Active alerts
- `GET /api/alerts/summary/:city` - Alert summary

### Reports
- `POST /api/reports` - Submit report
- `GET /api/reports/city/:city` - City reports
- `POST /api/reports/:id/upvote` - Upvote report

## Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/climateguard

# Authentication
JWT_SECRET=your-secret-key

# External APIs
OPENWEATHER_API_KEY=your-api-key
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

MIT License

## Acknowledgments

- India Meteorological Department
- Central Pollution Control Board
- OpenWeather
