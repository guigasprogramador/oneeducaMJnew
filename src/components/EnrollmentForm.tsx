import { useState } from 'react';
import { CustomForm, SubmissionAnswer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formService } from '@/services/formService';
import { enrollClass } from '@/services/courses/enrollmentService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EnrollmentFormProps {
  form: CustomForm;
  classId: string;
  isOpen: boolean;
  onClose: () => void;
  onEnrolled: () => void;
}

const EnrollmentForm = ({ form, classId, isOpen, onClose, onEnrolled }: EnrollmentFormProps) => {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswerChange = (fieldId: string, value: string) => {
    setAnswers({ ...answers, [fieldId]: value });
  };

  const handleSubmit = async () => {
    if (!user) return;

    const submissionAnswers: SubmissionAnswer[] = Object.entries(answers).map(([fieldId, answerText]) => ({
      fieldId,
      answerText,
    } as SubmissionAnswer));

    try {
      await formService.submitForm({ formId: form.id, userId: user.id, answers: submissionAnswers });
      const result = await enrollClass(classId, user.id);
      if (result.success) {
        toast.success('Enrolled successfully!');
        onEnrolled();
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to submit form and enroll.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{form.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {form.fields.map(field => (
            <div key={field.id} className="space-y-2">
              <Label>{field.label}</Label>
              {field.fieldType === 'text' && (
                <Input onChange={e => handleAnswerChange(field.id, e.target.value)} />
              )}
              {field.fieldType === 'textarea' && (
                <Textarea onChange={e => handleAnswerChange(field.id, e.target.value)} />
              )}
              {field.fieldType === 'select' && (
                <Select onValueChange={value => handleAnswerChange(field.id, value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Submit and Enroll</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollmentForm;
