import { supabase } from '@/integrations/supabase/client';
import { FinancialTransaction, Scholarship, ProfileScholarship } from '@/types/financial';

// Type for creating a new transaction, omitting read-only fields
export type NewFinancialTransaction = Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>;

// Type for updating a transaction
export type UpdateFinancialTransaction = Partial<NewFinancialTransaction>;


const financialService = {
  // == FINANCIAL TRANSACTIONS ==

  async getFinancialTransactions(): Promise<FinancialTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('due_date', { ascending: false });

      if (error) throw error;

      return data.map(t => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        type: t.type,
        status: t.status,
        dueDate: t.due_date,
        paidAt: t.paid_at,
        profileId: t.profile_id,
        providerId: t.provider_id,
        relatedContractId: t.related_contract_id,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching financial transactions:', error);
      throw new Error('Failed to fetch financial transactions.');
    }
  },

  async createFinancialTransaction(transaction: NewFinancialTransaction): Promise<FinancialTransaction> {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert({
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status,
          due_date: transaction.dueDate,
          paid_at: transaction.paidAt,
          profile_id: transaction.profileId,
          provider_id: transaction.providerId,
          related_contract_id: transaction.relatedContractId,
        })
        .select('*')
        .single();

      if (error) throw error;

      return {
        id: data.id,
        description: data.description,
        amount: data.amount,
        type: data.type,
        status: data.status,
        dueDate: data.due_date,
        paidAt: data.paid_at,
        profileId: data.profile_id,
        providerId: data.provider_id,
        relatedContractId: data.related_contract_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error creating financial transaction:', error);
      throw new Error('Failed to create financial transaction.');
    }
  },

  async updateFinancialTransaction(id: string, updates: UpdateFinancialTransaction): Promise<FinancialTransaction> {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .update({
          description: updates.description,
          amount: updates.amount,
          type: updates.type,
          status: updates.status,
          due_date: updates.dueDate,
          paid_at: updates.paidAt,
          profile_id: updates.profileId,
          provider_id: updates.providerId,
          related_contract_id: updates.relatedContractId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      return {
        id: data.id,
        description: data.description,
        amount: data.amount,
        type: data.type,
        status: data.status,
        dueDate: data.due_date,
        paidAt: data.paid_at,
        profileId: data.profile_id,
        providerId: data.provider_id,
        relatedContractId: data.related_contract_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error updating financial transaction:', error);
      throw new Error('Failed to update financial transaction.');
    }
  },

  async deleteFinancialTransaction(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting financial transaction:', error);
      throw new Error('Failed to delete financial transaction.');
    }
  },

  // Placeholder for Scholarship and ProfileScholarship functions
  // I will add them in a future step if needed
};

export default financialService;
