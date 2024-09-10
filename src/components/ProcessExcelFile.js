import * as ExcelJS from 'exceljs';
export class ProcessExcelFile {
    async parseExcelFile(file) {
        const workbook = new ExcelJS.Workbook();
        const data = await file.arrayBuffer();
        await workbook.xlsx.load(data);
        const worksheet = workbook.getWorksheet(1); // Fetch the first worksheet
        // Check if the worksheet is defined
        if (!worksheet) {
            throw new Error("Worksheet not found.");
        }
        const parsedData = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1)
                return; // Skip header
            const entry = {
                PID: row.getCell(1).value, // Assuming PID is in the first column
                Released: row.getCell(2).value,
                AssemblyStarted: row.getCell(3).value,
                AssemblyFinished: row.getCell(4).value,
                Crated: row.getCell(5).value,
                OnSite: row.getCell(6).value,
                Installed: row.getCell(7).value,
            };
            parsedData.push(entry);
        });
        return parsedData;
    }
}
//# sourceMappingURL=ProcessExcelFile.js.map