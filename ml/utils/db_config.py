import mysql.connector
from mysql.connector import pooling
import os
from typing import Optional

class DatabaseConfig:
    _instance = None
    _pool = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseConfig, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if self._pool is None:
            self._pool = mysql.connector.pooling.MySQLConnectionPool(
                pool_name="ml_pool",
                pool_size=5,
                pool_reset_session=True,
                host=os.getenv('DB_HOST', 'localhost'),
                port=int(os.getenv('DB_PORT', 3306)),
                database=os.getenv('DB_NAME', 'dashboard_db'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', 'kali'),
                autocommit=True
            )

    def get_connection(self):
        return self._pool.get_connection()

    def execute_query(self, query: str, params: Optional[tuple] = None):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(query, params or ())
            result = cursor.fetchall()
            return result
        finally:
            cursor.close()
            conn.close()

    def execute_query_df(self, query: str, params: Optional[tuple] = None):
        import pandas as pd
        conn = self.get_connection()
        try:
            df = pd.read_sql(query, conn, params=params)
            return df
        finally:
            conn.close()