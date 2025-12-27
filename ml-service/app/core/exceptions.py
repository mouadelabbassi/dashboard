class MLServiceException(Exception):
    pass


class ModelNotLoadedException(MLServiceException):
    pass


class ModelNotTrainedException(MLServiceException):
    pass


class InvalidInputException(MLServiceException):
    pass


class DatabaseException(MLServiceException):
    pass


class PredictionException(MLServiceException):
    pass


class TrainingException(MLServiceException):
    pass