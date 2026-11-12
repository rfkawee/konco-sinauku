import type { DocumentItem, SummaryData, QuizGenerateResponse, QuizQuestion, QuizSubmitResponse } from '../types';

const API_BASE = '/api';

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) {
    throw new Error(`Gagal memuat dokumen: ${res.statusText}`);
  }
  const data = await res.json();
  return data.documents || [];
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Upload gagal: HTTP ${res.status}`);
  }

  return await res.json();
}

export async function deleteDocument(documentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${documentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Gagal menghapus dokumen.');
  }
}

export function getDocumentPdfUrl(documentId: string): string {
  return `${API_BASE}/documents/${documentId}/file`;
}

export async function sendChatStreaming(
  documentId: string,
  question: string,
  onToken: (token: string) => void,
  onDone: (citations: number[]) => void,
  onError: (errorMsg: string) => void
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_id: documentId,
        question: question,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      onError(err.detail || `Server error: HTTP ${res.status}`);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onError('Respons stream tidak dapat dibaca.');
      return;
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let citations: number[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.substring(6));
            if (json.token) {
              onToken(json.token);
            }
            if (json.done && json.citations) {
              citations = json.citations;
            }
          } catch (e) {
            console.error('SSE JSON parse error', e);
          }
        }
      }
    }

    onDone(citations);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Koneksi ke backend terputus.';
    onError(message);
  }
}

export async function fetchSummary(documentId: string, topic?: string): Promise<SummaryData> {
  const res = await fetch(`${API_BASE}/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId, topic }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal memuat ringkasan.');
  }
  return await res.json();
}

export async function fetchQuiz(documentId: string, topic: string, numQuestions: number): Promise<QuizGenerateResponse> {
  const res = await fetch(`${API_BASE}/quiz/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: documentId,
      topic: topic,
      num_questions: numQuestions,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal membuat kuis.');
  }
  return await res.json();
}

export async function submitQuizAnswers(
  documentId: string,
  topic: string,
  answers: { question_id: number; user_answer: string | null }[],
  questions: QuizQuestion[]
): Promise<QuizSubmitResponse> {
  const res = await fetch(`${API_BASE}/quiz/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: documentId,
      topic: topic,
      answers: answers,
      questions: questions,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal mengirim jawaban kuis.');
  }
  return await res.json();
}
