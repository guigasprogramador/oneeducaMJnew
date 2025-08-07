import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { professorService, ProfessorDetails } from '@/services/professorService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ProfessorProfile = () => {
  const { user } = useAuth();
  const [details, setDetails] = useState<ProfessorDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      professorService.getProfessorDetails(user.id).then((data) => {
        setDetails(data);
        setIsLoading(false);
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (details) {
      setDetails({ ...details, [e.target.name]: e.target.value });
    }
  };

  const handleQualificationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (details) {
      setDetails({ ...details, qualifications: e.target.value.split(',') });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (details && user) {
      const detailsToSave = { ...details, user_id: user.id };
      const success = details.id
        ? await professorService.updateProfessorDetails(detailsToSave)
        : await professorService.createProfessorDetails(detailsToSave);

      if (success) {
        professorService.getProfessorDetails(user.id).then(setDetails);
      }
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Professor Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Your Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={details?.bio || ''}
                onChange={handleInputChange}
                placeholder="Tell us about yourself"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                name="specialization"
                value={details?.specialization || ''}
                onChange={handleInputChange}
                placeholder="e.g., React, Node.js, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualifications">Qualifications (comma-separated)</Label>
              <Input
                id="qualifications"
                name="qualifications"
                value={details?.qualifications?.join(',') || ''}
                onChange={handleQualificationsChange}
                placeholder="e.g., PhD in Computer Science, MSc in AI"
              />
            </div>
            {/* Availability field is omitted for simplicity for now */}
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessorProfile;
