import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Utility function to export JSON data to an Excel (.xlsx) file.
 * 
 * @param {Array<Object>} data - The JSON data to export.
 * @param {string} fileName - Base name of the file (timestamp will be appended).
 * @param {string} sheetName - Name of the worksheet.
 * @returns {boolean} True if successful, false otherwise.
 */
export const exportToExcel = (data, fileName, sheetName = "Sheet 1") => {
    if (!data || data.length === 0) return false;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' 
    });
    
    saveAs(blob, `${fileName}_${new Date().getTime()}.xlsx`);
    return true;
};
