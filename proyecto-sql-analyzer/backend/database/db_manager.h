#ifndef DB_MANAGER_H
#define DB_MANAGER_H

// Incluir MySQL
#include <mysql.h>
#include <stdbool.h>

// Definición de tipos de valor para db_insert
#define VALUE_TYPE_STRING  0
#define VALUE_TYPE_NUMBER  1
#define VALUE_TYPE_BOOLEAN 2

// Funciones públicas del gestor de base de datos
bool db_init(const char* host, const char* user, const char* password, const char* database);
bool db_init_from_file(const char* sql_file);
bool db_table_exists(const char* table_name);
bool db_insert(const char* table_name, const char** fields, const char** values, const int* types, int count);
void db_close();

#endif // DB_MANAGER_H