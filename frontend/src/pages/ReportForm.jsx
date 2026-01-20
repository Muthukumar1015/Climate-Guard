import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, AlertTriangle, Send } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { reportsAPI } from '../services/api';

export default function ReportForm() {
  const navigate = useNavigate();
  const { city } = useLocation();
  const [formData, setFormData] = useState({
    type: 'waterlogging',
    title: '',
    description: '',
    address: '',
    city: city,
    severity: 'medium',
    lat: '',
    lng: ''
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6)
        });
        setGettingLocation(false);
      },
      (err) => {
        setError('Could not get location');
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      data.append('type', formData.type);
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('address', formData.address);
      data.append('city', formData.city);
      data.append('severity', formData.severity);
      data.append('lat', formData.lat);
      data.append('lng', formData.lng);

      images.forEach((image) => {
        data.append('images', image);
      });

      await reportsAPI.create(data);
      navigate('/reports');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-8 h-8 text-orange-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Report an Issue</h1>
          <p className="text-gray-600">Help us monitor climate and environmental issues</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="waterlogging">Waterlogging / Flooding</option>
            <option value="pollution">Air Pollution</option>
            <option value="water_contamination">Water Contamination</option>
            <option value="heat_emergency">Heat Emergency</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description of the issue"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Provide details about the issue..."
            required
          />
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
          <div className="flex gap-2">
            {['low', 'medium', 'high', 'critical'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFormData({ ...formData, severity: level })}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.severity === level
                    ? level === 'critical' ? 'bg-red-500 text-white' :
                      level === 'high' ? 'bg-orange-500 text-white' :
                      level === 'medium' ? 'bg-yellow-500 text-white' :
                      'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Street address or landmark"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input
              type="text"
              value={formData.lat}
              onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 28.6139"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input
              type="text"
              value={formData.lng}
              onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 77.2090"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <MapPin className="w-4 h-4" />
          {gettingLocation ? 'Getting location...' : 'Use current location'}
        </button>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photos (optional)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-20 h-20">
                <img
                  src={URL.createObjectURL(img)}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                >
                  X
                </button>
              </div>
            ))}
          </div>
          <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
            <Camera className="w-5 h-5 text-gray-400" />
            <span className="text-gray-500">Add photos (max 5)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
