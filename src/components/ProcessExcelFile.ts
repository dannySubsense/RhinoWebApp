import * as ExcelJS from 'exceljs';

export class ProcessExcelFile {
    public async parseExcelFile(file: File): Promise<any[]> {
        const workbook = new ExcelJS.Workbook();
        const data = await file.arrayBuffer();
        await workbook.xlsx.load(data);
        const worksheet = workbook.getWorksheet(1); // Fetch the first worksheet

        // Check if the worksheet is defined
        if (!worksheet) {
            throw new Error("Worksheet not found.");
        }

        const parsedData: any[] = [];

        // Get the headers from the first row
        const headerRow = worksheet.getRow(1);
        const headers: string[] = [];

        headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            headers[colNumber - 1] = cell.text.trim();
        });

        // Iterate over the rows, starting from the second row
        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row

            const rowData: any = {};

            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const header = headers[colNumber - 1];
                rowData[header] = cell.value;
            });

            parsedData.push(rowData);
        });

        return parsedData;
    }
}
