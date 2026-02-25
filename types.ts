
export interface StudentProfile {
  id: string; // Certificate ID / Unique ID
  name: string;
  registerNumber: string;
  degree: string;
  department: string;
  collegeName: string;
  admissionDate?: string; // Date of admission (YYYY-MM-DD format)
  yearOfPassing: string;
  photoBase64: string;
  certificateBase64?: string; // data URL of uploaded certificate PDF for embedding
  certificatePdfHash: string;
  loginId: string;
  passwordHash: string;
  createdAt: number;
}

export interface Block {
  index: number;
  timestamp: number;
  data: BlockData;
  previousHash: string;
  hash: string;
}

export interface BlockData {
  certificateId: string;
  studentName?: string;
  registerNumber?: string;
  pdfHash?: string;
  status?: CertificateStatus;
}

export type CertificateStatus = 'ISSUED' | 'REVOKED' | 'GENESIS';
export type CertificateVerificationStatus = 'VALID' | 'REVOKED' | 'NOT_FOUND' | 'INVALID';

export interface UserSession {
  role: 'admin' | 'student';
  userId: string;
}

export interface Credentials {
  loginId: string;
  password: string;
}
