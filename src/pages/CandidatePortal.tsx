import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { ApplicationStatus, Job } from '../types';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

export default function CandidatePortal() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    fatherHusbandName: '',
    email: '',
    phone: '',
    address: '',
    maritalStatus: 'single',
    dateOfBirth: '',
    role: '',
    qualification: '',
    collegeName: '',
    universityName: '',
    passingYear: '',
    experience: '',
  });

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const q = query(collection(db, 'jobs'), where('active', '==', true));
        const snapshot = await getDocs(q);
        const activeJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
        setJobs(activeJobs);
        if (activeJobs.length > 0 && !formData.role) {
          setFormData(prev => ({ ...prev, role: activeJobs[0].title }));
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
    };
    fetchJobs();
  }, []);

  const scrollToForm = (job: Job) => {
    setSelectedJob(job);
    setFormData(prev => ({ ...prev, role: job.title }));
    document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("File size must be less than 5MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 2 * 1024 * 1024) { // 2MB limit for photo
        toast.error("Photo size must be less than 2MB");
        return;
      }
      setPhoto(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please upload your resume");
      return;
    }
    if (!photo) {
      toast.error("Please upload your photo");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload Resume
      const fileRef = ref(storage, `resumes/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(fileRef, file);
      const resumeUrl = await getDownloadURL(uploadResult.ref);

      // 2. Upload Photo
      const photoRef = ref(storage, `photos/${Date.now()}_${photo.name}`);
      const photoUploadResult = await uploadBytes(photoRef, photo);
      const photoUrl = await getDownloadURL(photoUploadResult.ref);

      // 3. Save to Firestore
      const applicantData = {
        ...formData,
        resumeUrl,
        photoUrl,
        status: ApplicationStatus.APPLIED,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'applicants'), applicantData);
      
      setIsSuccess(true);
      toast.success("Application submitted successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'applicants');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-green-50 text-green-600 border border-green-100 shadow-sm"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <h1 className="mb-4 font-serif text-4xl font-medium tracking-tight">Application Received!</h1>
        <p className="mb-10 text-natural-muted leading-relaxed">
          Thank you for applying to Vendhan InfoTech. We've sent a confirmation email to <strong className="text-natural-text underline decoration-natural-accent">{formData.email}</strong>. Our team will review your profile carefully.
        </p>
        <button 
          onClick={() => setIsSuccess(false)}
          className="rounded-full bg-natural-primary px-10 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-xl shadow-natural-primary/20 transition-all hover:bg-natural-secondary hover:-translate-y-0.5"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="bg-natural-bg">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-20 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 font-serif text-6xl font-medium tracking-tight md:text-7xl"
          >
            Join <span className="italic">Vendhan InfoTech.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto text-lg text-natural-muted max-w-2xl"
          >
            We're building a world-class team at Vendhan InfoTech. Explore our open roles and help us shape the future of technology.
          </motion.p>
        </div>

        {/* Job Board */}
        <div className="mb-24">
          <div className="mb-8 flex items-center justify-between border-b border-natural-border pb-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-muted">Current Openings</h2>
            <span className="text-[10px] font-bold text-natural-primary">{jobs.length} Positions</span>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, idx) => (
              <motion.div 
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group flex flex-col rounded-[32px] border border-natural-border bg-white p-8 transition-all hover:border-natural-primary hover:shadow-2xl hover:shadow-natural-primary/5"
              >
                <div className="mb-4">
                  <span className="rounded-full bg-natural-bg px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-natural-muted">{job.department}</span>
                </div>
                <h3 className="mb-2 font-serif text-2xl font-medium">{job.title}</h3>
                <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-natural-muted">{job.description}</p>
                <button 
                  onClick={() => scrollToForm(job)}
                  className="mt-auto flex items-center justify-between rounded-full border border-natural-accent py-3 pl-6 pr-2 text-[10px] font-bold uppercase tracking-widest transition-all group-hover:bg-natural-primary group-hover:border-natural-primary group-hover:text-natural-bg"
                >
                  Apply Now
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-natural-bg text-natural-primary group-hover:bg-white/20 group-hover:text-white">
                    <ChevronRight size={14} />
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Application Form */}
        <div id="application-form" className="mx-auto max-w-4xl scroll-mt-32 rounded-[48px] border border-natural-border bg-white p-8 md:p-16 shadow-2xl shadow-natural-primary/5">
          <div className="mb-12 text-center">
            <h2 className="mb-2 font-serif text-4xl font-medium tracking-tight">Ready to apply?</h2>
            <p className="text-sm text-natural-muted">
              Applying for: <span className="font-bold text-natural-primary uppercase tracking-wider">{formData.role || 'Select a role below'}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div className="space-y-8">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-natural-muted">Personal Information</h2>
          
          <div className="flex justify-center mb-6">
            <div className={cn(
              "relative flex h-32 w-32 flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all overflow-hidden",
              photo ? "border-natural-primary" : "border-natural-accent hover:border-natural-primary"
            )}>
              <input 
                type="file" 
                accept="image/*"
                className="absolute inset-0 z-10 cursor-pointer opacity-0"
                onChange={handlePhotoChange}
              />
              {photo ? (
                <img src={URL.createObjectURL(photo)} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-center p-2 text-natural-muted">
                  <Upload size={20} className="mb-1 opacity-40" />
                  <span className="text-[9px] font-bold uppercase">Upload Photo</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-natural-muted">Full Name</label>
            <input 
              required
              type="text"
              placeholder="Julian Casablancas"
              className="w-full rounded-[20px] border border-natural-border bg-white px-5 py-4 text-sm transition-all focus:border-natural-primary focus:ring-4 focus:ring-natural-primary/5 outline-hidden"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-natural-muted">Father / Husband's Name</label>
            <input 
              required
              type="text"
              placeholder="John Smith"
              className="w-full rounded-[20px] border border-natural-border bg-white px-5 py-4 text-sm transition-all focus:border-natural-primary focus:ring-4 focus:ring-natural-primary/5 outline-hidden"
              value={formData.fatherHusbandName}
              onChange={e => setFormData({ ...formData, fatherHusbandName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-natural-muted">Date of Birth</label>
              <input 
                required
                type="date"
                className="w-full rounded-[20px] border border-natural-border bg-white px-5 py-4 text-sm transition-all focus:border-natural-primary focus:ring-4 focus:ring-natural-primary/5 outline-hidden"
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-natural-muted">Marital Status</label>
              <select 
                className="w-full rounded-[20px] border border-natural-border bg-white px-5 py-4 text-sm transition-all focus:border-natural-primary focus:ring-4 focus:ring-natural-primary/5 outline-hidden appearance-none"
                value={formData.maritalStatus}
                onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-natural-muted">Email Address</label>
            <input 
              required
              type="email"
              placeholder="julian@viva.com"
              className="w-full rounded-[20px] border border-natural-border bg-white px-5 py-4 text-sm transition-all focus:border-natural-primary focus:ring-4 focus:ring-natural-primary/5 outline-hidden"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-natural-muted">Phone Number</label>
            <input 
              required
              type="tel"
              placeholder="+1 (555) 000-0000"
              className="w-full rounded-[20px] border border-natural-border bg-white px-5 py-4 text-sm transition-all focus:border-natural-primary focus:ring-4 focus:ring-natural-primary/5 outline-hidden"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-natural-muted">Residential Address</label>
            <textarea 
              required
              placeholder="123 Street, City, Country"
              className="w-full rounded-[20px] border border-natural-border bg-white px-5 py-4 text-sm transition-all focus:border-natural-primary focus:ring-4 focus:ring-natural-primary/5 outline-hidden h-24 resize-none"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-natural-muted">Professional Details</h2>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-natural-muted">Role Applying For</label>
            <select 
              className="w-full rounded-[20px] border border-natural-border bg-white px-5 py-4 text-sm transition-all focus:border-natural-primary focus:ring-4 focus:ring-natural-primary/5 outline-hidden appearance-none"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            >
              {jobs.map(job => (
                <option key={job.id} value={job.title}>{job.title}</option>
              ))}
              {jobs.length === 0 && <option value="">No open roles available</option>}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-natural-muted">Qualification</label>
              <input 
                required
                type="text"
                placeholder="B.Tech"
                className="w-full rounded-[20px] border border-natural-border bg-white px-5 py-4 text-sm transition-all focus:border-natural-primary focus:ring-4 focus:ring-natural-primary/5 outline-hidden"
                value={formData.qualification}
                onChange={e => setFormData({ ...formData, qualification: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-natural-muted">Passing Year</label>
              <input 
                required
                type="text"
                placeholder="2022"
                className="w-full rounded-[20px] border border-natural-border bg-white px-5 py-4 text-sm transition-all focus:border-natural-primary focus:ring-4 focus:ring-natural-primary/5 outline-hidden"
                value={formData.passingYear}
                onChange={e => setFormData({ ...formData, passingYear: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-natural-muted">College Name</label>
            <input 
              required
              type="text"
              placeholder="Imperial College London"
              className="w-full rounded-[20px] border border-natural-border bg-white px-5 py-4 text-sm transition-all focus:border-natural-primary focus:ring-4 focus:ring-natural-primary/5 outline-hidden"
              value={formData.collegeName}
              onChange={e => setFormData({ ...formData, collegeName: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-natural-muted">University Name</label>
            <input 
              required
              type="text"
              placeholder="University of London"
              className="w-full rounded-[20px] border border-natural-border bg-white px-5 py-4 text-sm transition-all focus:border-natural-primary focus:ring-4 focus:ring-natural-primary/5 outline-hidden"
              value={formData.universityName}
              onChange={e => setFormData({ ...formData, universityName: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-natural-muted">Years of Experience</label>
            <input 
              required
              type="number"
              placeholder="5"
              className="w-full rounded-[20px] border border-natural-border bg-white px-5 py-4 text-sm transition-all focus:border-natural-primary focus:ring-4 focus:ring-natural-primary/5 outline-hidden"
              value={formData.experience}
              onChange={e => setFormData({ ...formData, experience: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-natural-muted">Resume / CV (PDF)</label>
            <div 
              className={cn(
                "relative flex h-36 w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed transition-all",
                file ? "border-natural-primary bg-natural-bg/50" : "border-natural-accent hover:border-natural-primary hover:bg-natural-surface"
              )}
            >
              <input 
                type="file" 
                accept=".pdf"
                className="absolute inset-0 z-10 cursor-pointer opacity-0"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="flex flex-col items-center text-natural-primary font-medium anim-in fade-in zoom-in duration-300">
                  <FileText size={28} className="mb-2" />
                  <span className="text-xs font-bold uppercase tracking-tight">{file.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-natural-muted">
                  <Upload size={28} className="mb-2 opacity-40" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Drop PDF or click</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 md:col-span-2">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-[24px] bg-natural-primary py-5 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-2xl shadow-natural-primary/40 transition-all hover:bg-natural-secondary hover:-translate-y-1 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing
              </>
            ) : (
              "Submit Application"
            )}
          </button>
          <div className="mt-8 flex justify-center items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-natural-muted/60 bg-natural-accent/20 py-2 rounded-full px-4 mx-auto w-fit">
            <AlertCircle size={12} /> SECURED TRANSMISSION
          </div>
        </div>
      </form>
      </div>
    </section>
    </div>
  );
}
