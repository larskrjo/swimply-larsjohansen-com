from mysql.connector import pooling

dbconfig = {
    "host": "localhost",
    "user": "root",
    "password": "Abcd1234",
    "database": "pool_data",
    "autocommit": True
}

pool = pooling.MySQLConnectionPool(
    pool_name="pool-temperature",
    pool_size=5,
    **dbconfig
)

class Database:
    def __init__(self):
        self.conn = None
        self.cursor = None

    def __enter__(self):
        self.conn = pool.get_connection()
        self.cursor = self.conn.cursor()
        self.cursor.execute("SET time_zone = '+00:00'")
        return self.cursor

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.conn.rollback()
        else:
            self.conn.commit()
        self.cursor.close()
        self.conn.close()