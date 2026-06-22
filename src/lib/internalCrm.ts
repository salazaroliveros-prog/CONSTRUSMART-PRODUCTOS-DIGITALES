// CRM Interno — Sin dependencias externas, todo en Supabase
import { supabase } from './supabase';

export interface CrmLead {
  id: string;
  type: 'quote' | 'service' | 'contact' | 'abandoned_cart' | 'checkout';
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  source: string;
  details: string;
  value?: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CrmActivity {
  id: string;
  lead_id: string;
  type: 'note' | 'call' | 'email' | 'whatsapp' | 'status_change';
  description: string;
  created_by?: string;
  created_at: string;
}

class InternalCRM {
  // ===== LEAD MANAGEMENT =====

  async createLead(lead: {
    type: CrmLead['type'];
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    source: string;
    details: string;
    value?: number;
  }): Promise<string | null> {
    // Check if lead already exists for this email + type
    const { data: existing } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('customer_email', lead.customer_email)
      .eq('type', lead.type)
      .in('status', ['new', 'contacted', 'qualified'])
      .maybeSingle();

    if (existing) {
      // Update existing lead instead of duplicate
      await supabase
        .from('crm_leads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      return existing.id;
    }

    const { data, error } = await supabase
      .from('crm_leads')
      .insert({
        type: lead.type,
        customer_name: lead.customer_name,
        customer_email: lead.customer_email,
        customer_phone: lead.customer_phone || null,
        source: lead.source,
        details: lead.details,
        value: lead.value || null,
        status: 'new',
      })
      .select('id')
      .single();

    if (error) {
      console.error('CRM: Error creating lead:', error.message);
      return null;
    }

    // Auto-create follow-up task for new leads
    await this.scheduleFollowUp(data!.id, lead.customer_name, lead.customer_email, lead.type);
    
    return data!.id;
  }

  async getLeads(filters?: {
    status?: string;
    type?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ leads: CrmLead[]; total: number }> {
    let query = supabase
      .from('crm_leads')
      .select('*', { count: 'exact' });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }
    if (filters?.search) {
      query = query.or(
        `customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%,details.ilike.%${filters.search}%`
      );
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 50)
      .range(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 50) - 1);

    const { data, error, count } = await query;
    if (error) {
      console.error('CRM: Error fetching leads:', error.message);
      return { leads: [], total: 0 };
    }
    return { leads: data as CrmLead[] || [], total: count || 0 };
  }

  async updateLeadStatus(leadId: string, status: CrmLead['status'], notes?: string): Promise<boolean> {
    const { error } = await supabase
      .from('crm_leads')
      .update({ status, notes: notes || null, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) {
      console.error('CRM: Error updating lead:', error.message);
      return false;
    }

    // Log activity
    await this.addActivity(leadId, 'status_change', `Status changed to: ${status}`);
    return true;
  }

  // ===== ACTIVITY LOGGING =====

  async addActivity(leadId: string, type: CrmActivity['type'], description: string): Promise<boolean> {
    const { error } = await supabase
      .from('crm_activities')
      .insert({ lead_id: leadId, type, description });

    if (error) {
      console.error('CRM: Error logging activity:', error.message);
      return false;
    }
    return true;
  }

  async getActivities(leadId: string): Promise<CrmActivity[]> {
    const { data } = await supabase
      .from('crm_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    return data || [];
  }

  async getLeadStats() {
    const { data: all } = await supabase
      .from('crm_leads')
      .select('status, type, value');

    if (!all) return { byStatus: {}, byType: {}, totalValue: 0, totalLeads: 0 };

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalValue = 0;

    for (const lead of all) {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      byType[lead.type] = (byType[lead.type] || 0) + 1;
      totalValue += Number(lead.value || 0);
    }

    return {
      byStatus,
      byType,
      totalValue,
      totalLeads: all.length,
    };
  }

  // ===== FOLLOW-UP AUTOMATION =====

  async scheduleFollowUp(leadId: string, name: string, email: string, type: string) {
    // Schedule a follow-up for 24h later using the crm_tasks table
    await supabase.from('crm_tasks').insert({
      type: type === 'abandoned_cart' ? 'abandoned_cart' : 'quote_follow_up',
      reference_id: leadId,
      target_email: email,
      target_name: name,
      metadata: { lead_id: leadId },
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    }).catch(() => {});
  }

  // ===== PIPELINE STATS FOR DASHBOARD =====

  async getPipelineSummary() {
    const { data } = await supabase
      .from('crm_leads')
      .select('status, value, type, created_at');

    if (!data) return null;

    const now = new Date();
    const thisMonth = data.filter(l => new Date(l.created_at).getMonth() === now.getMonth());
    const conversion = data.length > 0
      ? Math.round((data.filter(l => l.status === 'converted').length / data.length) * 100)
      : 0;

    return {
      total: data.length,
      newThisMonth: thisMonth.length,
      converted: data.filter(l => l.status === 'converted').length,
      conversionRate: conversion,
      pipelineValue: data.reduce((s, l) => s + Number(l.value || 0), 0),
      bySource: data.reduce((acc: Record<string, number>, l) => {
        acc[l.type] = (acc[l.type] || 0) + 1;
        return acc;
      }, {}),
    };
  }
}

export const internalCrm = new InternalCRM();