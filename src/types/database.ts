
// Define custom type for Supabase database interface
export interface Database {
  public: {
    Tables: {
      certificates: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          course_name: string;
          user_name: string;
          issue_date: string;
          expiry_date: string | null;
          certificate_url: string | null;
        };
      };
      courses: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          thumbnail: string | null;
          duration: string | null;
          instructor: string;
          enrolledcount: number;
          rating: number;
          created_at: string;
          updated_at: string;
          professor_id: string | null;
          status: 'pending' | 'approved' | 'rejected';
          expiry_date: string | null;
          approved_by: string | null;
          approved_at: string | null;
          rejection_reason: string | null;
          syllabus: string | null;
          bibliography: string | null;
        };
      };
      course_documents: {
        Row: {
          id: string;
          course_id: string;
          document_name: string;
          document_url: string;
          created_at: string;
        };
      };
      modules: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          order_number: number;
          created_at: string;
          updated_at: string;
          has_quiz: boolean;
          quiz_data: any | null;
        };
      };
      lessons: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          description: string | null;
          duration: string | null;
          video_url: string | null;
          content: string | null;
          order_number: number;
          created_at: string;
          updated_at: string;
        };
      };
      course_prerequisites: {
        Row: {
          course_id: string;
          prerequisite_id: string;
        };
      };
      classes: {
        Row: {
          id: string;
          course_id: string;
          name: string;
          instructor_id: string | null;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          progress: number;
          enrolled_at: string;
          completed_at: string | null;
        };
      };
      lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          completed: boolean;
          completed_at: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string | null;
          bio: string | null;
          avatar_url: string | null;
          job_title: string | null;
          company: string | null;
          location: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
          role: 'admin' | 'professor' | 'student';
        };
      };
      recent_certificates: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          issue_date: string;
          course_name: string;
          user_name: string;
        };
      };
      lesson_attachments: {
        Row: {
          id: string;
          lesson_id: string;
          file_name: string;
          file_url: string;
          file_type: string;
          file_size: number | null;
          uploaded_by: string;
          created_at: string;
        };
      };
      course_duplications: {
        Row: {
          id: string;
          original_course_id: string;
          duplicated_course_id: string;
          duplicated_by: string;
          created_at: string;
        };
      };
      course_forums: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
      };
      forum_messages: {
        Row: {
          id: string;
          forum_id: string;
          user_id: string;
          message: string;
          parent_message_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      quiz_responses: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          responses: any;
          score: number | null;
          max_score: number | null;
          completed_at: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          read: boolean;
          created_at: string;
        };
      };
      quizzes: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
      };
      questions: {
        Row: {
          id: string;
          quiz_id: string;
          question_text: string;
          question_type: string;
          order_number: number;
          created_at: string;
        };
      };
      answers: {
        Row: {
          id: string;
          question_id: string;
          answer_text: string;
          is_correct: boolean;
          created_at: string;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          score: number | null;
          started_at: string;
          completed_at: string | null;
        };
      };
      quiz_attempt_answers: {
        Row: {
          id: string;
          quiz_attempt_id: string;
          question_id: string;
          answer_id: string | null;
          answer_text_input: string | null;
          is_correct: boolean | null;
          created_at: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          course_id: string;
          class_id: string | null;
          title: string;
          content: string;
          created_by: string;
          created_at: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          class_id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          location: string | null;
          created_at: string;
        };
      };
      custom_forms: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
      };
      form_fields: {
        Row: {
          id: string;
          form_id: string;
          label: string;
          field_type: string;
          options: any | null;
          is_required: boolean;
          order_number: number;
        };
      };
      form_submissions: {
        Row: {
          id: string;
          form_id: string;
          user_id: string;
          submitted_at: string;
        };
      };
      submission_answers: {
        Row: {
          id: string;
          submission_id: string;
          field_id: string;
          answer_text: string;
        };
      };
    };
  };
}
