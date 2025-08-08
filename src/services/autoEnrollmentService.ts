import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { courseService } from './api';

/**
 * Service to automatically enroll users in classes.
 */
export const autoEnrollmentService = {
  /**
   * Enrolls a user in the first available class of all courses.
   * @param userId The ID of the user to enroll.
   * @returns An array of class IDs the user was enrolled in.
   */
  async enrollUserInAllCourses(userId: string): Promise<string[]> {
    try {
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (userError || !userProfile) {
        throw new Error(`User not found: ${userError?.message || 'Profile does not exist'}`);
      }

      const { data: availableCourses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title');
      
      if (coursesError) throw coursesError;
      if (!availableCourses || availableCourses.length === 0) return [];

      const successfulEnrollments: string[] = [];

      for (const course of availableCourses) {
        const classes = await courseService.getClassesForCourse(course.id);
        if (classes.length > 0) {
          const classToEnroll = classes[0]; // Enroll in the first available class

          const { data: existing } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', userId)
            .eq('class_id', classToEnroll.id)
            .maybeSingle();

          if (!existing) {
            const result = await courseService.enrollClass(classToEnroll.id, userId);
            if (result.success) {
              successfulEnrollments.push(classToEnroll.id);
            }
          }
        }
      }
      
      if (successfulEnrollments.length > 0) {
        toast.success(`User automatically enrolled in ${successfulEnrollments.length} classes.`);
      }
      
      return successfulEnrollments;
    } catch (error) {
      console.error('Error during auto-enrollment:', error);
      toast.error(`Auto-enrollment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  },
  
  /**
   * Enrolls all users in the first available class of a specific course.
   * @param courseId The ID of the course.
   * @returns An array of user IDs that were enrolled.
   */
  async enrollAllUsersInCourse(courseId: string): Promise<string[]> {
    try {
      const classes = await courseService.getClassesForCourse(courseId);
      if (classes.length === 0) {
        toast.warning('No classes available for this course to enroll users.');
        return [];
      }
      const classToEnroll = classes[0]; // Enroll users in the first available class

      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'student');
      
      if (usersError) throw usersError;
      if (!users || users.length === 0) return [];

      const { data: existingEnrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('user_id')
        .eq('class_id', classToEnroll.id);
      
      if (enrollmentsError) throw enrollmentsError;

      const enrolledUserIds = new Set(existingEnrollments?.map(e => e.user_id) || []);
      const usersToEnroll = users.filter(user => !enrolledUserIds.has(user.id));
      
      if (usersToEnroll.length === 0) {
        toast.info('All users are already enrolled in a class for this course.');
        return [];
      }

      const successfulEnrollments: string[] = [];
      for (const user of usersToEnroll) {
        const result = await courseService.enrollClass(classToEnroll.id, user.id);
        if (result.success) {
          successfulEnrollments.push(user.id);
        }
      }
      
      if (successfulEnrollments.length > 0) {
        toast.success(`${successfulEnrollments.length} users were automatically enrolled in the class.`);
      }
      
      return successfulEnrollments;
    } catch (error) {
      console.error('Error enrolling all users in course:', error);
      toast.error(`Failed to enroll all users: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }
};
