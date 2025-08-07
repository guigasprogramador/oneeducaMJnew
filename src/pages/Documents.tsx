import { useState, useEffect } from 'react';
import { documentService } from '@/services/documentService';
import { GeneralDocument } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const DocumentsPage = () => {
    const [documents, setDocuments] = useState<GeneralDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const { user, profile } = useAuth(); // Assuming profile contains role info

    // States for upload form
    const [isUploadVisible, setIsUploadVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const docs = await documentService.getGeneralDocuments();
            setDocuments(docs);
            const uniqueCategories = [...new Set(docs.map(d => d.category).filter(Boolean) as string[])];
            setCategories(uniqueCategories);
        } catch (error) {
            console.error("Error fetching documents:", error);
            toast.error("Falha ao buscar documentos.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) {
            toast.warning("Título e arquivo são obrigatórios.");
            return;
        }
        setIsUploading(true);
        try {
            await documentService.uploadGeneralDocument(file, { title, description, category });
            toast.success("Documento enviado com sucesso!");
            // Reset form
            setTitle('');
            setDescription('');
            setCategory('');
            setFile(null);
            setIsUploadVisible(false);
            fetchDocuments(); // Refresh list
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Falha no upload do documento.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (docId: string) => {
        if (!window.confirm("Tem certeza que deseja deletar este documento?")) return;
        try {
            await documentService.deleteGeneralDocument(docId);
            toast.success("Documento deletado com sucesso!");
            fetchDocuments();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Falha ao deletar documento.");
        }
    };

    const filteredDocuments = documents.filter(doc =>
        selectedCategory === 'all' || doc.category === selectedCategory
    );

    const isAdmin = profile?.role === 'admin';

    return (
        <div className="container py-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Diretório de Documentos</h1>
                {isAdmin && (
                    <Button onClick={() => setIsUploadVisible(!isUploadVisible)}>
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploadVisible ? 'Cancelar Envio' : 'Novo Documento'}
                    </Button>
                )}
            </div>

            {isAdmin && isUploadVisible && (
                <Card>
                    <CardHeader>
                        <CardTitle>Enviar Novo Documento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <Input placeholder="Título do Documento" value={title} onChange={e => setTitle(e.target.value)} required />
                            <Input placeholder="Descrição (opcional)" value={description} onChange={e => setDescription(e.target.value)} />
                            <Input placeholder="Categoria (opcional)" value={category} onChange={e => setCategory(e.target.value)} />
                            <Input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} required />
                            <Button type="submit" disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enviar
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <CardTitle>Documentos</CardTitle>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filtrar por categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Categorias</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p>Carregando...</p>
                    ) : filteredDocuments.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredDocuments.map(doc => (
                                <div key={doc.id} className="p-4 border rounded-md flex items-start justify-between">
                                    <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
                                        <FileText className="h-6 w-6 text-muted-foreground mt-1" />
                                        <div>
                                            <p className="font-semibold group-hover:underline">{doc.title}</p>
                                            <p className="text-sm text-muted-foreground">{doc.description}</p>
                                            {doc.category && <p className="text-xs bg-secondary text-secondary-foreground inline-block px-2 py-0.5 rounded-full mt-1">{doc.category}</p>}
                                        </div>
                                    </a>
                                    {isAdmin && (
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(doc.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Nenhum documento encontrado.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DocumentsPage;
