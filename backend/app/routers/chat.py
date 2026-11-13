import json
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models.db_models import Document, ChatMessage
from app.models.schemas import ChatRequest, ChatResponse, ChatMessageResponse
from app.core.rag import retrieve_relevant_chunks
from app.core.gemini import generate_chat_stream
from app.core.auth import get_current_member_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post("")
async def chat_rag(
    req: ChatRequest,
    db: Session = Depends(get_db),
    member_id: str = Depends(get_current_member_id)
):
    """
    Endpoint Tanya Jawab RAG dengan streaming Server-Sent Events (SSE).
    Menyimpan pesan pengguna dan respons asisten ke database per member_id.
    """
    doc = db.query(Document).filter(Document.id == req.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen materi tidak ditemukan.")

    # 1. Semantic Retrieval Top-4 Chunks
    relevant_chunks = retrieve_relevant_chunks(db, req.document_id, req.question, top_k=4)
    if not relevant_chunks:
        raise HTTPException(status_code=400, detail="Tidak ada materi yang dapat di-retrieve untuk dokumen ini.")

    citations = sorted(list(set([c["page_number"] for c in relevant_chunks])))

    # 2. Simpan pesan User ke DB per member_id
    try:
        user_msg = ChatMessage(
            document_id=doc.id,
            user_id=member_id,
            role="user",
            content=req.question,
            citations=[]
        )
        db.add(user_msg)
        db.commit()
    except Exception as e:
        logger.warning(f"Gagal menyimpan pesan user ke DB: {e}")

    def sse_event_stream():
        full_text = ""
        # 3. Stream tokens dari Gemini LLM
        for token in generate_chat_stream(req.question, relevant_chunks, req.history):
            full_text += token
            payload = json.dumps({"token": token, "done": False})
            yield f"data: {payload}\n\n"

        # 4. Simpan respons asisten ke DB setelah stream selesai
        try:
            save_db = SessionLocal()
            try:
                assistant_msg = ChatMessage(
                    document_id=doc.id,
                    user_id=member_id,
                    role="assistant",
                    content=full_text,
                    citations=citations
                )
                save_db.add(assistant_msg)
                save_db.commit()
            finally:
                save_db.close()
        except Exception as err:
            logger.error(f"Gagal menyimpan respons asisten ke DB: {err}")

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

@router.get("/history", response_model=List[ChatMessageResponse])
def get_chat_history(
    document_id: str,
    db: Session = Depends(get_db),
    member_id: str = Depends(get_current_member_id)
):
    """Mengambil riwayat percakapan dokumen khusus untuk member_id aktif."""
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.document_id == document_id, ChatMessage.user_id == member_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return messages

@router.delete("/history")
def clear_chat_history(
    document_id: str,
    db: Session = Depends(get_db),
    member_id: str = Depends(get_current_member_id)
):
    """Menghapus seluruh riwayat percakapan dokumen khusus untuk member_id aktif."""
    db.query(ChatMessage).filter(
        ChatMessage.document_id == document_id,
        ChatMessage.user_id == member_id
    ).delete()
    db.commit()
    return {"message": "Riwayat chat berhasil dibersihkan."}
