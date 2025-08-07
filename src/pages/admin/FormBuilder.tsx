import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formService } from '@/services/formService';
import { CustomForm, FormField } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash } from 'lucide-react';

const FormBuilder = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<CustomForm> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      formService.getFormForCourse(courseId).then(data => {
        setForm(data || { courseId, title: 'Enrollment Form', fields: [] });
        setIsLoading(false);
      });
    }
  }, [courseId]);

  const handleFieldChange = (fIndex: number, field: keyof FormField, value: string | boolean | number) => {
    if (form && form.fields) {
      const newFields = [...form.fields];
      (newFields[fIndex] as any)[field] = value;
      setForm({ ...form, fields: newFields });
    }
  };

  const handleAddField = () => {
    if (form) {
      const newField: FormField = {
        id: `new-${Date.now()}`,
        formId: form.id || '',
        label: '',
        fieldType: 'text',
        isRequired: false,
        order: form.fields ? form.fields.length + 1 : 1,
      };
      setForm({ ...form, fields: [...(form.fields || []), newField] });
    }
  };

  const handleSaveForm = async () => {
    if (form) {
      try {
        await formService.saveForm(form);
        toast.success('Form saved successfully!');
        navigate('/admin/courses');
      } catch (error) {
        toast.error('Failed to save form.');
      }
    }
  };

  if (isLoading) return <p>Loading form builder...</p>;
  if (!form) return <p>Could not load form data.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Form Builder</h1>
      <Card>
        <CardHeader><CardTitle>Form Details</CardTitle></CardHeader>
        <CardContent>
          <Label>Form Title</Label>
          <Input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
        </CardContent>
      </Card>

      {form.fields?.map((field, fIndex) => (
        <Card key={field.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Field {fIndex + 1}</CardTitle>
              <Button variant="ghost" size="icon"><Trash className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>Label</Label>
            <Input value={field.label} onChange={e => handleFieldChange(fIndex, 'label', e.target.value)} />
            <Label>Field Type</Label>
            <Select value={field.fieldType} onValueChange={value => handleFieldChange(fIndex, 'fieldType', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Textarea</SelectItem>
                <SelectItem value="select">Select</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={handleAddField}><Plus className="h-4 w-4 mr-2" />Add Field</Button>
      <Button onClick={handleSaveForm}>Save Form</Button>
    </div>
  );
};

export default FormBuilder;
