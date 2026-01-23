class DomainError(Exception):
    """Base exception for domain errors."""
    pass

class ResourceNotFoundError(DomainError):
    """Raised when a requested resource is not found."""
    def __init__(self, resource_type: str, resource_id: str):
        self.message = f"{resource_type} with ID {resource_id} not found"
        super().__init__(self.message)

class PermissionDeniedError(DomainError):
    """Raised when operation is not permitted (e.g. ownership check failure)."""
    def __init__(self, message: str = "Permission denied"):
        self.message = message
        super().__init__(self.message)

class BusinessRuleViolationError(DomainError):
    """Raised when a business rule is violated."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)
