import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import Papa from 'papaparse';

import financialService from '@/services/financialService';
import { userService } from '@/services/userService';
import { serviceProviderService } from '@/services/serviceProviderService';

import { FinancialTransaction, NewFinancialTransaction, Scholarship, ProfileScholarship } from '@/types/financial';
import { User } from '@/types';
import { ServiceProvider } from '@/services/serviceProviderService';
import { PlusCircle, Trash2, Upload } from 'lucide-react';

type ProfileScholarshipWithNames = ProfileScholarship & { profiles: { name: string }, scholarships: { name: string }};

// Interfaces for CSV parsing to avoid 'any'
interface TransactionCsvRow {
  description: string;
  amount: string;
  type: 'income' | 'expense';
  status: 'pending' | 'paid' | 'overdue' | 'canceled';
  due_date: string;
  user_email?: string;
  provider_name?: string;
}

interface ScholarshipCsvRow {
    user_email: string;
    scholarship_name: string;
    start_date: string;
    end_date?: string;
}

// Main Component
const AdminFinancial: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Gestão Financeira</h1>
        <Tabs defaultValue="transactions">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="transactions">Transações</TabsTrigger>
                <TabsTrigger value="scholarships">Bolsas de Estudo</TabsTrigger>
            </TabsList>
            <TabsContent value="transactions">
                <TransactionsTab />
            </TabsContent>
            <TabsContent value="scholarships">
                <ScholarshipsTab />
            </TabsContent>
        </Tabs>
    </div>
  );
};

// Transactions Tab Component
const TransactionsTab: React.FC = () => {
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [providers, setProviders] = useState<ServiceProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSingleDialogOpen, setIsSingleDialogOpen] = useState(false);
    const [newTransaction, setNewTransaction] = useState<Partial<NewFinancialTransaction>>({ type: 'expense', status: 'pending' });
    const [entityType, setEntityType] = useState<'user' | 'provider'>('user');
    const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [transData, usersData, providersData] = await Promise.all([
                financialService.getFinancialTransactions(),
                userService.getUsers(),
                serviceProviderService.getServiceProviders(),
            ]);
            setTransactions(transData);
            setUsers(usersData);
            setProviders(providersData);
        } catch (error) { toast.error("Failed to fetch transaction data."); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setNewTransaction(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSelectChange = (name: string, value: string) => setNewTransaction(p => ({ ...p, [name]: value }));
    const handleEntitySelectChange = (value: string) => {
        if (entityType === 'user') setNewTransaction(p => ({ ...p, profileId: value, providerId: undefined }));
        else setNewTransaction(p => ({ ...p, providerId: value, profileId: undefined }));
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTransaction.description || !newTransaction.amount || !newTransaction.dueDate || (!newTransaction.profileId && !newTransaction.providerId)) {
            toast.error('Please fill all required fields.'); return;
        }
        try {
            await financialService.createFinancialTransaction(newTransaction as NewFinancialTransaction);
            toast.success('Transaction created!');
            setIsSingleDialogOpen(false);
            setNewTransaction({ type: 'expense', status: 'pending' });
            fetchData();
        } catch (err) { toast.error('Failed to create transaction.'); }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setCsvFile(e.target.files[0]);
    };

    const handleBatchSubmit = async () => {
        if (!csvFile) { toast.error("Please select a CSV file."); return; }
        setIsUploading(true);
        const userEmailMap = new Map(users.map(u => [u.email, u.id]));
        const providerNameMap = new Map(providers.map(p => [p.name, p.id]));
        Papa.parse(csvFile, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const newTransactions = (results.data as TransactionCsvRow[]).map((row) => {
                        const profileId = row.user_email ? userEmailMap.get(row.user_email) : undefined;
                        const providerId = row.provider_name ? providerNameMap.get(row.provider_name) : undefined;
                        if (!profileId && !providerId) return null;
                        return {
                            description: row.description, amount: parseFloat(row.amount), type: row.type,
                            status: row.status, dueDate: new Date(row.due_date).toISOString(),
                            profileId: profileId, providerId: providerId,
                        };
                    }).filter((t): t is NewFinancialTransaction => t !== null && !isNaN(t.amount));

                    if(newTransactions.length === 0) {
                        toast.error("No valid transactions found in file.");
                        setIsUploading(false); return;
                    }
                    await financialService.createBatchTransactions(newTransactions);
                    toast.success(`${newTransactions.length} transactions imported!`);
                    setIsBatchDialogOpen(false); setCsvFile(null);
                    if(fileInputRef.current) fileInputRef.current.value = "";
                    fetchData();
                } catch (error) { toast.error("Error during batch import."); }
                finally { setIsUploading(false); }
            },
            error: () => { toast.error("Failed to parse CSV."); setIsUploading(false); }
        });
    };

    if (isLoading) return <div>Loading transactions...</div>;

    return (
        <div className="mt-4">
            <div className="flex justify-end gap-2 mb-4">
                <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}><DialogTrigger asChild><Button variant="outline"><Upload className="mr-2 h-4 w-4" />Importar Lote</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Importar Transações</DialogTitle></DialogHeader><div><p className="text-sm text-muted-foreground mb-2">CSV com colunas: `description`, `amount`, `type`, `status`, `due_date`, e `user_email` ou `provider_name`.</p><Input type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} /></div><DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose><Button onClick={handleBatchSubmit} disabled={isUploading}>{isUploading ? "Importando..." : "Importar"}</Button></DialogFooter></DialogContent></Dialog>
                <Dialog open={isSingleDialogOpen} onOpenChange={setIsSingleDialogOpen}><DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Nova Transação</Button></DialogTrigger><DialogContent>{/* Single transaction form */}</DialogContent></Dialog>
            </div>
            <div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead><TableHead>Vencimento</TableHead></TableRow></TableHeader><TableBody>{transactions.length > 0 ? transactions.map(t => (<TableRow key={t.id}><TableCell>{t.description}</TableCell><TableCell>R$ {t.amount.toFixed(2)}</TableCell><TableCell>{t.type === 'income' ? 'Receita' : 'Despesa'}</TableCell><TableCell>{t.status}</TableCell><TableCell>{new Date(t.dueDate).toLocaleDateString()}</TableCell></TableRow>)) : <TableRow><TableCell colSpan={5} className="text-center">Nenhuma transação.</TableCell></TableRow>}</TableBody></Table></div>
        </div>
    );
};

// Scholarships Tab Component
const ScholarshipsTab: React.FC = () => {
    const [scholarships, setScholarships] = useState<Scholarship[]>([]);
    const [profileScholarships, setProfileScholarships] = useState<ProfileScholarshipWithNames[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
    const [newScholarship, setNewScholarship] = useState<Partial<Omit<Scholarship, 'id' | 'createdAt' | 'updatedAt'>>>({});
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [newAssignment, setNewAssignment] = useState<Partial<Omit<ProfileScholarship, 'id' | 'createdAt'>>>({});
    const [isBatchAssignDialogOpen, setIsBatchAssignDialogOpen] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [scholarshipsData, assignmentsData, usersData] = await Promise.all([
                financialService.getScholarships(), financialService.getProfileScholarships(), userService.getUsers(),
            ]);
            setScholarships(scholarshipsData);
            setProfileScholarships(assignmentsData as ProfileScholarshipWithNames[]);
            setUsers(usersData.filter(u => u.role === 'student'));
        } catch (error) { toast.error("Failed to fetch scholarship data."); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleTypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newScholarship.name || newScholarship.discountPercentage === undefined) { toast.error("Name and discount are required."); return; }
        try {
            await financialService.createScholarship(newScholarship as Omit<Scholarship, 'id' | 'createdAt' | 'updatedAt'>);
            toast.success("Scholarship type created!");
            setIsTypeDialogOpen(false); setNewScholarship({}); fetchData();
        } catch (error) { toast.error("Failed to create scholarship type."); }
    };

    const handleTypeDelete = async (id: string) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await financialService.deleteScholarship(id);
            toast.success("Scholarship type deleted."); fetchData();
        } catch (error) { toast.error("Failed to delete type."); }
    };

    const handleAssignmentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAssignment.profileId || !newAssignment.scholarshipId || !newAssignment.startDate) { toast.error("All fields required."); return; }
        try {
            await financialService.assignScholarshipToProfile(newAssignment as Omit<ProfileScholarship, 'id' | 'createdAt'>);
            toast.success("Scholarship assigned!");
            setIsAssignDialogOpen(false); setNewAssignment({}); fetchData();
        } catch (error) { toast.error("Failed to assign scholarship."); }
    };

    const handleAssignmentDelete = async (id: string) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await financialService.removeScholarshipFromProfile(id);
            toast.success("Assignment removed."); fetchData();
        } catch (error) { toast.error("Failed to remove assignment."); }
    };

    const handleBatchAssignSubmit = () => {
        if (!csvFile) { toast.error("Please select a CSV file."); return; }
        setIsUploading(true);
        const userEmailMap = new Map(users.map(u => [u.email, u.id]));
        const scholarshipNameMap = new Map(scholarships.map(s => [s.name, s.id]));
        Papa.parse(csvFile, {
            header: true, skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const newAssignments = (results.data as ScholarshipCsvRow[]).map((row) => {
                        const profileId = userEmailMap.get(row.user_email);
                        const scholarshipId = scholarshipNameMap.get(row.scholarship_name);
                        if (!profileId || !scholarshipId) return null;
                        return {
                            profileId, scholarshipId,
                            startDate: new Date(row.start_date).toISOString(),
                            endDate: row.end_date ? new Date(row.end_date).toISOString() : undefined,
                        };
                    }).filter((a): a is Omit<ProfileScholarship, 'id' | 'createdAt'> => a !== null);

                    if (newAssignments.length === 0) {
                        toast.error("No valid assignments found in file.");
                        setIsUploading(false); return;
                    }
                    await financialService.assignBatchScholarships(newAssignments);
                    toast.success(`${newAssignments.length} scholarships assigned!`);
                    setIsBatchAssignDialogOpen(false); setCsvFile(null);
                    if(fileInputRef.current) fileInputRef.current.value = "";
                    fetchData();
                } catch (error) { toast.error("Error during batch assignment."); }
                finally { setIsUploading(false); }
            },
            error: () => { toast.error("Failed to parse CSV."); setIsUploading(false); }
        });
    };

    if (isLoading) return <div>Loading scholarships...</div>;

    return (
        <div className="mt-4">
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2"><h2 className="text-xl font-semibold">Tipos de Bolsas</h2><Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}><DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Novo Tipo</Button></DialogTrigger><DialogContent>{/* Form */}</DialogContent></Dialog></div>
                <div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>% Desconto</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{scholarships.length > 0 ? scholarships.map(s => (<TableRow key={s.id}><TableCell>{s.name}</TableCell><TableCell>{s.discountPercentage}%</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleTypeDelete(s.id)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>)) : <TableRow><TableCell colSpan={3} className="text-center">Nenhum tipo de bolsa.</TableCell></TableRow>}</TableBody></Table></div>
            </div>
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold">Alunos Bolsistas</h2>
                    <div className="flex gap-2">
                        <Dialog open={isBatchAssignDialogOpen} onOpenChange={setIsBatchAssignDialogOpen}><DialogTrigger asChild><Button variant="outline"><Upload className="mr-2 h-4 w-4" />Importar Lote</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Importar Associações</DialogTitle></DialogHeader><div><p className="text-sm text-muted-foreground mb-2">CSV com colunas: `user_email`, `scholarship_name`, `start_date` (YYYY-MM-DD), `end_date` (opcional).</p><Input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)} ref={fileInputRef} /></div><DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose><Button onClick={handleBatchAssignSubmit} disabled={isUploading}>{isUploading ? "Importando..." : "Importar"}</Button></DialogFooter></DialogContent></Dialog>
                        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}><DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Associar Bolsa</Button></DialogTrigger><DialogContent>{/* Form */}</DialogContent></Dialog>
                    </div>
                </div>
                <div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Aluno</TableHead><TableHead>Bolsa</TableHead><TableHead>Início</TableHead><TableHead>Fim</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{profileScholarships.length > 0 ? profileScholarships.map(ps => (<TableRow key={ps.id}><TableCell>{ps.profiles?.name || 'N/A'}</TableCell><TableCell>{ps.scholarships?.name || 'N/A'}</TableCell><TableCell>{new Date(ps.startDate).toLocaleDateString()}</TableCell><TableCell>{ps.endDate ? new Date(ps.endDate).toLocaleDateString() : 'N/A'}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleAssignmentDelete(ps.id)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>)) : <TableRow><TableCell colSpan={5} className="text-center">Nenhum aluno bolsista.</TableCell></TableRow>}</TableBody></Table></div>
            </div>
        </div>
    );
};

export default AdminFinancial;
