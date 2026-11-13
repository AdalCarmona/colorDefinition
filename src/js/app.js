const searchForm = document.getElementById("solicitud-datos");
const colorInput = document.getElementById("color-entrada");
const resultDiv = document.getElementById("color-info-error");
const tableBody = document.getElementById("tabla-tintas");

const colorInfoElements = {
    name: document.getElementById("color-name"),
    code: document.getElementById("color-code"),
    base: document.getElementById("color-base"),
    presentation: document.getElementById("color-presentation")
};

// Objeto para mapear códigos de tintas a colores
const tintColors = {
    B:   { hex: "#000000", name: "Black" },
    E:   { hex: "#000dff", name: "Blue" },
    M:   { hex: "#8B008B", name: "Magenta" },
    L:   { hex: "#593C1E", name: "Umber" },
    C:   { hex: "#c9a800", name: "Yellow Ox." },
    AXX: { hex: "#FFDE21", name: "Yellow" },
    R:   { hex: "#FF2C2C", name: "Orange red" },
    T:   { hex: "#e76400", name: "Orange Yl." },
    D:   { hex: "#06402B", name: "Green" },
    F:   { hex: "#781000", name: "Red Ox." },
    I:   { hex: "#800080", name: "Brown Ox." },
    KX:  { hex: "#ffffff", name: "White" }
};

// Variable para almacenar las fórmulas
let formulas = {};

// Peticion fetch() para cargar formulas.json
async function loadFormulas() {
    try {
        const response = await fetch("./src/data/formulas.json");
        if (!response.ok) {
            throw new Error("No se pudo cargar formulas.json");
        }
        formulas = await response.json();
        console.log("Fórmulas cargadas correctamente");
    } catch (error) {
        console.error("Error:", error);
    }
}
loadFormulas();

// Recoleccion de datos color/presentacion
searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const searchValue = colorInput.value.trim().toLowerCase();
    const selectedPresentation = document.querySelector('input[name="presentacion"]:checked');

    if (!selectedPresentation) {
        alert("Selecciona una presentación");
        return;
    }

    const presentationValue = selectedPresentation.value;

    // Limpiar los resultados de la búsqueda anterior
    resultDiv.textContent = "";
    Object.values(colorInfoElements).forEach((element) => {
        if (element) {
            element.textContent = "";
        }
    });
    tableBody.replaceChildren();

    console.log(searchValue);
    console.log(presentationValue);

    // Asignar a variables las propiedades obtenidas de JSON
    const presentationNames = {
        cubeta: "Cubeta",
        galon: "Galón",
        litro: "Litro"
    };
    const presentation = presentationNames[presentationValue];

    // Buscar el color en las fórmulas
    const formulaFound = Object.entries(formulas).find(
        ([code, formula]) => {
            return (
                code.toLowerCase() === searchValue ||
                formula.color.toLowerCase() === searchValue
            );
        }
    );
    console.log("Fórmula encontrada:", formulaFound);

    // Comprobar si se encontró la fórmula
    if (!formulaFound) {
        resultDiv.textContent = "No se encontró el color solicitado.";
        return;
    }

        // Obtener código y datos de la fórmula
    const [code, formula] = formulaFound;

    // Obtener tintas correspondientes a la presentación
    const tints = formula.presentaciones[presentation];

    if (!tints || Object.keys(tints).length === 0) {
        resultDiv.textContent = "No hay datos para esta presentación";
        return;
    }

    // Mostrar información del color
    const missingInfoElements = Object.entries(colorInfoElements)
        .filter(([, element]) => element === null)
        .map(([name]) => name);

    if (missingInfoElements.length > 0) {
        console.error(
            `No se encontraron elementos HTML para mostrar la información: ${missingInfoElements.join(", ")}`
        );
        resultDiv.textContent =
            "No se pudo mostrar la información del color. Verifica los elementos del HTML.";
        return;
    }

    colorInfoElements.name.textContent = formula.color;
    colorInfoElements.code.textContent = code;
    colorInfoElements.base.textContent = formula.base;
    colorInfoElements.presentation.textContent = presentation;

    // Generar las filas de la tabla
    createTintRows(tints);
});

// Función para crear las filas dinámicamente
function createTintRows(tints) {

    // Limpiar resultados anteriores
    tableBody.replaceChildren();

    // Recorrer cada tinta de la fórmula
    for (const [tintCode, quantities] of Object.entries(tints)) {

        // Crear fila
        const row = document.createElement("tr");

        // Crear celda para identificar la tinta
        const colorCell = document.createElement("td");

        // Obtener información de la tinta
        const tintInfo = tintColors[tintCode];

        // Crear nombre de la tinta
        const tintName = document.createElement("span");

        tintName.textContent = tintInfo
            ? tintInfo.name
            : "Color desconocido";

        // Crear div para representar el color
        const colorPreview = document.createElement("div");

        colorPreview.classList.add("color-preview");

        // Mostrar el código de la tinta
        colorPreview.textContent = tintCode;

        // Asignar color de fondo si se encuentra en el objeto tintColors
        if (tintInfo) {
            colorPreview.style.backgroundColor = tintInfo.hex;
        } else {
            colorPreview.style.backgroundColor = "#D3D3D3"; // Color por defecto si no se encuentra
        }

        // Agregar nombre y color a la celda
        colorCell.appendChild(tintName);
        colorCell.appendChild(colorPreview);

        // Agregar información accesible
        colorPreview.title = `Tinta ${tintCode}`;

        colorCell.appendChild(colorPreview);

        row.appendChild(colorCell);


        // Crear las celdas de cantidades
        const units = ["oz", "64", "128"];

        for (const unit of units) {

            const cell = document.createElement("td");

            const quantityDiv = document.createElement("div");

            quantityDiv.classList.add("casilla");

            // Mostrar 1 en lugar de 0.5 para la unidad 128
            let quantity = quantities[unit];
            if (quantity === null || quantity === undefined) {
                quantity = 0;
            }
            if (unit === "128" && quantity === 0.5) {
                quantity = 1;
            }
            quantityDiv.textContent = quantity;

            cell.appendChild(quantityDiv);

            row.appendChild(cell);
        }

        // Agregar la fila completa a la tabla
        tableBody.appendChild(row);
    }
}
