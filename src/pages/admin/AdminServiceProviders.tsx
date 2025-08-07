import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { serviceProviderService, ServiceProvider } from '@/services/serviceProviderService';
import ServiceProvidersTable from '@/components/admin/service-providers/ServiceProvidersTable';
import ServiceProviderForm from '@/components/admin/service-providers/ServiceProviderForm';

const AdminServiceProviders = () => {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | undefined>(undefined);

  const fetchProviders = async () => {
    setIsLoading(true);
    const data = await serviceProviderService.getServiceProviders();
    setProviders(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleFormSubmit = async (data: ServiceProvider) => {
    if (editingProvider) {
      await serviceProviderService.updateServiceProvider(editingProvider.id!, data);
    } else {
      await serviceProviderService.createServiceProvider(data);
    }
    fetchProviders();
    setIsDialogOpen(false);
    setEditingProvider(undefined);
  };

  const handleEdit = (provider: ServiceProvider) => {
    setEditingProvider(provider);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await serviceProviderService.deleteServiceProvider(id);
    fetchProviders();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Service Providers</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingProvider(undefined);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Provider
            </Button>
          </DialogTrigger>
          <ServiceProviderForm
            initialData={editingProvider}
            onSubmit={handleFormSubmit}
          />
        </Dialog>
      </div>

      <Card>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <ServiceProvidersTable
            providers={providers}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </Card>
    </div>
  );
};

export default AdminServiceProviders;
