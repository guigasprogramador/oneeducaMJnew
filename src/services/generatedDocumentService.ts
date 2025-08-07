import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * The structure of a generated document for use in the frontend.
 * This should be defined in `src/types/index.ts` eventually.
 */
export interface GeneratedDocument {
  id: string;
  userId: string;
  documentType: 'declaration' | 'contract' | 'student_id_card' | 'report_card' | 'school_transcript';
  title: string;
  contentHtml: string;
  issueDate: string;
  authenticationCode: string;
  createdAt: string;
  courseId?: string | null;
}

/**
 * Interface for document data in the database (snake_case)
 */
interface DocumentDB {
  id: string;
  user_id: string;
  document_type: 'declaration' | 'contract' | 'student_id_card' | 'report_card' | 'school_transcript';
  title: string;
  content_html: string;
  issue_date: string;
  authentication_code: string;
  created_at: string;
  course_id?: string | null;
}

/**
 * Interface for creating a new document
 */
export interface CreateDocumentData {
  userId: string;
  documentType: 'declaration' | 'contract' | 'student_id_card' | 'report_card' | 'school_transcript';
  title: string;
  contentHtml: string;
  authenticationCode: string;
  courseId?: string;
}

/**
 * Maps a database document object to the frontend GeneratedDocument type
 */
const mapToGeneratedDocument = (doc: DocumentDB): GeneratedDocument => ({
  id: doc.id,
  userId: doc.user_id,
  documentType: doc.document_type,
  title: doc.title,
  contentHtml: doc.content_html,
  issueDate: doc.issue_date,
  authenticationCode: doc.authentication_code,
  createdAt: doc.created_at,
  courseId: doc.course_id,
});

/**
 * Generates a unique authentication code.
 * e.g., "DECL-AB12CD34"
 */
const generateAuthCode = (prefix: string): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix.toUpperCase()}-${timestamp}-${randomPart}`;
};

// --- Service Functions ---

/**
 * Fetches all documents for a specific user.
 * @param userId The ID of the user.
 */
const getDocumentsForUser = async (userId: string): Promise<GeneratedDocument[]> => {
  if (!userId) {
    toast.error('User ID is required to fetch documents.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents.');
      throw error;
    }

    return data.map(mapToGeneratedDocument);
  } catch (error) {
    return [];
  }
};

/**
 * Creates a new document in the database.
 * @param documentData The data for the new document.
 */
const createDocument = async (documentData: CreateDocumentData): Promise<GeneratedDocument | null> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: documentData.userId,
        document_type: documentData.documentType,
        title: documentData.title,
        content_html: documentData.contentHtml,
        authentication_code: documentData.authenticationCode,
        course_id: documentData.courseId,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating document:', error);
      toast.error(`Failed to create document: ${error.message}`);
      throw error;
    }

    toast.success('Document created successfully!');
    return mapToGeneratedDocument(data);
  } catch (error) {
    return null;
  }
};

/**
 * Verifies and retrieves a document using its authentication code.
 * This calls the database function `get_document_by_auth_code`.
 * @param authCode The authentication code of the document.
 */
const verifyDocumentByAuthCode = async (authCode: string): Promise<GeneratedDocument | null> => {
  if (!authCode) {
    toast.error('Authentication code is required.');
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('get_document_by_auth_code', {
      auth_code: authCode,
    });

    if (error) {
      console.error('Error verifying document:', error);
      toast.error('Failed to verify document.');
      throw error;
    }

    if (!data || data.length === 0) {
      toast.warning('Document not found or invalid code.');
      return null;
    }

    // The RPC function returns an array, we expect only one result.
    return mapToGeneratedDocument(data[0] as DocumentDB);
  } catch (error) {
    return null;
  }
};


/**
 * Creates an HTML template for an enrollment declaration.
 * @param userName The name of the student.
 * @param courseName The name of the course.
 * @param issueDate The date the declaration was issued.
 * @param authCode The authentication code for verification.
 * @returns A string containing the HTML for the declaration.
 */
const createDeclarationTemplate = (userName: string, courseName: string, issueDate: string, authCode: string): string => {
  const formattedDate = new Date(issueDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return `
    <div style="font-family: Arial, sans-serif; border: 1px solid #ccc; padding: 20px; max-width: 800px; margin: auto;">
      <h1 style="text-align: center; color: #333;">Declaração de Matrícula</h1>
      <p style="font-size: 1.1em; line-height: 1.6;">
        Declaramos para os devidos fins que <strong>${userName}</strong> está regularmente matriculado(a) no curso
        <strong>"${courseName}"</strong> nesta instituição de ensino.
      </p>
      <p style="font-size: 1.1em;">
        Data de Emissão: ${formattedDate}
      </p>
      <hr style="margin: 20px 0;">
      <p style="font-size: 0.9em; color: #555;">
        Para verificar a autenticidade deste documento, acesse nosso portal e utilize o seguinte código de verificação:
        <br>
        <strong>${authCode}</strong>
      </p>
    </div>
  `;
};

/**
 * Generates an enrollment declaration for a user in a specific course.
 * @param userId The ID of the user.
 * @param courseId The ID of the course.
 */
const generateEnrollmentDeclaration = async (userId: string, courseId: string): Promise<GeneratedDocument | null> => {
  try {
    // 1. Fetch user and course data
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      toast.error('Failed to find user profile.');
      throw userError || new Error('User not found.');
    }

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .single();

    if (courseError || !courseData) {
      toast.error('Failed to find course.');
      throw courseError || new Error('Course not found.');
    }

    const userName = userData.name;
    const courseName = courseData.title;

    // 2. Generate content and auth code
    const authCode = generateAuthCode('DECL');
    const issueDate = new Date().toISOString();
    const contentHtml = createDeclarationTemplate(userName, courseName, issueDate, authCode);
    const title = `Declaração de Matrícula - ${courseName}`;

    // 3. Create the document record
    return createDocument({
      userId,
      courseId,
      documentType: 'declaration',
      title,
      contentHtml,
      authenticationCode: authCode,
    });
  } catch (error) {
    console.error('Error generating enrollment declaration:', error);
    return null;
  }
};

/**
 * Creates an HTML template for a student ID card.
 * @param {object} data - The data for the ID card.
 * @param {string} data.userName - The name of the student.
 * @param {string | null} data.avatarUrl - The URL for the student's photo.
 * @param {string} data.userId - The student's registration ID.
 * @param {string} data.issueDate - The date the card was issued.
 * @param {string} data.expiryDate - The date the card expires.
 * @param {string} data.authCode - The authentication code for verification.
 * @returns A string containing the HTML for the ID card.
 */
const createStudentIdCardTemplate = (data: {
  userName: string;
  avatarUrl: string | null;
  userId: string;
  issueDate: string;
  expiryDate: string;
  authCode: string;
}): string => {
  const formattedIssueDate = new Date(data.issueDate).toLocaleDateString('pt-BR');
  const formattedExpiryDate = new Date(data.expiryDate).toLocaleDateString('pt-BR');
  const placeholderAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.userName)}`;

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; width: 320px; height: 200px; border: 1px solid #ddd; border-radius: 12px; background-color: #f9f9f9; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; margin: auto; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
      <div style="display: flex; align-items: center;">
        <img src="${data.avatarUrl || placeholderAvatar}" alt="Foto do Aluno" style="width: 60px; height: 60px; border-radius: 50%; margin-right: 16px; object-fit: cover; border: 2px solid #007bff;">
        <div>
          <h2 style="font-size: 16px; font-weight: 600; margin: 0; color: #333;">CARTEIRA DE ESTUDANTE</h2>
          <p style="font-size: 12px; margin: 0; color: #555;">OneEduca Platform</p>
        </div>
      </div>
      <div>
        <p style="font-size: 18px; font-weight: bold; margin: 8px 0; color: #0056b3;">${data.userName}</p>
        <div style="font-size: 11px; color: #666;">
          <p style="margin: 2px 0;"><strong>Matrícula:</strong> ${data.userId}</p>
          <p style="margin: 2px 0;"><strong>Emissão:</strong> ${formattedIssueDate} &nbsp;&nbsp; <strong>Validade:</strong> ${formattedExpiryDate}</p>
        </div>
      </div>
      <div style="font-size: 9px; color: #777; text-align: center; border-top: 1px dashed #ccc; padding-top: 4px;">
        Código de verificação: ${data.authCode}
      </div>
    </div>
  `;
};

/**
 * Generates a student ID card for a user.
 * @param userId The ID of the user.
 */
const generateStudentIdCard = async (userId: string): Promise<GeneratedDocument | null> => {
  try {
    // 1. Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      toast.error('Failed to find user profile.');
      throw userError || new Error('User not found.');
    }

    // 2. Generate content and auth code
    const authCode = generateAuthCode('ID');
    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Valid for 1 year

    const contentHtml = createStudentIdCardTemplate({
      userName: userData.name || 'Nome não encontrado',
      avatarUrl: userData.avatar_url,
      userId: userId,
      issueDate: issueDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      authCode,
    });
    const title = `Carteira de Estudante - ${userData.name}`;

    // 3. Create the document record
    return createDocument({
      userId,
      documentType: 'student_id_card',
      title,
      contentHtml,
      authenticationCode: authCode,
    });
  } catch (error) {
    console.error('Error generating student ID card:', error);
    return null;
  }
};

/**
 * Creates an HTML template for a report card.
 * @param {object} data - The data for the report card.
 * @returns A string containing the HTML for the report card.
 */
const createReportCardTemplate = (data: {
  userName: string;
  courseName: string;
  grades: { quiz_title: string; score: number | null }[];
  finalScore: number;
  issueDate: string;
  authCode: string;
}): string => {
  const formattedDate = new Date(data.issueDate).toLocaleDateString('pt-BR');
  const gradeRows = data.grades.map(grade => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${grade.quiz_title}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${grade.score !== null ? grade.score.toFixed(2) : 'N/A'}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; border: 1px solid #ccc; padding: 20px; max-width: 800px; margin: auto;">
      <h1 style="text-align: center; color: #333;">Boletim de Notas</h1>
      <div style="margin-bottom: 20px;">
        <p><strong>Aluno(a):</strong> ${data.userName}</p>
        <p><strong>Curso:</strong> ${data.courseName}</p>
        <p><strong>Data de Emissão:</strong> ${formattedDate}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 8px; border-bottom: 2px solid #333; text-align: left;">Avaliação</th>
            <th style="padding: 8px; border-bottom: 2px solid #333; text-align: right;">Nota</th>
          </tr>
        </thead>
        <tbody>
          ${gradeRows}
        </tbody>
        <tfoot>
          <tr>
            <td style="padding: 10px 8px; border-top: 2px solid #333; font-weight: bold; text-align: right;">Nota Final</td>
            <td style="padding: 10px 8px; border-top: 2px solid #333; font-weight: bold; text-align: right;">${data.finalScore.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <hr style="margin: 20px 0;">
      <p style="font-size: 0.9em; color: #555;">
        Código de verificação: <strong>${data.authCode}</strong>
      </p>
    </div>
  `;
};

/**
 * Generates a report card for a user in a specific course.
 * @param userId The ID of the user.
 * @param courseId The ID of the course.
 */
const generateReportCard = async (userId: string, courseId: string): Promise<GeneratedDocument | null> => {
  try {
    // 1. Fetch grades data using the new, more secure RPC function
    const { data: userGrades, error: rpcError } = await supabase.rpc('get_user_final_grades', {
      user_id_param: userId,
      course_id_param: courseId
    });

    if (rpcError) {
      toast.error('Failed to fetch grades for the report card.');
      throw rpcError;
    }

    if (!userGrades || userGrades.length === 0) {
      toast.info('No grades found for this user in the selected course.');
      return null;
    }

    const userName = userGrades[0].user_name;
    const courseName = userGrades[0].course_title;

    const validScores = userGrades.map((g: any) => g.score).filter((s: any) => s !== null) as number[];
    const finalScore = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0;

    // 2. Generate content and auth code
    const authCode = generateAuthCode('BOLETIM');
    const issueDate = new Date().toISOString();
    const contentHtml = createReportCardTemplate({
      userName,
      courseName,
      grades: userGrades,
      finalScore,
      issueDate,
      authCode
    });
    const title = `Boletim - ${courseName}`;

    // 3. Create the document record
    return createDocument({
      userId,
      courseId,
      documentType: 'report_card',
      title,
      contentHtml,
      authenticationCode: authCode,
    });
  } catch (error) {
    console.error('Error generating report card:', error);
    return null;
  }
};

/**
 * Creates an HTML template for a school transcript.
 */
const createTranscriptTemplate = (data: {
  userName: string;
  transcriptData: { course_title: string; enrollment_status: string; final_grade: number | null; completion_date: string | null }[];
  issueDate: string;
  authCode: string;
}): string => {
  const formattedDate = new Date(data.issueDate).toLocaleDateString('pt-BR');
  const transcriptRows = data.transcriptData.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.course_title}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.enrollment_status}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.final_grade !== null ? item.final_grade.toFixed(2) : 'N/A'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.completion_date ? new Date(item.completion_date).toLocaleDateString('pt-BR') : 'N/A'}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; border: 1px solid #ccc; padding: 20px; max-width: 800px; margin: auto;">
      <h1 style="text-align: center; color: #333;">Histórico Escolar</h1>
      <div style="margin-bottom: 20px;">
        <p><strong>Aluno(a):</strong> ${data.userName}</p>
        <p><strong>Data de Emissão:</strong> ${formattedDate}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 8px; border-bottom: 2px solid #333; text-align: left;">Curso</th>
            <th style="padding: 8px; border-bottom: 2px solid #333; text-align: left;">Status</th>
            <th style="padding: 8px; border-bottom: 2px solid #333; text-align: center;">Nota Final</th>
            <th style="padding: 8px; border-bottom: 2px solid #333; text-align: center;">Data de Conclusão</th>
          </tr>
        </thead>
        <tbody>
          ${transcriptRows}
        </tbody>
      </table>
      <hr style="margin: 20px 0;">
      <p style="font-size: 0.9em; color: #555;">
        Código de verificação: <strong>${data.authCode}</strong>
      </p>
    </div>
  `;
};

/**
 * Generates a school transcript for a user.
 * @param userId The ID of the user.
 */
const generateSchoolTranscript = async (userId: string): Promise<GeneratedDocument | null> => {
  try {
    // 1. Fetch user's name and transcript data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) throw new Error('User profile not found.');

    const { data: transcriptData, error: rpcError } = await supabase.rpc('get_user_transcript_data', {
      user_id_param: userId
    });

    if (rpcError) {
      toast.error('Failed to fetch transcript data.');
      throw rpcError;
    }

    if (!transcriptData || transcriptData.length === 0) {
      toast.info('No enrollment history found for this user.');
      return null;
    }

    // 2. Generate content and auth code
    const authCode = generateAuthCode('HIST');
    const issueDate = new Date().toISOString();
    const contentHtml = createTranscriptTemplate({
      userName: profile.name,
      transcriptData,
      issueDate,
      authCode
    });
    const title = `Histórico Escolar - ${profile.name}`;

    // 3. Create the document record
    return createDocument({
      userId,
      documentType: 'school_transcript',
      title,
      contentHtml,
      authenticationCode: authCode,
    });
  } catch (error) {
    console.error('Error generating school transcript:', error);
    return null;
  }
};

/**
 * Creates an HTML template for a service contract.
 */
const createContractTemplate = (data: {
  userName: string;
  userCpf: string;
  courseName: string;
  coursePrice: number;
  issueDate: string;
  authCode: string;
}): string => {
  const formattedDate = new Date(data.issueDate).toLocaleDateString('pt-BR');
  const priceFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.coursePrice);

  return `
    <div style="font-family: Arial, sans-serif; border: 1px solid #ccc; padding: 20px; max-width: 800px; margin: auto;">
      <h1 style="text-align: center; color: #333;">Contrato de Prestação de Serviços Educacionais</h1>
      <p><strong>CONTRATANTE:</strong> ${data.userName}, portador(a) do CPF nº ${data.userCpf || '[CPF não informado]'}.</p>
      <p><strong>CONTRATADA:</strong> OneEduca Platform, pessoa jurídica de direito privado.</p>
      <p><strong>OBJETO DO CONTRATO:</strong> O presente contrato tem por objeto a prestação de serviços educacionais, referente ao curso <strong>"${data.courseName}"</strong>.</p>
      <p><strong>VALOR:</strong> O valor do curso é de <strong>${priceFormatted}</strong>.</p>
      <p><strong>TERMOS E CONDIÇÕES:</strong></p>
      <ol style="font-size: 0.9em; color: #555; line-height: 1.5;">
        <li>A CONTRATADA se compromete a fornecer acesso ao material didático do curso.</li>
        <li>O acesso ao curso é pessoal e intransferível.</li>
        <li>O pagamento deverá ser efetuado no ato da matrícula.</li>
        <li>Este contrato tem validade a partir da data de sua emissão.</li>
      </ol>
      <p style="text-align: center; margin-top: 40px;">${formattedDate}</p>
      <hr style="margin: 20px 0;">
      <p style="font-size: 0.9em; color: #555;">
        Código de verificação: <strong>${data.authCode}</strong>
      </p>
    </div>
  `;
};

/**
 * Generates a service contract for a user for a specific course.
 * @param userId The ID of the user.
 * @param courseId The ID of the course.
 */
const generateServiceContract = async (userId: string, courseId: string): Promise<GeneratedDocument | null> => {
  try {
    // 1. Fetch user and course data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, cpf') // Attempt to select cpf
      .eq('id', userId)
      .single();

    if (profileError || !profile) throw new Error('User profile not found.');

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title, price')
      .eq('id', courseId)
      .single();

    if (courseError || !course) throw new Error('Course not found.');

    // 2. Generate content and auth code
    const authCode = generateAuthCode('CONT');
    const issueDate = new Date().toISOString();
    const contentHtml = createContractTemplate({
      userName: profile.name,
      userCpf: profile.cpf || '',
      courseName: course.title,
      coursePrice: course.price || 0,
      issueDate,
      authCode
    });
    const title = `Contrato de Serviço - ${course.title}`;

    // 3. Create the document record
    return createDocument({
      userId,
      courseId,
      documentType: 'contract',
      title,
      contentHtml,
      authenticationCode: authCode,
    });
  } catch (error) {
    console.error('Error generating service contract:', error);
    toast.error('Failed to generate service contract.');
    return null;
  }
};


/**
 * Generated Document Service
 * Manages all operations related to generated official documents like declarations and contracts.
 */
export const generatedDocumentService = {
  getDocumentsForUser,
  createDocument,
  verifyDocumentByAuthCode,
  generateAuthCode,
  generateEnrollmentDeclaration,
  generateStudentIdCard,
  generateReportCard,
  generateSchoolTranscript,
  generateServiceContract,
  // Specific document generation functions will be added here
};
