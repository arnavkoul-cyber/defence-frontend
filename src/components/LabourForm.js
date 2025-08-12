import React, { useState, useEffect } from 'react';
import { User, UserCheck, Building, Phone, CreditCard, Camera, X, CheckCircle } from 'lucide-react';
import Header from './Header';
import api from '../api/api';
import Footer from './footer';
import { toast } from 'react-toastify';

function LabourForm() {
  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    sector_id: '',
    contact_number: '',
  aadhaar_number: '',
  bank_name: '',
  bank_account_no: '',
  bank_ifsc_code: '',
  adhar_path: '',
  });

  const [sectors, setSectors] = useState([]);

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const response = await api.get('/dynamic/sectors');
        setSectors(response.data.data || []);
      } catch (err) {
        setSectors([]);
      }
    };
    fetchSectors();
  }, []);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  // Camera logic
  const handleOpenCamera = async () => {
    setShowCamera(true);
    setTimeout(async () => {
      if (videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoRef.current.srcObject = stream;
        } catch (err) {
          alert('Camera access denied');
        }
      }
    }, 100);
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedPhoto(dataUrl);
      // Stop camera
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }
      setShowCamera(false);
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required.';
    if (!formData.father_name.trim()) newErrors.father_name = 'Father name is required.';
    if (!formData.sector_id) newErrors.sector_id = 'Sector selection is required.';
    if (!formData.contact_number.trim()) {
      newErrors.contact_number = 'Contact number is required.';
    } else if (!/^\d{10}$/.test(formData.contact_number.trim())) {
      newErrors.contact_number = 'Contact number must be 10 digits.';
    }
    if (!formData.aadhaar_number.trim()) {
      newErrors.aadhaar_number = 'Aadhaar number is required.';
    } else if (!/^\d{12}$/.test(formData.aadhaar_number.trim())) {
      newErrors.aadhaar_number = 'Aadhaar number must be 12 digits.';
    }
    if (!capturedPhoto) newErrors.capturedPhoto = 'Photo capture is required.';

    // If bank details form is shown, validate those too
    if (showBankForm) {
      if (!formData.bank_name.trim()) newErrors.bank_name = 'Bank name is required.';
      if (!formData.bank_account_no.trim()) newErrors.bank_account_no = 'Account number is required.';
      else if (!/^\d{6,18}$/.test(formData.bank_account_no.trim())) newErrors.bank_account_no = 'Enter a valid account number.';
      if (!formData.bank_ifsc_code.trim()) newErrors.bank_ifsc_code = 'IFSC code is required.';
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(formData.bank_ifsc_code.trim())) newErrors.bank_ifsc_code = 'Enter a valid IFSC code.';
      if (!formData.adhar_path) newErrors.adhar_path = 'Aadhaar image is required.';
    }
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSectorChange = (selectedValue) => {
    setFormData({ ...formData, sector_id: selectedValue });
    setErrors({ ...errors, sector_id: undefined });
  };

  // Check if base labour form is complete (for enabling the bank step)
  const isLabourFormComplete = () => {
    const contactOk = /^\d{10}$/.test((formData.contact_number || '').trim());
    const aadhaarOk = /^\d{12}$/.test((formData.aadhaar_number || '').trim());
    return Boolean(
      (formData.name || '').trim() &&
      (formData.father_name || '').trim() &&
      (formData.sector_id || '') &&
      contactOk &&
      aadhaarOk &&
      capturedPhoto
    );
  };

  const handleAadharFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, adhar_path: reader.result }));
      setErrors((prev) => ({ ...prev, adhar_path: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      // Prepare payload
      const payload = {
        name: formData.name,
        father_name: formData.father_name,
        sector_id: formData.sector_id,
        contact_number: formData.contact_number,
        aadhaar_number: formData.aadhaar_number,
        photo: capturedPhoto, // base64 image
        // Bank details (as requested keys)
        bank_name: formData.bank_name || undefined,
        bank_account_no: formData.bank_account_no || undefined,
        bank_ifsc_code: formData.bank_ifsc_code || undefined,
        adhar_path: formData.adhar_path || undefined,
      };
 
      const response = await api.post('/labour/register', payload);
 toast.success('Labour registered successfully!', { position: 'top-center', autoClose: 2500 });
   
      
        setFormData({
          name: '',
          father_name: '',
          sector_id: '',
          contact_number: '',
          aadhaar_number: '',
          bank_name: '',
          bank_account_no: '',
          bank_ifsc_code: '',
          adhar_path: '',
        });
        setCapturedPhoto(null);
        setShowBankForm(false);
        setErrors({});
      
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Error registering labour');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background image with blur and dark overlay */}
      <img src={require('../assets/labour_pic.jpg')} alt="Background" className="absolute inset-0 w-full h-full object-cover scale-105" />
      <div className="absolute inset-0 bg-black/40" aria-hidden="true"></div>
      <div className="absolute inset-0 backdrop-blur-sm" aria-hidden="true"></div>

      {/* Content */}
      <div className="relative flex flex-col min-h-screen">
        <Header variant="glass" />

        {/* Main Content Area with proper spacing */}
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 pb-28">
          <div className="max-w-3xl mx-auto mb-12">
            {/* Form Container */}
            <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-blue-500/90 to-blue-400/80 px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <UserCheck className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Labour Registration</h2>
                    <p className="text-blue-100 mt-1">Complete your registration to join our workforce</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Form Content */}
              <div className="max-h-[420px] md:max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-white/10">
                <div className="p-8 space-y-6">
                  {/* Row 1: Name and Father Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <User className="w-4 h-4 text-blue-600" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 ${
                          errors.name ? 'border-red-400 bg-red-50' : 'border-white/50 md:border-gray-200 focus:border-blue-300'
                        } bg-white/70 md:bg-white placeholder:text-gray-400`}
                        placeholder="Enter your full name"
                      />
                      {errors.name && <p className="text-red-500 text-sm flex items-center gap-1"><X className="w-4 h-4" />{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <User className="w-4 h-4 text-blue-600" />
                        Father's Name
                      </label>
                      <input
                        type="text"
                        name="father_name"
                        value={formData.father_name}
                        onChange={handleChange}
                        className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 ${
                          errors.father_name ? 'border-red-400 bg-red-50' : 'border-white/50 md:border-gray-200 focus:border-blue-300'
                        } bg-white/70 md:bg-white placeholder:text-gray-400`}
                        placeholder="Enter father's name"
                      />
                      {errors.father_name && <p className="text-red-500 text-sm flex items-center gap-1"><X className="w-4 h-4" />{errors.father_name}</p>}
                    </div>
                  </div>

                  {/* Row 2: Sector and Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Building className="w-4 h-4 text-blue-600" />
                        Work Sector
                      </label>
                      <div className="relative">
                        <select
                          name="sector_id"
                          value={formData.sector_id}
                          onChange={(e) => handleSectorChange(e.target.value)}
                          className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 ${
                            errors.sector_id ? 'border-red-400 bg-red-50' : 'border-white/50 md:border-gray-200 focus:border-blue-300'
                          } bg-white/70 md:bg-white text-gray-700 appearance-none`}
                        >
                          <option value="">Select your work sector</option>
                          {sectors.map(sector => (
                            <option key={sector.id} value={sector.id}>{sector.name}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                      {errors.sector_id && <p className="text-red-500 text-sm flex items-center gap-1"><X className="w-4 h-4" />{errors.sector_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Phone className="w-4 h-4 text-blue-600" />
                        Contact Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="contact_number"
                          value={formData.contact_number}
                          onChange={handleChange}
                          className={`w-full p-4 pl-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 ${
                            errors.contact_number ? 'border-red-400 bg-red-50' : 'border-white/50 md:border-gray-200 focus:border-blue-300'
                          } bg-white/70 md:bg-white placeholder:text-gray-400`}
                          placeholder="10-digit mobile number"
                          maxLength={10}
                        />
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                      </div>
                      {formData.contact_number && formData.contact_number.length !== 10 && (
                        <p className="text-amber-600 text-sm">Please enter a complete 10-digit number</p>
                      )}
                      {errors.contact_number && <p className="text-red-500 text-sm flex items-center gap-1"><X className="w-4 h-4" />{errors.contact_number}</p>}
                    </div>
                  </div>

                  {/* Row 3: Aadhaar Number */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      Aadhaar Number
                    </label>
                    <div className="relative max-w-md">
                      <input
                        type="text"
                        name="aadhaar_number"
                        value={formData.aadhaar_number}
                        onChange={handleChange}
                        className={`w-full p-4 pl-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 ${
                          errors.aadhaar_number ? 'border-red-400 bg-red-50' : 'border-white/50 md:border-gray-200 focus:border-blue-300'
                        } bg-white/70 md:bg-white placeholder:text-gray-400`}
                        placeholder="12-digit Aadhaar number"
                        maxLength={12}
                      />
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                    </div>
                    {formData.aadhaar_number && formData.aadhaar_number.length !== 12 && (
                      <p className="text-amber-600 text-sm">Please enter a complete 12-digit number</p>
                    )}
                    {errors.aadhaar_number && <p className="text-red-500 text-sm flex items-center gap-1"><X className="w-4 h-4" />{errors.aadhaar_number}</p>}
                  </div>

                  {/* Photo Capture Section */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Camera className="w-4 h-4 text-blue-600" />
                      Photo Capture (Required)
                    </label>

                    <div className="bg-white/60 rounded-xl p-6 border-2 border-dashed border-white/40">
                      {!showCamera && !capturedPhoto && (
                        <div className="text-center">
                          <div className="w-14 h-14 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                            <Camera className="w-6 h-6 text-blue-600" />
                          </div>
                          <button
                            type="button"
                            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center gap-2 mx-auto"
                            onClick={handleOpenCamera}
                          >
                            <Camera className="w-4 h-4" />
                            Open Camera
                          </button>
                          <p className="text-xs text-gray-600 mt-1">Click to capture your photo</p>
                        </div>
                      )}

                      {showCamera && (
                        <div className="text-center space-y-4">
                          <video ref={videoRef} autoPlay className="rounded-xl border-4 border-white shadow-lg w-full max-w-sm mx-auto h-64 object-cover" />
                          <div className="flex justify-center gap-4">
                            <button type="button" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center gap-2" onClick={handleCapturePhoto}>
                              <CheckCircle className="w-5 h-5" />
                              Capture Photo
                            </button>
                            <button type="button" className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center gap-2" onClick={handleCloseCamera}>
                              <X className="w-5 h-5" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {capturedPhoto && (
                        <div className="text-center space-y-4">
                          <div className="relative inline-block">
                            <img src={capturedPhoto} alt="Captured Photo" className="rounded-xl border-4 border-white shadow-lg w-32 h-24 object-cover mx-auto" />
                            <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="flex justify-center gap-4">
                            <span className="text-green-600 font-semibold flex items-center gap-2">
                              <CheckCircle className="w-5 h-5" />
                              Photo captured successfully!
                            </span>
                            <button type="button" onClick={() => setCapturedPhoto(null)} className="text-blue-600 hover:text-blue-800 font-semibold underline">
                              Retake Photo
                            </button>
                          </div>
                        </div>
                      )}

                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </div>

                    {errors.capturedPhoto && <p className="text-red-500 text-sm flex items-center gap-1"><X className="w-4 h-4" />{errors.capturedPhoto}</p>}
                  </div>

                  {/* Bank Details Section (shown after photo) */}
                  {!showBankForm && (
                    <div className="pt-6">
                      <button
                        type="button"
                        onClick={() => isLabourFormComplete() && setShowBankForm(true)}
                        disabled={!isLabourFormComplete()}
                        className={`w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] ${!isLabourFormComplete() ? 'opacity-60 cursor-not-allowed hover:from-emerald-600 hover:to-emerald-500' : ''}`}
                      >
                        Add Bank Details
                      </button>
                      {!isLabourFormComplete() && (
                        <p className="text-sm text-gray-600 mt-2 text-center">Complete Labour details and capture photo to continue</p>
                      )}
                    </div>
                  )}

                  {showBankForm && (
                    <div className="mt-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Bank Name</label>
                          <input
                            type="text"
                            name="bank_name"
                            value={formData.bank_name}
                            onChange={handleChange}
                            className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 ${errors.bank_name ? 'border-red-400 bg-red-50' : 'border-white/50 md:border-gray-200'}`}
                            placeholder="e.g., J&K Bank"
                          />
                          {errors.bank_name && <p className="text-red-500 text-sm">{errors.bank_name}</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Account Number</label>
                          <input
                            type="text"
                            name="bank_account_no"
                            value={formData.bank_account_no}
                            onChange={handleChange}
                            className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 ${errors.bank_account_no ? 'border-red-400 bg-red-50' : 'border-white/50 md:border-gray-200'}`}
                            placeholder="Enter account number"
                          />
                          {errors.bank_account_no && <p className="text-red-500 text-sm">{errors.bank_account_no}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">IFSC Code</label>
                          <input
                            type="text"
                            name="bank_ifsc_code"
                            value={formData.bank_ifsc_code}
                            onChange={handleChange}
                            className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 uppercase ${errors.bank_ifsc_code ? 'border-red-400 bg-red-50' : 'border-white/50 md:border-gray-200'}`}
                            placeholder="e.g., JAKA0XXXXXX"
                          />
                          {errors.bank_ifsc_code && <p className="text-red-500 text-sm">{errors.bank_ifsc_code}</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Upload Aadhaar Image</label>
                          <input type="file" accept="image/*" onChange={handleAadharFile} className="w-full p-3 border-2 rounded-xl bg-white/70 md:bg-white" />
                          {errors.adhar_path && <p className="text-red-500 text-sm">{errors.adhar_path}</p>}
                          {formData.adhar_path && (
                            <img src={formData.adhar_path} alt="Aadhaar Preview" className="mt-2 w-40 h-28 object-cover rounded-md border" />
                          )}
                        </div>
                      </div>

                      {/* Submit after bank details */}
                      <div className="pt-2">
                        <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02]" disabled={submitting}>
                          {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              Submitting...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <CheckCircle className="w-5 h-5" />
                              Submit Registration
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </main>

        <Footer variant="glass" />
      </div>
    </div>
  );
}

export default LabourForm;