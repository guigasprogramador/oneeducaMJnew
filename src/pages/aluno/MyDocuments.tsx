import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { generatedDocumentService, GeneratedDocument } from '@/services/generatedDocumentService';
import { getEnrolledCourses } from '@/services/courses/enrollmentService';
import { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, PlusCircle, Loader2 } from 'lucide-react';

const MyDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [selectedCourseDecl, setSelectedCourseDecl] = useState<string>('');
  const [selectedCourseReport, setSelectedCourseReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingDecl, setIsGeneratingDecl] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [selectedCourseContract, setSelectedCourseContract] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [docs, courses] = await Promise.all([
          generatedDocumentService.getDocumentsForUser(user.id),
          getEnrolledCourses(user.id)
        ]);
        setDocuments(docs);
        setEnrolledCourses(courses);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load your documents and courses.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleGenerateDeclaration = async () => {
        if (!user || !selectedCourseDecl) {
      toast.warning('Please select a course to generate a declaration.');
      return;
    }

        setIsGeneratingDecl(true);
    try {
            const newDocument = await generatedDocumentService.generateEnrollmentDeclaration(user.id, selectedCourseDecl);
      if (newDocument) {
        setDocuments([newDocument, ...documents]);
        toast.success('Declaration generated successfully!');
      }
    } catch (error) {
      console.error('Error generating declaration:', error);
    } finally {
            setIsGeneratingDecl(false);
        }
    };

    const handleGenerateReportCard = async () => {
        if (!user || !selectedCourseReport) {
            toast.warning('Please select a course to generate a report card.');
            return;
        }

        setIsGeneratingReport(true);
        try {
            const newDocument = await generatedDocumentService.generateReportCard(user.id, selectedCourseReport);
            if (newDocument) {
                setDocuments([newDocument, ...documents]);
                toast.success('Report Card generated successfully!');
            }
        } catch (error) {
            console.error('Error generating report card:', error);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleGenerateIdCard = async () => {
        if (!user) return;

        setIsGeneratingId(true);
        try {
            const newDocument = await generatedDocumentService.generateStudentIdCard(user.id);
            if (newDocument) {
                setDocuments([newDocument, ...documents]);
                toast.success('Student ID Card generated successfully!');
            }
        } catch (error) {
            console.error('Error generating student ID card:', error);
        } finally {
            setIsGeneratingId(false);
    }
  };

    const handleGenerateTranscript = async () => {
        if (!user) return;

        setIsGeneratingTranscript(true);
        try {
            const newDocument = await generatedDocumentService.generateSchoolTranscript(user.id);
            if (newDocument) {
                setDocuments([newDocument, ...documents]);
                toast.success('School Transcript generated successfully!');
            }
        } catch (error) {
            console.error('Error generating school transcript:', error);
        } finally {
            setIsGeneratingTranscript(false);
        }
    };

    const handleGenerateContract = async () => {
        if (!user || !selectedCourseContract) {
            toast.warning('Please select a course to generate a contract.');
            return;
        }

        setIsGeneratingContract(true);
        try {
            const newDocument = await generatedDocumentService.generateServiceContract(user.id, selectedCourseContract);
            if (newDocument) {
                setDocuments([newDocument, ...documents]);
                toast.success('Service Contract generated successfully!');
            }
        } catch (error) {
            console.error('Error generating service contract:', error);
        } finally {
            setIsGeneratingContract(false);
        }
    };

  const viewDocument = (htmlContent: string) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    } else {
      toast.error("Please allow pop-ups to view the document.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Meus Documentos</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Gerar Novos Documentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg">
            <div className="flex-grow">
              <h3 className="font-semibold">Declaração de Matrícula</h3>
              <p className="text-sm text-muted-foreground">Gera um documento comprovando sua matrícula em um curso.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <Select onValueChange={setSelectedCourseDecl} value={selectedCourseDecl}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {enrolledCourses.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleGenerateDeclaration} disabled={isGeneratingDecl || !selectedCourseDecl} className="w-full sm:w-auto">
                {isGeneratingDecl ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</>
                ) : (
                  <><PlusCircle className="mr-2 h-4 w-4" /> Gerar</>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg">
            <div className="flex-grow">
              <h3 className="font-semibold">Boletim do Curso</h3>
              <p className="text-sm text-muted-foreground">Gera um boletim com suas notas no curso selecionado.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <Select onValueChange={setSelectedCourseReport} value={selectedCourseReport}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {enrolledCourses.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleGenerateReportCard} disabled={isGeneratingReport || !selectedCourseReport} className="w-full sm:w-auto">
                {isGeneratingReport ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</>
                ) : (
                  <><PlusCircle className="mr-2 h-4 w-4" /> Gerar</>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Carteira de Estudante</h3>
              <p className="text-sm text-muted-foreground">Gera sua carteira de identificação de estudante.</p>
            </div>
            <Button onClick={handleGenerateIdCard} disabled={isGeneratingId}>
              {isGeneratingId ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</>
              ) : (
                <><PlusCircle className="mr-2 h-4 w-4" /> Gerar Carteirinha</>
              )}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Histórico Escolar</h3>
              <p className="text-sm text-muted-foreground">Gera seu histórico escolar completo com todos os cursos.</p>
            </div>
            <Button onClick={handleGenerateTranscript} disabled={isGeneratingTranscript}>
              {isGeneratingTranscript ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</>
              ) : (
                <><PlusCircle className="mr-2 h-4 w-4" /> Gerar Histórico</>
              )}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg">
            <div className="flex-grow">
              <h3 className="font-semibold">Contrato de Serviço</h3>
              <p className="text-sm text-muted-foreground">Gera o contrato de prestação de serviço para um curso.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <Select onValueChange={setSelectedCourseContract} value={selectedCourseContract}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {enrolledCourses.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleGenerateContract} disabled={isGeneratingContract || !selectedCourseContract} className="w-full sm:w-auto">
                {isGeneratingContract ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</>
                ) : (
                  <><PlusCircle className="mr-2 h-4 w-4" /> Gerar</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos Gerados</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <ul className="space-y-4">
              {documents.map(doc => (
                <li key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-6 w-6 mr-4 text-primary" />
                    <div>
                      <p className="font-semibold">{doc.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Emitido em: {new Date(doc.issueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => viewDocument(doc.contentHtml)}>
                    Visualizar
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground py-8">Você ainda não gerou nenhum documento.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyDocuments;
