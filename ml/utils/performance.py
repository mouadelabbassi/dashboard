import time
import json
from datetime import datetime
from collections import defaultdict
from pathlib import Path

class PerformanceMonitor:

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PerformanceMonitor, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.prediction_times = defaultdict(list)
        self.prediction_counts = defaultdict(int)
        self.error_counts = defaultdict(int)
        self.start_time = datetime.now()

        self._initialized = True

    def record_prediction(self, prediction_type, execution_time):
        self.prediction_times[prediction_type].append(execution_time)
        self.prediction_counts[prediction_type] += 1

    def record_error(self, error_type):
        self.error_counts[error_type] += 1

    def get_statistics(self):
        stats = {
            'uptime_seconds': (datetime.now() - self.start_time).total_seconds(),
            'predictions': {},
            'errors': dict(self.error_counts)
        }

        for pred_type, times in self.prediction_times.items():
            if times:
                stats['predictions'][pred_type] = {
                    'count': self.prediction_counts[pred_type],
                    'avg_time_ms': sum(times) / len(times) * 1000,
                    'min_time_ms': min(times) * 1000,
                    'max_time_ms': max(times) * 1000
                }

        return stats

    def save_statistics(self):
        stats_dir = Path(__file__).resolve().parent.parent / 'logs'
        stats_dir.mkdir(exist_ok=True)

        stats_file = stats_dir / f'performance_stats_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'

        with open(stats_file, 'w') as f:
            json.dump(self.get_statistics(), f, indent=2)

        return str(stats_file)

def time_prediction(func):
    def wrapper(*args, **kwargs):
        monitor = PerformanceMonitor()
        start_time = time.time()

        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            monitor.record_prediction(func.__name__, execution_time)
            return result
        except Exception as e:
            monitor.record_error(func.__name__)
            raise

    return wrapper