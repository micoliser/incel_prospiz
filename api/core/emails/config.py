from django.conf import settings
from typing import List


class EmailConfig:
    """
    Centralized email configuration reader accessing django.conf.settings
    which loads from environment variables.
    """

    @staticmethod
    def is_enabled() -> bool:
        """Check if email sending is enabled."""
        return bool(getattr(settings, 'EMAIL_ENABLED', False))

    @staticmethod
    def is_debug_mode() -> bool:
        """Check if email debug mode is active (logs instead of sending)."""
        return bool(getattr(settings, 'EMAIL_DEBUG', False))

    @staticmethod
    def get_sender_name() -> str:
        """Get the sender display name."""
        return getattr(settings, 'EMAIL_SENDER_NAME', '') or 'Incel Holidays and Tourism'

    @staticmethod
    def get_default_from_email() -> str:
        """Get the default from email address."""
        return getattr(settings, 'DEFAULT_FROM_EMAIL', '') or 'info@inceltourism.com'

    @staticmethod
    def format_from_email() -> str:
        """Format the 'From' header as 'Sender Name <email@domain.com>'."""
        sender_name = EmailConfig.get_sender_name()
        from_email = EmailConfig.get_default_from_email()
        if sender_name:
            return f"{sender_name} <{from_email}>"
        return from_email

    @staticmethod
    def get_internal_recipients() -> List[str]:
        """
        Get the list of internal operations team email addresses
        configured via INTERNAL_NOTIFICATION_EMAILS.
        """
        recipients = getattr(settings, 'INTERNAL_NOTIFICATION_EMAILS', [])
        if recipients and isinstance(recipients, list) and len(recipients) > 0:
            return recipients
        from_email = EmailConfig.get_default_from_email()
        return [from_email] if from_email else ['info@inceltourism.com']
