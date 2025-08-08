import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import financialService from '@/services/financialService';
import { userService } from '@/services/userService';
import { serviceProviderService } from '@/services/serviceProviderService';

import { FinancialTransaction, NewFinancialTransaction } from '@/types/financial';
import { User } from '@/types';
import { ServiceProvider } from '@/services/serviceProviderService';
import { PlusCircle } from 'lucide-react';

const AdminFinancial: React.FC = () => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Partial<NewFinancialTransaction>>({
    type: 'expense',
    status: 'pending',
  });
  const [entityType, setEntityType] = useState<'user' | 'provider'>('user');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [transData, usersData, providersData] = await Promise.all([
        financialService.getFinancialTransactions(),
        userService.getUsers(),
        serviceProviderService.getServiceProviders(),
      ]);
      setTransactions(transData);
      setUsers(usersData);
      setProviders(providersData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to fetch data', { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTransaction((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewTransaction((prev) => ({ ...prev, [name]: value }));
  };

  const handleEntitySelectChange = (name: string, value: string) => {
    if (entityType === 'user') {
        setNewTransaction((prev) => ({ ...prev, profileId: value, providerId: undefined }));
    } else {
        setNewTransaction((prev) => ({ ...prev, providerId: value, profileId: undefined }));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.dueDate) {
      toast.error('Please fill all required fields.');
      return;
    }
    if (!newTransaction.profileId && !newTransaction.providerId) {
        toast.error('Please link the transaction to a User or Service Provider.');
        return;
    }

    try {
      await financialService.createFinancialTransaction(newTransaction as NewFinancialTransaction);
      toast.success('Transaction created successfully!');
      setIsDialogOpen(false);
      setNewTransaction({ type: 'expense', status: 'pending' }); // Reset form
      fetchData(); // Refresh data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      toast.error('Failed to create transaction', { description: errorMessage });
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-4">Loading financial data...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestão Financeira</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Transação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Descrição</Label>
                  <Input id="description" name="description" value={newTransaction.description || ''} onChange={handleInputChange} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">Valor</Label>
                  <Input id="amount" name="amount" type="number" value={newTransaction.amount || ''} onChange={handleInputChange} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dueDate" className="text-right">Vencimento</Label>
                    <Input id="dueDate" name="dueDate" type="date" value={newTransaction.dueDate || ''} onChange={handleInputChange} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Tipo</Label>
                  <Select name="type" onValueChange={(value) => handleSelectChange('type', value)} defaultValue={newTransaction.type}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">Status</Label>
                  <Select name="status" onValueChange={(value) => handleSelectChange('status', value)} defaultValue={newTransaction.status}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="overdue">Atrasado</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Vincular a</Label>
                    <Select onValueChange={(value: 'user' | 'provider') => setEntityType(value)} defaultValue={entityType}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="user">Usuário (Aluno/Professor)</SelectItem>
                            <SelectItem value="provider">Prestador de Serviço</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {entityType === 'user' ? (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="profileId" className="text-right">Usuário</Label>
                        <Select name="profileId" onValueChange={(value) => handleEntitySelectChange('profileId', value)}>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Selecione um usuário" /></SelectTrigger>
                            <SelectContent>
                                {users.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="providerId" className="text-right">Prestador</Label>
                        <Select name="providerId" onValueChange={(value) => handleEntitySelectChange('providerId', value)}>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Selecione um prestador" /></SelectTrigger>
                            <SelectContent>
                                {providers.map(p => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                <Button type="submit">Salvar Transação</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>R$ {t.amount.toFixed(2)}</TableCell>
                  <TableCell>{t.type === 'income' ? 'Receita' : 'Despesa'}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell>{new Date(t.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{/* Action buttons (edit, delete) here */}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Nenhuma transação encontrada.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminFinancial;
