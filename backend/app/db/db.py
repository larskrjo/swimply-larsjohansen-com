import boto3
from botocore.exceptions import ClientError
from mysql.connector import pooling
import os

def get_prod_secret():
    secret_name = "Website-MySQL"
    region_name = "us-west-2"

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        raise e

    mysql_user = get_secret_value_response['mysql_user']
    mysql_password = get_secret_value_response['mysql_password']
    return {
        "host": "db",
        "port": "3306",
        "user": mysql_user,
        "password": mysql_password
    }

def get_dev_secret():
    return {
        "host": "localhost",
        "port": "3306",
        "user": "root",
        "password": "Abcd1234"
    }

dbconfig = {
    "database": "pool_data",
    "autocommit": True
}

print(f"mysqluser: {dbconfig}")

if os.getenv("DEVELOPMENT_MODE") == "prod":
    dbconfig = dbconfig | get_prod_secret()
else:
    dbconfig = dbconfig | get_dev_secret()

# pool = pooling.MySQLConnectionPool(
#     pool_name="pool-temperature",
#     pool_size=5,
#     **dbconfig
# )

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