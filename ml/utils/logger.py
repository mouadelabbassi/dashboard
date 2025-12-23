import logging
import os
from datetime import datetime
from pathlib import Path

class MLLogger:

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLLogger, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.logs_dir = Path(__file__).resolve().parent.parent / 'logs'
        self.logs_dir.mkdir(exist_ok=True)

        log_file = self.logs_dir / f'ml_service_{datetime.now().strftime("%Y%m%d")}.log'

        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )

        self.logger = logging.getLogger('MLService')
        self._initialized = True

    def info(self, message):
        self.logger.info(message)

    def error(self, message):
        self.logger.error(message)

    def warning(self, message):
        self.logger.warning(message)

    def debug(self, message):
        self.logger.debug(message)

    def log_prediction(self, asin, prediction_type, result):
        self.logger.info(f"Prediction - ASIN: {asin}, Type: {prediction_type}, Result: {result}")

    def log_model_load(self, model_name, status):
        self.logger.info(f"Model Load - {model_name}: {status}")

    def log_error(self, error_type, error_message, traceback=None):
        self.logger.error(f"Error - Type: {error_type}, Message: {error_message}")
        if traceback:
            self.logger.error(f"Traceback: {traceback}")