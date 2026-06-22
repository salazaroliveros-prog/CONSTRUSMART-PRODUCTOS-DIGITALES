import { supabase } from '@/lib/supabase';

interface CompanyInfo {
  name?: string;
  emails?: string[];
  phones?: string[];
  address?: string;
  website?: string;
}

interface ContactInfo {
  whatsapp?: string;
  sales_email?: string;
  support_email?: string;
}

class CompanyService {
  private static instance: CompanyService;
  private cachedInfo: CompanyInfo | null = null;
  private cachedContact: ContactInfo | null = null;

  private constructor() {}

  static getInstance(): CompanyService {
    if (!CompanyService.instance) {
      CompanyService.instance = new CompanyService();
    }
    return CompanyService.instance;
  }

  async getCompanyInfo(): Promise<CompanyInfo> {
    if (this.cachedInfo) return this.cachedInfo;
    try {
      const { data } = await supabase
        .from('company_settings')
        .select('value')
        .eq('key', 'company_info')
        .single();
      if (data?.value) {
        this.cachedInfo = data.value as CompanyInfo;
      }
    } catch {}
    return this.cachedInfo || {};
  }

  async getContactInfo(): Promise<ContactInfo> {
    if (this.cachedContact) return this.cachedContact;
    try {
      const { data } = await supabase
        .from('company_settings')
        .select('value')
        .eq('key', 'contact_info')
        .single();
      if (data?.value) {
        this.cachedContact = data.value as ContactInfo;
      }
    } catch {}
    return this.cachedContact || {};
  }
}

export const companyService = CompanyService.getInstance();
