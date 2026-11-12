import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import Document, DocumentChunk, QuizResult
from app.models.schemas import (
    QuizGenerateRequest, QuizGenerateResponse,
    QuizSubmitRequest, QuizSubmitResponse, QuestionResultDetail
)
from app.core.gemini import generate_structured_quiz
from app.core.rag import retrieve_relevant_chunks

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/quiz", tags=["Quiz"])

@router.post("/generate", response_model=QuizGenerateResponse)
def generate_quiz(req: QuizGenerateRequest, db: Session = Depends(get_db)):
    """Membuat soal kuis pilihan ganda berdasarkan topik dan jumlah soal yang dipilih."""
    doc = db.query(Document).filter(Document.id == req.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan.")

    # Ambil chunks relevan dengan topik
    search_query = req.topic if req.topic and req.topic != "Semua Bagian Dokumen" else doc.filename
    relevant_chunks = retrieve_relevant_chunks(db, req.document_id, search_query, top_k=15)
    
    if not relevant_chunks:
        # Fallback ke seluruh chunks jika query kosong
        all_chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == req.document_id).limit(15).all()
        relevant_chunks = [{"chunk_index": c.chunk_index, "page_number": c.page_number, "content": c.content} for c in all_chunks]

    if not relevant_chunks:
        raise HTTPException(status_code=400, detail="Materi dokumen tidak cukup untuk membuat kuis.")

    quiz_response = generate_structured_quiz(
        topic=req.topic or "Materi Dokumen",
        num_questions=req.num_questions,
        context_chunks=relevant_chunks
    )
    return quiz_response

@router.post("/submit", response_model=QuizSubmitResponse)
def submit_quiz(req: QuizSubmitRequest, db: Session = Depends(get_db)):
    """
    Mengevaluasi seluruh jawaban kuis yang disubmit serentak oleh siswa,
    menghitung skor persentase, dan memberikan analisis jawaban mendalam.
    """
    user_answer_map = {a.question_id: a.user_answer for a in req.answers}
    
    correct_count = 0
    total = len(req.questions)
    details = []

    for q in req.questions:
        user_ans = user_answer_map.get(q.id)
        # Normalisasi jawaban user (e.g. "A. ..." -> "A" atau "A")
        clean_user_ans = user_ans.strip()[:1].upper() if user_ans else None
        clean_correct = q.correct_answer.strip()[:1].upper()

        is_correct = (clean_user_ans == clean_correct)
        if is_correct:
            correct_count += 1

        details.append(QuestionResultDetail(
            question_id=q.id,
            question=q.question,
            options=q.options,
            user_answer=clean_user_ans,
            correct_answer=clean_correct,
            is_correct=is_correct,
            explanation=q.explanation,
            relevant_page=q.relevant_page
        ))

    percentage = round((correct_count / total * 100)) if total > 0 else 0

    if percentage >= 80:
        message = "🎉 Pemahaman Luar Biasa! Anda menguasai materi ini dengan sangat baik."
    elif percentage >= 60:
        message = "👍 Hasil yang Bagus! Tinjau kembali beberapa rujukan halaman untuk memperkuat konsep."
    else:
        message = "📚 Perlu Pendalaman Lebih Lanjut. Silakan baca ulang materi melalui viewer di sisi kiri."

    # Simpan riwayat kuis
    try:
        quiz_record = QuizResult(
            document_id=req.document_id,
            user_id="default-student",
            topic=req.topic,
            total_questions=total,
            score=percentage,
            quiz_data=[d.model_dump() for d in details]
        )
        db.add(quiz_record)
        db.commit()
    except Exception as e:
        logger.warning(f"Gagal menyimpan riwayat kuis ke DB: {e}")

    return QuizSubmitResponse(
        topic=req.topic,
        total_questions=total,
        correct_count=correct_count,
        percentage=percentage,
        message=message,
        details=details
    )
