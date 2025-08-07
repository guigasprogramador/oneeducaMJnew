import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ServiceProvider {
  id?: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  service_type: string;
}

export const serviceProviderService = {
  async getServiceProviders(): Promise<ServiceProvider[]> {
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*');
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching service providers:', error);
      toast.error('Failed to fetch service providers.');
      return [];
    }
  },

  async createServiceProvider(provider: ServiceProvider): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('service_providers')
        .insert(provider);
      if (error) throw error;
      toast.success('Service provider created successfully!');
      return true;
    } catch (error: any) {
      console.error('Error creating service provider:', error);
      toast.error(`Failed to create service provider: ${error.message}`);
      return false;
    }
  },

  async updateServiceProvider(id: string, provider: ServiceProvider): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('service_providers')
        .update(provider)
        .eq('id', id);
      if (error) throw error;
      toast.success('Service provider updated successfully!');
      return true;
    } catch (error: any) {
      console.error('Error updating service provider:', error);
      toast.error(`Failed to update service provider: ${error.message}`);
      return false;
    }
  },

  async deleteServiceProvider(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('service_providers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Service provider deleted successfully!');
      return true;
    } catch (error: any) {
      console.error('Error deleting service provider:', error);
      toast.error(`Failed to delete service provider: ${error.message}`);
      return false;
    }
  },
};
