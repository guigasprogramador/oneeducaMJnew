import { useState, useEffect, useCallback } from 'react';
import { documentService } from '@/services/documentService';
import { GeneralDocument } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { FileText, Upload, Trash2, Loader2, Archive, Pencil, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const DocumentsPage = () => {
    const [documents, setDocuments] = useState<GeneralDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [viewStatus, setViewStatus] = useState<'active' | 'archived'>('active');
    const { profile } = useAuth();

    // Upload form states
    const [isUploadVisible, setIsUploadVisible] = useState(false);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadDescription, setUploadDescription] = useState('');
    const [uploadCategory, setUploadCategory] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Edit dialog states
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<GeneralDocument | null>(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', category: '' });

    const fetchDocuments = useCallback(async () => {
        setIsLoading(true);
        try {
            const docs = await documentService.getGeneralDocuments({ status: viewStatus });
            setDocuments(docs);
            if (viewStatus === 'active') {
                const uniqueCategories = [...new Set(docs.map(d => d.category).filter(Boolean) as string[])];
                setCategories(uniqueCategories);
            }
        } catch (error) {
            console.error(`Error fetching ${viewStatus} documents:`, error);
            toast.error(`Falha ao buscar documentos ${viewStatus === 'active' ? 'ativos' : 'arquivados'}.`);
        } finally {
            setIsLoading(false);
        }
    }, [viewStatus]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !uploadTitle) {
            toast.warning("Título e arquivo são obrigatórios.");
            return;
        }
        setIsUploading(true);
        try {
            await documentService.uploadGeneralDocument(uploadFile, { title: uploadTitle, description: uploadDescription, category: uploadCategory });
            toast.success("Documento enviado com sucesso!");
            setUploadTitle('');
            setUploadDescription('');
            setUploadCategory('');
            setUploadFile(null);
            setIsUploadVisible(false);
            fetchDocuments();
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Falha no upload do documento.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (docId: string) => {
        if (!window.confirm("Atenção! Esta ação é irreversível e deletará o documento permanentemente. Deseja continuar?")) return;
        try {
            await documentService.deleteGeneralDocument(docId);
            toast.success("Documento deletado permanentemente!");
            fetchDocuments();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Falha ao deletar documento.");
        }
    };

    const handleSetStatus = async (docId: string, status: 'active' | 'archived') => {
        const actionText = status === 'archived' ? 'arquivar' : 'reativar';
        if (!window.confirm(`Tem certeza que deseja ${actionText} este documento?`)) return;
        try {
            await documentService.setDocumentStatus(docId, status);
            toast.success(`Documento ${actionText} com sucesso!`);
            fetchDocuments();
        } catch (error) {
            toast.error(`Falha ao ${actionText} o documento.`);
        }
    };

    const handleEditClick = (doc: GeneralDocument) => {
        setEditingDocument(doc);
        setEditForm({ title: doc.title, description: doc.description || '', category: doc.category || '' });
        setIsEditOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDocument) return;
        try {
            await documentService.updateGeneralDocument(editingDocument.id, editForm);
            toast.success("Documento atualizado com sucesso!");
            setIsEditOpen(false);
            setEditingDocument(null);
            fetchDocuments();
        } catch (error) {
            toast.error("Falha ao atualizar o documento.");
        }
    };


    const filteredDocuments = documents.filter(doc =>
        selectedCategory === 'all' || doc.category === selectedCategory
    );

    const isAdmin = profile?.role === 'admin';

    const renderDocumentCard = (doc: GeneralDocument) => (
        <div key={doc.id} className="p-4 border rounded-md flex flex-col justify-between gap-3">
            <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
                <FileText className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-grow">
                    <p className="font-semibold group-hover:underline">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">{doc.description}</p>
                    {doc.category && <p className="text-xs bg-secondary text-secondary-foreground inline-block px-2 py-0.5 rounded-full mt-1">{doc.category}</p>}
                </div>
            </a>
            {isAdmin && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                     <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => handleEditClick(doc)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => handleSetStatus(doc.id, viewStatus === 'active' ? 'archived' : 'active')}>
                        {viewStatus === 'active' ? <Archive className="h-4 w-4" /> : <Inbox className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );

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
                    <CardHeader><CardTitle>Enviar Novo Documento</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <Input placeholder="Título do Documento" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} required />
                            <Textarea placeholder="Descrição (opcional)" value={uploadDescription} onChange={e => setUploadDescription(e.target.value)} />
                            <Input placeholder="Categoria (opcional)" value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} />
                            <Input type="file" onChange={e => setUploadFile(e.target.files ? e.target.files[0] : null)} required />
                            <Button type="submit" disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enviar
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Tabs value={viewStatus} onValueChange={(value) => setViewStatus(value as 'active' | 'archived')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">Ativos</TabsTrigger>
                    <TabsTrigger value="archived">Arquivados</TabsTrigger>
                </TabsList>
                <TabsContent value="active">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <CardTitle>Documentos Ativos</CardTitle>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar por categoria" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas as Categorias</SelectItem>
                                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <p>Carregando...</p> : filteredDocuments.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filteredDocuments.map(renderDocumentCard)}</div>
                            ) : <p>Nenhum documento ativo encontrado.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="archived">
                    <Card>
                        <CardHeader><CardTitle>Documentos Arquivados</CardTitle></CardHeader>
                        <CardContent>
                            {isLoading ? <p>Carregando...</p> : documents.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{documents.map(renderDocumentCard)}</div>
                            ) : <p>Nenhum documento arquivado encontrado.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Documento</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <Input placeholder="Título" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} required />
                        <Textarea placeholder="Descrição" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                        <Input placeholder="Categoria" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button type="submit">Salvar Alterações</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DocumentsPage;
