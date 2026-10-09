# Certificate Management System - Admin Module Update

## Overview
This document outlines the new Admin Certificate Management System added to the Certificate Verification System. The system now allows admins to add multiple certificates to existing student accounts without creating duplicate user records or modifying the existing authentication flow.

## Key Changes

### 1. Data Model Updates (`types.ts`)
**New Certificate Interface:**
```typescript
export interface Certificate {
  id: string;                    // Unique certificate ID
  certificateBase64: string;     // data URL of uploaded certificate PDF
  certificatePdfHash: string;    // SHA-256 hash of PDF
  uploadedAt: number;            // Timestamp when certificate was added
  status?: CertificateStatus;    // ISSUED, REVOKED, GENESIS
}
```

**StudentProfile Updated:**
- Changed `id` field from Certificate ID to Student ID (unique per student)
- Added `certificates: Certificate[]` array to store multiple certificates
- Added `certificates_legacy` field for backward compatibility

### 2. Service Layer Extensions (`services/store.ts`)
New methods added to StoreService:

#### `getStudentByRegisterNumber(registerNumber: string)`
Searches for existing students by registration number without creating new accounts.

**Usage:**
```typescript
const student = StoreService.getStudentByRegisterNumber("REG001");
```

#### `addCertificateToStudent(studentId: string, certificate: Certificate)`
Appends a new certificate to an existing student's certificate array.

**Usage:**
```typescript
StoreService.addCertificateToStudent(studentId, newCertificate);
```

#### `getStudentCertificates(studentId: string) → Certificate[]`
Retrieves all certificates for a student.

#### `getCertificateById(studentId: string, certificateId: string) → Certificate | undefined`
Retrieves a specific certificate.

#### `updateStudent(studentId: string, updates: Partial<StudentProfile>)`
Updates student profile fields.

### 3. New Admin Component (`pages/AdminCertificateManager.tsx`)

**Path:** `/admin-certificates`

**Features:**
- Search for existing students by register number
- Display student details (name, ID, degree, department, institution, photo)
- View all existing certificates for the student
- Upload and add new certificates to existing accounts
- Real-time blockchain verification status for each certificate
- Success/error feedback

**Workflow:**
1. Admin enters student's register number
2. System fetches existing student record
3. Admin selects a PDF certificate to upload
4. System:
   - Computes SHA-256 hash of PDF
   - Generates unique certificate ID
   - Adds block to blockchain with certificate hash
   - Appends certificate to student's certificate array
   - Displays success message
   - Refreshes certificate list with verification status

### 4. Updated Components

#### AdminDashboard (`pages/AdminDashboard.tsx`)
- Updated to create students with new certificate structure
- Each new student starts with a single certificate in the array
- Updated status refresh logic to handle certificate array

#### StudentDashboard (`pages/StudentDashboard.tsx`)
- Updated to display all student certificates
- Shows blockchain verification status for each certificate
- Certificate selection and download for each certificate
- Backward compatibility with legacy single-certificate format

#### App.tsx
- Added import for AdminCertificateManager
- Added route: `/admin-certificates`
- Updated navbar to show "Manage Certificates" link for admins

## Data Flow

### Creating New Student with Certificate (AdminDashboard)
```
Admin submits form
  ↓
Validate input
  ↓
Generate Student ID (STUD-XXXXX)
  ↓
Generate Certificate ID (CERT-XXXXX)
  ↓
Hash certificate PDF (SHA-256)
  ↓
Create Certificate object
  ↓
Add block to blockchain (ISSUED)
  ↓
Save StudentProfile with certificates array
  ↓
Display credentials
```

### Adding Certificate to Existing Student (AdminCertificateManager)
```
Admin searches by register number
  ↓
System retrieves existing StudentProfile
  ↓
Admin uploads certificate PDF
  ↓
Generate Certificate ID (CERT-XXXXX)
  ↓
Hash certificate PDF (SHA-256)
  ↓
Create Certificate object
  ↓
Add block to blockchain (ISSUED)
  ↓
Append certificate to existing certificates array
  ↓
Update student record
  ↓
Refresh certificate list with status
```

## Backward Compatibility

The system maintains backward compatibility with existing single-certificate student records through the `certificates_legacy` field. When loading old records:

1. If `certificates` array exists → Use it
2. If `certificates` array is empty but `certificates_legacy` exists → Use legacy format
3. StudentDashboard and AdminDashboard both handle both formats transparently

## Authentication & Authorization

**No Changes to Existing Flow:**
- Student login uses `loginId` and `passwordHash` (unchanged)
- Admin login uses hardcoded credentials (unchanged)
- Student dashboard shows only their own records (unchanged)
- All new features are admin-only

## Security Considerations

1. **No Duplicate Accounts:** Searching by register number finds existing users
2. **Blockchain Integrity:** Each certificate hash is stored on blockchain
3. **Immutable Records:** Previous certificates remain in history
4. **Status Verification:** Blockchain verification available for all certificates

## Testing Checklist

- [ ] Admin can search for existing student by register number
- [ ] System returns correct student record
- [ ] Admin can upload certificate to existing student
- [ ] Certificate hash is computed and stored
- [ ] Blockchain entry is created for new certificate
- [ ] Certificate appears in student's certificate list
- [ ] Verification status shows correctly
- [ ] Student can see all their certificates on dashboard
- [ ] Each certificate can be downloaded individually
- [ ] Old single-certificate records still work
- [ ] No duplicate student accounts created
- [ ] Student login flow unchanged
- [ ] Admin dashboard still creates new students correctly

## API Changes Summary

**No breaking changes.** All existing endpoints and methods continue to work. New methods are additive only.

### Old Code Still Works:
```typescript
// Getting a student by login
const student = StoreService.getStudentByLogin("john0001");

// Revoking a certificate
await BlockchainService.revokeCertificate(certificateId);

// Verifying a certificate
const status = await BlockchainService.getCertificateStatus(certId, pdfHash);
```

### New Capabilities:
```typescript
// Search by register number
const student = StoreService.getStudentByRegisterNumber("REG001");

// Add certificate to existing student
StoreService.addCertificateToStudent(studentId, certificate);

// Get all certificates for a student
const certificates = StoreService.getStudentCertificates(studentId);

// Get specific certificate
const cert = StoreService.getCertificateById(studentId, certId);
```

## File Structure

```
pages/
  ├── AdminDashboard.tsx          (Updated - new certificate structure)
  ├── AdminCertificateManager.tsx (NEW - manage certs for existing students)
  ├── AdminLogin.tsx              (Unchanged)
  ├── StudentDashboard.tsx        (Updated - display multiple certs)
  ├── StudentLogin.tsx            (Unchanged)
  ├── Home.tsx                    (Unchanged)
  └── PublicVerify.tsx            (Unchanged)
services/
  ├── store.ts                    (Updated - new certificate methods)
  └── blockchain.ts               (Unchanged)
types.ts                          (Updated - Certificate interface, StudentProfile)
App.tsx                           (Updated - new route, navigation)
```

## Future Enhancements

1. **Bulk Certificate Upload:** Allow uploading certificates for multiple students at once
2. **Certificate Templates:** Predefined certificate formats
3. **Expiration Dates:** Add certificate validity periods
4. **Revocation Management:** UI for revoking specific certificates
5. **Export/Audit Trail:** Export student certificate history
6. **Filter & Sort:** Enhanced search and filtering options
7. **Email Notifications:** Notify students when certificates are added

## Troubleshooting

**Issue:** Student record not found during search
- **Solution:** Ensure you're using the exact register number as stored in the system

**Issue:** Certificate not appearing after upload
- **Solution:** Check browser console for errors; ensure PDF file is valid

**Issue:** Blockchain verification shows "UNKNOWN"
- **Solution:** Wait a moment for blockchain to process; refresh the page

**Issue:** Old student records not loading
- **Solution:** System handles legacy format automatically; no action needed
