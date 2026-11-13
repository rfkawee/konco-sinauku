import React, { useState, useEffect } from 'react';
import { MessageSquare, FileText, Award, PanelLeftClose, PanelLeftOpen, Loader2 } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { DocumentSidebar } from './components/DocumentSidebar';
import { PDFViewerPanel } from './components/PDFViewerPanel';
import { ChatModule } from './components/ChatModule';
import { SummaryModule } from './components/SummaryModule';
import { QuizModule } from './components/QuizModule';
import type { DocumentItem } from './types';
import { fetchDocuments, uploadDocument } from './lib/api';
import { supabase, isSupabaseConfigured } from './lib/supabase';

export const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'workspace'>('landing');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'chat' | 'summary' | 'quiz'>('chat');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  
  // Ambil email dari localStorage agar sesi tidak hilang saat refresh
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('konco_user_email') || null;
  });

  // State untuk menyimpan file sementara saat user mengunggah sebelum login
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isAutoUploading, setIsAutoUploading] = useState(false);
  const [autoUploadFileName, setAutoUploadFileName] = useState<string>('');

  const loadDocuments = async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
      if (docs.length > 0 && !activeDoc) {
        setActiveDoc(docs[0]);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  useEffect(() => {
    // 1. Pulihkan sesi aktif dari Supabase (khususnya setelah redirect login Google OAuth atau reload)
    const initAuthSession = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error fetching Supabase session:', error);
          }
          if (session?.user?.email) {
            const email = session.user.email;
            setUserEmail(email);
            localStorage.setItem('konco_user_email', email);
          }
        } catch (err) {
          console.error('Failed to init auth session:', err);
        }
      }
    };

    initAuthSession();

    // 2. Pasang realtime auth listener dari Supabase
    // Ini otomatis menangkap token saat Google OAuth jump-back ke aplikasi!
    let authSub: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user?.email) {
          const email = session.user.email;
          setUserEmail(email);
          localStorage.setItem('konco_user_email', email);
        } else if (event === 'SIGNED_OUT') {
          setUserEmail(null);
          localStorage.removeItem('konco_user_email');
        }
      });
      authSub = data.subscription;
    }

    loadDocuments();

    return () => {
      if (authSub) {
        authSub.unsubscribe();
      }
    };
  }, []);

  const handleSelectDoc = (doc: DocumentItem) => {
    setActiveDoc(doc);
    setCurrentPage(1);
  };

  const handleOpenAuth = (noticeMsg?: string) => {
    setAuthNotice(noticeMsg || null);
    setIsAuthOpen(true);
  };

  // Handler logout terpusat
  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out from Supabase:', err);
      }
    }
    localStorage.removeItem('konco_user_email');
    setUserEmail(null);
    setView('landing');
  };

  // Handler saat user belum login men-drop atau memilih file di landing page
  const handleFileSelectedPreAuth = (file: File) => {
    setPendingFile(file);
    setAutoUploadFileName(file.name);
    setAuthNotice(`File "${file.name}" siap diproses. Silakan masuk terlebih dahulu untuk langsung membuka materi di ruang belajar.`);
    setIsAuthOpen(true);
  };

  // Handler saat user berhasil login
  const handleAuthSuccess = async (email: string) => {
    setUserEmail(email);
    localStorage.setItem('konco_user_email', email);
    setIsAuthOpen(false);
    setAuthNotice(null);

    // Jika sebelumnya user sudah memilih/menyeret file PDF, langsung unggah secara otomatis
    if (pendingFile) {
      const fileToUpload = pendingFile;
      setPendingFile(null);
      setIsAutoUploading(true);

      try {
        const newDoc = await uploadDocument(fileToUpload);
        setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
        setActiveDoc(newDoc);
        setCurrentPage(1);
        setView('workspace');
      } catch (err: unknown) {
        console.error('Auto upload error:', err);
        const msg = err instanceof Error ? err.message : 'Gagal mengunggah file PDF setelah login.';
        alert(msg);
      } finally {
        setIsAutoUploading(false);
        setAutoUploadFileName('');
      }
    }
  };

  const handleUploadSuccess = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
    setActiveDoc(newDoc);
    setCurrentPage(1);
    setView('workspace');
  };

  const handleOpenWorkspace = (doc?: DocumentItem) => {
    if (doc) {
      setActiveDoc(doc);
      setCurrentPage(1);
    } else if (documents.length > 0 && !activeDoc) {
      setActiveDoc(documents[0]);
    }
    setView('workspace');
  };

  // Handler auto-jump ke halaman PDF saat user klik sitasi [Halaman X] di panel kanan
  const handleJumpToPage = (pageNum: number) => {
    setCurrentPage(pageNum);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {view === 'landing' ? (
        <div className="flex-1 overflow-y-auto">
          <LandingPage
            userEmail={userEmail}
            documents={documents}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
            onUploadSuccess={handleUploadSuccess}
            onOpenWorkspace={handleOpenWorkspace}
            onFileSelectedPreAuth={handleFileSelectedPreAuth}
            isAutoUploading={isAutoUploading}
          />
        </div>
      ) : (
        <>
          {/* Navbar Workspace (Tombol Login ditiadakan sesuai spesifikasi; ada tombol navigasi kembali ke Landing) */}
          <Navbar
            activeDoc={activeDoc}
            userEmail={userEmail}
            onLogout={handleLogout}
            onBackToLanding={() => setView('landing')}
          />

          {/* Main Workspace Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Perpustakaan Materi */}
            {isSidebarOpen && (
              <DocumentSidebar
                documents={documents}
                activeDoc={activeDoc}
                onSelectDoc={handleSelectDoc}
                onRefreshDocs={loadDocuments}
              />
            )}

            {/* Konten Utama: Split-Screen Dual View */}
            <main className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* Bar Kontrol Sub-Header */}
              <div className="h-10 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between text-xs shrink-0">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                  title={isSidebarOpen ? 'Sembunyikan Sidebar' : 'Tampilkan Sidebar'}
                >
                  {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                  <span>{isSidebarOpen ? 'Tutup Sidebar' : 'Buka Sidebar'}</span>
                </button>

                {/* Tab Selector untuk Panel Kanan */}
                <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold text-xs transition cursor-pointer ${
                      activeTab === 'chat'
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Tanya Jawab</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold text-xs transition cursor-pointer ${
                      activeTab === 'summary'
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ringkasan</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('quiz')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold text-xs transition cursor-pointer ${
                      activeTab === 'quiz'
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Kuis Evaluasi</span>
                  </button>
                </div>
              </div>

              {/* Area Kerja Split View 50:50 */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Panel Kiri: In-App PDF Viewer (50%) */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-200 overflow-hidden">
                  <PDFViewerPanel
                    document={activeDoc}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </div>

                {/* Panel Kanan: 3 Modul Belajar (50%) */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-hidden bg-white">
                  {activeTab === 'chat' && (
                    <ChatModule
                      document={activeDoc}
                      onJumpToPage={handleJumpToPage}
                    />
                  )}

                  {activeTab === 'summary' && (
                    <SummaryModule
                      document={activeDoc}
                    />
                  )}

                  {activeTab === 'quiz' && (
                    <QuizModule
                      document={activeDoc}
                      onJumpToPage={handleJumpToPage}
                    />
                  )}
                </div>
              </div>
            </main>
          </div>
        </>
      )}

      {/* Modal Autentikasi Terpusat */}
      <AuthModal
        isOpen={isAuthOpen}
        notice={authNotice}
        onClose={() => {
          setIsAuthOpen(false);
          setAuthNotice(null);
          setPendingFile(null);
          setAutoUploadFileName('');
        }}
        onSuccess={handleAuthSuccess}
      />

      {/* Overlay Status Upload Otomatis Pasca-Login */}
      {isAutoUploading && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-slate-800 flex flex-col items-center shadow-2xl border border-slate-100">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <h3 className="text-base font-bold text-slate-800">Menyiapkan Ruang Belajar...</h3>
            <p className="text-xs text-slate-500 mt-2 line-clamp-2">
              Materi <span className="font-semibold text-blue-600">{autoUploadFileName}</span> sedang diproses dan diindeks secara otomatis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
