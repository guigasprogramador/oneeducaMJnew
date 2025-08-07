import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

// A generic column definition type
export interface ColumnDef<T> {
  accessorKey: keyof T | ((row: T) => any);
  header: string;
  cell?: (row: T) => React.ReactNode;
}

interface ReportDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
}

export function ReportDataTable<T extends { id?: string | number }>({ data, columns }: ReportDataTableProps<T>) {
  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhum dado para exibir.</p>;
  }

  const getRowKey = (row: T, index: number) => {
    // Use a unique property like 'id' if it exists, otherwise fall back to index
    return row.id ?? `row-${index}`;
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={`header-${index}`}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={getRowKey(row, rowIndex)}>
              {columns.map((column, colIndex) => (
                <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                  {column.cell
                    ? column.cell(row)
                    : typeof column.accessorKey === 'function'
                    ? column.accessorKey(row)
                    : (row[column.accessorKey as keyof T] as React.ReactNode)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
