import { useState, useEffect } from 'react';
import { announcementService } from '@/services/announcementService';
import { courseService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Announcement, Course, Class } from '@/types';

const AdminAnnouncements = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    courseService.getCourses().then(setCourses);
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      courseService.getClassesForCourse(selectedCourse).then(setClasses);
      fetchAnnouncements();
    } else {
      setClasses([]);
      setAnnouncements([]);
    }
  }, [selectedCourse]);

  useEffect(() => {
    fetchAnnouncements();
  }, [selectedClass]);

  const fetchAnnouncements = async () => {
    if (!selectedCourse) return;
    setIsLoading(true);
    try {
      const data = selectedClass
        ? await announcementService.getAnnouncementsForClass(selectedClass)
        : await announcementService.getAnnouncementsForCourse(selectedCourse);
      setAnnouncements(data);
    } catch (error) {
      toast.error('Failed to load announcements.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!selectedCourse || !newAnnouncement.title || !newAnnouncement.content || !user) {
      toast.error('Please select a course and fill in all fields.');
      return;
    }
    try {
      await announcementService.createAnnouncement({
        courseId: selectedCourse,
        classId: selectedClass || undefined,
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        createdBy: user.id,
      });
      setNewAnnouncement({ title: '', content: '' });
      fetchAnnouncements();
      toast.success('Announcement created.');
    } catch (error) {
      toast.error('Failed to create announcement.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manage Announcements</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create New Announcement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select onValueChange={setSelectedCourse} value={selectedCourse}>
              <SelectTrigger><SelectValue placeholder="Select a Course" /></SelectTrigger>
              <SelectContent>
                {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select onValueChange={setSelectedClass} value={selectedClass} disabled={!selectedCourse}>
              <SelectTrigger><SelectValue placeholder="Select a Class (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Title"
            value={newAnnouncement.title}
            onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
          />
          <Textarea
            placeholder="Content"
            value={newAnnouncement.content}
            onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
          />
          <Button onClick={handleCreateAnnouncement}>Create</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Existing Announcements</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p>Loading...</p> : (
            <ul className="space-y-4">
              {announcements.map(a => (
                <li key={a.id} className="p-4 border rounded-md">
                  <h3 className="font-bold">{a.title}</h3>
                  <p>{a.content}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Posted on {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
              {announcements.length === 0 && <p>No announcements found.</p>}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnnouncements;
