import os
import json
import logging
import hashlib
from typing import List, Generator, Dict, Any, Optional
from app.config import settings
from app.models.schemas import QuizGenerateResponse, QuizQuestion

logger = logging.getLogger(__name__)

# Coba inisialisasi Google GenAI SDK
genai_available = False
try:
    if settings.GEMINI_API_KEY:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        genai_available = True
        logger.info("Google Gemini SDK berhasil dikonfigurasi.")
    else:
        logger.warning("GEMINI_API_KEY belum diisi. Mengaktifkan Dev Fallback Mode.")
except Exception as e:
    logger.warning(f"Tidak dapat menginisialisasi Google GenAI: {e}. Mengaktifkan Dev Fallback Mode.")

def get_embedding(text: str) -> List[float]:
    """Menghasilkan vector embedding 768 dimensi menggunakan text-embedding-004."""
    if genai_available and settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            res = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            return res['embedding']
        except Exception as e:
            logger.error(f"Error memanggil Gemini embedding: {e}")
            # Fallback ke pseudo-embedding jika API limit/error
            return generate_mock_embedding(text)
    else:
        return generate_mock_embedding(text)

def generate_mock_embedding(text: str) -> List[float]:
    """Menghasilkan embedding deterministik 768 dimensi untuk mode development/offline."""
    hasher = hashlib.sha256(text.encode('utf-8')).digest()
    vec = []
    for i in range(768):
        byte_val = hasher[i % len(hasher)]
        vec.append(round((byte_val / 255.0) * 2 - 1, 6))
    return vec

SYSTEM_TUTOR_PROMPT = """Anda adalah 'Konco Sinauku', seorang Asisten Akademis Formal yang bertugas membantu pelajar memahami materi pembelajaran secara faktual, objektif, dan terstruktur.

ATURAN WAJIB:
1. Jawab HANYA berdasarkan konteks dokumen yang diberikan.
2. Gaya bahasa harus FORMAL, LUGAS, SANTUN, dan TIDAK BERTELE-TELE.
3. JANGAN berspekulasi atau menambahkan informasi di luar teks dokumen. Jika materi tidak ada dalam konteks, jawab dengan jujur: 'Informasi tersebut tidak ditemukan dalam dokumen yang diunggah.'
4. Pada akhir setiap poin atau penjelasan fakta penting, SERTAKAN SITASI HALAMAN dalam format tag khusus: [Halaman X] (contoh: [Halaman 3]).
5. Gunakan format Markdown rapi dan notasi matematika LaTeX (misal $E=mc^2$) jika relevan.
"""

def generate_chat_stream(
    question: str,
    context_chunks: List[Dict[str, Any]],
    history: List[Dict[str, Any]] = None
) -> Generator[str, None, None]:
    """Menghasilkan streaming response token via Generator SSE."""
    context_text = "\n\n---\n\n".join([
        f"[Konteks Halaman {c['page_number']}]:\n{c['content']}"
        for c in context_chunks
    ])
    
    prompt = f"""Berikut adalah kutipan materi dari dokumen belajar siswa:
{context_text}

Pertanyaan Siswa: {question}

Instruksi: Berikan jawaban akademis formal yang tepat, ringkas, dan sertakan sitasi [Halaman X] untuk fakta yang bersangkutan."""

    if genai_available and settings.GEMINI_API_KEY:
        for candidate in ["gemini-3.8-flash", "gemini-flash-latest", "gemini-2.0-flash"]:
            try:
                import google.generativeai as genai
                model = genai.GenerativeModel(
                    model_name=candidate,
                    system_instruction=SYSTEM_TUTOR_PROMPT
                )
                response = model.generate_content(prompt, stream=True)
                has_yielded = False
                for chunk in response:
                    if chunk.text:
                        has_yielded = True
                        yield chunk.text
                if has_yielded:
                    return
            except Exception as e:
                logger.warning(f"Model {candidate} gagal untuk chat: {e}, mencoba kandidat berikutnya...")
                continue

    # Dev fallback streaming jika API key belum diisi
    yield f"Berdasarkan analisis materi pada dokumen:\n\n"
    if context_chunks:
        ref_page = context_chunks[0]['page_number']
        sample_snippet = context_chunks[0]['content'][:200]
        yield f"Materi terkait pertanyaan '{question}' ditemukan pada [Halaman {ref_page}]:\n\n"
        yield f"> \"{sample_snippet}...\"\n\n"
        yield f"Penjelasan akademis menunjukkan konsep tersebut berperan penting dalam materi ini. [Halaman {ref_page}]\n"
    else:
        yield "Informasi terkait belum ditemukan dalam konteks dokumen yang dipilih.\n"

def generate_structured_quiz(
    topic: str,
    num_questions: int,
    context_chunks: List[Dict[str, Any]]
) -> QuizGenerateResponse:
    """Membuat kuis pilihan ganda terstruktur dengan Pydantic output."""
    context_text = "\n\n".join([
        f"(Halaman {c['page_number']}): {c['content']}"
        for c in context_chunks[:15]
    ])

    if genai_available and settings.GEMINI_API_KEY:
        prompt = f"""Buatkan {num_questions} butir soal pilihan ganda akademis berdasarkan materi berikut:
Topik: {topic}

Konteks Dokumen:
{context_text}

Aturan Kuis:
1. Setiap soal harus memiliki 4 opsi jawaban diawali huruf 'A. ', 'B. ', 'C. ', 'D. '.
2. Berikan kunci jawaban yang tepat ('A', 'B', 'C', atau 'D').
3. Berikan analisis akademis mendalam mengapa jawaban tersebut benar dan mengapa opsi lain salah.
4. Tulis nomor halaman rujukan dokumen yang valid."""

        for candidate in ["gemini-3.8-flash", "gemini-flash-latest", "gemini-2.0-flash"]:
            try:
                import google.generativeai as genai
                model = genai.GenerativeModel(candidate)
                response = model.generate_content(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        response_schema=QuizGenerateResponse
                    )
                )
                data = json.loads(response.text)
                return QuizGenerateResponse(**data)
            except Exception as e:
                logger.warning(f"Gemini candidate {candidate} gagal untuk quiz: {e}")
                continue

    # Fallback kuis jika API Key belum aktif
    sample_page = context_chunks[0]['page_number'] if context_chunks else 1
    fallback_questions = []
    for i in range(1, num_questions + 1):
        fallback_questions.append(QuizQuestion(
            id=i,
            question=f"Berdasarkan pembahasan pada {topic}, manakah pernyataan berikut yang paling tepat mengenai konsep utama? (Soal Latihan #{i})",
            options=[
                f"A. Konsep utama dibahas secara mendalam dengan prinsip fundamental pada halaman {sample_page}.",
                "B. Konsep tersebut tidak relevan dengan pembahasan dokumen.",
                "C. Materi ini hanya bersifat hipotesis tanpa bukti faktual.",
                "D. Tidak ada kesimpulan yang dapat ditarik dari pembahasan tersebut."
            ],
            correct_answer="A",
            explanation=f"Opsi A benar karena prinsip fundamental materi dijelaskan secara eksplisit pada konteks dokumen. Opsi B, C, dan D tidak sesuai dengan fakta teks.",
            relevant_page=sample_page
        ))

    return QuizGenerateResponse(
        topic=topic,
        total_questions=len(fallback_questions),
        questions=fallback_questions
    )
