
import { Block, BlockData, CertificateStatus, CertificateVerificationStatus } from '../types';

export class BlockchainService {
  private static readonly STORAGE_KEY = 'sl_university_blockchain';

  /**
   * Computes SHA-256 hash of JSON stringified data
   * @param data - Data to hash (preferably structured objects)
   * @returns Promise<string> - Hexadecimal hash string
   */
  static async computeHash(data: Record<string, unknown>): Promise<string> {
    const jsonString = JSON.stringify(data);
    const msgUint8 = new TextEncoder().encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Retrieves the blockchain from localStorage
   * Creates genesis block if blockchain doesn't exist
   * @returns Promise<Block[]> - Array of blocks in the blockchain
   */
  static async getChain(): Promise<Block[]> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      const genesis = await this.createGenesisBlock();
      this.saveChain([genesis]);
      return [genesis];
    }
    try {
      return JSON.parse(stored) as Block[];
    } catch (parseError) {
      console.error('Failed to parse blockchain from storage', parseError);
      const genesis = await this.createGenesisBlock();
      this.saveChain([genesis]);
      return [genesis];
    }
  }

  /**
   * Creates the genesis (first) block of the blockchain
   * @returns Promise<Block> - The genesis block
   */
  private static async createGenesisBlock(): Promise<Block> {
    const blockData: BlockData = {
      certificateId: 'GENESIS',
      studentName: 'SYSTEM',
      registerNumber: '0000',
      pdfHash: '0',
      status: 'GENESIS'
    };
    const timestamp = Date.now();
    const hash = await this.computeHash({ index: 0, timestamp, data: blockData, previousHash: '0' });
    return { index: 0, timestamp, data: blockData, previousHash: '0', hash };
  }

  /**
   * Adds a new block to the blockchain
   * Computes hash based on index, timestamp, data, and previous hash
   * @param entry - Block data entry to add
   * @returns Promise<Block> - The newly created block
   */
  static async addBlock(entry: BlockData): Promise<Block> {
    const chain = await this.getChain();
    const lastBlock = chain[chain.length - 1];
    const index = lastBlock.index + 1;
    const timestamp = Date.now();
    const previousHash = lastBlock.hash;
    const hash = await this.computeHash({ index, timestamp, data: entry, previousHash });

    const newBlock: Block = { index, timestamp, data: entry, previousHash, hash };
    const updatedChain = [...chain, newBlock];
    this.saveChain(updatedChain);
    return newBlock;
  }

  /**
   * Revokes a certificate by adding a REVOKED block
   * @param certificateId - ID of certificate to revoke
   * @returns Promise<Block> - The revocation block
   */
  static async revokeCertificate(certificateId: string): Promise<Block> {
    const revocationData: BlockData = {
      certificateId,
      status: 'REVOKED'
    };
    return this.addBlock(revocationData);
  }

  /**
   * Finds the latest block for a specific certificate ID
   * Searches blockchain from most recent to oldest
   * @param certificateId - Certificate ID to search for
   * @returns Promise<Block | undefined> - Latest block or undefined if not found
   */
  static async getLatestBlockForCertificate(certificateId: string): Promise<Block | undefined> {
    const chain = await this.getChain();
    for (let i = chain.length - 1; i >= 0; i--) {
      if (chain[i].data?.certificateId === certificateId) {
        return chain[i];
      }
    }
    return undefined;
  }

  /**
   * Verifies certificate authenticity and status
   * Checks if certificate exists, if it's revoked, and validates PDF hash integrity
   * @param certificateId - Certificate ID to verify
   * @param currentPdfHash - Optional PDF hash to validate integrity
   * @returns Promise<CertificateVerificationStatus> - Certificate status (VALID, REVOKED, INVALID, NOT_FOUND)
   */
  static async getCertificateStatus(certificateId: string, currentPdfHash?: string): Promise<CertificateVerificationStatus> {
    const latest = await this.getLatestBlockForCertificate(certificateId);
    if (!latest) return 'NOT_FOUND';
    if (latest.data.status === 'REVOKED') return 'REVOKED';
    
    // Validate PDF integrity if hash provided
    if (currentPdfHash && latest.data.pdfHash) {
      return latest.data.pdfHash === currentPdfHash ? 'VALID' : 'INVALID';
    }
    
    // Certificate is issued but no hash comparison available
    return 'VALID';
  }

  /**
   * Alias for getCertificateStatus for backwards compatibility
   * @param certificateId - Certificate ID to verify
   * @param currentPdfHash - PDF hash to validate integrity
   * @returns Promise<CertificateVerificationStatus> - Certificate status
   */
  static async verifyCertificate(certificateId: string, currentPdfHash: string): Promise<CertificateVerificationStatus> {
    return this.getCertificateStatus(certificateId, currentPdfHash);
  }

  /**
   * Persists the blockchain to localStorage
   * Serializes blockchain array to JSON string
   * @param chain - Array of blocks to save
   * @throws Error if localStorage is unavailable or quota exceeded
   */
  private static saveChain(chain: Block[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(chain));
    } catch (error) {
      console.error('Failed to save blockchain to storage', error);
      throw new Error('Failed to persist blockchain: Storage quota may be exceeded or storage unavailable');
    }
  }

  /**
   * Computes SHA-256 hash of a file
   * Used for certificate PDF integrity verification
   * @param file - File object to hash
   * @returns Promise<string> - Hexadecimal hash of file content
   * @throws Error if file reading fails or hash computation fails
   */
  static async hashFile(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Failed to hash file', error);
      throw new Error('Failed to compute file hash');
    }
  }
}
