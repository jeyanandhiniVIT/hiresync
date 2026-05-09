import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, deleteDoc, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Applicant, ApplicationStatus, Job } from '../types';
import { format } from 'date-fns';
import { 
  Search, Filter, Eye, Trash2, Calendar, 
  CheckCircle, XCircle, Clock, Download, 
  MessageSquare, ChevronRight, User, Mail, Phone,
  GraduationCap, Briefcase, LogOut, ChevronUp, ChevronDown,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const [view, setView] = useState<'applicants' | 'jobs'>('applicants');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<keyof Applicant>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showJobModal, setShowJobModal] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', department: '', description: '', requirements: '' });
  const { logout } = useAuth();

  useEffect(() => {
    const qA = query(collection(db, 'applicants'), orderBy('createdAt', 'desc'));
    const unsubscribeA = onSnapshot(qA, (snapshot) => {
      setApplicants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Applicant)));
      setLoading(false);
    });

    const qJ = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const unsubscribeJ = onSnapshot(qJ, (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
    });

    return () => { unsubscribeA(); unsubscribeJ(); };
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'jobs'), {
        ...newJob,
        active: true,
        createdAt: new Date().toISOString()
      });
      setShowJobModal(false);
      setNewJob({ title: '', department: '', description: '', requirements: '' });
      toast.success("Job posting created");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'jobs');
    }
  };

  const toggleJobStatus = async (id: string, active: boolean) => {
    try {
      await updateDoc(doc(db, 'jobs', id), { active: !active });
      toast.success(`Job ${!active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `jobs/${id}`);
    }
  };

  const roles = ['All', ...Array.from(new Set(applicants.map(a => a.role)))];
  const statuses = ['All', ...Object.values(ApplicationStatus)];

  const filteredApplicants = applicants.filter(a => {
    const matchesSearch = a.fullName.toLowerCase().includes(search.toLowerCase()) || 
                          a.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'All' || a.role === filterRole;
    const matchesStatus = filterStatus === 'All' || a.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUpdateStatus = async (id: string, newStatus: ApplicationStatus) => {
    try {
      await updateDoc(doc(db, 'applicants', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applicants/${id}`);
    }
  };

  const handleBulkUpdateStatus = async (newStatus: ApplicationStatus) => {
    if (selectedIds.length === 0) return;
    const toastId = toast.loading(`Updating ${selectedIds.length} applicants...`);
    try {
      await Promise.all(selectedIds.map(id => 
        updateDoc(doc(db, 'applicants', id), {
          status: newStatus,
          updatedAt: serverTimestamp()
        })
      ));
      toast.success(`Updated ${selectedIds.length} applicants to ${newStatus}`, { id: toastId });
      setSelectedIds([]);
    } catch (error) {
      toast.error("Failed to update some applicants", { id: toastId });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} applications?`)) return;
    
    const toastId = toast.loading(`Deleting ${selectedIds.length} applications...`);
    try {
      await Promise.all(selectedIds.map(id => deleteDoc(doc(db, 'applicants', id))));
      toast.success(`Deleted ${selectedIds.length} applications`, { id: toastId });
      setSelectedIds([]);
      if (selectedApplicant && selectedIds.includes(selectedApplicant.id)) setSelectedApplicant(null);
    } catch (error) {
      toast.error("Failed to delete some applications", { id: toastId });
    }
  };

  const handleBulkEmail = () => {
    if (selectedIds.length === 0) return;
    const recipients = applicants
      .filter(a => selectedIds.includes(a.id))
      .map(a => a.email)
      .join(',');
    window.location.href = `mailto:?bcc=${recipients}`;
  };

  const handleSort = (field: keyof Applicant) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredApplicants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredApplicants.map(a => a.id));
    }
  };

  const toggleSelectOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const sortedApplicants = [...filteredApplicants].sort((a, b) => {
    let valA = a[sortBy] ?? '';
    let valB = b[sortBy] ?? '';

    if (typeof valA === 'string' && typeof valB === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleAddRemark = async (id: string, remark: string) => {
    try {
      await updateDoc(doc(db, 'applicants', id), {
        interviewRemarks: remark,
        updatedAt: serverTimestamp()
      });
      toast.success("Remark added");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applicants/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try {
      await deleteDoc(doc(db, 'applicants', id));
      toast.success("Application deleted");
      if (selectedApplicant?.id === id) setSelectedApplicant(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `applicants/${id}`);
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.APPLIED: return "bg-gray-100 text-gray-500 border-gray-200";
      case ApplicationStatus.SHORT_LISTED: return "bg-green-50 text-green-700 border-green-100";
      case ApplicationStatus.INTERVIEWED: return "bg-blue-50 text-blue-700 border-blue-100";
      case ApplicationStatus.HIRED: return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case ApplicationStatus.REJECTED: return "bg-orange-50 text-orange-700 border-orange-100";
      default: return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-natural-bg">
      {/* Sidebar - Matching Natural Tones */}
      <nav className="hidden w-64 flex-col bg-natural-primary p-8 text-natural-bg md:flex">
        <div className="mb-12">
          <h1 className="font-serif text-2xl italic tracking-tight">Vendhan Hire</h1>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-60">Recruitment Suite</p>
        </div>
        
        <div className="flex-1 space-y-8">
          <div className="space-y-2">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Main Menu</p>
            <button 
              onClick={() => setView('applicants')}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl p-3 text-sm font-medium transition-all",
                view === 'applicants' ? "bg-white/10" : "opacity-70 hover:opacity-100"
              )}
            >
              <User size={16} /> Applicants
            </button>
            <button 
              onClick={() => setView('jobs')}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl p-3 text-sm font-medium transition-all",
                view === 'jobs' ? "bg-white/10" : "opacity-70 hover:opacity-100"
              )}
            >
              <Briefcase size={16} /> Job Roles
            </button>
          </div>
        </div>

        <div className="mt-auto rounded-3xl bg-natural-secondary p-4">
          <p className="mb-1 text-[10px] font-bold uppercase opacity-70">Admin System</p>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-sm font-medium text-white hover:underline"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-20 items-center justify-between border-b border-natural-border bg-white px-8">
          <div>
            <h2 className="font-serif text-2xl font-medium">{view === 'applicants' ? 'Candidate Pipeline' : 'Job Management'}</h2>
            <p className="text-xs text-natural-muted">
              {view === 'applicants' ? `Managing ${applicants.length} active applications` : `Managing ${jobs.length} open roles`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {view === 'applicants' && (
              <div className="relative hidden sm:block">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-natural-muted" />
                <input 
                  type="text" 
                  placeholder="Search applicants..."
                  className="w-64 rounded-full border-none bg-natural-bg px-10 py-2.5 text-sm ring-natural-primary focus:ring-2 outline-hidden transition-all"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            )}
            <button 
              onClick={() => setShowJobModal(true)}
              className="rounded-full bg-natural-primary px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-medium text-white transition-all hover:bg-natural-secondary shadow-md"
            >
              New Role
            </button>
            <button 
              onClick={logout}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all shadow-sm"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-8 mb-8">
          {[
            { label: 'Total Applicants', value: applicants.length, icon: User },
            { label: 'Shortlisted', value: applicants.filter(a => a.status === ApplicationStatus.SHORT_LISTED).length, icon: CheckCircle },
            { label: 'Interviews', value: applicants.filter(a => a.status === ApplicationStatus.INTERVIEWED).length, icon: Calendar },
            { label: 'Job Roles', value: jobs.length, icon: Briefcase },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-natural-border p-6 rounded-[24px] shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-natural-bg rounded-xl">
                  <stat.icon size={16} className="text-natural-primary" />
                </div>
              </div>
              <p className="text-2xl font-serif font-medium">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        {view === 'applicants' ? (
          <>
            {/* Filters Bar */}
            <div className="flex h-16 items-center gap-6 border-b border-natural-border bg-natural-surface px-8">
              <span className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">Filter by:</span>
              <select 
                className="rounded-full border border-natural-accent bg-transparent px-4 py-1.5 text-xs outline-hidden"
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select 
                className="rounded-full border border-natural-accent bg-transparent px-4 py-1.5 text-xs outline-hidden"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="grid flex-1 grid-cols-12 gap-8 overflow-hidden p-8">
              {/* List Section */}
              <div className="col-span-12 overflow-y-auto lg:col-span-8">
                <div className="overflow-hidden rounded-[32px] border border-natural-border bg-white shadow-sm">
                  <table className="w-full text-left">
                    <thead className="border-b border-natural-border bg-natural-surface">
                      <tr>
                        <th className="px-6 py-5 w-12">
                          <button 
                            onClick={toggleSelectAll}
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded border transition-all",
                              selectedIds.length === filteredApplicants.length && filteredApplicants.length > 0
                                ? "bg-natural-primary border-natural-primary text-white"
                                : "border-natural-muted hover:border-natural-primary"
                            )}
                          >
                            {selectedIds.length === filteredApplicants.length && filteredApplicants.length > 0 && <Check size={12} />}
                          </button>
                        </th>
                        <th 
                          onClick={() => handleSort('fullName')}
                          className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-natural-muted cursor-pointer hover:text-natural-primary"
                        >
                          <div className="flex items-center gap-1">
                            Candidate
                            {sortBy === 'fullName' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('role')}
                          className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-natural-muted cursor-pointer hover:text-natural-primary"
                        >
                          <div className="flex items-center gap-1">
                            Role
                            {sortBy === 'role' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('createdAt')}
                          className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-natural-muted cursor-pointer hover:text-natural-primary"
                        >
                          <div className="flex items-center gap-1">
                            Added
                            {sortBy === 'createdAt' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('status')}
                          className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-natural-muted text-right cursor-pointer hover:text-natural-primary"
                        >
                          <div className="flex items-center justify-end gap-1">
                            Status
                            {sortBy === 'status' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-natural-bg">
                      {loading ? (
                        <tr><td colSpan={5} className="p-12 text-center text-natural-muted italic">Syncing with database...</td></tr>
                      ) : sortedApplicants.length === 0 ? (
                        <tr><td colSpan={5} className="p-12 text-center text-natural-muted italic">No candidates found matching criteria.</td></tr>
                      ) : sortedApplicants.map((applicant) => (
                        <tr 
                          key={applicant.id}
                          onClick={() => setSelectedApplicant(applicant)}
                          className={cn(
                            "group cursor-pointer transition-colors hover:bg-natural-bg",
                            selectedApplicant?.id === applicant.id ? "bg-natural-bg border-l-4 border-natural-primary" : "",
                            selectedIds.includes(applicant.id) ? "bg-natural-primary/5" : ""
                          )}
                        >
                          <td className="px-6 py-5" onClick={(e) => toggleSelectOne(e, applicant.id)}>
                            <button 
                              className={cn(
                                "flex h-5 w-5 items-center justify-center rounded border transition-all",
                                selectedIds.includes(applicant.id)
                                  ? "bg-natural-primary border-natural-primary text-white"
                                  : "border-natural-muted group-hover:border-natural-primary"
                              )}
                            >
                              {selectedIds.includes(applicant.id) && <Check size={12} />}
                            </button>
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-bold text-natural-text">{applicant.fullName}</div>
                            <div className="text-[11px] text-natural-muted font-medium">{applicant.email}</div>
                          </td>
                          <td className="px-6 py-5 text-sm text-natural-muted">{applicant.role}</td>
                          <td className="px-6 py-5 text-sm italic text-natural-muted">{format(new Date(applicant.createdAt), 'MMM d')}</td>
                          <td className="px-6 py-5 text-right">
                            <span className={cn(
                              "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-xs",
                              getStatusColor(applicant.status)
                            )}>
                              {applicant.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Profile Detail Side Panel */}
              <div className="hidden lg:col-span-4 lg:flex flex-col bg-white rounded-[32px] border border-natural-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                {selectedApplicant ? (
                  <>
                    <div className="p-8 border-b border-natural-bg text-center">
                      <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-[32px] bg-natural-accent font-serif text-3xl text-natural-primary shadow-inner overflow-hidden border-2 border-white">
                        {selectedApplicant.photoUrl ? (
                          <img src={selectedApplicant.photoUrl} alt={selectedApplicant.fullName} className="h-full w-full object-cover" />
                        ) : (
                          selectedApplicant.fullName.split(' ').map(n => n[0]).join('')
                        )}
                      </div>
                      <h3 className="font-serif text-2xl font-medium leading-tight">{selectedApplicant.fullName}</h3>
                      <p className="text-xs text-natural-muted mt-1 uppercase tracking-widest">{selectedApplicant.role}</p>
                      
                      <div className="mt-6 flex justify-center gap-3">
                        <a 
                          href={selectedApplicant.resumeUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="rounded-full border border-natural-accent bg-white px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-natural-bg flex items-center gap-2"
                        >
                          <Download size={12} /> Resume.pdf
                        </a>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                      {/* Personal info section */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-natural-muted">Candidate Details</label>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-natural-muted mb-0.5">Contact</p>
                            <p className="font-medium">{selectedApplicant.phone}</p>
                          </div>
                          <div>
                            <p className="text-natural-muted mb-0.5">Email</p>
                            <p className="font-medium truncate">{selectedApplicant.email}</p>
                          </div>
                          <div>
                            <p className="text-natural-muted mb-0.5">Parent/Spouse</p>
                            <p className="font-medium">{selectedApplicant.fatherHusbandName}</p>
                          </div>
                          <div>
                            <p className="text-natural-muted mb-0.5">Birth Date</p>
                            <p className="font-medium">{selectedApplicant.dateOfBirth}</p>
                          </div>
                          <div>
                            <p className="text-natural-muted mb-0.5">Marital Status</p>
                            <p className="font-medium capitalize">{selectedApplicant.maritalStatus}</p>
                          </div>
                          <div>
                            <p className="text-natural-muted mb-0.5">Experience</p>
                            <p className="font-medium">{selectedApplicant.experience} Years</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-natural-muted mb-0.5">Address</p>
                          <p className="text-xs font-medium leading-relaxed">{selectedApplicant.address}</p>
                        </div>
                      </div>

                      {/* Education section */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-natural-muted">Education</label>
                        <div className="text-xs space-y-3">
                          <div>
                            <p className="text-natural-muted mb-0.5">Degree</p>
                            <p className="font-bold">{selectedApplicant.qualification} ({selectedApplicant.passingYear})</p>
                          </div>
                          <div>
                            <p className="text-natural-muted mb-0.5">College</p>
                            <p className="font-medium">{selectedApplicant.collegeName}</p>
                          </div>
                          <div>
                            <p className="text-natural-muted mb-0.5">University</p>
                            <p className="font-medium">{selectedApplicant.universityName}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em] text-natural-muted">Interview Remarks</label>
                        <textarea 
                          className="h-28 w-full resize-none rounded-2xl border border-natural-border bg-natural-surface p-4 text-sm outline-hidden transition-all focus:ring-2 focus:ring-natural-primary/10"
                          placeholder="Feedback from initial screening..."
                          defaultValue={selectedApplicant.interviewRemarks}
                          onBlur={(e) => handleAddRemark(selectedApplicant.id, e.target.value)}
                        />
                        <p className="mt-1.5 text-[9px] text-natural-muted italic flex items-center gap-1">
                          <Clock size={10} /> Autosaves on exit
                        </p>
                      </div>

                      <div>
                        <label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em] text-natural-muted">Quick Status Update</label>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.values(ApplicationStatus).map((status) => (
                            <button
                              key={status}
                              onClick={() => handleUpdateStatus(selectedApplicant.id, status)}
                              className={cn(
                                "rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-tight transition-all border",
                                selectedApplicant.status === status 
                                  ? getStatusColor(status).replace('bg-', 'bg-') 
                                  : "bg-natural-surface border-natural-accent text-natural-muted hover:border-natural-primary hover:text-natural-primary"
                              )}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-natural-bg">
                        <button 
                          onClick={() => handleDelete(selectedApplicant.id)}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold uppercase tracking-widest text-red-600 transition-all hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Remove Applicant
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-12 text-center text-natural-muted">
                    <User size={64} className="mb-6 opacity-10" />
                    <p className="font-serif italic text-lg opacity-40">Select a candidate profile to begin review</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {jobs.map(job => (
                <div key={job.id} className="bg-white rounded-[32px] border border-natural-border p-8 shadow-sm flex flex-col transition-all hover:shadow-xl hover:shadow-natural-primary/5">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-serif text-xl font-medium">{job.title}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">{job.department}</p>
                    </div>
                    <button 
                      onClick={() => toggleJobStatus(job.id, job.active)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        job.active ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-100 text-gray-500 border-gray-200"
                      )}
                    >
                      {job.active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <p className="text-sm text-natural-muted line-clamp-3 mb-6 leading-relaxed flex-1">
                    {job.description}
                  </p>
                  <div className="pt-6 border-t border-natural-bg flex justify-between items-center">
                    <span className="text-[10px] text-natural-muted font-mono">{format(new Date(job.createdAt), 'MMM yyyy')}</span>
                    <button 
                      onClick={async () => {
                        if (window.confirm("Delete this job posting?")) {
                          await deleteDoc(doc(db, 'jobs', job.id));
                          toast.success("Job deleted");
                        }
                      }}
                      className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Job Modal */}
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-6 rounded-full bg-natural-primary px-8 py-4 text-white shadow-2xl"
          >
            <div className="flex items-center gap-3 border-r border-white/20 pr-6">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-bold text-natural-primary">
                {selectedIds.length}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest">Selected</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="group relative">
                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-80 hover:opacity-100 transition-all">
                  Update Status <ChevronUp size={14} />
                </button>
                <div className="absolute bottom-full left-0 mb-4 hidden w-48 flex-col rounded-2xl bg-white p-2 shadow-2xl group-hover:flex">
                  {Object.values(ApplicationStatus).map(status => (
                    <button
                      key={status}
                      onClick={() => handleBulkUpdateStatus(status)}
                      className="rounded-xl px-4 py-2 text-left text-[10px] font-bold uppercase tracking-tight text-natural-text hover:bg-natural-bg transition-all"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleBulkEmail}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-80 hover:opacity-100 transition-all"
              >
                <Mail size={14} /> Email
              </button>

              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-300 hover:text-red-100 transition-all"
              >
                <Trash2 size={14} /> Delete
              </button>

              <button 
                onClick={() => setSelectedIds([])}
                className="ml-4 rounded-full border border-white/20 p-2 hover:bg-white/10 transition-all"
              >
                <XCircle size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {showJobModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-natural-text/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl p-10 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-serif text-3xl font-medium italic">Create New Role</h3>
                <button onClick={() => setShowJobModal(false)} className="p-2 hover:bg-natural-bg rounded-full outline-hidden transition-all">
                  <XCircle size={24} className="text-natural-muted" />
                </button>
              </div>

              <form onSubmit={handleCreateJob} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">Job Title</label>
                    <input 
                      required
                      className="w-full rounded-2xl border border-natural-border bg-natural-surface px-5 py-3 text-sm focus:ring-1 ring-natural-primary outline-hidden"
                      placeholder="Senior Product Designer"
                      value={newJob.title}
                      onChange={e => setNewJob({...newJob, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">Department</label>
                    <input 
                      required
                      className="w-full rounded-2xl border border-natural-border bg-natural-surface px-5 py-3 text-sm focus:ring-1 ring-natural-primary outline-hidden"
                      placeholder="Design & Creative"
                      value={newJob.department}
                      onChange={e => setNewJob({...newJob, department: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">Job Description</label>
                  <textarea 
                    required
                    className="w-full h-32 rounded-2xl border border-natural-border bg-natural-surface px-5 py-3 text-sm focus:ring-1 ring-natural-primary outline-hidden resize-none"
                    placeholder="Describe the responsibilities..."
                    value={newJob.description}
                    onChange={e => setNewJob({...newJob, description: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">Key Requirements</label>
                  <textarea 
                    required
                    className="w-full h-32 rounded-2xl border border-natural-border bg-natural-surface px-5 py-3 text-sm focus:ring-1 ring-natural-primary outline-hidden resize-none"
                    placeholder="Skills, experience, qualifications..."
                    value={newJob.requirements}
                    onChange={e => setNewJob({...newJob, requirements: e.target.value})}
                  />
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full py-5 rounded-[24px] bg-natural-primary text-white text-sm font-bold uppercase tracking-[0.2em] shadow-xl shadow-natural-primary/20 hover:bg-natural-secondary transition-all"
                  >
                    Post Job Role
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
