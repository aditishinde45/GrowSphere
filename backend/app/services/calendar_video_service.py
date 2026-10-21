"""
GrowSphere Calendar and Video Conferencing Service Abstraction.
Generates sandbox meeting links and RFC 5545 calendar invitations.
"""

import abc
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any


class CalendarVideoProvider(abc.ABC):
    """Abstract interface for video conferencing and calendar integration."""

    @abc.abstractmethod
    def create_meeting(self, booking_id: int, topic: str, start_time: datetime, duration_minutes: int) -> Dict[str, Any]:
        pass


class SandboxCalendarVideoProvider(CalendarVideoProvider):
    """
    Sandbox provider generating secure deterministic meeting rooms and ICS data.
    """

    def create_meeting(self, booking_id: int, topic: str, start_time: datetime, duration_minutes: int) -> Dict[str, Any]:
        room_code = f"gs-room-{uuid.uuid4().hex[:8]}"
        meeting_link = f"https://meet.growsphere.dev/room/{room_code}"
        
        end_time = start_time + timedelta(minutes=duration_minutes)
        dt_start_fmt = start_time.strftime("%Y%m%dT%H%M%SZ")
        dt_end_fmt = end_time.strftime("%Y%m%dT%H%M%SZ")

        ics_content = (
            "BEGIN:VCALENDAR\r\n"
            "VERSION:2.0\r\n"
            "PRODID:-//GrowSphere//Career Mentorship//EN\r\n"
            "BEGIN:VEVENT\r\n"
            f"UID:booking-{booking_id}@growsphere.dev\r\n"
            f"DTSTAMP:{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}\r\n"
            f"DTSTART:{dt_start_fmt}\r\n"
            f"DTEND:{dt_end_fmt}\r\n"
            f"SUMMARY:GrowSphere Mentorship: {topic}\r\n"
            f"DESCRIPTION:Mentorship session link: {meeting_link}\r\n"
            f"LOCATION:{meeting_link}\r\n"
            "STATUS:CONFIRMED\r\n"
            "END:VEVENT\r\n"
            "END:VCALENDAR\r\n"
        )

        return {
            "room_code": room_code,
            "meeting_link": meeting_link,
            "ics_calendar": ics_content,
            "provider": "sandbox",
        }


# Global instance
calendar_video_provider = SandboxCalendarVideoProvider()
