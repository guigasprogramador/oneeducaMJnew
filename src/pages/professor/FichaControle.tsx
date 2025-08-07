import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { professorService } from '@/services/professorService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const FichaControle = () => {
  const { user } = useAuth();
  const [taughtCourses, setTaughtCourses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      Promise.all([
        professorService.getTaughtCourses(user.id),
        professorService.getProfessorPayments(user.id),
      ]).then(([courses, paymentsData]) => {
        setTaughtCourses(courses);
        setPayments(paymentsData);
        setIsLoading(false);
      });
    }
  }, [user]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Ficha de Controle</h1>
      <Card>
        <CardHeader>
          <CardTitle>Horas-aula Ministradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Horas Ministradas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taughtCourses.map((course) => (
                <TableRow key={course.course.title}>
                  <TableCell>{course.course.title}</TableCell>
                  <TableCell>{course.hours_logged}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proventos Recebidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell>R$ {payment.amount}</TableCell>
                  <TableCell>{payment.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FichaControle;
