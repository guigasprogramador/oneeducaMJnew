import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '@/services/quizService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { QuizResponse } from '@/types/professor';

const QuizResults = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<QuizResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (moduleId) {
      quizService.getQuizAttempts(moduleId)
        .then(data => {
          setAttempts(data);
          setIsLoading(false);
        })
        .catch(err => {
          toast.error('Failed to load quiz results.');
          setIsLoading(false);
        });
    }
  }, [moduleId]);

  if (isLoading) return <p>Loading results...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Quiz Results</h1>
        <Button variant="outline" onClick={() => navigate(`/admin/module/${moduleId}/quiz`)}>Back to Quiz Builder</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">No attempts yet.</TableCell>
                </TableRow>
              ) : (
                attempts.map(attempt => (
                  <TableRow key={attempt.id}>
                    <TableCell>{attempt.profiles?.name || 'Unknown User'}</TableCell>
                    <TableCell>
                      <Badge variant={attempt.score >= 70 ? 'default' : 'destructive'}>
                        {attempt.score}%
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(attempt.completed_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizResults;
