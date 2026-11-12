import json
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import Document
from app.models.schemas import ChatRequest, ChatResponse
from app.core.rag import retrieve_relevant_chunks
from app.core.gemini import generate_chat_stream

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post("")
async def chat_rag(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Endpoint Tanya Jawab RAG dengan streaming Server-Sent Events (SSE).
    Mengembalikan token kata per kata beserta metadata sitasi [Halaman X].
    """
    doc = db.query(Document).filter(Document.id == req.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen materi tidak ditemukan.")

    # 1. Semantic Retrieval Top-4 Chunks
    relevant_chunks = retrieve_relevant_chunks(db, req.document_id, req.question, top_k=4)
    if not relevant_chunks:
        raise HTTPException(status_code=400, detail="Tidak ada materi yang dapat di-retrieve untuk dokumen ini.")

    citations = sorted(list(set([c["page_number"] for c in relevant_chunks])))

    def sse_event_stream():
        full_text = ""
        # 2. Stream tokens dari Gemini LLM
        for token in generate_chat_stream(req.question, relevant_chunks, req.history):
            full_text += token
            payload = json.dumps({"token": token, "done": False})
            yield f"data: {payload}\n\n"

        # Kirim event penutup dengan sitasi resmi
        final_payload = json.dumps({
            "token": "",
            "done": True,
            "citations": citations
        })
        yield f"data: {final_payload}\n\n"

    return StreamingResponse(
        sse_event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
