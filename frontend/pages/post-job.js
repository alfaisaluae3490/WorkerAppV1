// frontend/pages/post-job.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  FiUpload, 
  FiX, 
  FiMapPin, 
  FiDollarSign, 
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiArrowLeft
} from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import { jobsAPI, categoriesAPI } from '../utils/apiClient';
import toast from 'react-hot-toast';

export default function PostJob() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    budget_min: '',
    budget_max: '',
    location_address: '',
    city: '',
    province: '',
    preferred_date: '',
    preferred_time: '',
    gender_preference: 'any',
    requires_verification: false,
    requires_insurance: false,
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      if (response.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Categories (fallback if API fails)
  const fallbackCategories = [
    'Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Painting',
    'Gardening', 'Moving', 'AC Repair', 'Appliance Repair', 'Handyman',
    'Locksmith', 'Pest Control', 'Roofing', 'Flooring', 'Masonry'
  ];

  // Pakistan provinces
  const provinces = [
    'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 
    'Gilgit-Baltistan', 'Azad Kashmir', 'Islamabad Capital Territory'
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to post a job');
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setImages([...images, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || formData.title.length < 5) {
      toast.error('Title must be at least 5 characters');
      return;
    }

    if (!formData.description || formData.description.length < 20) {
      toast.error('Description must be at least 20 characters');
      return;
    }

    if (!formData.category_id) {
      toast.error('Please select a category');
      return;
    }

    if (!formData.budget_min || !formData.budget_max) {
      toast.error('Please enter budget range');
      return;
    }

    if (parseInt(formData.budget_min) > parseInt(formData.budget_max)) {
      toast.error('Minimum budget cannot be greater than maximum');
      return;
    }

    if (!formData.location_address || !formData.city || !formData.province) {
      toast.error('Please enter complete location details');
      return;
    }

    // Check for contact info in title/description
    const contactPattern = /(\d{10,}|@[\w]+|whatsapp|email|phone|call|contact)/i;
    if (contactPattern.test(formData.title) || contactPattern.test(formData.description)) {
      toast.error('Please do not include contact information. You can share it after accepting a bid.');
      return;
    }

    setLoading(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null) {
          submitData.append(key, formData[key]);
        }
      });

      // Append images
      images.forEach((image) => {
        submitData.append('images', image);
      });

      // Call API
      const response = await jobsAPI.createJob(submitData);
      
      if (response.success) {
        toast.success('Job posted successfully!');
        router.push('/dashboard/customer');
      }
    } catch (error) {
      toast.error('Failed to post job. Please try again.');
      console.error('Post job error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Post a Job - Services Marketplace</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/">
                <h1 className="text-2xl font-bold text-primary-600 cursor-pointer">
                  Services Marketplace
                </h1>
              </Link>
              <Link href="/dashboard/customer">
                <button className="flex items-center gap-2 text-gray-700 hover:text-primary-600">
                  <FiArrowLeft size={20} />
                  <span>Back to Dashboard</span>
                </button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Post a New Job
            </h1>
            <p className="text-gray-600">
              Describe your project and get competitive bids from verified professionals
            </p>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Privacy & Security</p>
              <p>
                Do not include phone numbers, email addresses, or social media handles in your job post. 
                You can share contact information after accepting a bid.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="card">
            {/* Job Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Kitchen sink plumbing repair"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Be specific and clear (min. 5 characters)
              </p>
            </div>

            {/* Category */}
            <div className="mb-6">
              <label htmlFor="category_id" className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select a category</option>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))
                ) : (
                  fallbackCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))
                )}
              </select>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field min-h-[150px]"
                placeholder="Describe what needs to be done, materials required, timeline, etc. (min. 20 characters)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length} characters
              </p>
            </div>

            {/* Images */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Photos (Optional)
              </label>
              
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {imagePreviews.length < 5 && (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <FiUpload className="text-gray-400 mb-2" size={24} />
                  <span className="text-sm text-gray-600">
                    Click to upload images ({imagePreviews.length}/5)
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PNG, JPG up to 5MB each
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Budget */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Budget Range (PKR) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiDollarSign className="text-gray-400" size={18} />
                    </div>
                    <input
                      type="number"
                      name="budget_min"
                      value={formData.budget_min}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="Minimum"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum budget</p>
                </div>
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiDollarSign className="text-gray-400" size={18} />
                    </div>
                    <input
                      type="number"
                      name="budget_max"
                      value={formData.budget_max}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="Maximum"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Maximum budget</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              
              <div className="space-y-4">
                {/* Address */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMapPin className="text-gray-400" size={18} />
                  </div>
                  <input
                    type="text"
                    name="location_address"
                    value={formData.location_address}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Street address or area"
                    required
                  />
                </div>

                {/* City and Province */}
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="City"
                    required
                  />
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Province</option>
                    {provinces.map((prov) => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Preferred Date & Time */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Preferred Schedule (Optional)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="text-gray-400" size={18} />
                  </div>
                  <input
                    type="date"
                    name="preferred_date"
                    value={formData.preferred_date}
                    onChange={handleChange}
                    className="input-field pl-10"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiClock className="text-gray-400" size={18} />
                  </div>
                  <input
                    type="time"
                    name="preferred_time"
                    value={formData.preferred_time}
                    onChange={handleChange}
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="mb-6 space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Additional Preferences
              </label>
              
              {/* Gender Preference */}
              <div>
                <label className="text-sm text-gray-700">Gender Preference</label>
                <select
                  name="gender_preference"
                  value={formData.gender_preference}
                  onChange={handleChange}
                  className="input-field mt-1"
                >
                  <option value="any">No Preference</option>
                  <option value="male">Male Workers Only</option>
                  <option value="female">Female Workers Only</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="requires_verification"
                    checked={formData.requires_verification}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    Require ID-verified workers only
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="requires_insurance"
                    checked={formData.requires_insurance}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    Require workers with insurance
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner border-2 border-white border-t-transparent w-5 h-5 mx-auto"></div>
                  </>
                ) : (
                  'Post Job & Get Bids'
                )}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-gray-100 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-primary-600">1.</span>
                <span>Your job will be visible to workers in your area</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">2.</span>
                <span>You'll start receiving bids from interested workers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">3.</span>
                <span>Review profiles, ratings, and bid amounts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">4.</span>
                <span>Accept the best bid and start chatting with the worker</span>
              </li>
            </ul>
          </div>
        </main>
      </div>
    </>
  );
}