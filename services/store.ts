
import { StudentProfile, Certificate, Credentials } from '../types';

export class StoreService {
  private static readonly STORAGE_KEY = 'sl_university_students';

  /**
   * Retrieves all students from localStorage
   * @returns StudentProfile[] - Array of all student records
   */
  static getStudents(): StudentProfile[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored) as StudentProfile[];
    } catch (error) {
      console.error('Failed to parse students from storage', error);
      return [];
    }
  }

  /**
   * Saves a new student to localStorage
   * Appends to existing students list
   * @param student - Student profile to save
   * @throws Error if storage operation fails
   */
  static saveStudent(student: StudentProfile): void {
    const students = this.getStudents();
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...students, student]));
    } catch (error) {
      console.error('Failed to save student to storage', error);
      throw new Error('Failed to save student: Storage quota may be exceeded');
    }
  }

  /**
   * Retrieves a student by their student ID
   * @param id - Student ID to search for
   * @returns StudentProfile | undefined - Student record or undefined if not found
   */
  static getStudentById(id: string): StudentProfile | undefined {
    return this.getStudents().find(s => s.id === id);
  }

  /**
   * Retrieves a student by their login ID
   * @param loginId - Login ID to search for
   * @returns StudentProfile | undefined - Student record or undefined if not found
   */
  static getStudentByLogin(loginId: string): StudentProfile | undefined {
    return this.getStudents().find(s => s.loginId === loginId);
  }

  /**
   * Retrieves a student by their register number
   * @param registerNumber - Register number to search for
   * @returns StudentProfile | undefined - Student record or undefined if not found
   */
  static getStudentByRegisterNumber(registerNumber: string): StudentProfile | undefined {
    return this.getStudents().find(s => s.registerNumber === registerNumber);
  }

  /**
   * Adds a new certificate to an existing student's profile
   * @param studentId - Student ID to add certificate to
   * @param certificate - Certificate object to add
   * @throws Error if student not found or storage operation fails
   */
  static addCertificateToStudent(studentId: string, certificate: Certificate): void {
    const students = this.getStudents();
    const studentIndex = students.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    try {
      students[studentIndex].certificates.push(certificate);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(students));
    } catch (error) {
      console.error('Failed to add certificate to student', error);
      throw new Error('Failed to add certificate: Storage quota may be exceeded');
    }
  }

  /**
   * Retrieves all certificates for a student
   * @param studentId - Student ID to get certificates for
   * @returns Certificate[] - Array of certificates or empty array if student not found
   */
  static getStudentCertificates(studentId: string): Certificate[] {
    const student = this.getStudentById(studentId);
    if (!student) return [];
    return student.certificates || [];
  }

  /**
   * Retrieves a specific certificate by ID
   * @param studentId - Student ID
   * @param certificateId - Certificate ID to retrieve
   * @returns Certificate | undefined - Certificate or undefined if not found
   */
  static getCertificateById(studentId: string, certificateId: string): Certificate | undefined {
    const student = this.getStudentById(studentId);
    if (!student) return undefined;
    return (student.certificates || []).find(c => c.id === certificateId);
  }

  /**
   * Finds a certificate by ID across all students
   * @param certificateId - Certificate ID to find
   * @returns { student: StudentProfile, certificate: Certificate } | undefined - Student and certificate or undefined if not found
   */
  static findCertificateById(certificateId: string): { student: StudentProfile; certificate: Certificate } | undefined {
    const students = this.getStudents();
    for (const student of students) {
      const cert = (student.certificates || []).find(c => c.id === certificateId);
      if (cert) {
        return { student, certificate: cert };
      }
      // Also check legacy format
      if (student.certificates_legacy && student.id === certificateId) {
        const legacyCert: Certificate = {
          id: student.id,
          certificateBase64: student.certificates_legacy.certificateBase64 || '',
          certificatePdfHash: student.certificates_legacy.certificatePdfHash,
          uploadedAt: student.createdAt,
          status: 'ISSUED'
        };
        return { student, certificate: legacyCert };
      }
    }
    return undefined;
  }

  /**
   * Updates a student record
   * @param studentId - Student ID to update
   * @param updates - Partial student profile with fields to update
   * @throws Error if student not found or storage operation fails
   */
  static updateStudent(studentId: string, updates: Partial<StudentProfile>): void {
    const students = this.getStudents();
    const studentIndex = students.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    try {
      students[studentIndex] = { ...students[studentIndex], ...updates };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(students));
    } catch (error) {
      console.error('Failed to update student', error);
      throw new Error('Failed to update student: Storage quota may be exceeded');
    }
  }

  /**
   * Generates login credentials for a new student
   * Creates unique loginId from name + last 4 digits of register number
   * Generates random 8-character password
   * @param name - Student's full name
   * @param regNo - Student's registration number
   * @returns Credentials - Object containing loginId and password
   */
  static generateCredentials(name: string, regNo: string): Credentials {
    const cleanName = name.toLowerCase().trim().replace(/\s+/g, '');
    const loginId = `${cleanName}${regNo.slice(-4)}`;
    const password = Math.random().toString(36).slice(-8);
    return { loginId, password };
  }
}
