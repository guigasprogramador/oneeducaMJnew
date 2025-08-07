import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { prerequisiteService } from '@/services/courses/prerequisiteService';
import { courseService } from '@/services/api';
import { Course, CoursePrerequisite } from '@/types';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface PrerequisiteManagerProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PrerequisiteManager = ({ courseId, isOpen, onClose }: PrerequisiteManagerProps) => {
  const [prerequisites, setPrerequisites] = useState<CoursePrerequisite[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedPrerequisite, setSelectedPrerequisite] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [prereqs, courses] = await Promise.all([
            prerequisiteService.getPrerequisitesForCourse(courseId),
            courseService.getCourses(),
          ]);
          setPrerequisites(prereqs);
          setAllCourses(courses.filter(c => c.id !== courseId));
        } catch (error) {
          toast.error('Failed to load prerequisites data.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [courseId, isOpen]);

  const handleAddPrerequisite = async () => {
    if (!selectedPrerequisite) return;
    try {
      await prerequisiteService.addPrerequisite(courseId, selectedPrerequisite);
      setPrerequisites([...prerequisites, { courseId, prerequisiteId: selectedPrerequisite }]);
      setSelectedPrerequisite('');
      toast.success('Prerequisite added.');
    } catch (error) {
      toast.error('Failed to add prerequisite.');
    }
  };

  const handleRemovePrerequisite = async (prerequisiteId: string) => {
    try {
      await prerequisiteService.removePrerequisite(courseId, prerequisiteId);
      setPrerequisites(prerequisites.filter(p => p.prerequisiteId !== prerequisiteId));
      toast.success('Prerequisite removed.');
    } catch (error) {
      toast.error('Failed to remove prerequisite.');
    }
  };

  const getCourseTitle = (id: string) => allCourses.find(c => c.id === id)?.title || 'Unknown Course';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Prerequisites for Course</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Current Prerequisites</h4>
              <ul className="space-y-2 mt-2">
                {prerequisites.map(p => (
                  <li key={p.prerequisiteId} className="flex items-center justify-between">
                    <span>{getCourseTitle(p.prerequisiteId)}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleRemovePrerequisite(p.prerequisiteId)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
                {prerequisites.length === 0 && <p className="text-muted-foreground">No prerequisites.</p>}
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Add Prerequisite</h4>
              <div className="flex gap-2 mt-2">
                <Select value={selectedPrerequisite} onValueChange={setSelectedPrerequisite}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCourses
                      .filter(c => !prerequisites.some(p => p.prerequisiteId === c.id))
                      .map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddPrerequisite}>Add</Button>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrerequisiteManager;
