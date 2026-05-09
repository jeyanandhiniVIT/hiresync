export enum ApplicationStatus {
  APPLIED = 'applied',
  SHORT_LISTED = 'short-listed',
  INTERVIEWED = 'interviewed',
  REJECTED = 'rejected',
  HIRED = 'hired',
}

export interface Job {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: string;
  active: boolean;
  createdAt: string;
}

export interface Applicant {
  id: string;
  fullName: string;
  fatherHusbandName: string;
  email: string;
  phone: string;
  address: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  dateOfBirth: string;
  photoUrl: string;
  role: string;
  qualification: string;
  collegeName: string;
  universityName: string;
  passingYear: string;
  experience: string;
  resumeUrl: string;
  status: ApplicationStatus;
  interviewRemarks?: string;
  interviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: string;
  active: boolean;
  createdAt: string;
}
