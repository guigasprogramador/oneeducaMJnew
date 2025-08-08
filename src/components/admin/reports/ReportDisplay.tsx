import { ReportKey } from '@/components/admin/ReportFilters';
import { ReportDataTable, ColumnDef } from './ReportDataTable';
import { ReportChart } from './ReportChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

interface ReportDisplayProps {
  reportKey: ReportKey | 'none';
  data: any | null;
  isLoading: boolean;
  error: string | null;
}

// A specific component for the quantitative summary to show stats cards
const QuantitativeSummaryDisplay = ({ data }: { data: any }) => {
    if (!data || data.length === 0) return <p>Nenhum dado de resumo quantitativo.</p>;
    const summary = data[0];
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg bg-card">
                <h3 className="text-sm font-medium text-muted-foreground">Cursos</h3>
                <p className="text-2xl font-bold">{summary.course_count}</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
                <h3 className="text-sm font-medium text-muted-foreground">Turmas</h3>
                <p className="text-2xl font-bold">{summary.class_count}</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
                <h3 className="text-sm font-medium text-muted-foreground">Aulas</h3>
                <p className="text-2xl font-bold">{summary.lesson_count}</p>
            </div>
        </div>
    );
};


export function ReportDisplay({ reportKey, data, isLoading, error }: ReportDisplayProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
        <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Erro ao Gerar Relatório</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  if (reportKey === 'none' || !data) {
    return (
      <div className="text-center text-muted-foreground p-8 h-full flex items-center justify-center">
        <p>Selecione os filtros e clique em "Gerar Relatório" para ver os resultados.</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (reportKey) {
      case 'quantitative_summary':
        return <QuantitativeSummaryDisplay data={data} />;

      case 'enrollment_by_role':
        const enrollmentColumns: ColumnDef<any>[] = [
          { accessorKey: 'user_role', header: 'Cargo' },
          { accessorKey: 'enrollment_count', header: 'Nº de Inscrições' },
        ];
        const chartData = data.map((d: any) => ({ name: d.user_role, value: Number(d.enrollment_count) }));
        return (
          <div className="space-y-6">
            <ReportChart data={chartData} chartType="pie" title="Inscrições por Cargo" categoryKey="name" valueKey="value" />
            <ReportDataTable columns={enrollmentColumns} data={data} />
          </div>
        );

      case 'students_per_class':
        const studentColumns: ColumnDef<any>[] = [
          { accessorKey: 'user_name', header: 'Nome do Aluno' },
          { accessorKey: 'enrollment_status', header: 'Status' },
          { accessorKey: 'progress', header: 'Progresso (%)' },
        ];
        return <ReportDataTable columns={studentColumns} data={data} />;

      case 'final_grades':
        const gradeColumns: ColumnDef<any>[] = [
          { accessorKey: 'user_name', header: 'Aluno' },
          { accessorKey: 'course_title', header: 'Curso' },
          { accessorKey: 'quiz_title', header: 'Avaliação' },
          { accessorKey: 'score', header: 'Nota' },
        ];
        return <ReportDataTable columns={gradeColumns} data={data} />;

      case 'dropouts':
      case 'near_completion':
      case 'attendance_list':
        const attendanceColumns: ColumnDef<any>[] = [
          { accessorKey: 'user_name', header: 'Nome do Aluno' },
          { accessorKey: 'present_count', header: 'Presenças' },
          { accessorKey: 'absent_count', header: 'Faltas' },
          { accessorKey: 'justified_absence_count', header: 'Faltas Justificadas' },
          {
            accessorKey: 'attendance_rate',
            header: 'Taxa de Frequência (%)',
            cell: ({ row }) => `${parseFloat(row.original.attendance_rate).toFixed(2)}%`,
          },
        ];
        return <ReportDataTable columns={attendanceColumns} data={data} />;

      case 'document_lifecycle':
      case 'document_issuance_summary':
        const docColumns: ColumnDef<any>[] = [
          { accessorKey: 'document_type_br', header: 'Tipo de Documento' },
          { accessorKey: 'issuance_count', header: 'Quantidade Emitida' },
        ];
        const docChartData = data.map((d: any) => ({ name: d.document_type_br, value: Number(d.issuance_count) }));
        return (
          <div className="space-y-6">
            <ReportChart data={docChartData} chartType="pie" title="Documentos Emitidos por Tipo" categoryKey="name" valueKey="value" />
            <ReportDataTable columns={docColumns} data={data} />
          </div>
        );

      default:
        return <p>Visualização para este tipo de relatório ainda não implementada.</p>;
    }
  };

  return <div className="p-1">{renderContent()}</div>;
}
