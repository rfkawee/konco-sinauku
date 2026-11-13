import React, { useState, useEffect } from 'react';
import { MessageSquare, FileText, Award, PanelLeftClose, PanelLeftOpen, Loader2 } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { LogoutModal } from './components/LogoutModal';
import { DashboardModal } from './components/DashboardModal';
import { SettingsModal } from './components/SettingsModal';
import { DocumentSidebar } from './components/DocumentSidebar';
import { PDFViewerPanel } from './components/PDFViewerPanel';
import { ChatModule } from './components/ChatModule';
import { SummaryModule } from './components/SummaryModule';
import { QuizModule } from './components/QuizModule';
import type { DocumentItem } from './types';
import { fetchDocuments, uploadDocument } from './lib/api';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { getMemberId, setMemberId, clearMemberId, generateMemberId } from './lib/auth';

export const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'workspace'>('landing');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'chat' | 'summary' | 'quiz'>('chat');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('konco_user_email') || null;
  });
  const [memberId, setMemberIdState] = useState<string>(() => {
    return getMemberId();
  });

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isAutoUploading, setIsAutoUploading] = useState(false);
  const [autoUploadFileName, setAutoUploadFileName] = useState<string>('');

  const loadDocuments = async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
      if (docs.length > 0) {
        if (!activeDoc || !docs.some(d => d.id === activeDoc.id)) {
          setActiveDoc(docs[0]);
        }
      } else {
        setActiveDoc(null);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  useEffect(() => {
    const initAuthSession = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error fetching Supabase session:', error);
          }
          if (session?.user?.email) {
            const email = session.user.email;
            const newMemberId = generateMemberId(email, session.user.id);
            setUserEmail(email);
            setMemberId(newMemberId);
            setMemberIdState(newMemberId);
            localStorage.setItem('konco_user_email', email);
            loadDocuments();
          }
        } catch (err) {
          console.error('Failed to init auth session:', err);
        }
      }
    };

    initAuthSession();

    let authSub: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user?.email) {
          const email = session.user.email;
          const newMemberId = generateMemberId(email, session.user.id);
          setUserEmail(email);
          setMemberId(newMemberId);
          setMemberIdState(newMemberId);
          localStorage.setItem('konco_user_email', email);
          loadDocuments();
        } else if (event === 'SIGNED_OUT') {
          clearMemberId();
          setUserEmail(null);
          setMemberIdState(getMemberId());
          localStorage.removeItem('konco_user_email');
          setDocuments([]);
          setActiveDoc(null);
          setView('landing');
        }
      });
      authSub = data.subscription;
    }

    return () => {
      if (authSub) authSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [memberId]);

  const handleSelectDoc = (doc: DocumentItem) => {
    setActiveDoc(doc);
    setCurrentPage(1);
  };

  const handleJumpToPage = (pageNum: number) => {
    setCurrentPage(pageNum);
  };

  const handleOpenWorkspace = (doc?: DocumentItem) => {
    if (doc) {
      setActiveDoc(doc);
      setCurrentPage(1);
    }
    setView('workspace');
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    clearMemberId();
    setUserEmail(null);
    setMemberIdState(getMemberId());
    localStorage.removeItem('konco_user_email');
    setDocuments([]);
    setActiveDoc(null);
    setView('landing');
  };

  const handleFileSelectedPreAuth = (file: File) => {
    setPendingFile(file);
    setAutoUploadFileName(file.name);
    setAuthNotice(`Silakan masuk atau buat akun untuk menyimpan modul "${file.name}" ke ruang belajar Anda.`);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = async (email: string) => {
    setUserEmail(email);
    localStorage.setItem('konco_user_email', email);
    
    if (isSupabaseConfigured) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const newMemberId = generateMemberId(email, user.id);
        setMemberId(newMemberId);
        setMemberIdState(newMemberId);
      }
    } else {
      const newMemberId = generateMemberId(email);
      setMemberId(newMemberId);
      setMemberIdState(newMemberId);
    }

    setIsAuthOpen(false);
    setAuthNotice(null);

    if (pendingFile) {
      const fileToUpload = pendingFile;
      setPendingFile(null);
      setIsAutoUploading(true);

      try {
        const newDoc = await uploadDocument(fileToUpload);
        await loadDocuments();
        setActiveDoc(newDoc);
        setCurrentPage(1);
        setView('workspace');
      } catch (err) {
        console.error('Gagal mengunggah file pending setelah auth:', err);
        alert('Gagal mengunggah file PDF setelah login. Silakan coba unggah kembali.');
        loadDocuments();
      } finally {
        setIsAutoUploading(false);
        setAutoUploadFileName('');
      }
    } else {
      loadDocuments();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-hm-paper text-hm-ink overflow-hidden font-sans">
      {view === 'landing' ? (
        <LandingPage
          userEmail={userEmail}
          memberId={memberId}
          documents={documents}
          onOpenAuth={(noticeMsg) => {
            setAuthNotice(noticeMsg || null);
            setIsAuthOpen(true);
          }}
          onLogout={() => setIsLogoutModalOpen(true)}
          onUploadSuccess={(newDoc) => {
            loadDocuments();
            setActiveDoc(newDoc);
            setCurrentPage(1);
            setView('workspace');
          }}
          onOpenWorkspace={handleOpenWorkspace}
          onFileSelectedPreAuth={handleFileSelectedPreAuth}
          isAutoUploading={isAutoUploading}
          onOpenDashboard={() => setIsDashboardOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      ) : (
        <>
          {/* Navbar Workspace */}
          <Navbar
            activeDoc={activeDoc}
            userEmail={userEmail}
            memberId={memberId}
            documentsCount={documents.length}
            onLogout={() => setIsLogoutModalOpen(true)}
            onBackToLanding={() => setView('landing')}
            onOpenDashboard={() => setIsDashboardOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
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
            <main className="flex-1 flex flex-col overflow-hidden bg-hm-sheet">
              {/* Bar Kontrol Sub-Header */}
              <div className="h-10 bg-hm-paper-2 border-b border-hm-rule px-4 flex items-center justify-between text-xs shrink-0 select-none">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="flex items-center gap-1.5 text-hm-muted hover:text-hm-ink font-display font-medium cursor-pointer transition-colors"
                  title={isSidebarOpen ? 'Sembunyikan Sidebar' : 'Tampilkan Sidebar'}
                >
                  {isSidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
                  <span>{isSidebarOpen ? 'Tutup Sidebar' : 'Buka Sidebar'}</span>
                </button>

                {/* Tab Selector untuk Panel Kanan (Hallmark Keycaps) */}
                <div className="flex items-center gap-1 bg-hm-paper-3 p-0.5 rounded-xs border border-hm-rule">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xs font-display text-xs transition-colors cursor-pointer ${
                      activeTab === 'chat'
                        ? 'bg-hm-sheet text-hm-ink font-semibold shadow-subtle border border-hm-rule'
                        : 'text-hm-muted hover:text-hm-ink font-medium'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-hm-accent" />
                    <span>Tanya Jawab</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xs font-display text-xs transition-colors cursor-pointer ${
                      activeTab === 'summary'
                        ? 'bg-hm-sheet text-hm-ink font-semibold shadow-subtle border border-hm-rule'
                        : 'text-hm-muted hover:text-hm-ink font-medium'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-hm-accent" />
                    <span>Intisari</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('quiz')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xs font-display text-xs transition-colors cursor-pointer ${
                      activeTab === 'quiz'
                        ? 'bg-hm-sheet text-hm-ink font-semibold shadow-subtle border border-hm-rule'
                        : 'text-hm-muted hover:text-hm-ink font-medium'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-hm-accent" />
                    <span>Kuis Evaluasi</span>
                  </button>
                </div>
              </div>

              {/* Area Kerja Split View 50:50 */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Panel Kiri: In-App PDF Viewer (50%) */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-hm-rule overflow-hidden">
                  <PDFViewerPanel
                    document={activeDoc}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </div>

                {/* Panel Kanan: 3 Modul Belajar (50%) */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-hidden bg-hm-sheet">
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

      {/* Modal Konfirmasi Logout */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        userEmail={userEmail}
      />

      {/* Modal Dashboard Belajar */}
      <DashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        userEmail={userEmail}
        memberId={memberId}
        documents={documents}
        onSelectDocAndOpenWorkspace={(doc) => {
          setIsDashboardOpen(false);
          setActiveDoc(doc);
          setCurrentPage(1);
          setView('workspace');
        }}
      />

      {/* Modal Pengaturan (Settings) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userEmail={userEmail}
        memberId={memberId}
      />

      {/* Overlay Status Upload Otomatis Pasca-Login */}
      {isAutoUploading && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-hm-ink text-center">
          <div className="bg-hm-sheet rounded-sm p-8 max-w-sm w-full text-hm-ink flex flex-col items-center shadow-xl border border-hm-rule-2">
            <Loader2 className="w-10 h-10 text-hm-accent animate-spin mb-4" />
            <h3 className="text-base font-display font-bold text-hm-ink">Menyiapkan Ruang Belajar...</h3>
            <p className="text-xs text-hm-muted mt-2 font-sans line-clamp-2">
              Modul <span className="font-semibold text-hm-ink">{autoUploadFileName}</span> sedang diekstraksi dan diindeks secara otomatis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
