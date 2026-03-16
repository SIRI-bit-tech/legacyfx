from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TicketCreate(BaseModel):
    subject: str
    description: str
    category: str
    priority: str


class TicketResponse(BaseModel):
    id: str
    subject: str
    description: str
    category: str
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: str
    ticket_id: str
    user_id: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
