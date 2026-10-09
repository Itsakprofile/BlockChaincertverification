# Admin Certificate Management - Quick Start Guide

## How to Use the New Certificate Management System

### Accessing the Certificate Manager

1. Log in as Admin with credentials:
   - Email: `admin@hect.edu`
   - Password: `admin123`

2. Click **"Manage Certificates"** in the navbar

### Adding a Certificate to an Existing Student

**Step 1: Search for the Student**
- Enter the student's **Register Number** in the search field
- Click **Search**
- The system will fetch and display the student's details

**Step 2: Verify Student Information**
- Confirm you have the correct student:
  - Name ✓
  - Register Number ✓
  - Student ID ✓
  - Department ✓

**Step 3: Upload the Certificate**
- Click **Choose File** and select a PDF certificate
- Click **Add Certificate**
- System will:
  - Hash the PDF for integrity verification
  - Generate a unique Certificate ID
  - Store an entry on the blockchain
  - Add the certificate to the student's record

**Step 4: Confirmation**
- Success message will appear
- Certificate will appear in the list below with:
  - Certificate ID (e.g., CERT-XXXX)
  - Upload date and time
  - Blockchain verification status (✓ VALID, ✗ REVOKED, ? UNKNOWN)

### Creating a New Student (AdminDashboard)

The **Dashboard** page is still used for creating completely new student accounts:

1. From Admin navbar, click **Dashboard**
2. Fill in the form:
   - Name, Register Number, Degree, Department
   - Admission Date, Year of Passing
   - Upload student photo (JPG/PNG)
   - Upload initial certificate (PDF)
3. Click **Issue New Certificate**
4. Student will be created with new login credentials

### Student View of Multiple Certificates

When students log in to their dashboard, they can now see:
- All their certificates (instead of just one)
- Verification status for each:
  - ✓ **VALID** - Certificate is authentic and on blockchain
  - ✗ **REVOKED** - Certificate has been revoked
  - ? **CHECKING...** - Verification in progress
- Download button for each certificate individually
- Preview of the first certificate

### Key Differences from Old System

| Aspect | Old System | New System |
|--------|-----------|-----------|
| Certificates per student | 1 | Multiple |
| Admin tasks | Create new student only | Create OR add to existing |
| Search | By login ID | By register number |
| Student ID | Same as Certificate ID | Unique, fixed |
| Certificate ID | Per student | Per certificate |
| Blockchain | 1 entry per student | Entry per certificate |

### Example Workflow

**Scenario:** John Doe (REG123) already has a degree certificate. Later, he earns a diploma.

**Old System:**
- ❌ Cannot add diploma to existing account
- ❌ Must create new student record (duplicates!)
- ❌ New login, confusion about which is "real" account

**New System:**
1. Admin searches: "REG123"
2. Admin uploads diploma PDF
3. ✓ Diploma is added to John's existing account
4. ✓ John's login remains unchanged
5. ✓ John sees both certificates on dashboard

## Troubleshooting

### Q: Search returns "No student found"
**A:** Double-check the Register Number spelling and format. It's case-sensitive.

### Q: Certificate upload fails
**A:** 
- Ensure the file is a valid PDF
- Check file size isn't too large
- Check browser console (F12) for error messages

### Q: Certificate shows "? UNKNOWN" status
**A:** The blockchain verification may still be processing. Refresh the page in a few seconds.

### Q: Student can't see the new certificate
**A:**
- Have the student logout and login again
- Refresh the page
- Check that the certificate uploaded successfully (admin should see success message)

## Security Notes

✓ **No Duplicate Accounts:** Only existing students can be found by register number
✓ **Blockchain Protected:** Each certificate hash is stored immutably
✓ **Admin Only:** Only authenticated admins can access certificate management
✓ **Login Unchanged:** Student login credentials are never modified
✓ **No Data Loss:** All previous certificates remain in history

## Tips for Admins

1. **Before uploading:** Ensure the register number is correct
2. **File types:** Certificates must be PDF format
3. **Naming:** System auto-generates IDs (no need for manual naming)
4. **Status checks:** Blockchain status appears after upload
5. **Bulk operations:** Add one certificate at a time (no bulk upload yet)

## Important Notes

⚠️ **DO NOT:**
- Create duplicate student accounts with same register number
- Modify student names or register numbers after creation
- Delete certificates (revocation is available if needed)

✓ **DO:**
- Search first to check if student already exists
- Use consistent register number formats
- Upload valid PDF files only

## Navigation Map

```
/                         Home page
├─ /admin-login           Admin login
├─ /admin-dashboard       Create new students (Issue Certificate page)
├─ /admin-certificates    Add certificates to existing students (NEW!)
├─ /student-login         Student login
├─ /student-dashboard     View certificates (updated for multiple certs)
└─ /public-verify         Public certificate verification
```

## Data Stored

Each student record now contains:

```
StudentProfile {
  id: "STUD-ABC123"          // Unique student ID
  name: "John Doe"
  registerNumber: "REG123"
  degree: "B.Tech"
  department: "Computer Science"
  collegeName: "HECT"
  photoBase64: "..."
  certificates: [             // Array of certificates
    {
      id: "CERT-XYZ789",
      certificateBase64: "...",
      certificatePdfHash: "sha256hash...",
      uploadedAt: 1234567890,
      status: "ISSUED"
    },
    // ... more certificates if they exist
  ],
  loginId: "john0123"
  passwordHash: "password123"
  createdAt: 1234567890
}
```

## Contact & Support

For issues or clarifications about the certificate management system, refer to [ADMIN_CERTIFICATE_MANAGEMENT.md](ADMIN_CERTIFICATE_MANAGEMENT.md) for technical details.
