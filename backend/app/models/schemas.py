from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# Document Schemas
class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_size_bytes: int
    page_count: int
    topics: List[str] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]

# Chat Schemas
class ChatMessageItem(BaseModel):
    role: str
    content: str
    citations: Optional[List[int]] = []

class ChatRequest(BaseModel):
    document_id: str
    question: str
    history: Optional[List[ChatMessageItem]] = []

class ChatResponse(BaseModel):
    answer: str
    citations: List[int] = []

# Summary Schemas
class SummaryRequest(BaseModel):
    document_id: str
    topic: Optional[str] = None

class SummaryResponse(BaseModel):
    document_id: str
    executive_summary: str
    key_points: List[str]
    glossary: Dict[str, str]

# Quiz Schemas (Structured Output)
class QuizQuestion(BaseModel):
    id: int
    question: str = Field(description="Teks pertanyaan pilihan ganda")
    options: List[str] = Field(description="4 pilihan jawaban diawali huruf 'A. ...', 'B. ...', 'C. ...', 'D. ...'")
    correct_answer: str = Field(description="Huruf jawaban yang benar: 'A', 'B', 'C', atau 'D'")
    explanation: str = Field(description="Penjelasan akademis komprehensif mengapa opsi ini benar dan opsi lain salah")
    relevant_page: int = Field(description="Nomor halaman dokumen tempat materi ini ditemukan")

class QuizGenerateRequest(BaseModel):
    document_id: str
    topic: Optional[str] = "Semua Bagian Dokumen"
    num_questions: int = Field(default=5, ge=1, le=10)

class QuizGenerateResponse(BaseModel):
    topic: str
    total_questions: int
    questions: List[QuizQuestion]

class QuizSubmitItem(BaseModel):
    question_id: int
    user_answer: Optional[str] = None # 'A', 'B', 'C', 'D'

class QuizSubmitRequest(BaseModel):
    document_id: str
    topic: str
    answers: List[QuizSubmitItem]
    questions: List[QuizQuestion]

class QuestionResultDetail(BaseModel):
    question_id: int
    question: str
    options: List[str]
    user_answer: Optional[str]
    correct_answer: str
    is_correct: bool
    explanation: str
    relevant_page: int

class QuizSubmitResponse(BaseModel):
    topic: str
    total_questions: int
    correct_count: int
    percentage: int
    message: str
    details: List[QuestionResultDetail]
