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

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

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
                  Find Jobs
                </Link>
                <Link href="/my-bids" className="text-gray-700 hover:text-primary-600 font-medium">
                  My Bids
                </Link>
                <Link href="/my-bookings" className="text-gray-700 hover:text-primary-600 font-medium">
                  Active Jobs
                </Link>
                <Link href="/messages" className="text-gray-700 hover:text-primary-600 font-medium">
                  Messages
                </Link>
              </nav>

              {/* User Menu */}
              <div className="flex items-center gap-4">
                {/* Profile Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FiBriefcase className="text-green-600" size={20} />
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                    <div className="px-4 py-3 border-b">
                      <p className="font-semibold text-gray-900">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Worker Mode
                      </span>
                    </div>
                    
                    <Link href="/worker-profile">
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                        <FiUser size={18} />
                        <span>My Profile</span>
                      </button>
                    </Link>
                    
                    <Link href="/portfolio">
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                        <FiAward size={18} />
                        <span>My Portfolio</span>
                      </button>
                    </Link>
                    
                    <Link href="/settings">
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                        <FiSettings size={18} />
                        <span>Settings</span>
                      </button>
                    </Link>
                    
                    <button
                      onClick={handleSwitchToCustomer}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 border-t"
                    >
                      <FiUser size={18} />
                      <span>Switch to Customer Mode</span>
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-red-600 border-t"
                    >
                      <FiLogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
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
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => router.push('/browse-jobs')}
                className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Browse Available Jobs
              </button>
              <button
                onClick={() => router.push('/worker-profile')}
                className="bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors"
              >
                Complete Your Profile
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Profile Views</p>
                  <p className="text-3xl font-bold text-gray-900">247</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <FiTrendingUp size={12} />
                    +12% this week
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiEye className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Bids</p>
                  <p className="text-3xl font-bold text-gray-900">5</p>
                  <p className="text-xs text-gray-500 mt-1">3 pending review</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <FiMessageSquare className="text-yellow-600" size={24} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Jobs Completed</p>
                  <p className="text-3xl font-bold text-gray-900">23</p>
                  <p className="text-xs text-gray-500 mt-1">100% success rate</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                  <p className="text-3xl font-bold text-gray-900">4.9</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar key={star} size={12} className="text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FiStar className="text-purple-600" size={24} />
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
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Available Jobs
                </button>
                <button
                  onClick={() => setActiveTab('my-bids')}
                  className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                    activeTab === 'my-bids'
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My Bids
                </button>
                <button
                  onClick={() => setActiveTab('active-jobs')}
                  className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                    activeTab === 'active-jobs'
                      ? 'border-green-600 text-green-600'
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
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {job.title}
                            </h3>
                            <span className="badge badge-info text-xs">
                              {job.category}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <FiMapPin size={16} />
                              {job.location} • {job.distance}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiDollarSign size={16} />
                              ₨{job.budget}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiClock size={16} />
                              {job.postedAt}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiMessageSquare size={16} />
                              {job.bids} bids
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-sm text-gray-600">
                          Act fast! Limited time offer
                        </span>
                        <div className="flex gap-2">
                          <button className="btn-outline py-2 px-4 text-sm">
                            View Details
                          </button>
                          <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-medium transition-colors">
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
                  {myBids.length > 0 ? (
                    myBids.map((bid) => (
                      <div key={bid.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {bid.jobTitle}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <FiDollarSign size={16} />
                                Your bid: ₨{bid.myBid}
                              </span>
                              <span>Total bids: {bid.bidsCount}</span>
                              <span>{bid.postedAt}</span>
                            </div>
                          </div>
                          <span className="badge badge-warning">
                            {bid.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 pt-4 border-t">
                          <button className="btn-outline py-2 px-4 text-sm">
                            Edit Bid
                          </button>
                          <button className="text-red-600 hover:text-red-700 py-2 px-4 text-sm font-medium">
                            Withdraw Bid
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <FiMessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No bids placed yet
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Browse available jobs and place your first bid!
                      </p>
                      <button
                        onClick={() => setActiveTab('available-jobs')}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
                      >
                        Find Jobs
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'active-jobs' && (
                <div className="text-center py-12">
                  <FiCheckCircle className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No active jobs
                  </h3>
                  <p className="text-gray-600">
                    Win a bid to start working on a job
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}