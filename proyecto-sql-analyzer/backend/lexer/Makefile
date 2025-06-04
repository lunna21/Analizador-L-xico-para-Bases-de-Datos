CC = gcc
CFLAGS = -Wall -g

all: lexer

lex.yy.c: sql.l
	flex sql.l

lexer: lex.yy.c
	$(CC) $(CFLAGS) -DSTANDALONE -o lexer lex.yy.c

clean:
	rm -f lexer lex.yy.c
	
test: lexer
	./lexer "insertar en tabla usuarios valores: nombre = 'Juan', edad = 25, activo = verdadero fin;"