import { supabase } from '@/integrations/supabase/client';
import { CourseDocument, GeneralDocument } from '@/types';
import { uploadFile, deleteFile } from '@/utils/storage';

// ===== Serviço de Documentos do Curso =====

export const documentService = {
  /**
   * Busca todos os documentos associados a um curso.
   * @param courseId - O ID do curso.
   * @returns Uma lista de documentos do curso.
   */
  async getDocumentsByCourse(courseId: string): Promise<CourseDocument[]> {
    if (!courseId) throw new Error('ID do curso é obrigatório');

    const { data, error } = await supabase
      .from('course_documents')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar documentos do curso:', error);
      throw new Error('Falha ao buscar documentos do curso.');
    }

    return data.map(doc => ({
        id: doc.id,
        courseId: doc.course_id,
        documentName: doc.document_name,
        documentUrl: doc.document_url,
        createdAt: doc.created_at,
    }));
  },

  /**
   * Faz upload de um novo documento para um curso.
   * @param courseId - O ID do curso.
   * @param file - O arquivo a ser enviado.
   * @returns O objeto do documento do curso criado.
   */
  async uploadCourseDocument(courseId: string, file: File): Promise<CourseDocument> {
    if (!courseId || !file) throw new Error('ID do curso e arquivo são obrigatórios');

    const filePath = `course-documents/${courseId}/${Date.now()}_${file.name}`;
    const publicUrl = await uploadFile('course-files', filePath, file);

    const { data, error } = await supabase
      .from('course_documents')
      .insert({
        course_id: courseId,
        document_name: file.name,
        document_url: publicUrl,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao salvar documento do curso:', error);
      // Tentar deletar o arquivo órfão
      await deleteFile('course-files', filePath);
      throw new Error('Falha ao salvar informações do documento.');
    }

    return {
        id: data.id,
        courseId: data.course_id,
        documentName: data.document_name,
        documentUrl: data.document_url,
        createdAt: data.created_at,
    };
  },

  /**
   * Deleta um documento de um curso.
   * @param documentId - O ID do documento a ser deletado.
   */
  async deleteCourseDocument(documentId: string): Promise<void> {
    if (!documentId) throw new Error('ID do documento é obrigatório');

    // 1. Buscar o documento para obter a URL do arquivo
    const { data: doc, error: fetchError } = await supabase
        .from('course_documents')
        .select('document_url')
        .eq('id', documentId)
        .single();

    if (fetchError || !doc) {
        console.error('Erro ao buscar documento para exclusão:', fetchError);
        throw new Error('Documento não encontrado.');
    }

    // 2. Deletar o registro do banco de dados
    const { error: deleteDbError } = await supabase
        .from('course_documents')
        .delete()
        .eq('id', documentId);

    if (deleteDbError) {
        console.error('Erro ao deletar registro do documento:', deleteDbError);
        throw new Error('Falha ao deletar o documento.');
    }

    // 3. Deletar o arquivo do storage
    try {
        const url = new URL(doc.document_url);
        const filePath = url.pathname.split('/course-files/')[1];
        await deleteFile('course-files', filePath);
    } catch (e) {
        console.error("Erro ao parsear URL ou deletar arquivo do storage:", e);
    }
  },

  // ===== Serviço de Documentos Gerais =====

  /**
   * Busca documentos gerais com base em filtros.
   * @param params - Parâmetros de filtro e ordenação.
   * @returns Uma lista de documentos gerais.
   */
  async getGeneralDocuments(params?: { category?: string; sortBy?: 'created_at' | 'title' }): Promise<GeneralDocument[]> {
    let query = supabase.from('general_documents').select('*');

    if (params?.category) {
      query = query.eq('category', params.category);
    }

    if (params?.sortBy) {
      query = query.order(params.sortBy, { ascending: params.sortBy === 'title' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar documentos gerais:', error);
      throw new Error('Falha ao buscar documentos gerais.');
    }

    return data.map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        documentUrl: doc.document_url,
        documentType: doc.document_type,
        category: doc.category,
        fileSize: doc.file_size,
        createdBy: doc.created_by,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
    }));
  },

  /**
   * Faz upload de um novo documento geral.
   * @param file - O arquivo a ser enviado.
   * @param metadata - Metadados do documento.
   * @returns O objeto do documento geral criado.
   */
  async uploadGeneralDocument(file: File, metadata: { title: string; description?: string; category?: string; }): Promise<GeneralDocument> {
    if (!file || !metadata.title) throw new Error('Arquivo e título são obrigatórios');

    const filePath = `general-documents/${Date.now()}_${file.name}`;
    const publicUrl = await uploadFile('course-files', filePath, file);

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('general_documents')
      .insert({
        title: metadata.title,
        description: metadata.description,
        category: metadata.category,
        document_url: publicUrl,
        document_type: file.type,
        file_size: file.size,
        created_by: user?.id,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao salvar documento geral:', error);
      await deleteFile('course-files', filePath);
      throw new Error('Falha ao salvar informações do documento geral.');
    }

    return {
        id: data.id,
        title: data.title,
        description: data.description,
        documentUrl: data.document_url,
        documentType: data.document_type,
        category: data.category,
        fileSize: data.file_size,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
  },

  /**
   * Deleta um documento geral.
   * @param documentId - O ID do documento a ser deletado.
   */
  async deleteGeneralDocument(documentId: string): Promise<void> {
    if (!documentId) throw new Error('ID do documento é obrigatório');

    const { data: doc, error: fetchError } = await supabase
        .from('general_documents')
        .select('document_url')
        .eq('id', documentId)
        .single();

    if (fetchError || !doc) {
        console.error('Erro ao buscar documento geral para exclusão:', fetchError);
        throw new Error('Documento geral não encontrado.');
    }

    const { error: deleteDbError } = await supabase
        .from('general_documents')
        .delete()
        .eq('id', documentId);

    if (deleteDbError) {
        console.error('Erro ao deletar registro do documento geral:', deleteDbError);
        throw new Error('Falha ao deletar o documento geral.');
    }

    try {
        const url = new URL(doc.document_url);
        const filePath = url.pathname.split('/course-files/')[1];
        await deleteFile('course-files', filePath);
    } catch(e) {
        console.error("Erro ao parsear URL ou deletar arquivo do storage:", e);
    }
  },
};
