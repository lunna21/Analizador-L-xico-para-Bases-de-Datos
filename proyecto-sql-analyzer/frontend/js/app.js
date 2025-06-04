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

    // URL de la API
    const API_URL = 'http://localhost:3000/api/analyze';

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

    // Mostrar el análisis léxico 
    function displayLexicalAnalysis(tokens) {
        let html = '<div class="mb-3"><strong>Tokens encontrados:</strong></div>';
        html += '<div class="border rounded p-2 mb-3" style="max-height: 250px; overflow-y: auto;">';
        
        let currentLine = 1;
        let lineTokens = [];
        
        // Agrupar tokens por línea
        tokens.forEach(token => {
            if (token.line > currentLine) {
                // Renderizar tokens de la línea anterior
                if (lineTokens.length > 0) {
                    html += `<div class="mb-2"><small class="text-muted">Línea ${currentLine}:</small> `;
                    lineTokens.forEach(t => {
                        const tokenType = getTokenType(t.type);
                        html += `<span class="token token-${tokenType}" 
                                 title="Token: ${t.type}">${t.lexeme}</span>`;
                    });
                    html += '</div>';
                    lineTokens = [];
                }
                currentLine = token.line;
            }
            
            lineTokens.push(token);
        });
        
        // Renderizar la última línea
        if (lineTokens.length > 0) {
            html += `<div class="mb-2"><small class="text-muted">Línea ${currentLine}:</small> `;
            lineTokens.forEach(t => {
                const tokenType = getTokenType(t.type);
                html += `<span class="token token-${tokenType}" 
                         title="Token: ${t.type}">${t.lexeme}</span>`;
            });
            html += '</div>';
        }
        
        html += '</div>';
        html += `<div><strong>Total de tokens:</strong> ${tokens.length}</div>`;
        
        lexicalAnalysis.innerHTML = html;
    }
    
    // Mapear tipos de tokens a categorías CSS
    function getTokenType(type) {
        if (type.includes('KEYWORD')) return 'keyword';
        if (type === 'IDENTIFIER') return 'identifier';
        if (type === 'STRING') return 'string';
        if (type === 'NUMBER') return 'number';
        if (type === 'BOOLEAN') return 'boolean';
        if (['COLON', 'COMMA', 'EQUALS', 'SEMICOLON'].includes(type)) return 'operator';
        if (type === 'ERROR') return 'error';
        return 'other';
    }

    // Mostrar resultados de la consulta
    function displayQueryResult(result) {
        if (result.success) {
            queryResult.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    Consulta procesada correctamente
                </div>
                <div class="mb-2">
                    <strong>Consulta SQL ejecutada:</strong>
                </div>
                <pre class="bg-dark text-light p-2 rounded">${result.sqlQuery}</pre>
                <div class="mt-3">
                    <strong>Resultado:</strong> 1 fila insertada
                </div>
            `;
        } else {
            queryResult.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Error al procesar la consulta
                </div>
                <div class="mb-2">
                    <strong>Detalles del error:</strong>
                </div>
                <pre class="bg-dark text-light p-2 rounded">${result.stderr || result.error || 'Error desconocido'}</pre>
            `;
        }
    }
    
    // Ejecutar consulta contra la API
    async function executeQuery(query) {
        lexicalAnalysis.innerHTML = '<div class="d-flex justify-content-center my-4"><div class="loading-spinner"></div> Analizando...</div>';
        queryResult.innerHTML = '<div class="d-flex justify-content-center my-4"><div class="loading-spinner"></div> Ejecutando...</div>';
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });
            
            const result = await response.json();
            
            if (result.tokens) {
                displayLexicalAnalysis(result.tokens);
            } else {
                lexicalAnalysis.innerHTML = '<div class="alert alert-warning">No se encontraron tokens</div>';
            }
            
            displayQueryResult(result);
            
        } catch (error) {
            console.error("Error al comunicarse con la API:", error);
            lexicalAnalysis.innerHTML = '<div class="alert alert-danger">Error al analizar la consulta</div>';
            queryResult.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Error de comunicación con el servidor
                </div>
                <div>
                    ${error.message || 'No se pudo conectar con el servidor'}
                </div>
            `;
        }
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
        
        executeQuery(query);
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