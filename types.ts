
export interface Certificate {
  id: string; // Unique certificate ID
  certificateBase64: string; // data URL of uploaded certificate PDF
  certificatePdfHash: string;
  uploadedAt: number;
  status?: CertificateStatus;
}

export interface StudentProfile {
  id: string; // Student ID (not Certificate ID - unique per student)
  name: string;
  registerNumber: string;
  degree: string;
  department: string;
  collegeName: string;
  admissionDate?: string; // Date of admission (YYYY-MM-DD format)
  yearOfPassing: string;
  photoBase64: string;
  certificates: Certificate[]; // Array of certificates
  certificates_legacy?: { // Legacy field for backward compatibility during transition
    certificateBase64?: string;
    certificatePdfHash: string;
  };
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
