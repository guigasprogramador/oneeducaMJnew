import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { enrollmentService, courseService } from "@/services/api";
import { Class } from "@/types";

interface CourseWithClasses {
  id: string;
  title: string;
  classes: Class[];
}

interface CourseSelectorProps {
  userId: string;
  onEnrollmentComplete?: () => void;
}

const CourseSelector = ({ userId, onEnrollmentComplete }: CourseSelectorProps) => {
  const [courses, setCourses] = useState<CourseWithClasses[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    const fetchCoursesAndClasses = async () => {
      setIsLoading(true);
      try {
        const { data: coursesData, error: coursesError } = await supabase.from('courses').select('id, title');
        if (coursesError) throw coursesError;
        if (!coursesData) return;

        const coursesWithClasses = await Promise.all(
          coursesData.map(async (course) => {
            const classes = await courseService.getClassesForCourse(course.id);
            return { ...course, classes };
          })
        );
        setCourses(coursesWithClasses);

        if (userId) {
          const { data: enrollments, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select('class_id')
            .eq('user_id', userId);
          
          if (enrollmentsError) throw enrollmentsError;
          if (enrollments) {
            const enrolledIds = enrollments.map(e => e.class_id);
            setEnrolledClasses(enrolledIds);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load course data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCoursesAndClasses();
  }, [userId]);

  const handleClassToggle = (classId: string) => {
    setSelectedClasses(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const handleEnrollUser = async () => {
    if (!userId || selectedClasses.length === 0) {
      toast.error('Select at least one class to enroll the user.');
      return;
    }
    
    setIsEnrolling(true);
    try {
      const enrollmentPromises = selectedClasses.map(classId =>
        enrollmentService.enrollClass(classId, userId)
      );
      
      const results = await Promise.all(enrollmentPromises);
      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        toast.success(`User successfully enrolled in ${successCount} class(es).`);
        setEnrolledClasses(prev => [...prev, ...selectedClasses]);
        setSelectedClasses([]);
        if (onEnrollmentComplete) onEnrollmentComplete();
      } else {
        toast.error('Could not enroll the user in the selected classes.');
      }
    } catch (error) {
      console.error('Error enrolling user:', error);
      toast.error('Error processing enrollments.');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading courses and classes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Enroll in Classes</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select the classes to enroll this user in.
        </p>
      </div>
      
      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No courses available.</p>
      ) : (
        <>
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
            <Accordion type="multiple" className="w-full">
              {courses.map(course => (
                <AccordionItem key={course.id} value={course.id}>
                  <AccordionTrigger>{course.title}</AccordionTrigger>
                  <AccordionContent>
                    {course.classes.length > 0 ? (
                      course.classes.map(cls => {
                        const isEnrolled = enrolledClasses.includes(cls.id);
                        return (
                          <div key={cls.id} className="flex items-start space-x-2 py-1 pl-4">
                            <Checkbox
                              id={`class-${cls.id}`}
                              checked={selectedClasses.includes(cls.id)}
                              disabled={isEnrolled}
                              onCheckedChange={() => handleClassToggle(cls.id)}
                            />
                            <Label htmlFor={`class-${cls.id}`} className={`cursor-pointer ${isEnrolled ? 'text-muted-foreground' : ''}`}>
                              {cls.name}
                              {isEnrolled && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  Enrolled
                                </span>
                              )}
                            </Label>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground pl-4">No classes available for this course.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleEnrollUser} 
              disabled={selectedClasses.length === 0 || isEnrolling}
            >
              {isEnrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enroll in {selectedClasses.length} class(es)
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default CourseSelector;
