import { supabase } from './supabase';

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  category: string;
  service_category: string;
  location: string;
  client_name: string;
  completion_date: string;
  is_featured: boolean;
  tags: string[];
  images: PortfolioImage[];
}

export interface PortfolioImage {
  id: string;
  project_id: string;
  image_url: string;
  caption: string;
  sort_order: number;
}

class PortfolioService {
  private static instance: PortfolioService;

  static getInstance(): PortfolioService {
    if (!PortfolioService.instance) {
      PortfolioService.instance = new PortfolioService();
    }
    return PortfolioService.instance;
  }

  async getActiveProjects(): Promise<PortfolioProject[]> {
    return this.getProjects();
  }

  async getProjects(): Promise<PortfolioProject[]> {
    try {
      const { data: projects, error } = await supabase
        .from('portfolio_projects')
        .select('*, portfolio_images(*)')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('sort_order');

      if (error) throw error;
      return (projects || []).map(p => ({
        ...p,
        images: p.portfolio_images || [],
      })) as PortfolioProject[];
    } catch {
      return [];
    }
  }

  async getProjectsByCategory(category: string): Promise<PortfolioProject[]> {
    try {
      // Match by either category or service_category
      const { data, error } = await supabase
        .from('portfolio_projects')
        .select('*, portfolio_images(*)')
        .eq('is_active', true)
        .or(`category.eq.${category},service_category.eq.${category}`)
        .order('sort_order');

      if (error) throw error;
      return (data || []).map(p => ({
        ...p,
        images: p.portfolio_images || [],
      })) as PortfolioProject[];
    } catch {
      return [];
    }
  }

  async getFeatured(): Promise<PortfolioProject[]> {
    try {
      const { data, error } = await supabase
        .from('portfolio_projects')
        .select('*, portfolio_images(*)')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('sort_order')
        .limit(6);

      if (error) throw error;
      return (data || []).map(p => ({
        ...p,
        images: p.portfolio_images || [],
      })) as PortfolioProject[];
    } catch {
      return [];
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('portfolio_projects')
        .select('category')
        .eq('is_active', true);

      if (error) throw error;
      const cats = new Set((data || []).map(p => p.category).filter(Boolean));
      return Array.from(cats);
    } catch {
      return [];
    }
  }
}

export const portfolioService = PortfolioService.getInstance();