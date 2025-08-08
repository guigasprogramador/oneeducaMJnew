export type ReportKey =
  | 'quantitative_summary'
  | 'enrollment_by_role'
  | 'students_per_class'
  | 'final_grades'
  | 'dropouts'
  | 'near_completion'
  | 'attendance_list'
  | 'document_issuance_summary'
  | 'document_lifecycle' // New key for the lifecycle report
  | 'none';
