import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '@/contexts/AuthContext';
import { calendarService } from '@/services/calendarService';
import { CalendarEvent } from '@/types';
import { toast } from 'sonner';

const Calendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      calendarService.getEventsForUser(user.id)
        .then(data => {
          const formattedEvents = data.map(event => ({
            id: event.id,
            title: event.title,
            start: event.startTime,
            end: event.endTime,
            extendedProps: {
              description: event.description,
              location: event.location,
            }
          }));
          setEvents(formattedEvents);
          setIsLoading(false);
        })
        .catch(() => {
          toast.error('Failed to load calendar events.');
          setIsLoading(false);
        });
    }
  }, [user]);

  if (isLoading) return <p>Loading calendar...</p>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Calendar</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          eventClick={(info) => {
            alert(
              `Event: ${info.event.title}\n` +
              `Description: ${info.event.extendedProps.description || 'N/A'}\n` +
              `Location: ${info.event.extendedProps.location || 'N/A'}`
            );
          }}
        />
      </div>
    </div>
  );
};

export default Calendar;
