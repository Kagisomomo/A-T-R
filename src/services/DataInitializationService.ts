import { supabase } from '../lib/supabase';

export class DataInitializationService {
  private static isInitialized = false;
  private static initializationPromise: Promise<void> | null = null;

  static async initializeAllData(): Promise<void> {
    // Return existing promise if initialization is already in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return immediately if already initialized
    if (this.isInitialized) {
      return Promise.resolve();
    }

    // Create and store the initialization promise
    this.initializationPromise = this.performInitialization();
    
    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private static async performInitialization(): Promise<void> {
    console.log('🚀 Initializing Africa Tennis data...');
    
    try {
      // Check if we have a valid Supabase connection
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      
      if (error) {
        throw new Error(`Supabase connection error: ${error.message}`);
      }
      
      console.log('✅ Supabase connection successful');
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize data:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  static reset(): void {
    this.isInitialized = false;
    this.initializationPromise = null;
    console.log('🔄 Data initialization status reset');
  }

  static getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  static isInitializing(): boolean {
    return this.initializationPromise !== null;
  }
}