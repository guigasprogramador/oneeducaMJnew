
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  instructor: string;
  professor_id?: string;
  enrolledCount: number;
  rating: number;
  modules: Module[];
  createdAt: string;
  updatedAt: string;
  isEnrolled?: boolean;
  progress?: number;
  syllabus?: string;
  bibliography?: string;
}

export interface CourseDocument {
  id: string;
  courseId: string;
  documentName: string;
  documentUrl: string;
  createdAt: string;
}

export interface Class {
  id: string;
  courseId: string;
  name: string;
  instructorId?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt:string;
}

export interface CoursePrerequisite {
  courseId: string;
  prerequisiteId: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  duration: string;
  videoUrl?: string;
  content?: string;
  order: number;
  isCompleted?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "professor" | "student";
  avatar?: string | null;
  createdAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  userName: string;
  courseHours?: number; // Carga horária do curso em horas
  issueDate: string;
  expiryDate?: string;
  certificateUrl?: string;
  certificateHtml?: string; // HTML do certificado renderizado
}

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  bio?: string;
  jobTitle?: string;
  company?: string;
  location?: string;
  avatar?: string;
  website?: string;
  social?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  questions: Question[];
}

export interface Question {
  id: string;
  quizId: string;
  questionText: string;
  questionType: string;
  order: number;
  answers: Answer[];
}

export interface Answer {
  id: string;
  questionId: string;
  answerText: string;
  isCorrect: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score?: number;
  startedAt: string;
  completedAt?: string;
}

export interface QuizAttemptAnswer {
  id: string;
  quizAttemptId: string;
  questionId: string;
  answerId?: string;
  answerTextInput?: string;
  isCorrect?: boolean;
}

export interface Announcement {
  id: string;
  courseId: string;
  classId?: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  classId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
}

export interface CustomForm {
  id: string;
  courseId: string;
  title: string;
  fields: FormField[];
}

export interface FormField {
  id: string;
  formId: string;
  label: string;
  fieldType: string;
  options?: any;
  isRequired: boolean;
  order: number;
}

export interface FormSubmission {
  id: string;
  formId: string;
  userId: string;
  submittedAt: string;
  answers: SubmissionAnswer[];
}

export interface SubmissionAnswer {
  id: string;
  submissionId: string;
  fieldId: string;
  answerText: string;
}

export interface AcademicWork {
  id: string;
  classId: string;
  userId: string;
  title: string;
  documentUrl: string;
  documentType?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GeneralDocument {
  id: string;
  title: string;
  description?: string;
  documentUrl: string;
  documentType?: string;
  category?: string;
  fileSize?: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
