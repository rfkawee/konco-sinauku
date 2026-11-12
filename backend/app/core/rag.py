import json
import logging
import numpy as np
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.db_models import DocumentChunk
from app.core.gemini import get_embedding
from app.database import is_postgres

logger = logging.getLogger(__name__)

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Menghitung kemiripan kosinus antara dua vektor."""
    a = np.array(vec1, dtype=np.float32)
    b = np.array(vec2, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))

def retrieve_relevant_chunks(
    db: Session,
    document_id: str,
    query: str,
    top_k: int = 4
) -> List[Dict[str, Any]]:
    """
    Mengambil top-k potongan dokumen paling relevan terhadap query siswa.
    """
    query_vector = get_embedding(query)

    if is_postgres:
        try:
            # Query Cosine Distance (<=>) di pgvector
            sql = text("""
                SELECT id, chunk_index, page_number, content, (embedding <=> :qv) as distance
                FROM document_chunks
                WHERE document_id = :doc_id
                ORDER BY distance ASC
                LIMIT :top_k;
            """)
            qv_str = "[" + ",".join(map(str, query_vector)) + "]"
            result = db.execute(sql, {"doc_id": document_id, "qv": qv_str, "top_k": top_k}).fetchall()
            
            chunks = []
            for row in result:
                chunks.append({
                    "id": str(row[0]),
                    "chunk_index": row[1],
                    "page_number": row[2],
                    "content": row[3],
                    "score": round(1.0 - float(row[4]), 4)
                })
            return chunks
        except Exception as e:
            logger.error(f"Error pgvector query: {e}. Menggunakan fallback.")

    # Fallback untuk SQLite / in-memory cosine
    all_chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).all()
    if not all_chunks:
        return []

    scored_chunks = []
    for c in all_chunks:
        c_emb = c.embedding
        if isinstance(c_emb, str):
            try:
                c_emb = json.loads(c_emb)
            except Exception:
                c_emb = []
        
        sim = cosine_similarity(query_vector, c_emb) if c_emb else 0.0
        scored_chunks.append({
            "id": c.id,
            "chunk_index": c.chunk_index,
            "page_number": c.page_number,
            "content": c.content,
            "score": round(sim, 4)
        })

    # Urutkan berdasarkan similarity tertinggi
    scored_chunks.sort(key=lambda x: x["score"], reverse=True)
    return scored_chunks[:top_k]
