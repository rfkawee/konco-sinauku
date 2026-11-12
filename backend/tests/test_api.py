import io
import pytest
from fastapi.testclient import TestClient
from reportlab.pdfgen import canvas
from app.main import app

client = TestClient(app)

def create_sample_pdf(num_pages: int = 3, content_per_page: str = "Ini adalah materi biologi sel.") -> io.BytesIO:
    """Helper membuat file PDF in-memory untuk pengujian."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    for i in range(1, num_pages + 1):
        c.drawString(100, 750, f"Bab {i}: Struktur Sel dan Organel")
        c.drawString(100, 720, f"Halaman {i}. {content_per_page}")
        c.drawString(100, 700, "Mitokondria berfungsi sebagai pusat respirasi seluler penghasil energi ATP.")
        c.drawString(100, 680, "Membran sel memiliki sifat semipermeabel yang mengatur transport zat.")
        c.showPage()
    c.save()
    buf.seek(0)
    return buf

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "Konco-Sinauku"

def test_document_upload_and_flow():
    # 1. Test Upload PDF
    pdf_buf = create_sample_pdf(num_pages=3)
    response = client.post(
        "/api/documents/upload",
        files={"file": ("biologi_sel.pdf", pdf_buf, "application/pdf")}
    )
    assert response.status_code == 200
    doc_data = response.json()
    assert doc_data["filename"] == "biologi_sel.pdf"
    assert doc_data["page_count"] == 3
    doc_id = doc_data["id"]

    # 2. Test List Documents
    list_res = client.get("/api/documents")
    assert list_res.status_code == 200
    docs = list_res.json()["documents"]
    assert any(d["id"] == doc_id for d in docs)

    # 3. Test Get PDF File Stream (untuk Viewer Kiri)
    file_res = client.get(f"/api/documents/{doc_id}/file")
    assert file_res.status_code == 200
    assert file_res.headers["content-type"] == "application/pdf"

    # 4. Test Chat RAG Streaming
    chat_res = client.post(
        "/api/chat",
        json={"document_id": doc_id, "question": "Apa fungsi mitokondria?"}
    )
    assert chat_res.status_code == 200
    assert "text/event-stream" in chat_res.headers["content-type"]
    assert "data: " in chat_res.text
    assert "citations" in chat_res.text

    # 5. Test Summary Module
    summ_res = client.post(
        "/api/summary",
        json={"document_id": doc_id}
    )
    assert summ_res.status_code == 200
    s_data = summ_res.json()
    assert "executive_summary" in s_data
    assert len(s_data["key_points"]) > 0

    # 6. Test Quiz Generation
    quiz_res = client.post(
        "/api/quiz/generate",
        json={"document_id": doc_id, "topic": "Struktur Sel", "num_questions": 3}
    )
    assert quiz_res.status_code == 200
    q_data = quiz_res.json()
    assert len(q_data["questions"]) == 3
    assert q_data["questions"][0]["options"][0].startswith("A. ")

    # 7. Test Quiz Submission
    q1 = q_data["questions"][0]
    submit_res = client.post(
        "/api/quiz/submit",
        json={
            "document_id": doc_id,
            "topic": "Struktur Sel",
            "answers": [{"question_id": q1["id"], "user_answer": q1["correct_answer"]}],
            "questions": q_data["questions"]
        }
    )
    assert submit_res.status_code == 200
    sub_data = submit_res.json()
    assert sub_data["total_questions"] == 3
    assert sub_data["correct_count"] >= 1
    assert "details" in sub_data
    assert sub_data["details"][0]["relevant_page"] >= 1

    # 8. Test Delete Document
    del_res = client.delete(f"/api/documents/{doc_id}")
    assert del_res.status_code == 200

def test_file_validation_rejections():
    # Test reject non-pdf file
    fake_txt = io.BytesIO(b"Ini file teks biasa")
    res_txt = client.post(
        "/api/documents/upload",
        files={"file": ("catatan.txt", fake_txt, "text/plain")}
    )
    assert res_txt.status_code == 400

    # Test reject PDF > 50 halaman
    big_pdf = create_sample_pdf(num_pages=52)
    res_big = client.post(
        "/api/documents/upload",
        files={"file": ("buku_tebal.pdf", big_pdf, "application/pdf")}
    )
    assert res_big.status_code == 400
    assert "melebihi batas maksimum" in res_big.json()["detail"]
