import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { documentService } from '@/services/documentService';
import { CourseDocument } from '@/types';
import { Trash2, FileText, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CourseDocumentsProps {
  courseId: string;
}

export const CourseDocuments = ({ courseId }: CourseDocumentsProps) => {
  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const docs = await documentService.getDocumentsByCourse(courseId);
      setDocuments(docs);
    } catch (error) {
      toast.error('Erro ao buscar documentos do curso.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.warning('Por favor, selecione um arquivo.');
      return;
    }
    setIsUploading(true);
    try {
      await documentService.uploadCourseDocument(courseId, selectedFile);
      toast.success('Documento enviado com sucesso!');
      setSelectedFile(null); // Reset file input
      // Clear the file input visually
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if(fileInput) fileInput.value = '';
      fetchDocuments(); // Refresh the list
    } catch (error) {
      toast.error('Falha no upload do documento.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este documento?')) return;
    try {
      await documentService.deleteCourseDocument(documentId);
      toast.success('Documento deletado com sucesso!');
      fetchDocuments(); // Refresh the list
    } catch (error) {
      toast.error('Falha ao deletar o documento.');
      console.error(error);
    }
  };

  return (
    <div className="space-y-4 pt-4 mt-6 border-t">
      <h3 className="text-lg font-medium">Documentos do Curso</h3>

      <div className="space-y-2">
        <Label htmlFor="file-upload">Adicionar novo documento</Label>
        <div className="flex items-center gap-2">
          <Input id="file-upload" type="file" onChange={handleFileChange} />
          <Button onClick={handleUpload} disabled={isUploading || !selectedFile}>
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Enviar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Documentos existentes</h4>
        {isLoading ? (
          <p>Carregando documentos...</p>
        ) : documents.length > 0 ? (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {doc.documentName}
                  </a>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(doc.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum documento encontrado.</p>
        )}
      </div>
    </div>
  );
};
