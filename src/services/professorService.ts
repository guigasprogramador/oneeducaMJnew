import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProfessorDetails {
  id?: string;
  user_id: string;
  bio?: string;
  specialization?: string;
  qualifications?: string[];
  availability?: any;
}

export const professorService = {
  async getProfessorDetails(userId: string): Promise<ProfessorDetails | null> {
    try {
      const { data, error } = await supabase
        .from('professor_details')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // PostgREST error code for "Not a single row was found"
          return null;
        }
        throw error;
      }
      return data;
    } catch (error: any) {
      console.error('Error fetching professor details:', error);
      toast.error(`Failed to fetch professor details: ${error.message}`);
      return null;
    }
  },

  async updateProfessorDetails(details: ProfessorDetails): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('professor_details')
        .update({
          bio: details.bio,
          specialization: details.specialization,
          qualifications: details.qualifications,
          availability: details.availability,
        })
        .eq('user_id', details.user_id);

      if (error) {
        throw error;
      }

      toast.success('Professor details updated successfully!');
      return true;
    } catch (error: any) {
      console.error('Error updating professor details:', error);
      toast.error(`Failed to update professor details: ${error.message}`);
      return false;
    }
  },

  async createProfessorDetails(details: ProfessorDetails): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('professor_details')
        .insert(details);

      if (error) {
        throw error;
      }

      toast.success('Professor details created successfully!');
      return true;
    } catch (error: any) {
      console.error('Error creating professor details:', error);
      toast.error(`Failed to create professor details: ${error.message}`);
      return false;
    }
  },

  async getTaughtCourses(professorId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('courses_taught')
        .select(`
          hours_logged,
          course:courses(title)
        `)
        .eq('professor_id', professorId);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching taught courses:', error);
      toast.error('Failed to fetch taught courses.');
      return [];
    }
  },

  async getProfessorPayments(professorId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('professor_payments')
        .select('*')
        .eq('professor_id', professorId);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching professor payments:', error);
      toast.error('Failed to fetch professor payments.');
      return [];
    }
  },
};
