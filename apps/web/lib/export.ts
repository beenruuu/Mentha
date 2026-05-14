import JSZip from 'jszip';

/**
 * Convert data array to CSV string
 */
function convertToCSVString(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Array.from(new Set(data.flatMap((obj) => Object.keys(obj))));

    const csvRows = [
        headers.join(','),
        ...data.map((row) =>
            headers
                .map((header) => {
                    const value = row[header];
                    if (value === null || value === undefined) return '""';

                    const stringValue =
                        typeof value === 'object' ? JSON.stringify(value) : String(value);

                    const escaped = stringValue.replace(/"/g, '""');
                    return `"${escaped}"`;
                })
                .join(','),
        ),
    ];

    return csvRows.join('\n');
}

/**
 * Utility to export multiple datasets to a single ZIP file containing CSVs
 */
export async function exportToZIP(datasets: { data: any[]; name: string }[], zipFilename: string) {
    const zip = new JSZip();

    for (const dataset of datasets) {
        if (dataset.data && dataset.data.length > 0) {
            const csvContent = convertToCSVString(dataset.data);
            zip.file(`${dataset.name}.csv`, csvContent);
        }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${zipFilename}.zip`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Utility to export data to CSV (single file)
 */
export function exportToCSV(data: any[], filename: string) {
    const csvContent = convertToCSVString(data);
    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
