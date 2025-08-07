import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const enrollmentService = {
  async updateEnrollmentStatus(userId: string, courseId: string, status: string) {
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({ status })
        .eq('user_id', userId)
        .eq('course_id', courseId);

      if (error) {
        throw error;
      }

      toast.success(`Matrícula atualizada para ${status} com sucesso!`);
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar status da matrícula:', error);
      toast.error(`Falha ao atualizar status da matrícula: ${error.message}`);
      return false;
    }
  },
};
