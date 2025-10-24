// frontend/pages/jobs/[id]/bids.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  FiArrowLeft, 
  FiDollarSign, 
  FiClock,
  FiStar,
  FiCheck,
  FiX,
  FiUser,
  FiBriefcase,
  FiAward,
  FiMapPin
} from 'react-icons/fi';
import { jobsAPI, bidsAPI } from '../../../utils/apiClient';

export default function ViewBids() {
  const router = useRouter();
  const { id } = router.query;

  const [job, setJob] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingBidId, setProcessingBidId] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected

  useEffect(() => {
    if (id) {
      fetchJobAndBids();
    }
  }, [id]);

  const fetchJobAndBids = async () => {
    try {
      setLoading(true);

      // Fetch job details
      const jobResponse = await jobsAPI.getJob(id);
      if (jobResponse.success) {
        setJob(jobResponse.data);
      }

      // Fetch bids
      const bidsResponse = await bidsAPI.getJobBids(id);
      if (bidsResponse.success) {
        setBids(bidsResponse.data);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load bids');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async (bidId) => {
    if (!confirm('Are you sure you want to accept this bid? All other bids will be automatically rejected.')) {
      return;
    }

    try {
      setProcessingBidId(bidId);
      const response = await bidsAPI.acceptBid(bidId);
      
      if (response.success) {
        toast.success('Bid accepted successfully!');
        // Refresh data
        await fetchJobAndBids();
        
        // Redirect to bookings after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/customer');
        }, 2000);
      }
    } catch (error) {
      console.error('Error accepting bid:', error);
      toast.error(error.response?.data?.message || 'Failed to accept bid');
    } finally {
      setProcessingBidId(null);
    }
  };

  const handleRejectBid = async (bidId) => {
    if (!confirm('Are you sure you want to reject this bid?')) {
      return;
    }

    try {
      setProcessingBidId(bidId);
      const response = await bidsAPI.rejectBid(bidId);
      
      if (response.success) {
        toast.success('Bid rejected');
        // Refresh data
        await fetchJobAndBids();
      }
    } catch (error) {
      console.error('Error rejecting bid:', error);
      toast.error(error.response?.data?.message || 'Failed to reject bid');
    } finally {
      setProcessingBidId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBids = bids.filter(bid => {
    if (filter === 'all') return true;
    return bid.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bids...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Job not found</p>
          <Link href="/dashboard/customer" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>View Bids - {job.title} | WorkerApp</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <FiArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Bids Received</h1>
                  <p className="text-sm text-gray-600">{job.title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Job Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Budget</p>
                    <p className="font-semibold text-gray-900">
                      ${job.budget_min} - ${job.budget_max}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="text-gray-900">{job.city}, {job.province}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="text-gray-900">{job.category_name || job.category}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      job.status === 'open' ? 'bg-green-100 text-green-800' :
                      job.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Total Bids</p>
                    <p className="text-2xl font-bold text-blue-600">{bids.length}</p>
                  </div>

                  <div className="pt-4 border-t">
                    <Link href={`/jobs/${id}`} className="text-blue-600 hover:underline text-sm">
                      View Full Job Details →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Bids List */}
            <div className="lg:col-span-2">
              {/* Filter Tabs */}
              <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="border-b">
                  <div className="flex space-x-4 px-6">
                    <button
                      onClick={() => setFilter('all')}
                      className={`py-4 px-2 border-b-2 font-medium text-sm ${
                        filter === 'all'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      All Bids ({bids.length})
                    </button>
                    <button
                      onClick={() => setFilter('pending')}
                      className={`py-4 px-2 border-b-2 font-medium text-sm ${
                        filter === 'pending'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Pending ({bids.filter(b => b.status === 'pending').length})
                    </button>
                    <button
                      onClick={() => setFilter('accepted')}
                      className={`py-4 px-2 border-b-2 font-medium text-sm ${
                        filter === 'accepted'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Accepted ({bids.filter(b => b.status === 'accepted').length})
                    </button>
                    <button
                      onClick={() => setFilter('rejected')}
                      className={`py-4 px-2 border-b-2 font-medium text-sm ${
                        filter === 'rejected'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Rejected ({bids.filter(b => b.status === 'rejected').length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Bids List */}
              {filteredBids.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <FiBriefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No {filter !== 'all' ? filter : ''} bids yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBids.map((bid) => (
                    <div key={bid.id} className="bg-white rounded-lg shadow-sm p-6">
                      {/* Bid Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          {/* Worker Avatar */}
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {bid.worker_name?.charAt(0) || 'W'}
                          </div>

                          {/* Worker Info */}
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900">{bid.worker_name}</h3>
                              {bid.verified && (
                                <FiAward className="w-4 h-4 text-blue-600" title="Verified" />
                              )}
                            </div>
                            
                            {/* Rating */}
                            {bid.rating && (
                              <div className="flex items-center space-x-1 mt-1">
                                <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-medium text-gray-900">
                                  {bid.rating.toFixed(1)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ({bid.total_reviews} reviews)
                                </span>
                              </div>
                            )}

                            {/* Stats */}
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center space-x-1">
                                <FiBriefcase className="w-4 h-4" />
                                <span>{bid.total_jobs_completed || 0} jobs</span>
                              </span>
                              {bid.hourly_rate && (
                                <span>${bid.hourly_rate}/hr</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bid Status Badge */}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(bid.status)}`}>
                          {bid.status}
                        </span>
                      </div>

                      {/* Bid Amount */}
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Bid Amount</p>
                            <p className="text-3xl font-bold text-blue-600">${bid.bid_amount}</p>
                          </div>
                          {bid.estimated_duration && (
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Estimated Duration</p>
                              <p className="font-medium text-gray-900">{bid.estimated_duration}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Proposal */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Proposal:</p>
                        <p className="text-gray-600 whitespace-pre-line">{bid.proposal}</p>
                      </div>

                      {/* Worker Bio */}
                      {bid.bio && (
                        <div className="mb-4 pb-4 border-b">
                          <p className="text-sm font-medium text-gray-700 mb-2">About the Worker:</p>
                          <p className="text-sm text-gray-600">{bid.bio}</p>
                        </div>
                      )}

                      {/* Bid Time */}
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                        <FiClock className="w-4 h-4" />
                        <span>
                          Placed {new Date(bid.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      {bid.status === 'pending' && job.status === 'open' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleAcceptBid(bid.id)}
                            disabled={processingBidId === bid.id}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            <FiCheck className="w-5 h-5" />
                            <span>{processingBidId === bid.id ? 'Accepting...' : 'Accept Bid'}</span>
                          </button>
                          <button
                            onClick={() => handleRejectBid(bid.id)}
                            disabled={processingBidId === bid.id}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            <FiX className="w-5 h-5" />
                            <span>{processingBidId === bid.id ? 'Rejecting...' : 'Reject'}</span>
                          </button>
                        </div>
                      )}

                      {bid.status === 'accepted' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                          <p className="text-green-800 font-medium">✓ You accepted this bid</p>
                          <p className="text-sm text-green-600 mt-1">
                            A booking has been created. Check your bookings page.
                          </p>
                        </div>
                      )}

                      {bid.status === 'rejected' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                          <p className="text-red-800">You rejected this bid</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}