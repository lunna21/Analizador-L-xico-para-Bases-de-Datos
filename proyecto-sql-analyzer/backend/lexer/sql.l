%{
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Definición de tipos de tokens */
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
} SQL_TokenType;

/* Estructura para el token */
typedef struct {
    SQL_TokenType type;
    char* lexeme;
    int line;
} Token;

/* Variables globales */
Token* tokens = NULL;
int token_count = 0;
int token_capacity = 0;
int current_line = 1;

/* Función para agregar un token */
void add_token(SQL_TokenType type, char* lexeme) {
    if (token_count >= token_capacity) {
        token_capacity = token_capacity == 0 ? 10 : token_capacity * 2;
        tokens = realloc(tokens, token_capacity * sizeof(Token));
    }
    tokens[token_count].type = type;
    tokens[token_count].lexeme = strdup(lexeme);
    tokens[token_count].line = current_line;
    token_count++;
}

/* Función para liberar memoria */
void free_tokens() {
    for (int i = 0; i < token_count; i++) {
        free(tokens[i].lexeme);
    }
    free(tokens);
    tokens = NULL;
    token_count = 0;
    token_capacity = 0;
}
%}

%option noyywrap
%option case-insensitive

/* Definición de las expresiones regulares */
WHITESPACE      [ \t\r]+
NEWLINE         \n
DIGIT           [0-9]
LETTER          [a-zA-Z]
IDENTIFIER      {LETTER}[a-zA-Z0-9_]*
NUMBER          {DIGIT}+
STRING          \"([^\"\\]|\\.)*\"|\'([^\'\\]|\\.)*\'
BOOLEAN         verdadero|falso|true|false

%%

"insertar"      { add_token(TOKEN_KEYWORD_INSERTAR, yytext); }
"en"            { add_token(TOKEN_KEYWORD_EN, yytext); }
"tabla"         { add_token(TOKEN_KEYWORD_TABLA, yytext); }
"valores"       { add_token(TOKEN_KEYWORD_VALORES, yytext); }
"fin"           { add_token(TOKEN_KEYWORD_FIN, yytext); }

{BOOLEAN}       { add_token(TOKEN_BOOLEAN, yytext); }
{IDENTIFIER}    { add_token(TOKEN_IDENTIFIER, yytext); }
{NUMBER}        { add_token(TOKEN_NUMBER, yytext); }
{STRING}        { add_token(TOKEN_STRING, yytext); }

":"             { add_token(TOKEN_COLON, yytext); }
","             { add_token(TOKEN_COMMA, yytext); }
"="             { add_token(TOKEN_EQUALS, yytext); }
";"             { add_token(TOKEN_SEMICOLON, yytext); }

{WHITESPACE}    { /* Ignorar espacios en blanco */ }
{NEWLINE}       { current_line++; }

.               { add_token(TOKEN_ERROR, yytext); }

%%

/* Función principal para el análisis léxico */
Token* analyze_string(const char* input, int* count) {
    free_tokens();
    current_line = 1;

    YY_BUFFER_STATE buffer = yy_scan_string(input);
    yylex();
    yy_delete_buffer(buffer);

    *count = token_count;
    return tokens;
}

/* Función para imprimir tokens (para depuración) */
void print_tokens() {
    const char* token_names[] = {
        "INSERTAR", "EN", "TABLA", "VALORES", "FIN",
        "IDENTIFIER", "NUMBER", "STRING", "BOOLEAN",
        "COLON", "COMMA", "EQUALS", "SEMICOLON", "ERROR"
    };

    printf("Tokens encontrados (%d):\n", token_count);
    for (int i = 0; i < token_count; i++) {
        printf("[%d] Tipo: %s, Lexema: %s, Linea: %d\n",
               i, token_names[tokens[i].type], tokens[i].lexeme, tokens[i].line);
    }
}

/* Implementación de prueba para compilar como ejecutable independiente */
#ifdef STANDALONE
int main(int argc, char** argv) {
    if (argc < 2) {
        printf("Uso: %s \"consulta SQL\"\n", argv[0]);
        return 1;
    }
    int count;
    analyze_string(argv[1], &count);
    print_tokens();
    free_tokens();
    return 0;
}
#endif
