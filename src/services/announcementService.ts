import { supabase } from '@/integrations/supabase/client';
import { Announcement } from '@/types';

export const announcementService = {
  async createAnnouncement(announcementData: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        course_id: announcementData.courseId,
        class_id: announcementData.classId,
        title: announcementData.title,
        content: announcementData.content,
        created_by: announcementData.createdBy,
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, courseId: data.course_id, classId: data.class_id, createdBy: data.created_by, createdAt: data.created_at };
  },

  async getAnnouncementsForCourse(courseId: string): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('course_id', courseId)
      .is('class_id', null) // Announcements for the whole course
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(a => ({ ...a, courseId: a.course_id, classId: a.class_id, createdBy: a.created_by, createdAt: a.created_at }));
  },

  async getAnnouncementsForClass(classId: string): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(a => ({ ...a, courseId: a.course_id, classId: a.class_id, createdBy: a.created_by, createdAt: a.created_at }));
  },

  async deleteAnnouncement(announcementId: string): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);

    if (error) throw error;
  },

  async getAnnouncementsForUser(userId: string): Promise<Announcement[]> {
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('class_id, classes(course_id)')
      .eq('user_id', userId);

    if (enrollmentsError) throw enrollmentsError;
    if (!enrollments) return [];

    const classIds = enrollments.map(e => e.class_id);
    const courseIds = [...new Set(enrollments.map(e => e.classes?.course_id).filter(Boolean))];

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .or(`class_id.in.(${classIds.join(',')}),and(course_id.in.(${courseIds.join(',')}),class_id.is.null)`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(a => ({ ...a, courseId: a.course_id, classId: a.class_id, createdBy: a.created_by, createdAt: a.created_at }));
  }
};
