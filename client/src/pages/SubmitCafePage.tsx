import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, 
  MapPin, 
  Phone, 
  Plus, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Camera, 
  Info,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cafeSubmissionService, CreateSubmissionData } from '../services/cafeSubmissionService';
import { cafeService } from '../services/cafeService';
import { Amenity } from '../types';
import { useAuth } from '../contexts/AuthContext';

const STEPS = [
  { id: 'basic', title: 'Basic Info', icon: Coffee },
  { id: 'location', title: 'Location', icon: MapPin },
  { id: 'contact', title: 'Contact & Social', icon: Phone },
  { id: 'amenities', title: 'Amenities', icon: Plus },
  { id: 'photos', title: 'Photos', icon: Camera },
  { id: 'review', title: 'Review', icon: Check },
];

export default function SubmitCafePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [fetchingAmenities, setFetchingAmenities] = useState(true);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<{ id: string, url: string }[]>([]);

  const [formData, setFormData] = useState<CreateSubmissionData>({
    name: '',
    shortDescription: '',
    description: '',
    address: '',
    city: 'Davao City',
    country: 'Philippines',
    priceRange: 2,
    amenityIds: [],
  });

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/submit-cafe');
      return;
    }

    const loadAmenities = async () => {
      try {
        const response = await cafeService.getAmenities();
        setAmenities(response.data);
      } catch (err) {
        console.error('Failed to load amenities:', err);
      } finally {
        setFetchingAmenities(false);
      }
    };

    loadAmenities();
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'priceRange' ? parseInt(value) : value
    }));
  };

  const handleAmenityToggle = (amenityId: string) => {
    setFormData(prev => {
      const current = prev.amenityIds || [];
      const updated = current.includes(amenityId)
        ? current.filter(id => id !== amenityId)
        : [...current, amenityId];
      return { ...prev, amenityIds: updated };
    });
  };

  const validateStep = () => {
    setError(null);
    if (currentStep === 0) {
      if (!formData.name.trim()) return "Cafe name is required";
      if (!formData.shortDescription.trim()) return "Short description is required";
      if (formData.shortDescription.length < 10) return "Short description must be at least 10 characters";
    }
    if (currentStep === 1) {
      if (!formData.address.trim()) return "Address is required";
      if (!formData.city.trim()) return "City is required";
    }
    return null;
  };

  const handleNext = async () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (currentStep === STEPS.length - 1) {
      handleSubmit();
      return;
    }

    // If moving from step 1 (Basic Info) or 2 (Location), we could optionally save draft
    // But for simplicity, we just move forward and submit at the end.
    setCurrentStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cafeSubmissionService.createSubmission(formData);
      setSubmissionId(response.data.id);
      // Move to success step or just navigate
      navigate('/my-submissions', { state: { success: true, message: 'Cafe submitted successfully! It is now pending review.' } });
    } catch (err: any) {
      setError(err.message || 'Failed to submit cafe');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !submissionId) return;
    
    setLoading(true);
    try {
      const file = e.target.files[0];
      const response = await cafeSubmissionService.uploadPhoto(submissionId, file);
      setPhotos(prev => [...prev, response.data]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Cafe Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., The Roastery Davao"
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Short Description (Elevator Pitch)</label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                placeholder="e.g., Cozy specialty coffee shop in the heart of Davao."
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Full Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Tell us more about the cafe, the vibe, the beans..."
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Price Range</label>
              <div className="flex gap-4">
                {[1, 2, 3, 4].map((price) => (
                  <button
                    key={price}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priceRange: price }))}
                    className={`flex-1 py-2 rounded-lg border transition-all ${
                      formData.priceRange === price
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-amber-200'
                    }`}
                  >
                    {'$'.repeat(price)}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Street Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g., 123 Rizal Street"
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode || ''}
                  onChange={handleChange}
                  placeholder="8000"
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex gap-3">
              <Info className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-800">
                Coordinates are optional. Our team will verify the location before publishing.
              </p>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  placeholder="+63 912 345 6789"
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  placeholder="hello@cafe.com"
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website || ''}
                onChange={handleChange}
                placeholder="https://www.cafe.com"
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Instagram URL</label>
              <input
                type="url"
                name="instagram"
                value={formData.instagram || ''}
                onChange={handleChange}
                placeholder="https://instagram.com/cafe"
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              />
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
          >
            {fetchingAmenities ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.map((amenity) => (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => handleAmenityToggle(amenity.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left ${
                      formData.amenityIds?.includes(amenity.id)
                        ? 'bg-amber-50 border-amber-500 text-amber-700'
                        : 'bg-white border-neutral-200 text-neutral-600 hover:border-amber-200'
                    }`}
                  >
                    <div className="w-4 h-4 rounded border flex items-center justify-center border-current">
                      {formData.amenityIds?.includes(amenity.id) && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-sm truncate">{amenity.name}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-6"
          >
            <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100 flex flex-col items-center justify-center text-center space-y-4">
              <Camera className="w-12 h-12 text-neutral-400" />
              <div>
                <h3 className="font-medium text-neutral-900">Add photos later</h3>
                <p className="text-sm text-neutral-500 max-w-xs">
                  For this stage, you can submit the cafe details first. Photos can be added after the submission is created.
                </p>
              </div>
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-6"
          >
            <div className="bg-neutral-50 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-neutral-900">{formData.name || 'Untitled Cafe'}</h3>
                  <p className="text-neutral-500 text-sm">{formData.address}, {formData.city}</p>
                </div>
                <div className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded">
                  {'$'.repeat(formData.priceRange || 2)}
                </div>
              </div>
              
              <div className="border-t border-neutral-200 pt-4">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-neutral-600 text-sm line-clamp-3">{formData.shortDescription}</p>
              </div>

              <div className="border-t border-neutral-200 pt-4">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Selected Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.amenityIds?.length ? (
                    formData.amenityIds.map(id => {
                      const amenity = amenities.find(a => a.id === id);
                      return amenity ? (
                        <span key={id} className="bg-white border border-neutral-200 px-2 py-1 rounded text-xs text-neutral-600">
                          {amenity.name}
                        </span>
                      ) : null;
                    })
                  ) : (
                    <span className="text-neutral-400 text-xs italic">No amenities selected</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-sm text-blue-800">
                Your submission will be reviewed by an admin. You can track the status in your dashboard.
              </p>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-neutral-100 bg-neutral-50/50">
            <h1 className="text-2xl font-bold text-neutral-900">Submit a Cafe</h1>
            <p className="text-neutral-500 text-sm mt-1">Share your favorite coffee spot with the Davao community.</p>
          </div>

          {/* Stepper */}
          <div className="px-8 pt-8">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-neutral-100 -z-0">
                <motion.div 
                  className="h-full bg-amber-500" 
                  initial={{ width: '0%' }}
                  animate={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                />
              </div>

              {STEPS.map((step, index) => (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 ${
                    index <= currentStep 
                      ? 'bg-amber-500 border-amber-500 text-white' 
                      : 'bg-white border-neutral-200 text-neutral-400'
                  }`}>
                    {index < currentStep ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${
                    index <= currentStep ? 'text-neutral-900' : 'text-neutral-400'
                  } hidden sm:block`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Area */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Actions */}
            <div className="mt-12 flex items-center justify-between gap-4 border-t border-neutral-100 pt-8">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 0 || loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-200 transition-all disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    {currentStep === STEPS.length - 1 ? 'Submit for Review' : 'Next Step'}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        <p className="text-center text-neutral-400 text-xs mt-8">
          By submitting, you agree to our community guidelines and terms of service.
        </p>
      </div>
    </div>
  );
}
