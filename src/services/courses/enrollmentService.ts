import { Course, Class } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Get enrolled courses for a user.
 * Fetches courses the user is enrolled in via their classes.
 */
export const getEnrolledCourses = async (userId: string): Promise<Course[]> => {
  try {
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('*, classes(*, courses(*))')
      .eq('user_id', userId);

    if (error) throw error;
    if (!enrollments) return [];

    const courses = enrollments.map(enrollment => {
      const courseData = enrollment.classes?.courses;
      if (!courseData) return null;

      return {
        ...courseData,
        description: courseData.description || '',
        thumbnail: courseData.thumbnail || '/placeholder.svg',
        duration: courseData.duration || '',
        enrolledCount: courseData.enrolledcount || 0,
        rating: courseData.rating || 0,
        modules: [], // Modules loaded on demand
        createdAt: courseData.created_at,
        updatedAt: courseData.updated_at,
        isEnrolled: true,
        progress: enrollment.progress || 0,
      };
    }).filter((c): c is Course => c !== null);

    return courses;
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    throw error;
  }
};

/**
 * Get details for a specific class a user is enrolled in.
 */
export const getEnrolledClassDetails = async (userId: string, classId: string): Promise<{ course: Course, classInfo: Class } | null> => {
    try {
        const { data: enrollment, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('*, classes(*, courses(*, modules(*, lessons(*))))')
            .eq('user_id', userId)
            .eq('class_id', classId)
            .single();

        if (enrollmentError || !enrollment || !enrollment.classes || !enrollment.classes.courses) {
            console.log('User is not enrolled in this class or class details are missing.');
            return null;
        }

        const courseData = enrollment.classes.courses;
        const classData = enrollment.classes;

        const course: Course = {
            ...courseData,
            description: courseData.description || '',
            thumbnail: courseData.thumbnail || '/placeholder.svg',
            duration: courseData.duration || '',
            enrolledCount: courseData.enrolledcount || 0,
            rating: courseData.rating || 0,
            modules: courseData.modules.map(m => ({
                ...m,
                courseId: m.course_id,
                order: m.order_number,
                lessons: m.lessons.map(l => ({...l, moduleId: l.module_id, order: l.order_number}))
            })),
            createdAt: courseData.created_at,
            updatedAt: courseData.updated_at,
            isEnrolled: true,
            progress: enrollment.progress || 0,
        };

        const classInfo: Class = {
            id: classData.id,
            courseId: classData.course_id,
            name: classData.name,
            instructorId: classData.instructor_id,
            startDate: classData.start_date,
            endDate: classData.end_date,
            createdAt: classData.created_at,
            updatedAt: classData.updated_at,
        };

        return { course, classInfo };
    } catch (error) {
        console.error('Error fetching enrolled class details:', error);
        return null;
    }
};


/**
 * Enroll a user in a class.
 */
export const enrollClass = async (classId: string, userId: string): Promise<{ success: boolean; message: string; enrollment?: any }> => {
  try {
    if (!classId || !userId) {
      return { success: false, message: 'Class ID or User ID is invalid.' };
    }

    const { data: existing, error: checkError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('class_id', classId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      return { success: true, message: 'User is already enrolled in this class.', enrollment: existing };
    }

    const { data, error } = await supabase
      .from('enrollments')
      .insert({ user_id: userId, class_id: classId, progress: 0, enrolled_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;

    return { success: true, message: 'Enrolled successfully!', enrollment: data };
  } catch (error: any) {
    console.error('Error enrolling in class:', error);
    return { success: false, message: `Failed to enroll: ${error.message}` };
  }
};

/**
 * Update class progress.
 */
export const updateClassProgress = async (classId: string, userId: string, progress: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('enrollments')
      .update({ progress })
      .eq('user_id', userId)
      .eq('class_id', classId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating class progress:', error);
    throw error;
  }
};

/**
 * Check if a user is enrolled in any class of a specific course.
 */
export const checkEnrollment = async (courseId: string, userId:string) => {
  try {
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id')
      .eq('course_id', courseId);

    if (classesError) throw classesError;
    if (!classes || classes.length === 0) return { data: null, error: null };

    const classIds = classes.map(c => c.id);

    const { data, error } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('user_id', userId)
      .in('class_id', classIds)
      .limit(1)
      .maybeSingle();

    return { data, error };
  } catch (error) {
    console.error('Error checking enrollment:', error);
    throw error;
  }
};

/**
 * Get all users enrolled in any class of a specific course.
 */
export const getEnrolledUsers = async (courseId: string) => {
  try {
    if (!courseId) {
      toast.error('Course ID not provided');
      return [];
    }

    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id')
      .eq('course_id', courseId);

    if (classesError) throw classesError;
    if (!classes || classes.length === 0) return [];

    const classIds = classes.map(c => c.id);

    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('user_id, progress, enrolled_at, classes(name)')
      .in('class_id', classIds);

    if (enrollmentsError) throw enrollmentsError;
    if (!enrollments) return [];

    const userIds = [...new Set(enrollments.map(e => e.user_id).filter(Boolean))];
    if (userIds.length === 0) return [];
    
    const enrollmentMap = new Map();
    enrollments.forEach(e => {
        enrollmentMap.set(e.user_id, {
            progress: e.progress,
            enrolledAt: e.enrolled_at,
            className: e.classes?.name || 'N/A'
        });
    });

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) throw profilesError;
    if (!profiles) return [];

    const enrolledUsers = profiles.map(profile => {
        const enrollmentData = enrollmentMap.get(profile.id) || {};
        return {
          id: profile.id,
          name: profile.name || 'User',
          email: profile.email || '',
          role: profile.role || 'student',
          avatarUrl: profile.avatar_url || '',
          createdAt: profile.created_at || new Date().toISOString(),
          enrolledAt: enrollmentData.enrolledAt,
          progress: enrollmentData.progress || 0,
          className: enrollmentData.className
        };
      });

    return enrolledUsers;
  } catch (error) {
    console.error('Error getting enrolled users:', error);
    toast.error('Failed to get enrolled users.');
    return [];
  }
};
