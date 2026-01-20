import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, MapPin, ThumbsUp, MessageCircle, Plus, Filter } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { reportsAPI } from '../services/api';

export default function Reports() {
  const { city } = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState({ type: 'all', status: 'all' });

  useEffect(() => {
    fetchReports();
  }, [city, filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.type !== 'all') params.type = filter.type;
      if (filter.status !== 'all') params.status = filter.status;

      const response = await reportsAPI.getByCity(city, params);
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (reportId) => {
    if (!user) return;
    try {
      await reportsAPI.upvote(reportId);
      fetchReports();
    } catch (error) {
      console.error('Error upvoting:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      verified: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-purple-100 text-purple-700',
      resolved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return colors[severity] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Community Reports</h1>
          <p className="text-gray-600">Citizen-reported issues in {city}</p>
        </div>
        {user && (
          <Link
            to="/report/new"
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <Plus className="w-5 h-5" />
            Report Issue
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Filter:</span>
        </div>
        <select
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="waterlogging">Waterlogging</option>
          <option value="pollution">Pollution</option>
          <option value="water_contamination">Water Contamination</option>
          <option value="heat_emergency">Heat Emergency</option>
          <option value="other">Other</option>
        </select>
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report._id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      {report.type.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800">{report.title}</h3>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">{report.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {report.location?.address || report.location?.city}
                    </span>
                    <span>by {report.reportedBy?.name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={() => handleUpvote(report._id)}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500"
                      disabled={!user}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      {report.upvotes?.length || 0}
                    </button>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <MessageCircle className="w-4 h-4" />
                      {report.comments?.length || 0}
                    </span>
                  </div>
                </div>
                {report.images?.[0] && (
                  <img
                    src={report.images[0].url}
                    alt="Report"
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No reports found</p>
          <p className="text-gray-400 text-sm mt-1">Be the first to report an issue in your area</p>
        </div>
      )}
    </div>
  );
}
