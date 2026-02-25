
import { StudentProfile, Credentials } from '../types';

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
   * Retrieves a student by their certificate ID
   * @param id - Certificate/Student ID to search for
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
