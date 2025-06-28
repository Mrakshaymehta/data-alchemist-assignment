import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

interface ValidationError {
  rowIndex: number;
  field: string;
  message: string;
}

export default function DataGridViewer({ 
  data, 
  onChange, 
  errors = [] 
}: { 
  data: any[], 
  onChange: (data: any[]) => void,
  errors?: ValidationError[]
}) {
  if (!data.length) return <p>No data</p>;
  
  console.log('DataGridViewer received errors:', errors);
  
  const columns = Object.keys(data[0]).map((key) => ({ 
    key, 
    name: key, 
    editable: true,
    renderCell: ({ rowIdx, column }: { rowIdx: number, column: any }) => {
      const cellErrors = errors.filter(error => error.rowIndex === rowIdx && error.field === column.key);
      const hasError = cellErrors.length > 0;
      const errorMessage = cellErrors.map(e => e.message).join(', ');
      
      if (hasError) {
        console.log(`Error in cell [${rowIdx}, ${column.key}]:`, errorMessage);
      }
      
      return (
        <div 
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            backgroundColor: hasError ? '#fecaca' : 'transparent',
            border: hasError ? '1px solid #ef4444' : 'none'
          }}
          title={hasError ? errorMessage : undefined}
        >
          {data[rowIdx][column.key]}
        </div>
      );
    }
  }));

  return (
    <div className="my-4">
      <DataGrid
        columns={columns}
        rows={data}
        onRowsChange={(newRows: any[]) => onChange(newRows)}
        className="rdg-light"
      />
    </div>
  );
}
