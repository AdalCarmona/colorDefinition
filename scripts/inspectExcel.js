const XLSX = require("xlsx");
const path = require("path");

// 1. Definir la ruta del archivo Excel
const filePath = path.join(
    __dirname,
    "../data/formulas.xlsx"
);

// 2. Leer el archivo Excel
const workbook = XLSX.readFile(filePath);

// 3. Mostrar los nombres de las hojas
console.log("Hojas disponibles:", workbook.SheetNames);

// 4. Seleccionar la hoja que contiene las fórmulas
const sheetName = "Hoja1";
const worksheet = workbook.Sheets[sheetName];

if (!worksheet) {
    throw new Error(`No se encontró la hoja "${sheetName}".`);
}

// 5. Obtener el rango utilizado
const range = XLSX.utils.decode_range(worksheet["!ref"]);

console.log("Hoja seleccionada:", sheetName);
console.log("Rango utilizado:", worksheet["!ref"]);

console.log("\nContenido de las celdas:\n");

// 6. Recorrer las filas y columnas utilizadas
for (let row = range.s.r; row <= range.e.r; row++) {
    const cells = [];

    for (let col = range.s.c; col <= range.e.c; col++) {
        const address = XLSX.utils.encode_cell({
        r: row,
        c: col,
    });

    const cell = worksheet[address];

    if (cell && cell.v !== undefined) {
        cells.push(`${address} = ${cell.v}`);
        }
    }

    // Mostrar únicamente las filas con información
    if (cells.length > 0) {
        console.log(cells.join(" | "));
    }
}

// 7. Mostrar las celdas combinadas, si existen
const mergedCells = worksheet["!merges"] || [];

console.log("\nCeldas combinadas:");

if (mergedCells.length === 0) {
    console.log("No se encontraron celdas combinadas.");
    } else {
    mergedCells.forEach((merged) => {
        console.log(
        XLSX.utils.encode_range(merged)
        );
    });
}