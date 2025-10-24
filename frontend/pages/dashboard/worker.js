// frontend/pages/dashboard/worker.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  FiBriefcase, 
  FiUser, 
  FiLogOut, 
  FiSearch,
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiMessageSquare,
  FiStar,
  FiSettings,
  FiTrendingUp,
  FiAward,
  FiEye,
  FiCheckCircle
} from 'react-icons/fi';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function WorkerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout, switchRole } = useAuthStore();
  const [activeTab, setActiveTab] = useState('available-jobs');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
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

  // Mock data for available jobs
  const availableJobs = [
    {
      id: 1,
      title: 'Electrical wiring for new office',
      category: 'Electrical',
      location: 'Islamabad, ICT',
      budget: '20000-30000',
      distance: '5 km',
      postedAt: '1 hour ago',
      bids: 3
    },
    {
      id: 2,
      title: 'Interior painting - 3 bedroom apartment',
      category: 'Painting',
      location: 'Rawalpindi, Punjab',
      budget: '25000-35000',
      distance: '12 km',
      postedAt: '3 hours ago',
      bids: 7
    },
    {
      id: 3,
      title: 'Carpentry work for kitchen cabinets',
      category: 'Carpentry',
      location: 'Karachi, Sindh',
      budget: '15000-20000',
      distance: '8 km',
      postedAt: '5 hours ago',
      bids: 5
    },
  ];

  const myBids = [
    {
      id: 1,
      jobTitle: 'Plumbing repair in kitchen',
      myBid: '6500',
      status: 'pending',
      bidsCount: 8,
      postedAt: '2 days ago'
    },
  ];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const handleSwitchToCustomer = async () => {
    try {
      await switchRole('customer');
      toast.success('Switched to Customer mode');
      router.push('/dashboard/customer');
    } catch (error) {
      toast.error('Failed to switch role');
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Worker Dashboard - Services Marketplace</title>
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
                  Browse Jobs
                </Link>
                <Link href="/my-bids" className="text-gray-700 hover:text-primary-600 font-medium">
                  My Bids
                </Link>
                <Link href="/messages" className="text-gray-700 hover:text-primary-600 font-medium">
                  Messages
                </Link>
              </nav>

              <div className="flex items-center gap-4">
                {/* Profile Dropdown */}
                <div className="relative profile-dropdown">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FiBriefcase className="text-green-600" size={20} />
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50">
                      <div className="px-4 py-3 border-b">
                        <p className="font-semibold text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Worker Mode
                        </span>
                      </div>
                      
                      <Link href="/worker-profile">
                        <button 
                          onClick={() => setIsProfileOpen(false)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <FiUser size={18} />
                          <span>My Profile</span>
                        </button>
                      </Link>
                      
                      <Link href="/portfolio">
                        <button 
                          onClick={() => setIsProfileOpen(false)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <FiAward size={18} />
                          <span>My Portfolio</span>
                        </button>
                      </Link>
                      
                      <Link href="/settings">
                        <button 
                          onClick={() => setIsProfileOpen(false)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <FiSettings size={18} />
                          <span>Settings</span>
                        </button>
                      </Link>
                      
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          handleSwitchToCustomer();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 border-t"
                      >
                        <FiUser size={18} />
                        <span>Switch to Customer Mode</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-red-600 border-t"
                      >
                        <FiLogOut size={18} />
                        <span>Logout</span>
                      </button>
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
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white mb-8">
            <h2 className="text-3xl font-bold mb-2">
              Welcome, {user.full_name}! 💼
            </h2>
            <p className="text-green-100 mb-6">
              Find your next job opportunity and grow your business
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <FiTrendingUp className="text-white mb-2" size={24} />
                <p className="text-sm text-green-100">Success Rate</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <FiCheckCircle className="text-white mb-2" size={24} />
                <p className="text-sm text-green-100">Jobs Completed</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <FiStar className="text-white mb-2" size={24} />
                <p className="text-sm text-green-100">Your Rating</p>
                <p className="text-2xl font-bold">4.8 ⭐</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Available Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">24</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiBriefcase className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">My Bids</p>
                  <p className="text-3xl font-bold text-gray-900">5</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FiMessageSquare className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">2</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="text-purple-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Earned</p>
                  <p className="text-3xl font-bold text-gray-900">₨85K</p>
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
                  onClick={() => setActiveTab('available-jobs')}
                  className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                    activeTab === 'available-jobs'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Available Jobs
                </button>
                <button
                  onClick={() => setActiveTab('my-bids')}
                  className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                    activeTab === 'my-bids'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My Bids
                </button>
                <button
                  onClick={() => setActiveTab('active-jobs')}
                  className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                    activeTab === 'active-jobs'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Active Jobs
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'available-jobs' && (
                <div className="space-y-4">
                  {availableJobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <FiMapPin size={16} />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiDollarSign size={16} />
                              ₨{job.budget}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiClock size={16} />
                              {job.postedAt}
                            </span>
                            <span className="text-blue-600">📍 {job.distance} away</span>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          {job.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-sm text-gray-600">
                          {job.bids} bids placed
                        </span>
                        <div className="flex gap-2">
                          <button className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition">
                            View Details
                          </button>
                          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                            Place Bid
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'my-bids' && (
                <div className="space-y-4">
                  {myBids.map((bid) => (
                    <div key={bid.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {bid.jobTitle}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span>Your Bid: <strong className="text-primary-600">₨{bid.myBid}</strong></span>
                            <span>{bid.bidsCount} total bids</span>
                            <span>{bid.postedAt}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {bid.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'active-jobs' && (
                <div className="text-center py-12">
                  <FiBriefcase className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No active jobs</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}