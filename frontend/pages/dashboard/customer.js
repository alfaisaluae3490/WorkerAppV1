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
import toast from 'react-hot-toast';

export default function CustomerDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const [activeTab, setActiveTab] = useState('my-jobs');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Mock data for demonstration
  const myJobs = [
    {
      id: 1,
      title: 'Plumbing repair in kitchen',
      category: 'Plumbing',
      location: 'Karachi, Sindh',
      budget: '5000-8000',
      status: 'open',
      bids: 5,
      postedAt: '2 hours ago'
    },
    {
      id: 2,
      title: 'AC installation and maintenance',
      category: 'HVAC',
      location: 'Lahore, Punjab',
      budget: '15000-20000',
      status: 'in_progress',
      bids: 8,
      postedAt: '1 day ago'
    },
  ];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const handleSwitchToWorker = () => {
    router.push('/dashboard/worker');
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
                <Link href="/browse-workers" className="text-gray-700 hover:text-primary-600 font-medium">
                  Browse Workers
                </Link>
                <Link href="/my-bookings" className="text-gray-700 hover:text-primary-600 font-medium">
                  My Bookings
                </Link>
                <Link href="/messages" className="text-gray-700 hover:text-primary-600 font-medium">
                  Messages
                </Link>
              </nav>

              {/* User Menu */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/post-job')}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiPlusCircle size={20} />
                  <span className="hidden sm:inline">Post a Job</span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <FiUser className="text-primary-600" size={20} />
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                    <div className="px-4 py-3 border-b">
                      <p className="font-semibold text-gray-900">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Customer
                      </span>
                    </div>
                    
                    <Link href="/profile">
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                        <FiUser size={18} />
                        <span>My Profile</span>
                      </button>
                    </Link>
                    
                    <Link href="/settings">
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                        <FiSettings size={18} />
                        <span>Settings</span>
                      </button>
                    </Link>
                    
                    <button
                      onClick={handleSwitchToWorker}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 border-t"
                    >
                      <FiBriefcase size={18} />
                      <span>Switch to Worker Mode</span>
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
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white mb-8">
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, {user.full_name}! 👋
            </h2>
            <p className="text-primary-100 mb-6">
              Ready to find the perfect professional for your next project?
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => router.push('/post-job')}
                className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Post a New Job
              </button>
              <button
                onClick={() => router.push('/browse-workers')}
                className="bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-800 transition-colors"
              >
                Browse Workers
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">2</p>
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
                  <p className="text-3xl font-bold text-gray-900">13</p>
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
                  <p className="text-3xl font-bold text-gray-900">5</p>
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
                  <p className="text-3xl font-bold text-gray-900">₨45K</p>
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
                  {myJobs.length > 0 ? (
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
                            </div>
                          </div>
                          <span className={`badge ${
                            job.status === 'open' ? 'badge-success' : 
                            job.status === 'in_progress' ? 'badge-warning' : 
                            'badge-info'
                          }`}>
                            {job.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t">
                          <span className="text-sm font-medium text-gray-700">
                            {job.bids} bids received
                          </span>
                          <div className="flex gap-2">
                            <button className="btn-outline py-2 px-4 text-sm">
                              View Bids
                            </button>
                            <button className="btn-primary py-2 px-4 text-sm">
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
                  <FiMessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No active bookings
                  </h3>
                  <p className="text-gray-600">
                    Accept a bid to start a booking
                  </p>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="text-center py-12">
                  <FiClock className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No completed jobs yet
                  </h3>
                  <p className="text-gray-600">
                    Your job history will appear here
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