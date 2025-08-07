
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { Course } from "@/types";
import { courseService } from "@/services";
import { enrollClass, getEnrolledCourses, checkEnrollment } from "@/services/courses/enrollmentService";
import { GraduationCap, Clock, Users, BookOpen, Play, CalendarIcon, FileText } from "lucide-react";
import { toast } from "sonner";
import LoadingWithFeedback from "@/components/LoadingWithFeedback";
import { Class, CourseDocument, CustomForm } from "@/types";
import { formService } from "@/services/formService";
import EnrollmentForm from "@/components/EnrollmentForm";

const CourseDetails = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [customForm, setCustomForm] = useState<CustomForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState<string | null>(null); // Store classId being enrolled
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedClassForEnrollment, setSelectedClassForEnrollment] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      setIsLoading(true);
      try {
        const courseData = await courseService.getCourseById(courseId);
        setCourse(courseData);

        if (courseData) {
          const [classesData, documentsData, formData] = await Promise.all([
            courseService.getClassesForCourse(courseId),
            courseService.getDocumentsForCourse(courseId),
            formService.getFormForCourse(courseId),
          ]);
          setClasses(classesData);
          setDocuments(documentsData.map(d => ({...d, documentName: d.document_name, documentUrl: d.document_url, courseId: d.course_id, createdAt: d.created_at})));
          setCustomForm(formData);
        }

        if (user) {
          const { data } = await checkEnrollment(courseId, user.id);
          setIsEnrolled(!!data);
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
        toast.error("Erro ao carregar detalhes do curso");
        navigate("/courses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, navigate, user]);

  const handleEnroll = async (classId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (customForm) {
      setSelectedClassForEnrollment(classId);
      setIsFormModalOpen(true);
    } else {
      setIsEnrolling(classId);
      try {
        const result = await enrollClass(classId, user.id);
        if (result.success) {
          setIsEnrolled(true);
          toast.success(result.message || "Matrícula realizada com sucesso!");
        } else {
          toast.error(result.message || "Erro ao realizar matrícula");
        }
      } catch (error) {
        console.error("Error enrolling in class:", error);
        toast.error("Erro ao realizar matrícula");
      } finally {
        setIsEnrolling(null);
      }
    }
  };

  const startCourse = () => {
    if (courseId) {
      // This might need to be adapted to a class-specific player later
      navigate(`/aluno/curso/${courseId}/player`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <LoadingWithFeedback message="Carregando detalhes do curso..." />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p>Curso não encontrado</p>
        <Button className="mt-4" onClick={() => navigate("/courses")}>
          Voltar para Catálogo
        </Button>
      </div>
    );
  }

  const totalLessons = course.modules.reduce(
    (total, module) => total + module.lessons.length,
    0
  );

  return (
    <div className="space-y-8">
      {/* Course Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
          <p className="mt-2 text-muted-foreground">{course.description}</p>
          
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center">
              <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{course.instructor}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{course.enrolledCount} alunos</span>
            </div>
            <div className="flex items-center">
              <div className="text-yellow-500 mr-1">★</div>
              <span>{course.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <div className="md:w-1/3">
          <Card>
            <div className="aspect-video">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover rounded-t-lg"
              />
            </div>
            <CardContent className="p-6">
              {isEnrolled ? (
                <Button className="w-full" onClick={startCourse}>
                  Continuar Curso
                </Button>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Turmas Disponíveis</h3>
                  {classes.length > 0 ? (
                    classes.map((cls) => (
                      <Card key={cls.id} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{cls.name}</p>
                            {cls.startDate && (
                              <p className="text-sm text-muted-foreground">
                                Início em: {new Date(cls.startDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Button
                            onClick={() => handleEnroll(cls.id)}
                            disabled={isEnrolling === cls.id}
                          >
                            {isEnrolling === cls.id ? 'Matriculando...' : 'Matricular-se'}
                          </Button>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      Não há turmas abertas para este curso no momento.
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{course.modules.length} módulos</span>
                </div>
                <div className="flex items-center">
                  <Play className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{totalLessons} aulas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Course Content */}
      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules">Conteúdo do Curso</TabsTrigger>
          <TabsTrigger value="description">Sobre o Curso</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="modules" className="space-y-4 mt-4">
          <h2 className="text-2xl font-semibold">Módulos e Aulas</h2>
          
          {course.modules.length === 0 ? (
            <p className="text-muted-foreground">Este curso ainda não possui módulos</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {course.modules.map((module) => (
                <AccordionItem key={module.id} value={module.id}>
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <span className="font-medium">{module.title}</span>
                      <Badge variant="outline" className="ml-2">
                        {module.lessons.length} aulas
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-4">
                      {module.lessons.map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center">
                            <span className="text-muted-foreground mr-2">{index + 1}.</span>
                            <span>{lesson.title}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
        
        <TabsContent value="description" className="space-y-4 mt-4">
          <h2 className="text-2xl font-semibold">Sobre o Curso</h2>
          <div className="prose max-w-none">
            <p>{course.description}</p>
            
            {course.syllabus && (
              <>
                <h3 className="text-xl font-medium mt-4">Ementa</h3>
                <p>{course.syllabus}</p>
              </>
            )}

            {course.bibliography && (
              <>
                <h3 className="text-xl font-medium mt-4">Bibliografia</h3>
                <p>{course.bibliography}</p>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4 mt-4">
          <h2 className="text-2xl font-semibold">Documentos do Curso</h2>
          {documents.length > 0 ? (
            <ul className="space-y-2">
              {documents.map(doc => (
                <li key={doc.id}>
                  <a
                    href={doc.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    {doc.documentName}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Nenhum documento disponível para este curso.</p>
          )}
        </TabsContent>
      </Tabs>

      {customForm && selectedClassForEnrollment && (
        <EnrollmentForm
          form={customForm}
          classId={selectedClassForEnrollment}
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onEnrolled={() => setIsEnrolled(true)}
        />
      )}
    </div>
  );
};

export default CourseDetails;
