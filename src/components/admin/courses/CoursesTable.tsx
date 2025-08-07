import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Course } from "@/types";
import { MoreHorizontal, Edit, Trash, BookOpen, GitBranch, FileText, Users, ClipboardList } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import PrerequisiteManager from "./PrerequisiteManager";
import CourseDocumentsManager from "./CourseDocumentsManager";
import { useState } from "react";

interface CoursesTableProps {
  courses: Course[];
  isLoading: boolean;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  viewMode?: "table" | "grid";
}

const CoursesTable: React.FC<CoursesTableProps> = ({
  courses,
  isLoading,
  onEditCourse,
  onDeleteCourse,
  viewMode = "table",
}) => {
  const navigate = useNavigate();
  const [isPrereqModalOpen, setIsPrereqModalOpen] = useState(false);
  const [selectedCourseForPrereq, setSelectedCourseForPrereq] = useState<string | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedCourseForDoc, setSelectedCourseForDoc] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p>Carregando cursos...</p>
      </div>
    );
  }

  if (viewMode === "table") {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Instrutor</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead className="text-right">Alunos</TableHead>
              <TableHead className="text-right">Módulos</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nenhum curso encontrado
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>{course.instructor}</TableCell>
                  <TableCell>{course.duration}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{course.enrolledCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{course.moduleCount || course.modules.length || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditCourse(course)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeleteCourse(course.id)}>
                          <Trash className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/admin/modules?courseId=${course.id}`)}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Gerenciar Módulos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCourseForPrereq(course.id);
                            setIsPrereqModalOpen(true);
                          }}
                        >
                          <GitBranch className="h-4 w-4 mr-2" />
                          Gerenciar Pré-requisitos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCourseForDoc(course.id);
                            setIsDocModalOpen(true);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Gerenciar Documentos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/admin/course/${course.id}/classes`)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Gerenciar Turmas
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/admin/course/${course.id}/form`)}
                        >
                          <ClipboardList className="h-4 w-4 mr-2" />
                          Gerenciar Formulário
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {selectedCourseForPrereq && (
          <PrerequisiteManager
            courseId={selectedCourseForPrereq}
            isOpen={isPrereqModalOpen}
            onClose={() => {
              setIsPrereqModalOpen(false);
              setSelectedCourseForPrereq(null);
            }}
          />
        )}
        {selectedCourseForDoc && (
          <CourseDocumentsManager
            courseId={selectedCourseForDoc}
            isOpen={isDocModalOpen}
            onClose={() => {
              setIsDocModalOpen(false);
              setSelectedCourseForDoc(null);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Nenhum curso encontrado</p>
          </div>
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <Badge variant="outline">{course.duration}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Instrutor: {course.instructor}</p>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">Alunos:</span>
                      <Badge variant="outline">{course.enrolledCount}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">Módulos:</span>
                      <Badge variant="outline">{course.moduleCount || course.modules.length || 0}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex flex-wrap justify-start gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditCourse(course)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteCourse(course.id)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/modules?courseId=${course.id}`)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Módulos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCourseForPrereq(course.id);
                    setIsPrereqModalOpen(true);
                  }}
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  Pré-requisitos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCourseForDoc(course.id);
                    setIsDocModalOpen(true);
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Documentos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/course/${course.id}/classes`)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Turmas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/course/${course.id}/form`)}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Formulário
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      {selectedCourseForPrereq && (
        <PrerequisiteManager
          courseId={selectedCourseForPrereq}
          isOpen={isPrereqModalOpen}
          onClose={() => {
            setIsPrereqModalOpen(false);
            setSelectedCourseForPrereq(null);
          }}
        />
      )}
      {selectedCourseForDoc && (
        <CourseDocumentsManager
          courseId={selectedCourseForDoc}
          isOpen={isDocModalOpen}
          onClose={() => {
            setIsDocModalOpen(false);
            setSelectedCourseForDoc(null);
          }}
        />
      )}
    </>
  );
};

export default CoursesTable;
