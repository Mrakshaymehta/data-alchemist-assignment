import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

interface FileData {
    [key: string]: any;
}

export default function FileUploader({
    onFileUpload
}: {
    onFileUpload: (type: string, data: FileData[]) => void
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
            // Validate file size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                throw new Error('File size too large. Please upload a file smaller than 10MB.');
            }

            // Validate file type
            const fileExtension = file.name.toLowerCase().split('.').pop();
            if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
                throw new Error('Please upload a valid CSV or Excel file.');
            }

            let data: FileData[] = [];

            if (fileExtension === 'csv') {
                // Handle CSV files
                data = await parseCSV(file);
            } else {
                // Handle Excel files
                data = await parseExcel(file);
            }

            if (data.length === 0) {
                throw new Error('No data found in the file.');
            }

            // Determine file type based on filename
            const type = file.name.toLowerCase().includes('client')
                ? 'clients'
                : file.name.toLowerCase().includes('worker')
                    ? 'workers'
                    : 'tasks';

            onFileUpload(type, data);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while processing the file.');
        } finally {
            setIsLoading(false);
        }
    };

    const parseCSV = (file: File): Promise<FileData[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const text = event.target?.result as string;
                    const Papa = (await import('papaparse')).default;
                    
                    Papa.parse(text, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results: any) => {
                            if (results.errors && results.errors.length > 0) {
                                reject(new Error('Error parsing CSV file. Please check the file format.'));
                                return;
                            }
                            resolve(results.data as FileData[]);
                        },
                        error: (error: any) => {
                            reject(new Error(`CSV parsing error: ${error.message}`));
                        }
                    });
                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = () => {
                reject(new Error('Error reading file.'));
            };

            reader.readAsText(file);
        });
    };

    const parseExcel = (file: File): Promise<FileData[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Get the first sheet
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    resolve(jsonData as FileData[]);
                } catch (err) {
                    reject(new Error('Error parsing Excel file. Please check the file format.'));
                }
            };

            reader.onerror = () => {
                reject(new Error('Error reading file.'));
            };

            reader.readAsArrayBuffer(file);
        });
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                    Upload your CSV or Excel file
                </p>
                <p className="text-xs text-gray-500">
                    Supported formats: .csv, .xlsx, .xls (Max 10MB)
                </p>
            </div>

            <input
                type="file"
                accept=".csv,.xlsx,.xls"
                ref={fileInputRef}
                onChange={handleFile}
                disabled={isLoading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {isLoading && (
                <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Processing file...</span>
                </div>
            )}

            {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
                    {error}
                </div>
            )}
        </div>
    );
}
