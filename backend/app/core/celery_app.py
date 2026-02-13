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
    # Scheduler - Beat configuration
    beat_schedule={
        # Master scheduler - runs hourly, checks which brands need analysis based on plan
        'scheduled-analysis-runner': {
            'task': 'scheduled_analysis_runner',
            'schedule': 3600.0,  # Every hour
        },
        # Update AI visibility snapshots daily (for historical charts)
        'update-visibility-snapshots': {
            'task': 'update_visibility_snapshots',
            'schedule': 86400.0,  # Daily (24 hours)
        },
        # Check competitors weekly
        'check-competitors-weekly': {
            'task': 'check_competitors', 
            'schedule': 604800.0,  # Weekly (7 days)
        },
    }
)

