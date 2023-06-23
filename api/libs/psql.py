import os

from databases import Database

psql_conn_string = os.environ.get('PSQL_CONN_STRING')
db = Database(psql_conn_string)
