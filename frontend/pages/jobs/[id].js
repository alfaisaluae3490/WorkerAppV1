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
import { jobsAPI } from '../../utils/apiClient';
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
      // TODO: Call bids API when we build it
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Bid submitted successfully!');
      setShowBidForm(false);
      setBidData({ amount: '', message: '', estimated_duration: '' });
      // Refresh job to show new bid
      fetchJobDetails();
    } catch (error) {
      toast.error('Failed to submit bid');
      console.error('Submit bid error:', error);
    } finally {
      setSubmittingBid(false);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return 'Just now';
  };

  const getJobImages = () => {
    if (!job?.images) return [];
    try {
      const images = typeof job.images === 'string' ? JSON.parse(job.images) : job.images;
      return Array.isArray(images) ? images : [];
    } catch (e) {
      return [];
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job not found</h2>
          <Link href="/browse-jobs">
            <button className="btn-primary mt-4">Browse Jobs</button>
          </Link>
        </div>
      </div>
    );
  }

  const images = getJobImages();

  return (
    <>
      <Head>
        <title>{job.title} - Job Details</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/">
                <h1 className="text-2xl font-bold text-primary-600 cursor-pointer">
                  Services Marketplace
                </h1>
              </Link>
              
              <Link href="/browse-jobs">
                <button className="flex items-center gap-2 text-gray-700 hover:text-primary-600">
                  <FiArrowLeft size={20} />
                  <span>Back to Jobs</span>
                </button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Job Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Header */}
              <div className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {job.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-gray-600">
                      <span className="flex items-center gap-1">
                        <FiMapPin size={18} className="text-primary-600" />
                        {job.city}, {job.province}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiClock size={18} className="text-gray-400" />
                        Posted {getTimeAgo(job.created_at)}
                      </span>
                      {job.bids_count > 0 && (
                        <span className="flex items-center gap-1">
                          <FiMessageSquare size={18} className="text-blue-600" />
                          {job.bids_count} {job.bids_count === 1 ? 'bid' : 'bids'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {job.category_name && (
                    <span className="badge badge-info">
                      {job.category_name}
                    </span>
                  )}
                </div>

                {/* Budget */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <FiDollarSign className="text-green-600" size={20} />
                    <span className="font-semibold text-gray-700">Budget</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    ₨{job.budget_min?.toLocaleString()} - ₨{job.budget_max?.toLocaleString()}
                  </p>
                </div>

                {/* Images */}
                {images.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FiImage size={20} />
                      Job Photos
                    </h3>
                    
                    {/* Main Image */}
                    <div className="mb-4">
                      <img
                        src={images[selectedImage]}
                        alt="Job"
                        className="w-full h-96 object-cover rounded-lg"
                      />
                    </div>

                    {/* Thumbnail Gallery */}
                    {images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Thumbnail ${idx + 1}`}
                            onClick={() => setSelectedImage(idx)}
                            className={`w-20 h-20 object-cover rounded-lg cursor-pointer ${
                              selectedImage === idx ? 'ring-2 ring-primary-600' : 'opacity-70 hover:opacity-100'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Job Description</h3>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Additional Details */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Additional Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {job.preferred_date && (
                      <div className="flex items-start gap-3">
                        <FiCalendar className="text-purple-600 mt-1" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">Preferred Date</p>
                          <p className="text-gray-600">
                            {new Date(job.preferred_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {job.preferred_time && (
                      <div className="flex items-start gap-3">
                        <FiClock className="text-blue-600 mt-1" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">Preferred Time</p>
                          <p className="text-gray-600">{job.preferred_time}</p>
                        </div>
                      </div>
                    )}

                    {job.gender_preference && job.gender_preference !== 'any' && (
                      <div className="flex items-start gap-3">
                        <FiUser className="text-gray-600 mt-1" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">Gender Preference</p>
                          <p className="text-gray-600 capitalize">{job.gender_preference} workers only</p>
                        </div>
                      </div>
                    )}

                    {job.requires_verification && (
                      <div className="flex items-start gap-3">
                        <FiCheckCircle className="text-green-600 mt-1" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">Verification Required</p>
                          <p className="text-gray-600">ID-verified workers only</p>
                        </div>
                      </div>
                    )}

                    {job.requires_insurance && (
                      <div className="flex items-start gap-3">
                        <FiCheckCircle className="text-green-600 mt-1" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">Insurance Required</p>
                          <p className="text-gray-600">Must have insurance</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Customer Info & Bid Form */}
            <div className="lg:col-span-1 space-y-6">
              {/* Customer Info */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Posted By</h3>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <FiUser className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{job.customer_name}</p>
                    {job.customer_rating && (
                      <div className="flex items-center gap-1">
                        <FiStar className="text-yellow-400 fill-current" size={16} />
                        <span className="text-sm text-gray-600">{job.customer_rating} rating</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-2">
                  <p className="flex items-center gap-2">
                    <FiMapPin size={16} />
                    {job.location_address}
                  </p>
                </div>
              </div>

              {/* Bid Form */}
              {!showBidForm ? (
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
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
                        disabled={submittingBid}
                      >
                        {submittingBid ? (
                          <div className="spinner border-2 border-white border-t-transparent w-5 h-5 mx-auto"></div>
                        ) : (
                          'Submit Bid'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Job Stats */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Job Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Bids</span>
                    <span className="font-semibold text-gray-900">{job.bids_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="badge badge-success capitalize">{job.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Posted</span>
                    <span className="font-semibold text-gray-900">{getTimeAgo(job.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}