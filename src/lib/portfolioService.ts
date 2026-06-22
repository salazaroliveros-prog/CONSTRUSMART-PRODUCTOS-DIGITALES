import { supabase } from './supabase';

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  client_name: string;
  completion_date: string | null;
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images?: PortfolioImage[];
}

export interface PortfolioImage {
  id: string;
  project_id: string;
  image_url: string;
  caption: string;
  sort_order: number;
}

class PortfolioService {
  async getActiveProjects(): Promise<PortfolioProject[]> {
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*, portfolio_images(*)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !data) return [];

    return data.map((p: any) => ({
      ...p,
      images: (p.portfolio_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }));
  }

  async getAllProjects(): Promise<PortfolioProject[]> {
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*, portfolio_images(*)')
      .order('sort_order', { ascending: true });

    if (error || !data) return [];

    return data.map((p: any) => ({
      ...p,
      images: (p.portfolio_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }));
  }

  async upsertProject(project: Partial<PortfolioProject>): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const payload: any = { ...project };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;
      delete payload.images;

      if (project.id) {
        const { error } = await supabase.from('portfolio_projects').update(payload).eq('id', project.id);
        if (error) return { success: false, error: error.message };
        return { success: true, id: project.id };
      }

      const { data, error } = await supabase.from('portfolio_projects').insert(payload).select('id').single();
      if (error) return { success: false, error: error.message };
      return { success: true, id: data?.id };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error al guardar proyecto' };
    }
  }

  async deleteProject(projectId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from('portfolio_projects').delete().eq('id', projectId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async addImage(projectId: string, imageUrl: string, caption?: string, sortOrder?: number): Promise<{ success: boolean; error?: string; id?: string }> {
    const { data, error } = await supabase
      .from('portfolio_images')
      .insert({ project_id: projectId, image_url: imageUrl, caption: caption || '', sort_order: sortOrder || 0 })
      .select('id')
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  }

  async deleteImage(imageId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from('portfolio_images').delete().eq('id', imageId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}

export const portfolioService = new PortfolioService();
