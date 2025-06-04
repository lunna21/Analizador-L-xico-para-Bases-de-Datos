CC = x86_64-w64-mingw32-gcc
# Añadir la ruta de inclusión de MySQL
CFLAGS = -Wall -g -I"C:/Program Files/MySQL/MySQL Server 8.0/include" -I"../"
# Usar la ruta correcta de Windows para MySQL y el nombre correcto de la librería
LDFLAGS = -L"C:/Program Files/MySQL/MySQL Server 8.0/lib" -lmysql

# Rutas de directorios
LEXER_DIR = ../lexer
DB_DIR = ../database
BUILD_DIR = ../build

# Archivos objeto
OBJS = $(BUILD_DIR)/server.o $(BUILD_DIR)/lex.yy.o $(BUILD_DIR)/db_manager.o

all: dirs server

dirs:
	if not exist $(BUILD_DIR) mkdir $(BUILD_DIR)

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
	-del /F /Q $(BUILD_DIR)\*.o $(BUILD_DIR)\server.exe $(LEXER_DIR)\lex.yy.c 2>nul

run: all
	$(BUILD_DIR)/server $(BUILD_DIR)/query.txt
