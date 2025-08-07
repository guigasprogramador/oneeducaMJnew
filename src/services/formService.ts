import { supabase } from '@/integrations/supabase/client';
import { CustomForm, FormField, FormSubmission, SubmissionAnswer } from '@/types';

export const formService = {
  async getFormForCourse(courseId: string): Promise<CustomForm | null> {
    const { data, error } = await supabase
      .from('custom_forms')
      .select('*, form_fields(*)')
      .eq('course_id', courseId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No form for this course
      throw error;
    }
    if (!data) return null;

    const fields = data.form_fields.map(f => ({
      ...f,
      formId: f.form_id,
      fieldType: f.field_type,
      isRequired: f.is_required,
      order: f.order_number,
    }));

    return { ...data, courseId: data.course_id, fields };
  },

  async saveForm(form: Partial<CustomForm>): Promise<CustomForm> {
    const { id, courseId, title, fields } = form;

    // Upsert form
    const { data: formData, error: formError } = await supabase
      .from('custom_forms')
      .upsert({ id, course_id: courseId, title, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (formError) throw formError;

    // Upsert fields
    if (fields) {
      const fieldPromises = fields.map(field =>
        supabase.from('form_fields').upsert({
          id: field.id,
          form_id: formData.id,
          label: field.label,
          field_type: field.fieldType,
          options: field.options,
          is_required: field.isRequired,
          order_number: field.order,
        })
      );
      await Promise.all(fieldPromises);
    }

    return this.getFormForCourse(formData.course_id) as Promise<CustomForm>;
  },

  async submitForm(submission: Omit<FormSubmission, 'id' | 'submittedAt'>): Promise<void> {
    const { formId, userId, answers } = submission;

    const { data: submissionData, error: submissionError } = await supabase
      .from('form_submissions')
      .insert({ form_id: formId, user_id: userId })
      .select()
      .single();
    if (submissionError) throw submissionError;

    const answerPromises = answers.map(answer =>
      supabase.from('submission_answers').insert({
        submission_id: submissionData.id,
        field_id: answer.fieldId,
        answer_text: answer.answerText,
      })
    );
    await Promise.all(answerPromises);
  },

  async getSubmissionsForForm(formId: string): Promise<FormSubmission[]> {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*, submission_answers(*, form_fields(label))')
      .eq('form_id', formId);

    if (error) throw error;

    return data.map(s => ({
        ...s,
        formId: s.form_id,
        userId: s.user_id,
        submittedAt: s.submitted_at,
        answers: s.submission_answers.map(a => ({
            ...a,
            submissionId: a.submission_id,
            fieldId: a.field_id,
            answerText: a.answer_text,
            label: a.form_fields.label,
        }))
    }));
  },
};
