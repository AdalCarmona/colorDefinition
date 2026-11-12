const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// ============================================
// 1. CONFIGURACIÓN
// ============================================

const inputPath = path.join(
    __dirname,
    "../data/formulas.xlsx"
);

const outputPath = path.join(
    __dirname,
    "../data/formulas.json"
);

// Cada fórmula ocupa un bloque de 10 filas.
const BLOCK_SIZE = 10;

// Número de fila de Excel donde comienza la primera fórmula.
const FIRST_FORMULA_ROW = 1;

// ============================================
// 2. LEER EL ARCHIVO EXCEL
// ============================================

const workbook = XLSX.readFile(inputPath);

const sheetName = "Hoja1";
const worksheet = workbook.Sheets[sheetName];

if (!worksheet) {
    throw new Error(
        `No se encontró la hoja "${sheetName}".`
    );
}

console.log(`Hoja seleccionada: ${sheetName}`);

// ============================================
// 3. FUNCIONES AUXILIARES
// ============================================

// Obtener el valor de una celda usando
// coordenadas de Excel (fila y columna).
function getCell(row, column) {
    const address = XLSX.utils.encode_cell({
        r: row - 1,
        c: column - 1,
    });

    const value = worksheet[address]?.v;

    return value === undefined || value === null
    ? null
    : value;
}

// Convertir un valor a texto limpio.
function normalizeText(value) {
    return String(value ?? "").trim();
}

// Convertir una cantidad vacía en cero.
// Las cantidades no numéricas se consideran errores.
function getQuantity(row, column) {
    const value = getCell(row, column);

    if (value === null || value === "") {
        return 0;
    }

    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(
        `Cantidad inválida en la fila ${row}, columna ${column}: ${value}`
        );
    }

    return value;
}

// ============================================
// 4. LEER LOS COLORANTES DE UNA PRESENTACIÓN
// ============================================

function readPresentation(
    startRow,
    tintColumn,
    quantityColumns
    ) {
    const tints = {};

  // Las filas de datos ocupan las posiciones
  // startRow + 3 hasta startRow + 8.
  //
  // startRow corresponde a la fila del encabezado
  // de la fórmula.
    const firstTintRow = startRow + 3;
    const lastTintRow = startRow + 8;

    for (
        let row = firstTintRow;
        row <= lastTintRow;
        row++
    ) {
        const tintCode = normalizeText(
        getCell(row, tintColumn)
    );

    // Ignorar celdas vacías y filas de totales.
    if (!tintCode || tintCode.toLowerCase() === "total:") {
        continue;
    }

    // Ignorar filas que solo contienen espacios.
    if (tintCode.trim() === "") {
        continue;
    }

    // Evitar que un código repetido sobrescriba
    // silenciosamente una entrada anterior.
    if (Object.hasOwn(tints, tintCode)) {
        throw new Error(
            `Colorante duplicado "${tintCode}" en la fila ${row}.`
        );
    }

    tints[tintCode] = {
        oz: getQuantity(row, quantityColumns[0]),
        "64": getQuantity(row, quantityColumns[1]),
        "128": getQuantity(row, quantityColumns[2]),
        };
    }

    return tints;
}

// ============================================
// 5. CONVERTIR TODAS LAS FÓRMULAS
// ============================================

function convertFormulas() {
    const formulas = {};
    const errors = [];
    let processedBlocks = 0;

    const range = XLSX.utils.decode_range(
        worksheet["!ref"]
    );

    // Convertir el índice de la última fila de Excel
    // a número de fila convencional.
    const lastRow = range.e.r + 1;

    for (
    let startRow = FIRST_FORMULA_ROW;
    startRow <= lastRow;
    startRow += BLOCK_SIZE
    ) {
    // Obtener los datos generales.
    const color = normalizeText(
        getCell(startRow, 3)
    );

    const base = normalizeText(
        getCell(startRow, 10)
    );

    const code = normalizeText(
        getCell(startRow, 17)
    );

    // Si no existe código, no tenemos una fórmula válida.
    if (!code) {
        continue;
    }

    try {
      // Validar información general.
        if (!color || !base) {
            throw new Error(
            `Falta el color o la base en la fila ${startRow}.`
            );
        }

        // Validar códigos duplicados.
        if (Object.hasOwn(formulas, code)) {
            throw new Error(
            `El código "${code}" está duplicado.`
            );
        }

        // Leer las tres presentaciones.
        const litro = readPresentation(
            startRow,
            2,
            [3, 5, 6]
        );

        const galon = readPresentation(
            startRow,
            9,
            [10, 12, 13]
        );

        const cubeta = readPresentation(
            startRow,
            16,
            [17, 19, 20]
        );

      // Construir el objeto JSON.
        formulas[code] = {
            
            color,
            base,

        presentaciones: {
            Litro: litro,
            Galón: galon,
            Cubeta: cubeta,
            },
        };

        processedBlocks++;
        } catch (error) {
        errors.push({
            fila: startRow,
            codigo: code,
            mensaje: error.message,
        });
        }
    }

  // ==========================================
  // 6. GUARDAR EL JSON
  // ==========================================

    fs.writeFileSync(
        outputPath,
        JSON.stringify(formulas, null, 2),
        "utf8"
    );

  // ==========================================
  // 7. REPORTE FINAL
  // ==========================================

    console.log("\n==================================");
    console.log("       REPORTE DE CONVERSIÓN");
    console.log("==================================");

    console.log(
        `Fórmulas convertidas: ${processedBlocks}`
    );

    console.log(
        `Errores detectados: ${errors.length}`
    );

    console.log(
        `Archivo generado: ${outputPath}`
    );

    if (errors.length > 0) {
        console.log("\nErrores:");

        console.table(errors);
    }

    console.log("==================================");

    return {
        formulas,
        errors,
    };
}

// Ejecutar la conversión.
convertFormulas();