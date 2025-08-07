import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { academicWorkService } from '@/services/academicWorkService';
import { AcademicWork, Class } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';

interface Profile {
    id: string;
    name: string;
}

interface WorkByStudent {
    student: Profile;
    works: AcademicWork[];
}

const ProfessorSubmissions = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [submissions, setSubmissions] = useState<WorkByStudent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [professorId, setProfessorId] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfessorId = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setProfessorId(user.id);
            }
        };
        fetchProfessorId();
    }, []);

    useEffect(() => {
        if (!professorId) return;

        const fetchClasses = async () => {
            const { data, error } = await supabase
                .from('classes')
                .select('id, name, course_id, courses(title)') // Assuming a relationship to courses
                .eq('instructor_id', professorId);

            if (error) {
                console.error("Error fetching classes:", error);
            } else {
                // Manually shape data if relationship doesn't exist or isn't named 'courses'
                const shapedClasses = data.map(c => ({
                    ...c,
                    courseTitle: c.courses?.title || 'Curso Desconhecido'
                }));
                setClasses(shapedClasses as any);
            }
        };

        fetchClasses();
    }, [professorId]);

    useEffect(() => {
        if (!selectedClassId) {
            setSubmissions([]);
            return;
        };

        const fetchSubmissions = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch all works for the class
                const allWorks = await academicWorkService.getAcademicWorksByClass(selectedClassId);

                // 2. Get all unique student IDs from the works
                const studentIds = [...new Set(allWorks.map(w => w.userId))];

                if (studentIds.length === 0) {
                    setSubmissions([]);
                    setIsLoading(false);
                    return;
                }

                // 3. Fetch profiles for these students
                const { data: profiles, error } = await supabase
                    .from('profiles')
                    .select('id, name')
                    .in('id', studentIds);

                if (error) throw error;

                // 4. Group works by student
                const groupedByStudent: WorkByStudent[] = profiles.map(profile => ({
                    student: profile,
                    works: allWorks.filter(work => work.userId === profile.id)
                }));

                setSubmissions(groupedByStudent);

            } catch (error) {
                console.error("Error fetching submissions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubmissions();
    }, [selectedClassId]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Trabalhos dos Alunos</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Selecione uma Turma</CardTitle>
                    <Select onValueChange={setSelectedClassId} value={selectedClassId || ''}>
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map((c: any) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name} ({c.courseTitle})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p>Carregando trabalhos...</p>
                    ) : submissions.length > 0 ? (
                        <div className="space-y-4">
                            {submissions.map(({ student, works }) => (
                                <div key={student.id}>
                                    <h3 className="font-semibold text-lg">{student.name}</h3>
                                    <ul className="pl-4 mt-2 space-y-2 border-l">
                                        {works.map(work => (
                                            <li key={work.id} className="flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-muted-foreground" />
                                                <a href={work.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    {work.title}
                                                </a>
                                                <span className="text-xs text-muted-foreground">
                                                    - {new Date(work.createdAt).toLocaleString()}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">
                            {selectedClassId ? "Nenhum trabalho enviado para esta turma ainda." : "Por favor, selecione uma turma para ver os trabalhos."}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfessorSubmissions;
