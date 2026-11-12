import os
import logging
from typing import List, Dict, Any, Tuple
from pypdf import PdfReader
from fastapi import HTTPException
from app.config import settings

logger = logging.getLogger(__name__)

def validate_and_extract_pdf(file_path: str) -> Tuple[List[Dict[str, Any]], List[str], int, int]:
    """
    Memvalidasi dan mengekstrak isi PDF.
    Returns:
        - pages_data: List[{"page_number": int, "text": str}]
        - topics: List[str] (Daftar topik / bab yang terdeteksi)
        - file_size_bytes: int
        - page_count: int
    """
    file_size_bytes = os.path.getsize(file_path)
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    
    # 1. Validasi Ukuran File (Maksimal 20 MB)
    if file_size_bytes > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Ukuran file ({file_size_bytes / (1024*1024):.1f} MB) melebihi batas maksimum {settings.MAX_FILE_SIZE_MB} MB."
        )

    try:
        reader = PdfReader(file_path)
    except Exception as e:
        logger.error(f"Gagal membaca format PDF: {e}")
        raise HTTPException(status_code=400, detail="Format PDF tidak valid atau file rusak.")

    page_count = len(reader.pages)
    
    # 2. Validasi Jumlah Halaman (Maksimal 50 halaman)
    if page_count > settings.MAX_PAGE_COUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Jumlah halaman ({page_count} halaman) melebihi batas maksimum {settings.MAX_PAGE_COUNT} halaman."
        )
    
    if page_count == 0:
        raise HTTPException(status_code=400, detail="Dokumen PDF tidak memiliki halaman teks.")

    pages_data = []
    for idx, page in enumerate(reader.pages):
        page_num = idx + 1
        text = page.extract_text() or ""
        pages_data.append({
            "page_number": page_num,
            "text": text.strip()
        })

    # 3. Ekstraksi Topik / Bab dari Outline / Daftar Isi
    topics = []
    try:
        outline = reader.outline
        if outline:
            def extract_outline_titles(items):
                titles = []
                for item in items:
                    if isinstance(item, list):
                        titles.extend(extract_outline_titles(item))
                    elif hasattr(item, 'title') and item.title:
                        titles.append(str(item.title).strip())
                return titles
            
            topics = extract_outline_titles(outline)
    except Exception as e:
        logger.warning(f"Tidak dapat membaca outline asli PDF: {e}")

    # Fallback topik jika tidak ada outline: deteksi heading di halaman-halaman awal
    if not topics:
        detected = []
        for p in pages_data[:5]:
            lines = [l.strip() for l in p["text"].split("\n") if len(l.strip()) > 3]
            for l in lines:
                lower = l.lower()
                if lower.startswith("bab ") or lower.startswith("chapter ") or lower.startswith("bagian "):
                    detected.append(l)
        topics = detected[:10] if detected else ["Materi Umum (Seluruh Dokumen)"]

    return pages_data, topics, file_size_bytes, page_count
