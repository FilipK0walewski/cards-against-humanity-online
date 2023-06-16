import os

from databases import Database

psql_conn_string = os.environ.get('PSQL_CONN_STRING', 'postgresql://marcin:Calendar2023@localhost/cah')
db = Database(psql_conn_string)
