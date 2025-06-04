#include "db_manager.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static MYSQL* conn = NULL;

bool db_init(const char* host, const char* user, const char* password, const char* database) {
    // Liberar conexión anterior si existe
    if (conn != NULL) {
        mysql_close(conn);
    }
    
    // Inicializar conexión
    conn = mysql_init(NULL);
    if (conn == NULL) {
        fprintf(stderr, "Error al inicializar MySQL: %s\n", mysql_error(conn));
        return false;
    }
    
    // Conectar a la base de datos
    if (mysql_real_connect(conn, host, user, password, database, 0, NULL, 0) == NULL) {
        fprintf(stderr, "Error al conectar a MySQL: %s\n", mysql_error(conn));
        mysql_close(conn);
        conn = NULL;
        return false;
    }
    
    return true;
}

bool db_init_from_file(const char* sql_file) {
    if (conn == NULL) {
        fprintf(stderr, "La base de datos no está inicializada\n");
        return false;
    }
    
    FILE* file = fopen(sql_file, "r");
    if (!file) {
        fprintf(stderr, "No se pudo abrir el archivo SQL: %s\n", sql_file);
        return false;
    }
    
    // Leer todo el archivo
    fseek(file, 0, SEEK_END);
    long size = ftell(file);
    fseek(file, 0, SEEK_SET);
    
    char* sql_buffer = malloc(size + 1);
    if (!sql_buffer) {
        fclose(file);
        return false;
    }
    
    fread(sql_buffer, 1, size, file);
    sql_buffer[size] = '\0';
    fclose(file);
    
    // Dividir en consultas individuales (por ;)
    char* query = strtok(sql_buffer, ";");
    bool success = true;
    
    while (query != NULL && success) {
        // Eliminar espacios en blanco al principio y al final
        while (*query == ' ' || *query == '\n' || *query == '\r' || *query == '\t') {
            query++;
        }
        
        // Ejecutar consulta si no está vacía
        if (strlen(query) > 0) {
            if (mysql_query(conn, query)) {
                fprintf(stderr, "Error SQL: %s\n", mysql_error(conn));
                success = false;
            }
        }
        
        query = strtok(NULL, ";");
    }
    
    free(sql_buffer);
    return success;
}

bool db_table_exists(const char* table_name) {
    if (conn == NULL) {
        return false;
    }
    
    char query[256];
    sprintf(query, "SHOW TABLES LIKE '%s'", table_name);
    
    if (mysql_query(conn, query)) {
        return false;
    }
    
    MYSQL_RES* result = mysql_store_result(conn);
    if (!result) {
        return false;
    }
    
    bool exists = mysql_num_rows(result) > 0;
    mysql_free_result(result);
    
    return exists;
}

bool db_insert(const char* table_name, const char** fields, const char** values, const int* types, int count) {
    if (conn == NULL || !db_table_exists(table_name)) {
        return false;
    }
    
    // Construir la consulta SQL para inserción
    char* query = malloc(2048); // Asegurar espacio suficiente
    if (!query) {
        return false;
    }
    
    // INSERT INTO table_name (field1, field2, ...) VALUES (val1, val2, ...)
    sprintf(query, "INSERT INTO %s (", table_name);
    
    // Añadir campos
    for (int i = 0; i < count; i++) {
        strcat(query, fields[i]);
        if (i < count - 1) {
            strcat(query, ", ");
        }
    }
    
    strcat(query, ") VALUES (");
    
    // Añadir valores basados en su tipo
    for (int i = 0; i < count; i++) {
        // Imprimir para depuración
        printf(">>> DEBUG: values[%d] = \"%s\", type=%d\n", i, values[i], types[i]);
        
        if (types[i] == VALUE_TYPE_STRING) {
            // Cadena de texto: siempre escapar y entrecomillar
            const char* clean_val = values[i];
            size_t max_len = strlen(clean_val) * 2 + 3; // Espacio para escape + comillas + nulo
            char* escaped = malloc(max_len);
            
            if (!escaped) {
                fprintf(stderr, "Error de memoria al reservar escaped\n");
                free(query);
                return false;
            }
            
            // Colocar comilla inicial
            escaped[0] = '\'';
            
            // Escapar el contenido
            unsigned long esc_len = mysql_real_escape_string(
                conn, escaped + 1, clean_val, (unsigned long)strlen(clean_val)
            );
            
            // Colocar comilla final y terminador
            escaped[1 + esc_len] = '\'';
            escaped[1 + esc_len + 1] = '\0';
            
            // Concatenar a la consulta
            strcat(query, escaped);
            free(escaped);
        } 
        else if (types[i] == VALUE_TYPE_NUMBER) {
            // Es un número, agregarlo tal cual
            strcat(query, values[i]);
        } 
        else if (types[i] == VALUE_TYPE_BOOLEAN) {
            // Convertir booleano a 1/0
            if (strcasecmp(values[i], "verdadero") == 0 || 
                strcasecmp(values[i], "true") == 0) {
                strcat(query, "1");
            } else {
                strcat(query, "0");
            }
        }
        
        if (i < count - 1) {
            strcat(query, ", ");
        }
    }
    
    strcat(query, ")");
    
    // Ejecutar consulta
    printf("Ejecutando consulta SQL: %s\n", query);
    bool success = mysql_query(conn, query) == 0;
    if (!success) {
        fprintf(stderr, "Error al insertar datos: %s\n", mysql_error(conn));
    }
    
    free(query);
    return success;
}

void db_close() {
    if (conn != NULL) {
        mysql_close(conn);
        conn = NULL;
    }
}