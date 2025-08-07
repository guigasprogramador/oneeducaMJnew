import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { calendarService } from '@/services/calendarService';
import { CalendarEvent } from '@/types';
import { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

const ClassEventManager = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEvent> | null>(null);

  useEffect(() => {
    if (classId) {
      calendarService.getEventsForClass(classId).then(data => {
        setEvents(data.map(e => ({ id: e.id, title: e.title, start: e.startTime, end: e.endTime })));
      });
    }
  }, [classId]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedEvent({ startTime: selectInfo.startStr, endTime: selectInfo.endStr });
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
      setIsModalOpen(true);
    }
  };

  const handleSaveEvent = async () => {
    if (selectedEvent && classId) {
      try {
        if (selectedEvent.id) {
          await calendarService.updateEvent(selectedEvent.id, selectedEvent);
        } else {
          await calendarService.createEvent({ ...selectedEvent, classId } as CalendarEvent);
        }
        setIsModalOpen(false);
        // Refetch events
        const data = await calendarService.getEventsForClass(classId);
        setEvents(data.map(e => ({ id: e.id, title: e.title, start: e.startTime, end: e.endTime })));
        toast.success('Event saved.');
      } catch (error) {
        toast.error('Failed to save event.');
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Manage Class Events</h1>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        selectable={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.id ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Title"
              value={selectedEvent?.title || ''}
              onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={selectedEvent?.description || ''}
              onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
            />
            <Input
              placeholder="Location"
              value={selectedEvent?.location || ''}
              onChange={(e) => setSelectedEvent({ ...selectedEvent, location: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEvent}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassEventManager;
