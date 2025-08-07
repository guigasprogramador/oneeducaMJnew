import { supabase } from '@/integrations/supabase/client';
import { AcademicWork } from '@/types';
import { uploadFile, deleteFile } from '@/utils/storage';

export const academicWorkService = {
  /**
   * Busca todos os trabalhos acadêmicos de uma turma (para professores).
   * @param classId - O ID da turma.
   * @returns Uma lista de trabalhos acadêmicos.
   */
  async getAcademicWorksByClass(classId: string): Promise<AcademicWork[]> {
    if (!classId) throw new Error('ID da turma é obrigatório');

    const { data, error } = await supabase
      .from('academic_works')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar trabalhos da turma:', error);
      throw new Error('Falha ao buscar trabalhos da turma.');
    }

    return data.map(work => ({
        id: work.id,
        classId: work.class_id,
        userId: work.user_id,
        title: work.title,
        documentUrl: work.document_url,
        documentType: work.document_type,
        fileSize: work.file_size,
        createdAt: work.created_at,
        updatedAt: work.updated_at,
    }));
  },

  /**
   * Busca os trabalhos acadêmicos de um aluno específico em uma turma.
   * @param classId - O ID da turma.
   * @param userId - O ID do usuário.
   * @returns Uma lista de trabalhos acadêmicos do aluno.
   */
  async getMyAcademicWorks(classId: string, userId: string): Promise<AcademicWork[]> {
    if (!classId || !userId) throw new Error('ID da turma e ID do usuário são obrigatórios');

    const { data, error } = await supabase
      .from('academic_works')
      .select('*')
      .eq('class_id', classId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar seus trabalhos acadêmicos:', error);
      throw new Error('Falha ao buscar seus trabalhos acadêmicos.');
    }

    return data.map(work => ({
        id: work.id,
        classId: work.class_id,
        userId: work.user_id,
        title: work.title,
        documentUrl: work.document_url,
        documentType: work.document_type,
        fileSize: work.file_size,
        createdAt: work.created_at,
        updatedAt: work.updated_at,
    }));
  },

  /**
   * Faz upload de um novo trabalho acadêmico.
   * @param classId - O ID da turma.
   * @param userId - O ID do usuário que está enviando.
   * @param file - O arquivo a ser enviado.
   * @param title - O título do trabalho.
   * @returns O objeto do trabalho acadêmico criado.
   */
  async uploadAcademicWork(classId: string, userId: string, file: File, title: string): Promise<AcademicWork> {
    if (!classId || !userId || !file || !title) {
      throw new Error('ID da turma, ID do usuário, arquivo e título são obrigatórios');
    }

    const filePath = `academic-works/${classId}/${userId}/${Date.now()}_${file.name}`;
    const publicUrl = await uploadFile('course-files', filePath, file);

    const { data, error } = await supabase
      .from('academic_works')
      .insert({
        class_id: classId,
        user_id: userId,
        title: title,
        document_url: publicUrl,
        document_type: file.type,
        file_size: file.size,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao salvar trabalho acadêmico:', error);
      await deleteFile('course-files', filePath);
      throw new Error('Falha ao salvar informações do trabalho acadêmico.');
    }

    return {
        id: data.id,
        classId: data.class_id,
        userId: data.user_id,
        title: data.title,
        documentUrl: data.document_url,
        documentType: data.document_type,
        fileSize: data.file_size,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
  },

  /**
   * Deleta um trabalho acadêmico.
   * @param workId - O ID do trabalho a ser deletado.
   */
  async deleteAcademicWork(workId: string): Promise<void> {
    if (!workId) throw new Error('ID do trabalho é obrigatório');

    const { data: work, error: fetchError } = await supabase
      .from('academic_works')
      .select('document_url')
      .eq('id', workId)
      .single();

    if (fetchError || !work) {
      console.error('Erro ao buscar trabalho para exclusão:', fetchError);
      throw new Error('Trabalho acadêmico não encontrado.');
    }

    const { error: deleteDbError } = await supabase
      .from('academic_works')
      .delete()
      .eq('id', workId);

    if (deleteDbError) {
      console.error('Erro ao deletar registro do trabalho:', deleteDbError);
      throw new Error('Falha ao deletar o trabalho acadêmico.');
    }

    try {
      const url = new URL(work.document_url);
      const filePath = url.pathname.split('/course-files/')[1];
      await deleteFile('course-files', filePath);
    } catch (e) {
      console.error("Erro ao parsear URL ou deletar arquivo do storage:", e);
    }
  },
};
