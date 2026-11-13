import os
import uuid
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Header
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.db_models import Document, DocumentChunk
from app.models.schemas import DocumentResponse, DocumentListResponse
from app.core.pdf_parser import validate_and_extract_pdf
from app.core.chunker import process_document_pages
from app.core.gemini import get_embedding
from app.core.auth import get_current_member_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    member_id: str = Depends(get_current_member_id)
):
    """Unggah dan indeks file PDF materi pembelajaran (maks 20 MB, maks 50 hal)."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Hanya file berekstensi .pdf yang diperbolehkan.")

    doc_id = str(uuid.uuid4())
    saved_filename = f"{doc_id}.pdf"
    file_path = os.path.join(settings.UPLOAD_DIR, saved_filename)

    try:
        # Simpan file sementara ke disk
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # 1. Validasi & Ekstraksi PDF
        pages_data, topics, file_size_bytes, page_count = validate_and_extract_pdf(file_path)

        # 2. Simpan Entitas Document ke DB
        doc_entry = Document(
            id=doc_id,
            user_id=member_id,
            filename=file.filename,
            file_path=file_path,
            file_size_bytes=file_size_bytes,
            page_count=page_count,
            topics=topics
        )
        db.add(doc_entry)
        db.commit()

        # 3. Chunking & Simpan Embedding
        chunks_data = process_document_pages(pages_data)
        for c in chunks_data:
            emb = get_embedding(c["content"])
            chunk_entry = DocumentChunk(
                id=str(uuid.uuid4()),
                document_id=doc_id,
                chunk_index=c["chunk_index"],
                page_number=c["page_number"],
                content=c["content"],
                embedding=emb
            )
            db.add(chunk_entry)

        db.commit()
        db.refresh(doc_entry)
        logger.info(f"Dokumen '{file.filename}' berhasil diindeks: {len(chunks_data)} chunks, {page_count} halaman.")
        return doc_entry

    except HTTPException as he:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise he
    except Exception as e:
        logger.error(f"Gagal memproses dokumen upload: {e}")
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Kesalahan sistem saat memproses PDF: {str(e)}")

@router.get("", response_model=DocumentListResponse)
def list_documents(
    db: Session = Depends(get_db),
    member_id: str = Depends(get_current_member_id)
):
    """Mendapatkan daftar seluruh dokumen yang diunggah khusus untuk member_id aktif."""
    docs = db.query(Document).filter(Document.user_id == member_id).order_by(Document.created_at.desc()).all()
    return {"documents": docs}

@router.get("/{document_id}/file")
def get_document_file(document_id: str, db: Session = Depends(get_db)):
    """Streaming file PDF asli untuk ditampilkan pada In-App PDF Viewer di sisi kiri."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File PDF tidak ditemukan di server.")
    
    return FileResponse(
        doc.file_path,
        media_type="application/pdf",
        filename=doc.filename,
        headers={"Content-Disposition": f"inline; filename={doc.filename}"}
    )

@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    member_id: str = Depends(get_current_member_id)
):
    """Menghapus dokumen dan seluruh chunk dari database serta storage lokal khusus pemilik member_id."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == member_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan atau bukan milik Anda.")

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            logger.warning(f"Gagal menghapus file fisik: {e}")

    db.delete(doc)
    db.commit()
    return {"message": "Dokumen berhasil dihapus."}
