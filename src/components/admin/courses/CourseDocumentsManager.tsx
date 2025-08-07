import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Upload, File as FileIcon } from 'lucide-react';
import { CourseDocument } from '@/types';

interface CourseDocumentsManagerProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
}

const CourseDocumentsManager = ({ courseId, isOpen, onClose }: CourseDocumentsManagerProps) => {
  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
    }
  }, [courseId, isOpen]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('course_documents')
        .select('*')
        .eq('course_id', courseId);
      if (error) throw error;
      setDocuments(data.map(d => ({ ...d, documentName: d.document_name, documentUrl: d.document_url, courseId: d.course_id, createdAt: d.created_at })));
    } catch (error) {
      toast.error('Failed to load documents.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const filePath = `${courseId}/${file.name}`;
      const { error: uploadError } = await supabase.storage.from('course-documents').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('course-documents').getPublicUrl(filePath);

      const { data: newDocument, error: dbError } = await supabase
        .from('course_documents')
        .insert({ course_id: courseId, document_name: file.name, document_url: publicUrl })
        .select()
        .single();

      if (dbError) throw dbError;

      setDocuments([...documents, { ...newDocument, documentName: newDocument.document_name, documentUrl: newDocument.document_url, courseId: newDocument.course_id, createdAt: newDocument.created_at }]);
      setFile(null);
      toast.success('Document uploaded.');
    } catch (error) {
      toast.error('Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string, documentUrl: string) => {
    try {
      const filePath = new URL(documentUrl).pathname.split('/course-documents/')[1];
      await supabase.storage.from('course-documents').remove([filePath]);
      await supabase.from('course_documents').delete().eq('id', documentId);
      setDocuments(documents.filter(d => d.id !== documentId));
      toast.success('Document deleted.');
    } catch (error) {
      toast.error('Failed to delete document.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Course Documents</DialogTitle>
        </DialogHeader>
        {isLoading ? <p>Loading...</p> : (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Current Documents</h4>
              <ul className="space-y-2 mt-2">
                {documents.map(doc => (
                  <li key={doc.id} className="flex items-center justify-between">
                    <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <FileIcon className="h-4 w-4" />
                      <span>{doc.documentName}</span>
                    </a>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id, doc.documentUrl)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
                {documents.length === 0 && <p className="text-muted-foreground">No documents.</p>}
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Upload New Document</h4>
              <div className="flex gap-2 mt-2">
                <Input type="file" onChange={handleFileChange} />
                <Button onClick={handleUpload} disabled={isUploading || !file}>
                  {isUploading ? 'Uploading...' : <Upload className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDocumentsManager;
