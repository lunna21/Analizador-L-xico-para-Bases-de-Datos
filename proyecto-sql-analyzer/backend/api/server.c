#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include "../database/db_manager.h"

// Declaración de funciones externas del lexer
typedef enum {
    TOKEN_KEYWORD_INSERTAR,
    TOKEN_KEYWORD_EN,
    TOKEN_KEYWORD_TABLA,
    TOKEN_KEYWORD_VALORES,
    TOKEN_KEYWORD_FIN,
    TOKEN_IDENTIFIER,
    TOKEN_NUMBER,
    TOKEN_STRING,
    TOKEN_BOOLEAN,
    TOKEN_COLON,
    TOKEN_COMMA,
    TOKEN_EQUALS,
    TOKEN_SEMICOLON,
    TOKEN_ERROR
} SQL_TokenType;  // Nombre cambiado

typedef struct {
    SQL_TokenType type;  // Aquí también
    char* lexeme;
    int line;
} Token;

extern Token* analyze_string(const char* input, int* count);
extern void free_tokens();
extern void print_tokens();

// Función para procesar una consulta de inserción
bool process_insert_query(Token* tokens, int token_count) {
    if (token_count < 8) {
        fprintf(stderr, "Consulta demasiado corta para ser válida\n");
        return false;
    }
    
    // Verificar la estructura básica: insertar en tabla <nombre_tabla> valores: ...
    if (tokens[0].type != TOKEN_KEYWORD_INSERTAR ||
        tokens[1].type != TOKEN_KEYWORD_EN ||
        tokens[2].type != TOKEN_KEYWORD_TABLA ||
        tokens[3].type != TOKEN_IDENTIFIER ||
        tokens[4].type != TOKEN_KEYWORD_VALORES ||
        tokens[5].type != TOKEN_COLON) {
        fprintf(stderr, "Estructura de consulta incorrecta\n");
        return false;
    }
    
    // Extraer el nombre de la tabla
    char* table_name = tokens[3].lexeme;
    
    // Analizar los campos y valores
    char** fields = NULL;
    char** values = NULL;
    int* types = NULL;  // Array para almacenar los tipos
    int field_count = 0;
    int capacity = 0;
    
    int i = 6; // Comenzar después de "valores:"
    while (i < token_count) {
        // Verificar formato: campo = valor
        if (tokens[i].type != TOKEN_IDENTIFIER) {
            break;
        }
        
        if (i + 2 >= token_count || tokens[i + 1].type != TOKEN_EQUALS) {
            break;
        }
        
        // Verificar el tipo de valor
        if (tokens[i + 2].type != TOKEN_STRING && 
            tokens[i + 2].type != TOKEN_NUMBER && 
            tokens[i + 2].type != TOKEN_BOOLEAN) {
            break;
        }
        
        // Añadir el campo y valor
        if (field_count >= capacity) {
            capacity = capacity == 0 ? 4 : capacity * 2;
            fields = realloc(fields, capacity * sizeof(char*));
            values = realloc(values, capacity * sizeof(char*));
            types = realloc(types, capacity * sizeof(int));  // Reservar para tipos
        }
        
        fields[field_count] = tokens[i].lexeme;
        values[field_count] = tokens[i + 2].lexeme;
        
        // Determinar el tipo basado en el token
        if (tokens[i + 2].type == TOKEN_STRING) {
            types[field_count] = VALUE_TYPE_STRING;
        } else if (tokens[i + 2].type == TOKEN_NUMBER) {
            types[field_count] = VALUE_TYPE_NUMBER;
        } else if (tokens[i + 2].type == TOKEN_BOOLEAN) {
            types[field_count] = VALUE_TYPE_BOOLEAN;
        }
        
        field_count++;
        
        // Avanzar al siguiente par campo = valor
        i += 3;
        
        // Verificar si hay una coma o si hemos llegado a "fin"
        if (i < token_count && tokens[i].type == TOKEN_COMMA) {
            i++; // Saltar la coma
        } else if (i < token_count && tokens[i].type == TOKEN_KEYWORD_FIN) {
            break;
        }
    }
    
    // Verificar que termina con "fin;"
    if (i >= token_count || tokens[i].type != TOKEN_KEYWORD_FIN ||
        i + 1 >= token_count || tokens[i + 1].type != TOKEN_SEMICOLON) {
        fprintf(stderr, "La consulta debe terminar con 'fin;'\n");
        free(fields);
        free(values);
        free(types);
        return false;
    }
    
    // Limpiar valores de cadenas (quitar comillas)
    for (int j = 0; j < field_count; j++) {
        if (types[j] == VALUE_TYPE_STRING && 
            (values[j][0] == '"' || values[j][0] == '\'')) {
            int len = strlen(values[j]);
            char* clean_value = malloc(len - 1);
            strncpy(clean_value, values[j] + 1, len - 2);
            clean_value[len - 2] = '\0';
            values[j] = clean_value;
        }
    }
    
    // Insertar en la base de datos
    bool success = db_insert(table_name, (const char**)fields, (const char**)values, 
                           (const int*)types, field_count);
    
    // Limpiar valores procesados
    for (int j = 0; j < field_count; j++) {
        if (types[j] == VALUE_TYPE_STRING && 
            values[j][0] != '"' && values[j][0] != '\'') {
            free(values[j]);
        }
    }
    free(fields);
    free(values);
    free(types);
    
    return success;
}

// Función principal para procesar un archivo de consultas
bool process_query_file(const char* filename) {
    FILE* file = fopen(filename, "r");
    if (!file) {
        fprintf(stderr, "No se pudo abrir el archivo: %s\n", filename);
        return false;
    }
    
    // Leer todo el archivo
    fseek(file, 0, SEEK_END);
    long size = ftell(file);
    fseek(file, 0, SEEK_SET);
    
    char* content = malloc(size + 1);
    if (!content) {
        fclose(file);
        return false;
    }
    
    fread(content, 1, size, file);
    content[size] = '\0';
    fclose(file);
    
    // Analizar consultas
    int token_count;
    Token* tokens = analyze_string(content, &token_count);
    free(content);
    
    if (token_count == 0) {
        fprintf(stderr, "No se encontraron tokens en el archivo\n");
        return false;
    }
    
    // Imprimir tokens (para depuración)
    print_tokens();
    
    // Procesar la consulta
    bool success = process_insert_query(tokens, token_count);
    free_tokens();
    
    return success;
}

int main(int argc, char** argv) {
    if (argc < 2) {
        printf("Uso: %s <archivo_consulta>\n", argv[0]);
        return 1;
    }
    
    // Inicializar la base de datos MySQL
    if (!db_init("localhost", "root", "root", "analizador_lexico")) {
        fprintf(stderr, "Error al inicializar la base de datos\n");
        return 1;
    }
    
    // Inicializar las tablas desde el archivo SQL
    if (!db_init_from_file("../database/init_db.sql")) {
        fprintf(stderr, "Error al inicializar las tablas\n");
        db_close();
        return 1;
    }
    
    // Procesar el archivo de consulta
    bool success = process_query_file(argv[1]);
    
    if (success) {
        printf("Consulta procesada correctamente\n");
    } else {
        fprintf(stderr, "Error al procesar la consulta\n");
    }
    
    db_close();
    return success ? 0 : 1;
}