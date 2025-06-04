const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../../frontend')));

// Crear directorio temporal si no existe
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

// Endpoint para procesar consultas SQL
app.post('/api/analyze', (req, res) => {
    const { query } = req.body;
    
    if (!query || query.trim() === '') {
        return res.status(400).json({ error: 'La consulta no puede estar vacía' });
    }
    
    // Guardar la consulta en un archivo temporal
    const timestamp = Date.now();
    const queryFilePath = path.join(tempDir, `query_${timestamp}.txt`);
    
    fs.writeFile(queryFilePath, query, (err) => {
        if (err) {
            console.error('Error al escribir archivo temporal:', err);
            return res.status(500).json({ error: 'Error al procesar la consulta' });
        }
        
        // Ruta al ejecutable del servidor C con extensión .exe para Windows
        const serverPath = path.join(__dirname, '../build/server.exe');
        
        // Ejecutar el programa en C con rutas entrecomilladas para manejar espacios
        exec(`"${serverPath}" "${queryFilePath}"`, (error, stdout, stderr) => {
            // Leer los resultados
            let tokens = [];
            let success = false;
            let sqlQuery = "";
            
            // Extraer tokens del resultado
            const tokenMatches = stdout.match(/\[\d+\] Tipo: .*?, Lexema: .*?, Linea: \d+/g);
            if (tokenMatches) {
                tokens = tokenMatches.map(tokenText => {
                    const typeMatch = tokenText.match(/Tipo: (.*?),/);
                    const lexemeMatch = tokenText.match(/Lexema: (.*?),/);
                    const lineMatch = tokenText.match(/Linea: (\d+)/);
                    
                    return {
                        type: typeMatch ? typeMatch[1] : 'UNKNOWN',
                        lexeme: lexemeMatch ? lexemeMatch[1] : '',
                        line: lineMatch ? parseInt(lineMatch[1]) : 0
                    };
                });
            }
            
            // Extraer consulta SQL generada
            const sqlMatch = stdout.match(/Ejecutando consulta SQL: (.*)/);
            if (sqlMatch) {
                sqlQuery = sqlMatch[1];
            }
            
            // Verificar si fue exitoso
            if (stdout.includes('Consulta procesada correctamente')) {
                success = true;
            }
            
            // Eliminar el archivo temporal
            fs.unlink(queryFilePath, (unlinkErr) => {
                if (unlinkErr) console.error('Error al eliminar archivo temporal:', unlinkErr);
            });
            
            // Devolver respuesta
            return res.json({
                success,
                tokens,
                sqlQuery,
                stdout,
                stderr: stderr || null,
                error: error ? error.message : null
            });
        });
    });
});

// Ruta para servir el frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor API ejecutándose en http://localhost:${PORT}`);
});