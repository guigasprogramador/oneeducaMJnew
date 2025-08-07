import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { academicWorkService } from '@/services/academicWorkService';
import { AcademicWork } from '@/types';
import { Trash2, FileText, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AcademicWorkSubmissionProps {
  classId: string;
  userId: string;
}

export const AcademicWorkSubmission = ({ classId, userId }: AcademicWorkSubmissionProps) => {
  const [works, setWorks] = useState<AcademicWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  const fetchWorks = useCallback(async () => {
    if (!classId || !userId) return;
    setIsLoading(true);
    try {
      const userWorks = await academicWorkService.getMyAcademicWorks(classId, userId);
      setWorks(userWorks);
    } catch (error) {
      toast.error('Erro ao buscar seus trabalhos acadêmicos.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [classId, userId]);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      toast.warning('Por favor, forneça um título e selecione um arquivo.');
      return;
    }
    setIsUploading(true);
    try {
      await academicWorkService.uploadAcademicWork(classId, userId, selectedFile, title);
      toast.success('Trabalho enviado com sucesso!');
      setSelectedFile(null);
      setTitle('');
      const fileInput = document.getElementById('work-file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchWorks(); // Refresh the list
    } catch (error) {
      toast.error('Falha no envio do trabalho.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (workId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este trabalho?')) return;
    try {
      await academicWorkService.deleteAcademicWork(workId);
      toast.success('Trabalho deletado com sucesso!');
      fetchWorks(); // Refresh the list
    } catch (error) {
      toast.error('Falha ao deletar o trabalho.');
      console.error(error);
    }
  };

  return (
    <div className="space-y-4 pt-4 mt-6 border-t">
      <h3 className="text-lg font-medium">Meus Trabalhos Enviados</h3>

      <div className="p-4 border rounded-md space-y-4">
        <h4 className="font-medium">Enviar novo trabalho</h4>
        <div className="space-y-2">
            <Label htmlFor="work-title">Título do Trabalho</Label>
            <Input
                id="work-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Resumo do Capítulo 1"
            />
        </div>
        <div className="space-y-2">
            <Label htmlFor="work-file-upload">Arquivo do Trabalho</Label>
            <div className="flex items-center gap-2">
            <Input id="work-file-upload" type="file" onChange={handleFileChange} />
            <Button onClick={handleUpload} disabled={isUploading || !selectedFile || !title.trim()}>
                {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                <Upload className="h-4 w-4 mr-2" />
                )}
                Enviar
            </Button>
            </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Trabalhos existentes</h4>
        {isLoading ? (
          <p>Carregando trabalhos...</p>
        ) : works.length > 0 ? (
          <ul className="space-y-2">
            {works.map((work) => (
              <li key={work.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <a href={work.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {work.title}
                    </a>
                    <p className="text-xs text-muted-foreground">
                        Enviado em: {new Date(work.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(work.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum trabalho enviado para esta turma.</p>
        )}
      </div>
    </div>
  );
};
