from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "mentha_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=['app.worker']  # We will define tasks in worker.py for now
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Resilience settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    # Scheduler
    beat_schedule={
        'run-daily-geo-simulation-check': {
            'task': 'run_geo_simulation', # Assuming we have a wrapper task that iterates all brands
            'schedule': 86400.0, # Daily (seconds)
        },
        'check-competitors-weekly': {
            'task': 'check_competitors', 
            'schedule': 604800.0, # Weekly
        },
    }
)
