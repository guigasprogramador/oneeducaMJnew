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

  // == SCHOLARSHIPS ==

  async getScholarships(): Promise<Scholarship[]> {
    try {
      const { data, error } = await supabase
        .from('scholarships')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      return data.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        discountPercentage: s.discount_percentage,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching scholarships:', error);
      throw new Error('Failed to fetch scholarships.');
    }
  },

  async createScholarship(scholarshipData: Omit<Scholarship, 'id' | 'createdAt' | 'updatedAt'>): Promise<Scholarship> {
    try {
      const { data, error } = await supabase
        .from('scholarships')
        .insert({
          name: scholarshipData.name,
          description: scholarshipData.description,
          discount_percentage: scholarshipData.discountPercentage,
        })
        .select('*')
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        discountPercentage: data.discount_percentage,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error creating scholarship:', error);
      throw new Error('Failed to create scholarship.');
    }
  },

  async deleteScholarship(id: string): Promise<void> {
    try {
      await supabase.from('profile_scholarships').delete().eq('scholarship_id', id);
      const { error } = await supabase
        .from('scholarships')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting scholarship:', error);
      throw new Error('Failed to delete scholarship.');
    }
  },

  // == PROFILE SCHOLARSHIPS ==

  async getProfileScholarships(): Promise<(ProfileScholarship & { profiles: { name: string }, scholarships: { name: string }})[]> {
    try {
        const { data, error } = await supabase
            .from('profile_scholarships')
            .select('*, profiles(name), scholarships(name)');

        if (error) throw error;

        return data.map(ps => ({
            id: ps.id,
            profileId: ps.profile_id,
            scholarshipId: ps.scholarship_id,
            startDate: ps.start_date,
            endDate: ps.end_date,
            createdAt: ps.created_at,
            profiles: ps.profiles,
            scholarships: ps.scholarships,
        }));
    } catch (error) {
        console.error('Error fetching profile scholarships:', error);
        throw new Error('Failed to fetch profile scholarships.');
    }
  },

  async assignScholarshipToProfile(assignment: Omit<ProfileScholarship, 'id' | 'createdAt'>): Promise<ProfileScholarship> {
    try {
        const { data, error } = await supabase
            .from('profile_scholarships')
            .insert({
                profile_id: assignment.profileId,
                scholarship_id: assignment.scholarshipId,
                start_date: assignment.startDate,
                end_date: assignment.endDate,
            })
            .select('*')
            .single();

        if (error) throw error;

        return {
            id: data.id,
            profileId: data.profile_id,
            scholarshipId: data.scholarship_id,
            startDate: data.start_date,
            endDate: data.end_date,
            createdAt: data.created_at,
        };
    } catch (error) {
        console.error('Error assigning scholarship:', error);
        throw new Error('Failed to assign scholarship.');
    }
  },

  async removeScholarshipFromProfile(assignmentId: string): Promise<void> {
      try {
          const { error } = await supabase
              .from('profile_scholarships')
              .delete()
              .eq('id', assignmentId);

          if (error) throw error;
      } catch (error) {
          console.error('Error removing scholarship assignment:', error);
          throw new Error('Failed to remove scholarship assignment.');
      }
  },

  // == BATCH OPERATIONS ==

  async createBatchTransactions(transactions: NewFinancialTransaction[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .insert(transactions.map(t => ({
            description: t.description,
            amount: t.amount,
            type: t.type,
            status: t.status,
            due_date: t.dueDate,
            paid_at: t.paidAt,
            profile_id: t.profileId,
            provider_id: t.providerId,
        })));

      if (error) throw error;
    } catch (error) {
      console.error('Error creating batch transactions:', error);
      throw new Error('Failed to create batch transactions.');
    }
  },

  async assignBatchScholarships(assignments: Omit<ProfileScholarship, 'id' | 'createdAt'>[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('profile_scholarships')
        .insert(assignments.map(a => ({
          profile_id: a.profileId,
          scholarship_id: a.scholarshipId,
          start_date: a.startDate,
          end_date: a.endDate,
        })));

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning batch scholarships:', error);
      throw new Error('Failed to assign batch scholarships.');
    }
  }
};

export default financialService;
