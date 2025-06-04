document.addEventListener('DOMContentLoaded', function() {
    // Definición de tablas y sus campos
    const tableSchemas = {
        usuarios: [
            { name: 'nombre', type: 'string', placeholder: 'Nombre del usuario' },
            { name: 'edad', type: 'number', placeholder: '25' },
            { name: 'email', type: 'string', placeholder: 'correo@ejemplo.com' },
            { name: 'activo', type: 'boolean', placeholder: '' }
        ],
        productos: [
            { name: 'nombre', type: 'string', placeholder: 'Nombre del producto' },
            { name: 'precio', type: 'number', placeholder: '1200.50' },
            { name: 'stock', type: 'number', placeholder: '10' },
            { name: 'disponible', type: 'boolean', placeholder: '' }
        ],
        pedidos: [
            { name: 'usuario_id', type: 'number', placeholder: '1' },
            { name: 'fecha', type: 'string', placeholder: '2023-06-15' },
            { name: 'total', type: 'number', placeholder: '1200.50' },
            { name: 'completado', type: 'boolean', placeholder: '' }
        ]
    };

    // Templates de consultas
    const queryTemplates = {
        'insert-usuarios': "insertar en tabla usuarios valores: nombre = 'Juan', edad = 25, email = 'juan@ejemplo.com', activo = verdadero fin;",
        'insert-productos': "insertar en tabla productos valores: nombre = 'Laptop', precio = 1200, stock = 10, disponible = verdadero fin;",
        'insert-pedidos': "insertar en tabla pedidos valores: usuario_id = 1, fecha = '2023-06-15', total = 1200, completado = falso fin;"
    };

    // Elementos DOM
    const sqlEditor = document.getElementById('sql-editor');
    const btnExecute = document.getElementById('btn-execute');
    const btnGenerate = document.getElementById('btn-generate');
    const tableSelect = document.getElementById('table-select');
    const fieldsContainer = document.getElementById('fields-container');
    const lexicalAnalysis = document.getElementById('lexical-analysis');
    const queryResult = document.getElementById('query-result');
    const queryTemplate = document.getElementById('query-template');

    // Cargar campos según la tabla seleccionada
    function loadFields(tableId) {
        fieldsContainer.innerHTML = '';
        const fields = tableSchemas[tableId];
        
        fields.forEach(field => {
            const fieldRow = document.createElement('div');
            fieldRow.className = 'mb-3 row align-items-center';
            
            let fieldInput;
            if (field.type === 'boolean') {
                fieldInput = `
                    <div class="col-sm-8">
                        <select id="field-${field.name}" class="form-select field-input">
                            <option value="verdadero">Verdadero</option>
                            <option value="falso">Falso</option>
                        </select>
                    </div>
                `;
            } else {
                fieldInput = `
                    <div class="col-sm-8">
                        <input type="${field.type === 'number' ? 'number' : 'text'}" 
                               class="form-control field-input" 
                               id="field-${field.name}" 
                               placeholder="${field.placeholder}">
                    </div>
                `;
            }
            
            fieldRow.innerHTML = `
                <label class="col-sm-4 col-form-label">${field.name}:</label>
                ${fieldInput}
            `;
            
            fieldsContainer.appendChild(fieldRow);
        });
    }

    // Generar consulta SQL desde los campos
    function generateQuery() {
        const tableId = tableSelect.value;
        const fields = tableSchemas[tableId];
        
        let query = `insertar en tabla ${tableId} valores: `;
        const values = [];
        
        fields.forEach(field => {
            const inputField = document.getElementById(`field-${field.name}`);
            let value = inputField.value.trim();
            
            if (!value && field.type !== 'boolean') return;
            
            if (field.type === 'string' && value) {
                // Añadir comillas a cadenas si no las tienen
                if (!value.startsWith("'") && !value.startsWith('"')) {
                    value = `'${value}'`;
                }
            }
            
            values.push(`${field.name} = ${value}`);
        });
        
        query += values.join(', ') + ' fin;';
        sqlEditor.value = query;
    }

    // Simulación de análisis léxico
    function simulateLexicalAnalysis(query) {
        lexicalAnalysis.innerHTML = '<div class="loading-spinner"></div> Analizando...';
        
        // Definición simple de tokens para la simulación
        const tokenPatterns = [
            { type: 'keyword', pattern: /\b(insertar|en|tabla|valores|fin)\b/gi },
            { type: 'identifier', pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*\b(?!\s*=)/g },
            { type: 'string', pattern: /'[^']*'|"[^"]*"/g },
            { type: 'number', pattern: /\b\d+(\.\d+)?\b/g },
            { type: 'boolean', pattern: /\b(verdadero|falso|true|false)\b/gi },
            { type: 'operator', pattern: /[=,:;]/g }
        ];
        
        // Simulación - tiempo para "procesar"
        setTimeout(() => {
            let html = '<div class="mb-3"><strong>Tokens encontrados:</strong></div>';
            html += '<div class="border rounded p-2 mb-3" style="max-height: 250px; overflow-y: auto;">';
            
            let tokenCount = 0;
            let currentLine = 1;
            
            // Dividir por líneas
            const lines = query.split('\n');
            
            lines.forEach((line, lineIndex) => {
                html += `<div class="mb-2"><small class="text-muted">Línea ${lineIndex + 1}:</small> `;
                
                // Encontrar tokens en cada línea
                for (const { type, pattern } of tokenPatterns) {
                    const matches = line.match(pattern) || [];
                    matches.forEach(match => {
                        const cleanMatch = match.trim();
                        if (cleanMatch) {
                            html += `<span class="token token-${type}" 
                                     title="Token #${tokenCount}: ${type.toUpperCase()}">${cleanMatch}</span>`;
                            tokenCount++;
                        }
                    });
                }
                
                html += '</div>';
            });
            
            html += '</div>';
            html += `<div><strong>Total de tokens:</strong> ${tokenCount}</div>`;
            
            lexicalAnalysis.innerHTML = html;
        }, 800);
    }

    // Simulación de ejecución de consulta
    function simulateQueryExecution(query) {
        queryResult.innerHTML = '<div class="loading-spinner"></div> Ejecutando...';
        
        setTimeout(() => {
            // Verificar si es una consulta de inserción
            if (/insertar\s+en\s+tabla\s+\w+\s+valores/i.test(query)) {
                const tableMatch = query.match(/tabla\s+(\w+)/i);
                const table = tableMatch ? tableMatch[1] : 'desconocida';
                
                // Construir SQL simulado
                let sqlQuery = '';
                if (table === 'usuarios') {
                    sqlQuery = "INSERT INTO usuarios (nombre, edad, email, activo) VALUES ('...', ..., '...', ...)";
                } else if (table === 'productos') {
                    sqlQuery = "INSERT INTO productos (nombre, precio, stock, disponible) VALUES ('...', ..., ..., ...)";
                } else if (table === 'pedidos') {
                    sqlQuery = "INSERT INTO pedidos (usuario_id, fecha, total, completado) VALUES (..., '...', ..., ...)";
                }
                
                queryResult.innerHTML = `
                    <div class="alert alert-success">
                        <i class="bi bi-check-circle-fill me-2"></i>
                        Consulta procesada correctamente
                    </div>
                    <div class="mb-2">
                        <strong>Consulta SQL ejecutada:</strong>
                    </div>
                    <pre class="bg-dark text-light p-2 rounded">${sqlQuery}</pre>
                    <div class="mt-3">
                        <strong>Resultado:</strong> 1 fila insertada en la tabla "${table}"
                    </div>
                `;
            } else {
                queryResult.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        Consulta no reconocida
                    </div>
                    <div>Solo se admiten consultas del tipo "insertar en tabla..."</div>
                `;
            }
        }, 1500);
    }

    // Event Listeners
    tableSelect.addEventListener('change', () => {
        loadFields(tableSelect.value);
    });

    btnGenerate.addEventListener('click', generateQuery);

    btnExecute.addEventListener('click', () => {
        const query = sqlEditor.value.trim();
        if (!query) {
            alert('Por favor escribe una consulta antes de ejecutar');
            return;
        }
        
        simulateLexicalAnalysis(query);
        simulateQueryExecution(query);
    });
    
    queryTemplate.addEventListener('change', function() {
        const templateId = this.value;
        if (templateId && queryTemplates[templateId]) {
            sqlEditor.value = queryTemplates[templateId];
        }
    });

    // Inicialización
    loadFields(tableSelect.value);
});