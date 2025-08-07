import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types';

export const calendarService = {
  async createEvent(eventData: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        class_id: eventData.classId,
        title: eventData.title,
        description: eventData.description,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        location: eventData.location,
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, classId: data.class_id, startTime: data.start_time, endTime: data.end_time };
  },

  async getEventsForClass(classId: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('class_id', classId)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data.map(e => ({ ...e, classId: e.class_id, startTime: e.start_time, endTime: e.end_time }));
  },

  async getEventsForUser(userId: string): Promise<CalendarEvent[]> {
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('user_id', userId);

    if (enrollmentsError) throw enrollmentsError;
    if (!enrollments) return [];

    const classIds = enrollments.map(e => e.class_id);

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .in('class_id', classIds)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data.map(e => ({ ...e, classId: e.class_id, startTime: e.start_time, endTime: e.end_time }));
  },

  async updateEvent(eventId: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        title: eventData.title,
        description: eventData.description,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        location: eventData.location,
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return { ...data, classId: data.class_id, startTime: data.start_time, endTime: data.end_time };
  },

  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  },
};
