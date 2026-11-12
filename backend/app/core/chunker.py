import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def split_text_into_chunks(
    text: str,
    chunk_size: int = 800,
    chunk_overlap: int = 150,
    separators: List[str] = None
) -> List[str]:
    """Memecah teks panjang menjadi potongan (chunks) dengan overlap secara rekursif."""
    if separators is None:
        separators = ["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " "]

    if len(text) <= chunk_size:
        return [text] if text.strip() else []

    # Cari separator terbaik
    chosen_sep = ""
    for sep in separators:
        if sep in text:
            chosen_sep = sep
            break

    if not chosen_sep:
        # Potong langsung berdasarkan ukuran jika tidak ada separator
        return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size - chunk_overlap)]

    splits = text.split(chosen_sep)
    chunks = []
    current_chunk = ""

    for s in splits:
        candidate = f"{current_chunk}{chosen_sep}{s}" if current_chunk else s
        if len(candidate) <= chunk_size:
            current_chunk = candidate
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            # Jaga overlap
            overlap_prefix = current_chunk[-chunk_overlap:] if len(current_chunk) > chunk_overlap else current_chunk
            current_chunk = f"{overlap_prefix}{chosen_sep}{s}".strip()

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks

def process_document_pages(
    pages_data: List[Dict[str, Any]],
    chunk_size: int = 800,
    chunk_overlap: int = 150
) -> List[Dict[str, Any]]:
    """
    Memproses setiap halaman dokumen menjadi chunk yang terasosiasi dengan nomor halaman asli.
    Returns:
        List[{"chunk_index": int, "page_number": int, "content": str}]
    """
    all_chunks = []
    chunk_counter = 0

    for page in pages_data:
        page_num = page["page_number"]
        page_text = page["text"]
        
        if not page_text:
            continue

        page_chunks = split_text_into_chunks(
            page_text,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

        for c in page_chunks:
            all_chunks.append({
                "chunk_index": chunk_counter,
                "page_number": page_num,
                "content": c
            })
            chunk_counter += 1

    logger.info(f"Berhasil menghasilkan {len(all_chunks)} chunks dari {len(pages_data)} halaman.")
    return all_chunks
