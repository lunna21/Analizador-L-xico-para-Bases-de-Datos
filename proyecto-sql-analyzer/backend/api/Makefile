CC = x86_64-w64-mingw32-gcc
# Añadir la ruta de inclusión de MySQL
CFLAGS = -Wall -g -I"C:/Program Files/MySQL/MySQL Server 8.0/include" -I"../"
# Usar la ruta correcta de Windows para MySQL y el nombre correcto de la librería
LDFLAGS = -L"C:/Program Files/MySQL/MySQL Server 8.0/lib" -lmysql

# Rutas de directorios
LEXER_DIR = ../lexer
DB_DIR = ../database
BUILD_DIR = ../build

# Añadir esta línea para solucionar errores de directorios
MKDIR = mkdir -p

# Archivos objeto
OBJS = $(BUILD_DIR)/server.o $(BUILD_DIR)/lex.yy.o $(BUILD_DIR)/db_manager.o

all: dirs server

dirs:
	$(MKDIR) $(BUILD_DIR)  # Estos espacios al inicio deben ser tabulaciones

server: $(OBJS)
	$(CC) $(CFLAGS) -o $(BUILD_DIR)/server $^ $(LDFLAGS)

$(BUILD_DIR)/server.o: server.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(BUILD_DIR)/lex.yy.o: $(LEXER_DIR)/lex.yy.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(LEXER_DIR)/lex.yy.c: $(LEXER_DIR)/sql.l
	cd $(LEXER_DIR) && flex sql.l

$(BUILD_DIR)/db_manager.o: $(DB_DIR)/db_manager.c
	$(CC) $(CFLAGS) -c -o $@ $<

clean:
	rm -f $(BUILD_DIR)/*.o $(BUILD_DIR)/server $(LEXER_DIR)/lex.yy.c

run: all
	$(BUILD_DIR)/server $(BUILD_DIR)/query.txt
	