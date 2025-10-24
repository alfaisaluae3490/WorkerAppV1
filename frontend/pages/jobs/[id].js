// frontend/pages/jobs/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  FiMapPin, 
  FiDollarSign, 
  FiClock,
  FiCalendar,
  FiUser,
  FiStar,
  FiArrowLeft,
  FiAlertCircle,
  FiCheckCircle,
  FiMessageSquare,
  FiImage
} from 'react-icons/fi';
import useAuthStore from '../../store/authStore';
import { jobsAPI, bidsAPI } from '../../utils/apiClient';
import toast from 'react-hot-toast';

export default function JobDetails() {
  const router = useRouter();
  const { id } = router.query;
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showBidForm, setShowBidForm] = useState(false);
  const [submittingBid, setSubmittingBid] = useState(false);

  const [bidData, setBidData] = useState({
    amount: '',
    message: '',
    estimated_duration: '',
  });

  // Fetch job details
  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getJob(id);
      
      if (response.success) {
        setJob(response.data.job);
      }
    } catch (error) {
      console.error('Failed to fetch job:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleBidChange = (e) => {
    const { name, value } = e.target;
    setBidData({
      ...bidData,
      [name]: value
    });
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to place a bid');
      router.push('/login');
      return;
    }

    // Validation
    if (!bidData.amount || parseFloat(bidData.amount) <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    if (!bidData.message || bidData.message.length < 10) {
      toast.error('Please provide a message (min 10 characters)');
      return;
    }

    setSubmittingBid(true);

    try {
      // Call bids API
      const response = await bidsAPI.placeBid({
        job_id: job.id,
        bid_amount: parseFloat(bidData.amount),
        proposal: bidData.message,
        estimated_duration: bidData.estimated_duration || null
      });

      if (response.success) {
        toast.success('Bid submitted successfully!');
        setShowBidForm(false);
        setBidData({ amount: '', message: '', estimated_duration: '' });
        // Refresh job to show new bid count
        fetchJobDetails();
      } else {
        toast.error(response.message || 'Failed to submit bid');
      }
    } catch (error) {
      console.error('Submit bid error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit bid';
      toast.error(errorMessage);
    } finally {
      setSubmittingBid(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Job not found</p>
          <Link href="/browse-jobs">
            <button className="btn-primary">Browse Jobs</button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnJob = user?.id === job.customer_id;

  return (
    <>
      <Head>
        <title>{job.title} - Services Marketplace</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/">
                <h1 className="text-2xl font-bold text-primary-600 cursor-pointer">
                  Services Marketplace
                </h1>
              </Link>

              <div className="flex items-center gap-4">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard/customer">
                      <button className="text-gray-700 hover:text-primary-600 font-medium">
                        Dashboard
                      </button>
                    </Link>
                    <Link href="/profile">
                      <button className="text-gray-700 hover:text-primary-600 font-medium">
                        Profile
                      </button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <button className="text-gray-700 hover:text-primary-600 font-medium">
                        Login
                      </button>
                    </Link>
                    <Link href="/signup">
                      <button className="btn-primary">
                        Sign Up
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Link href="/browse-jobs">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
              <FiArrowLeft />
              <span>Back to Jobs</span>
            </button>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Job Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Header */}
              <div className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {job.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FiMapPin size={16} />
                        {job.city}, {job.province}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiClock size={16} />
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                    job.category_slug === 'plumbing' ? 'bg-blue-100 text-blue-800' :
                    job.category_slug === 'electrical' ? 'bg-yellow-100 text-yellow-800' :
                    job.category_slug === 'cleaning' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.category_name}
                  </span>
                </div>

                {/* Budget */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <FiDollarSign className="text-green-600" size={20} />
                    <span className="text-sm font-medium text-gray-700">Budget</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    Rs{parseFloat(job.budget_min).toLocaleString()} - Rs{parseFloat(job.budget_max).toLocaleString()}
                  </p>
                </div>

                {/* Job Photos */}
                {job.images && job.images.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FiImage size={20} />
                      Job Photos
                    </h3>
                    
                    {/* Main Image */}
                    <div className="mb-3">
                      <img
                        src={job.images[selectedImage]}
                        alt={`Job photo ${selectedImage + 1}`}
                        className="w-full h-96 object-cover rounded-lg"
                      />
                    </div>

                    {/* Thumbnail Gallery */}
                    {job.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {job.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className={`h-20 object-cover rounded-lg cursor-pointer transition ${
                              selectedImage === index 
                                ? 'ring-2 ring-primary-600' 
                                : 'opacity-70 hover:opacity-100'
                            }`}
                            onClick={() => setSelectedImage(index)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Job Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Job Description
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Additional Details */}
                {(job.preferred_date || job.preferred_time || job.gender_preference !== 'any') && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Additional Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {job.preferred_date && (
                        <div className="flex items-start gap-3">
                          <FiCalendar className="text-gray-400 mt-1" size={18} />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Preferred Date</p>
                            <p className="text-gray-600">{new Date(job.preferred_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                      {job.preferred_time && (
                        <div className="flex items-start gap-3">
                          <FiClock className="text-gray-400 mt-1" size={18} />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Preferred Time</p>
                            <p className="text-gray-600">{job.preferred_time}</p>
                          </div>
                        </div>
                      )}
                      {job.gender_preference && job.gender_preference !== 'any' && (
                        <div className="flex items-start gap-3">
                          <FiUser className="text-gray-400 mt-1" size={18} />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Gender Preference</p>
                            <p className="text-gray-600 capitalize">{job.gender_preference}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Posted By
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {job.customer_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{job.customer_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <FiMapPin size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{job.city}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Action Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                {!isOwnJob ? (
                  !showBidForm ? (
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast.error('Please login to place a bid');
                          router.push('/login');
                          return;
                        }
                        setShowBidForm(true);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
                    >
                      Place Your Bid
                    </button>
                  ) : (
                    <div className="card">
                      <h3 className="font-semibold text-gray-900 mb-4">Submit Your Bid</h3>
                      
                      <form onSubmit={handleSubmitBid} className="space-y-4">
                        {/* Bid Amount */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Bid Amount (PKR) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiDollarSign className="text-gray-400" size={18} />
                            </div>
                            <input
                              type="number"
                              name="amount"
                              value={bidData.amount}
                              onChange={handleBidChange}
                              className="input-field pl-10"
                              placeholder="Enter your bid"
                              required
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Budget: ₨{job.budget_min?.toLocaleString()} - ₨{job.budget_max?.toLocaleString()}
                          </p>
                        </div>

                        {/* Message */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Proposal Message <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            name="message"
                            value={bidData.message}
                            onChange={handleBidChange}
                            className="input-field min-h-[120px]"
                            placeholder="Explain why you're the best fit for this job..."
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {bidData.message.length} characters (min 10)
                          </p>
                        </div>

                        {/* Estimated Duration */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimated Duration (Optional)
                          </label>
                          <input
                            type="text"
                            name="estimated_duration"
                            value={bidData.estimated_duration}
                            onChange={handleBidChange}
                            className="input-field"
                            placeholder="e.g., 2-3 hours, 1 day"
                          />
                        </div>

                        {/* Notice */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                          <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                          <p className="text-sm text-blue-800">
                            Your contact details will only be shared if the customer accepts your bid.
                          </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setShowBidForm(false)}
                            className="flex-1 btn-secondary"
                            disabled={submittingBid}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 btn-primary"
                            disabled={submittingBid}
                          >
                            {submittingBid ? 'Submitting...' : 'Submit Bid'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )
                ) : (
                  <div className="card">
                    <div className="text-center py-8">
                      <FiCheckCircle className="mx-auto text-green-600 mb-3" size={48} />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        This is your job posting
                      </h3>
                      <p className="text-gray-600 mb-4">
                        You cannot bid on your own job
                      </p>
                      <Link href={`/jobs/${job.id}/bids`}>
                        <button className="btn-primary w-full">
                          View Bids
                        </button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Job Statistics */}
                <div className="card mt-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Job Statistics</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Bids</span>
                      <span className="font-semibold text-gray-900">{job.bids_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        job.status === 'open' ? 'bg-green-100 text-green-800' :
                        job.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                        job.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Posted</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .card {
          @apply bg-white rounded-xl p-6 shadow-sm;
        }
        
        .btn-primary {
          @apply bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed;
        }
        
        .btn-secondary {
          @apply border-2 border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed;
        }
        
        .input-field {
          @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent;
        }
        
        .spinner {
          @apply w-12 h-12 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin;
        }
      `}</style>
    </>
  );
}