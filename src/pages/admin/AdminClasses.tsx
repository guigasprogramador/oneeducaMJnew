import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '@/services/courseService';
import { calendarService } from '@/services/calendarService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Class, CalendarEvent } from '@/types';
import { toast } from 'sonner';
import { Plus, Edit, Trash, Calendar as CalendarIcon } from 'lucide-react';
// I will need a form for creating/editing classes and another for events.
// For now, I will just display the classes and a button to manage events.

const AdminClasses = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      courseService.getClassesForCourse(courseId)
        .then(setClasses)
        .catch(() => toast.error('Failed to load classes.'))
        .finally(() => setIsLoading(false));
    }
  }, [courseId]);

  // Placeholder for managing events
  const handleManageEvents = (classId: string) => {
    // This will navigate to a new page for managing events for a class
    navigate(`/admin/class/${classId}/events`);
  };

  if (isLoading) return <p>Loading classes...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manage Classes</h1>
      <Card>
        <CardHeader>
          <CardTitle>Classes for Course</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map(cls => (
                <TableRow key={cls.id}>
                  <TableCell>{cls.name}</TableCell>
                  <TableCell>{cls.startDate ? new Date(cls.startDate).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{cls.endDate ? new Date(cls.endDate).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleManageEvents(cls.id)}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Manage Events
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminClasses;
