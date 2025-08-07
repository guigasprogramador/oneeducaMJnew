import { supabase } from '@/integrations/supabase/client';
import { CoursePrerequisite } from '@/types';

export const prerequisiteService = {
  async getPrerequisitesForCourse(courseId: string): Promise<CoursePrerequisite[]> {
    if (!courseId) throw new Error('Course ID is required');
    try {
      const { data, error } = await supabase
        .from('course_prerequisites')
        .select('*')
        .eq('course_id', courseId);
      if (error) throw error;
      return data.map(p => ({ courseId: p.course_id, prerequisiteId: p.prerequisite_id }));
    } catch (error) {
      console.error('Error fetching prerequisites:', error);
      throw error;
    }
  },

  async addPrerequisite(courseId: string, prerequisiteId: string): Promise<void> {
    if (!courseId || !prerequisiteId) throw new Error('Course ID and Prerequisite ID are required');
    try {
      const { error } = await supabase
        .from('course_prerequisites')
        .insert({ course_id: courseId, prerequisite_id: prerequisiteId });
      if (error) throw error;
    } catch (error) {
      console.error('Error adding prerequisite:', error);
      throw error;
    }
  },

  async removePrerequisite(courseId: string, prerequisiteId: string): Promise<void> {
    if (!courseId || !prerequisiteId) throw new Error('Course ID and Prerequisite ID are required');
    try {
      const { error } = await supabase
        .from('course_prerequisites')
        .delete()
        .eq('course_id', courseId)
        .eq('prerequisite_id', prerequisiteId);
      if (error) throw error;
    } catch (error) {
      console.error('Error removing prerequisite:', error);
      throw error;
    }
  },
};
