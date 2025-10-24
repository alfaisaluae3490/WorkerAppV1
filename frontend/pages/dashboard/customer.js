// frontend/pages/dashboard/customer.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  FiBriefcase, 
  FiPlusCircle, 
  FiUser, 
  FiLogOut, 
  FiSearch,
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiMessageSquare,
  FiStar,
  FiSettings
} from 'react-icons/fi';
import useAuthStore from '../../store/authStore';
import { jobsAPI, authAPI } from '../../utils/apiClient';
import toast from 'react-hot-toast';

export default function CustomerDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const [activeTab, setActiveTab] = useState('my-jobs');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Real data from API
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalBids: 0,
    completed: 0,
    totalSpent: 0
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      fetchMyJobs();
    }
  }, [isAuthenticated, router]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  // Fetch real jobs from database
  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getMyJobs();
      
      if (response.success) {
        const jobs = response.data.jobs || response.data || [];
        setMyJobs(jobs);
        
        // Calculate stats
        const activeJobs = jobs.filter(j => j.status === 'open' || j.status === 'assigned').length;
        const totalBids = jobs.reduce((sum, job) => sum + (parseInt(job.bids_count) || 0), 0);
        const completed = jobs.filter(j => j.status === 'completed').length;
        
        setStats({
          activeJobs,
          totalBids,
          completed,
          totalSpent: 0 // TODO: Calculate from bookings
        });
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load your jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const handleSwitchToWorker = async () => {
    try {
      const response = await authAPI.switchRole('worker');
      if (response.success) {
        toast.success('Switched to Worker mode');
        router.push('/dashboard/worker');
      }
    } catch (error) {
      toast.error('Failed to switch role');
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Customer Dashboard - Services Marketplace</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header/Navbar */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/">
                <h1 className="text-2xl font-bold text-primary-600 cursor-pointer">
                  Services Marketplace
                </h1>
              </Link>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/browse-jobs" className="text-gray-700 hover:text-primary-600 font-medium">
                  Browse Workers
                </Link>
                <Link href="/my-bookings" className="text-gray-700 hover:text-primary-600 font-medium">
                  My Bookings
                </Link>
                <Link href="/messages" className="text-gray-700 hover:text-primary-600 font-medium">
                  Messages
                </Link>
              </nav>

              {/* Right side - Actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/post-job')}
                  className="hidden md:flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  <FiPlusCircle size={20} />
                  Post a Job
                </button>

                {/* Profile Dropdown */}
                <div className="relative profile-dropdown">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                  >
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border z-50">
                      <div className="p-4 border-b">
                        <p className="font-semibold text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mt-2">
                          Customer
                        </span>
                      </div>

                      <div className="p-2">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            router.push('/profile');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded flex items-center gap-3"
                        >
                          <FiUser size={18} />
                          Profile Settings
                        </button>

                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            handleSwitchToWorker();
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded flex items-center gap-3"
                        >
                          <FiBriefcase size={18} />
                          Switch to Worker Mode
                        </button>

                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded flex items-center gap-3 text-red-600"
                        >
                          <FiLogOut size={18} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl p-8 text-white mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user.full_name?.split(' ')[0]}! 👋</h1>
            <p className="text-primary-100 mb-6">Ready to find the perfect professional for your next project?</p>
            
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/post-job')}
                className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
              >
                Post a New Job
              </button>
              <button
                onClick={() => router.push('/browse-jobs')}
                className="bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-800 transition"
              >
                Browse Workers
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeJobs}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiBriefcase className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Bids</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalBids}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FiMessageSquare className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FiStar className="text-purple-600" size={24} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                  <p className="text-3xl font-bold text-gray-900">Rs{stats.totalSpent}K</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <FiDollarSign className="text-yellow-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex gap-8 px-6">
                <button
                  onClick={() => setActiveTab('my-jobs')}
                  className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                    activeTab === 'my-jobs'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My Posted Jobs
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                    activeTab === 'bookings'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Active Bookings
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  History
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'my-jobs' && (
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading your jobs...</p>
                    </div>
                  ) : myJobs.length > 0 ? (
                    myJobs.map((job) => (
                      <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <FiMapPin size={16} />
                                {job.city}, {job.province}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiDollarSign size={16} />
                                Rs{job.budget_min}-{job.budget_max}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiClock size={16} />
                                {getTimeAgo(job.created_at)}
                              </span>
                            </div>
                          </div>
                          <span className={`badge ${
                            job.status === 'open' ? 'badge-success' : 
                            job.status === 'assigned' ? 'badge-warning' : 
                            job.status === 'completed' ? 'badge-info' :
                            'badge-default'
                          }`}>
                            {job.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t">
                          <span className="text-sm font-medium text-gray-700">
                            {job.bids_count || 0} bids received
                          </span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => router.push(`/jobs/${job.id}/bids`)}
                              className="btn-outline py-2 px-4 text-sm"
                            >
                              View Bids
                            </button>
                            <button 
                              onClick={() => router.push(`/jobs/${job.id}`)}
                              className="btn-primary py-2 px-4 text-sm"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <FiBriefcase className="mx-auto text-gray-400 mb-4" size={48} />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No jobs posted yet
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Post your first job to get started!
                      </p>
                      <button
                        onClick={() => router.push('/post-job')}
                        className="btn-primary"
                      >
                        Post a Job
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bookings' && (
                <div className="text-center py-12">
                  <p className="text-gray-600">No active bookings</p>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="text-center py-12">
                  <p className="text-gray-600">No completed jobs yet</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .card {
          @apply bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow;
        }
        
        .btn-primary {
          @apply bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition;
        }
        
        .btn-outline {
          @apply border-2 border-primary-600 text-primary-600 px-6 py-2 rounded-lg font-semibold hover:bg-primary-50 transition;
        }
        
        .badge {
          @apply px-3 py-1 rounded-full text-xs font-semibold;
        }
        
        .badge-success {
          @apply bg-green-100 text-green-800;
        }
        
        .badge-warning {
          @apply bg-yellow-100 text-yellow-800;
        }
        
        .badge-info {
          @apply bg-blue-100 text-blue-800;
        }
        
        .badge-default {
          @apply bg-gray-100 text-gray-800;
        }
      `}</style>
    </>
  );
}