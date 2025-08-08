import { Course, Module, Lesson, Class } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { requestQueue } from '@/utils/requestQueue';
import type {
  ExtendedCourse,
  CourseStatus,
  CreateCourseForm,
  CourseFilters,
  ProfessorStats,
} from '@/types/professor';
import { Database } from '@/types/database';

// Tipos para inserção e atualização, derivados do 'database.ts' para garantir a correspondência.
type CourseInsert = Database['public']['Tables']['courses']['Insert'];
type CourseUpdate = Database['public']['Tables']['courses']['Update'];

// Função auxiliar para mapear um objeto de curso do banco de dados (snake_case) para o tipo da aplicação (camelCase)
const mapDbCourseToExtendedCourse = (
  course: any,
  relations: {
    enrollmentsCount?: number;
    modulesCount?: number;
    modules?: Module[];
    professorName?: string;
  } = {}
): ExtendedCourse => {
  return {
    id: course.id,
    title: course.title,
    description: course.description || '',
    thumbnail: course.thumbnail || '/placeholder.svg',
    duration: course.duration || '',
    instructor: course.instructor,
    enrolledCount: relations.enrollmentsCount ?? course.enrolledcount ?? 0,
    rating: course.rating || 0,
    modules: relations.modules ?? [],
    createdAt: course.created_at,
    updatedAt: course.updated_at,
    isEnrolled: false, // Este valor deve ser definido com base no contexto do usuário logado
    progress: 0, // Idem
    professorId: course.professor_id,
    status: (course.status as CourseStatus) || 'pending',
    expiryDate: course.expiry_date,
    modulesCount: relations.modulesCount ?? 0,
    professorName: relations.professorName || 'N/A',
    // Adicionando os novos campos do schema
    category: course.category,
    hasEvaluativeActivity: course.has_evaluative_activity,
    evaluativeActivityDescription: course.evaluative_activity_description,
    syllabus: course.syllabus,
    bibliography: course.bibliography,
    origin: course.origin,
    nature: course.nature,
  };
};


const courseService = {
  // Busca cursos públicos e aprovados para o catálogo
  async getCourses(): Promise<Course[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*, modules(id, title, order_number, lessons(id)), classes(id, enrollments(id))')
        .eq('status', 'approved')
        .order('title', { ascending: true });

      if (error) throw error;
      if (!data) return [];

      return data.map(course => {
        const enrollmentsCount = course.classes.reduce((acc, currentClass) => acc + (currentClass.enrollments?.length || 0), 0);

        return mapDbCourseToExtendedCourse(course, {
          enrollmentsCount,
          modules: (course.modules || []).map(mod => ({
            ...mod,
            courseId: course.id,
            order: mod.order_number,
            lessons: (mod.lessons || []).map(les => ({ ...les, moduleId: mod.id, order: 0 })) // A ordem da aula não é relevante aqui
          }))
        })
      });
    } catch (error) {
      console.error('Erro ao buscar cursos:', error);
      throw new Error('Falha ao buscar cursos.');
    }
  },

  // Cria um novo curso
  async createCourse(courseData: CreateCourseForm & { professor_id?: string; status?: CourseStatus }): Promise<ExtendedCourse> {
    if (!courseData?.title?.trim()) throw new Error('Título do curso é obrigatório');
    if (!courseData?.instructor?.trim()) throw new Error('Nome do instrutor é obrigatório');

    try {
      const courseToInsert: CourseInsert = {
        title: courseData.title.trim(),
        description: courseData.description?.trim() || null,
        thumbnail: courseData.thumbnail?.trim() || null,
        duration: courseData.duration?.trim() || null,
        instructor: courseData.instructor.trim(),
        professor_id: courseData.professor_id || null,
        status: courseData.status || 'pending',
        expiry_date: courseData.expiryDate || null,
        // Campos com valores padrão no DB não precisam ser enviados, a menos que queiramos especificá-los
      };

      const { data, error } = await supabase
        .from('courses')
        .insert(courseToInsert)
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Nenhum dado retornado após criar o curso');

      return mapDbCourseToExtendedCourse(data);
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      throw new Error('Falha ao criar curso');
    }
  },

  // Atualiza um curso existente
  async updateCourse(courseId: string, courseData: Partial<CreateCourseForm>): Promise<ExtendedCourse> {
    if (!courseId) throw new Error('ID do curso é obrigatório');

    const updates: CourseUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (courseData.title) updates.title = courseData.title.trim();
    if (courseData.description) updates.description = courseData.description.trim();
    if (courseData.thumbnail) updates.thumbnail = courseData.thumbnail.trim();
    if (courseData.duration) updates.duration = courseData.duration.trim();
    if (courseData.instructor) updates.instructor = courseData.instructor.trim();
    if (courseData.expiryDate) updates.expiry_date = courseData.expiryDate;
    // Adicione outros campos atualizáveis aqui

    try {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .select('*')
        .single();

      if (error) throw error;

      return mapDbCourseToExtendedCourse(data);
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      throw new Error('Falha ao atualizar curso');
    }
  },

  // Deleta um curso
  async deleteCourse(courseId: string): Promise<void> {
    if (!courseId) throw new Error('ID do curso é obrigatório');
    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir curso:', error);
      throw new Error('Falha ao excluir curso');
    }
  },

  // Busca um curso por ID com todas as suas relações
  async getCourseById(courseId: string): Promise<Course | null> {
    if (!courseId) return null;

    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          modules (
            *,
            lessons (
              *,
              lesson_progress (
                completed
              )
            )
          ),
          classes (
            id,
            enrollments(id)
          )
        `)
        .eq('id', courseId)
        .single();

      if (error || !data) {
        if (error && error.code !== 'PGRST116') { // PGRST116: no rows returned
          console.error('Erro ao buscar curso por ID:', error);
        }
        return null;
      }
      
      const enrollmentsCount = data.classes.reduce((acc, cls) => acc + (cls.enrollments?.length || 0), 0);
      
      const modules = (data.modules || []).map(mod => ({
        id: mod.id,
        courseId: data.id,
        title: mod.title,
        description: mod.description || '',
        order: mod.order_number,
        lessons: (mod.lessons || []).map(les => ({
          id: les.id,
          moduleId: mod.id,
          title: les.title || '',
          description: les.description || '',
          duration: les.duration || '',
          videoUrl: les.video_url || '',
          content: les.content || '',
          order: les.order_number || 0,
          isCompleted: (les.lesson_progress && les.lesson_progress.length > 0) ? les.lesson_progress[0].completed : false,
        })).sort((a, b) => a.order - b.order),
      })).sort((a, b) => a.order - b.order);

      return mapDbCourseToExtendedCourse(data, { enrollmentsCount, modules });

    } catch (error) {
      console.error('Erro geral ao buscar curso por ID:', error);
      throw new Error('Falha ao buscar detalhes do curso');
    }
  },

  // Busca cursos para a tela de administração
  async getCoursesForAdmin(): Promise<ExtendedCourse[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          classes(id, enrollments(id)),
          modules(id),
          professor:professor_id ( id, name )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map(course => {
        const enrollmentsCount = course.classes.reduce((acc, cls) => acc + (cls.enrollments?.length || 0), 0);
        const modulesCount = course.modules?.length || 0;
        // O Supabase retorna o professor aninhado como um objeto ou nulo
        const professorName = (course.professor as any)?.name || 'N/A';

        return mapDbCourseToExtendedCourse(course, {
          enrollmentsCount,
          modulesCount,
          professorName
        });
      });
    } catch (error) {
      console.error('Erro ao buscar cursos para admin:', error);
      throw new Error('Falha ao buscar cursos para administração');
    }
  },

  // Busca cursos de um professor específico
  async getCoursesByProfessor(professorId: string, filters?: CourseFilters): Promise<ExtendedCourse[]> {
    if (!professorId) return [];
    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          classes(id, enrollments(id)),
          modules(id)
        `)
        .eq('professor_id', professorId);

      // Aplicar filtros
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map(course => {
        const enrollmentsCount = course.classes.reduce((acc, cls) => acc + (cls.enrollments?.length || 0), 0);
        const modulesCount = course.modules?.length || 0;
        return mapDbCourseToExtendedCourse(course, { enrollmentsCount, modulesCount });
      });
    } catch (error) {
      console.error('Erro ao buscar cursos do professor:', error);
      throw new Error('Erro ao buscar cursos do professor');
    }
  },

  // Aprova um curso
  async approveCourse(courseId: string, adminId: string): Promise<void> {
    const updates: CourseUpdate = {
      status: 'approved',
      approved_by: adminId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('courses').update(updates).eq('id', courseId);
    if (error) {
      console.error('Erro ao aprovar curso:', error);
      throw new Error('Erro ao aprovar curso');
    }
  },

  // Rejeita um curso
  async rejectCourse(courseId: string, adminId: string, reason?: string): Promise<void> {
    const updates: CourseUpdate = {
      status: 'rejected',
      approved_by: adminId,
      approved_at: new Date().toISOString(), // ou talvez `rejection_at`? Mantendo como está.
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('courses').update(updates).eq('id', courseId);
    if (error) {
      console.error('Erro ao rejeitar curso:', error);
      throw new Error('Erro ao rejeitar curso');
    }
  },

  // Busca cursos com status pendente
  async getPendingCourses(): Promise<ExtendedCourse[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          classes(id, enrollments(id)),
          modules(id),
          professor:profiles(id, name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map(course => {
        const enrollmentsCount = course.classes.reduce((acc, cls) => acc + (cls.enrollments?.length || 0), 0);
        const modulesCount = course.modules?.length || 0;
        const professorName = (course.professor as any)?.name || 'N/A';
        return mapDbCourseToExtendedCourse(course, { enrollmentsCount, modulesCount, professorName });
      });
    } catch (error) {
      console.error('Erro ao buscar cursos pendentes:', error);
      throw new Error('Erro ao buscar cursos pendentes');
    }
  },

  // Busca turmas de um curso
  async getClassesForCourse(courseId: string): Promise<Class[]> {
    if (!courseId) return [];
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('course_id', courseId);

      if (error) throw error;

      return (data || []).map(c => ({
          id: c.id,
          courseId: c.course_id,
          name: c.name,
          instructorId: c.instructor_id || undefined,
          startDate: c.start_date || undefined,
          endDate: c.end_date || undefined,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching classes for course:', error);
      throw new Error('Failed to fetch classes for course');
    }
  },

  // Busca documentos de um curso
  async getDocumentsForCourse(courseId: string): Promise<any[]> {
    if (!courseId) return [];
    try {
      const { data, error } = await supabase
        .from('course_documents')
        .select('*')
        .eq('course_id', courseId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching documents for course:', error);
      throw new Error('Failed to fetch documents for course');
    }
  },

  // Funções que estavam faltando ou que precisam de atenção
  async getProfessorStats(professorId: string): Promise<ProfessorStats> {
    // Esta função depende de uma RPC 'get_professor_courses'.
    // A implementação da RPC não foi fornecida, então esta é uma implementação de placeholder.
    console.warn("getProfessorStats está usando dados de placeholder. A RPC 'get_professor_courses' precisa ser verificada.");
    return {
      professorId,
      professorName: 'Nome do Professor (Placeholder)',
      totalCourses: 0,
      approvedCourses: 0,
      pendingCourses: 0,
      totalStudents: 0,
      totalEnrollments: 0,
      averageRating: 0,
    };
  },

  async duplicateCourse(courseId: string, newTitle?: string): Promise<ExtendedCourse> {
    // Esta função depende de uma RPC 'duplicate_course'.
    // A implementação da RPC não foi fornecida.
    console.error("A função 'duplicateCourse' não pode ser executada pois depende de uma RPC ('duplicate_course') não definida no schema providenciado.");
    throw new Error("RPC 'duplicate_course' não implementada.");
  }
};

export default courseService;
