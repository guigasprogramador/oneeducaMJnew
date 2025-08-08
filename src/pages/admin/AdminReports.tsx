import { useState } from 'react';
import { ReportDisplay } from '@/components/admin/reports/ReportDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportKey } from '@/components/admin/ReportFilters';
import { reportService } from '@/services/reportService';
import { supabase } from '@/integrations/supabase/client';

import { useEffect } from 'react';

interface Class {
  id: string;
  name: string;
  course_title: string;
}

const AdminReports = () => {
  const [selectedReport, setSelectedReport] = useState<ReportKey | 'none'>('none');
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedDocStatus, setSelectedDocStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, courses(title)');

      if (error) {
        console.error('Error fetching classes:', error);
      } else {
        const formattedClasses = data.map(c => ({
          id: c.id,
          name: c.name,
          course_title: c.courses.title,
        }));
        setClasses(formattedClasses);
      }
    };
    fetchClasses();
  }, []);

  const handleGenerateReport = async () => {
    if (selectedReport === 'none') {
      setError("Por favor, selecione um tipo de relatório.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setReportData(null);

    try {
      let data;
      const params = {}; // Will be populated with filters later

      switch (selectedReport) {
        case 'document_issuance_summary':
          data = await reportService.getDocumentIssuanceSummary(null, null, null);
          break;
        case 'document_lifecycle':
          data = await reportService.getDocumentIssuanceSummary(null, null, selectedDocStatus);
          break;
        case 'dropouts':
          if (!selectedClass) {
            throw new Error("Por favor, selecione uma turma para este relatório.");
          }
          data = await reportService.getStudentsPerClass(selectedClass, 'evadidos');
          break;
        case 'attendance_list':
          if (!selectedClass) {
            throw new Error("Por favor, selecione uma turma para este relatório.");
          }
          data = await reportService.getStudentAttendanceSummary(selectedClass);
          break;
        // Other cases will be added here
        default:
          // A simple RPC call for other existing reports as a placeholder
          const { data: rpcData, error: rpcError } = await supabase.rpc(selectedReport, params);
          if (rpcError) throw rpcError;
          data = rpcData;
          break;
      }
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao gerar o relatório.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filtros do Relatório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="report-type">Tipo de Relatório</Label>
            <Select onValueChange={(value) => setSelectedReport(value as ReportKey)} defaultValue="none">
              <SelectTrigger id="report-type">
                <SelectValue placeholder="Selecione um relatório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>Selecione um tipo</SelectItem>
                <SelectItem value="quantitative_summary">Quantitativo Geral</SelectItem>
                <SelectItem value="enrollment_by_role">Inscrições por Cargo</SelectItem>
                <SelectItem value="students_per_class">Alunos por Turma</SelectItem>
                <SelectItem value="final_grades">Notas Finais</SelectItem>
                <SelectItem value="document_issuance_summary">Quantitativo de Documentos</SelectItem>
                <SelectItem value="dropouts">Relatório de Evasão</SelectItem>
                <SelectItem value="attendance_list">Relatório de Frequência</SelectItem>
                <SelectItem value="document_lifecycle">Lifecycle de Documentos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(selectedReport === 'dropouts' || selectedReport === 'students_per_class' || selectedReport === 'attendance_list') && (
            <div className="grid gap-2">
              <Label htmlFor="class-select">Turma</Label>
              <Select onValueChange={setSelectedClass} disabled={classes.length === 0}>
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.course_title} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedReport === 'document_lifecycle' && (
            <div className="grid gap-2">
              <Label htmlFor="doc-status-select">Status do Documento</Label>
              <Select onValueChange={setSelectedDocStatus}>
                <SelectTrigger id="doc-status-select">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emitido">Emitido</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? "Gerando..." : "Gerar Relatório"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportDisplay
            reportKey={selectedReport}
            data={reportData}
            isLoading={isLoading}
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
