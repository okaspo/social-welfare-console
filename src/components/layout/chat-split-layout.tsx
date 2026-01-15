'use client';

import { ReactNode, createContext, useContext, useState, useCallback } from 'react';
import { X, MessageCircle, FileText, FolderOpen, Settings } from 'lucide-react';
import MinimalSidebar, { NavItem } from './minimal-sidebar';
import RegistryCanvas from '../canvas/registry-canvas';
import ArchiveCanvas from '../canvas/archive-canvas';

// ============================================================================
// Canvas Context - 右側パネルの状態管理
// ============================================================================

interface CanvasContent {
    id: string;
    title: string;
    type: 'form' | 'preview' | 'editor' | 'viewer' | 'registry' | 'archive';
    component: ReactNode;
}

interface CanvasContextType {
    isOpen: boolean;
    content: CanvasContent | null;
    openCanvas: (content: CanvasContent) => void;
    closeCanvas: () => void;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export function useCanvas() {
    const context = useContext(CanvasContext);
    if (!context) {
        throw new Error('useCanvas must be used within ChatSplitLayout');
    }
    return context;
}

// ============================================================================
// Split Layout Component
// ============================================================================

interface ChatSplitLayoutProps {
    children: ReactNode; // Chat component
    personaEmoji?: string;
    personaName?: string;
    userName?: string;
    corporationName?: string;
}

export default function ChatSplitLayout({
    children,
    personaEmoji = '💙',
    personaName = '葵',
    userName,
    corporationName
}: ChatSplitLayoutProps) {
    const [activeNav, setActiveNav] = useState<NavItem>('home');
    const [isCanvasOpen, setIsCanvasOpen] = useState(false);
    const [canvasContent, setCanvasContent] = useState<CanvasContent | null>(null);
    const [isMobileCanvasOpen, setIsMobileCanvasOpen] = useState(false);

    const openCanvas = useCallback((content: CanvasContent) => {
        setCanvasContent(content);
        setIsCanvasOpen(true);
        setIsMobileCanvasOpen(true);
    }, []);

    const closeCanvas = useCallback(() => {
        setIsCanvasOpen(false);
        setIsMobileCanvasOpen(false);
        setActiveNav('home');
    }, []);

    // Handle sidebar navigation
    const handleNavClick = useCallback((item: NavItem) => {
        setActiveNav(item);

        if (item === 'home') {
            closeCanvas();
        } else if (item === 'registry') {
            openCanvas({
                id: 'registry',
                title: '台帳',
                type: 'registry',
                component: (
                    <RegistryCanvas
                        items={[]}
                        onItemClick={(regItem) => {
                            // Handle registry item click - could open officer list, etc.
                            console.log('Registry item clicked:', regItem);
                        }}
                    />
                )
            });
        } else if (item === 'archive') {
            openCanvas({
                id: 'archive',
                title: '文書',
                type: 'archive',
                component: (
                    <ArchiveCanvas
                        documents={[]}
                        onDocumentClick={(doc) => {
                            console.log('Document clicked:', doc);
                        }}
                    />
                )
            });
        } else if (item === 'settings') {
            // Navigate to settings page
            window.location.href = '/swc/dashboard/settings';
        }
    }, [openCanvas, closeCanvas]);

    const contextValue: CanvasContextType = {
        isOpen: isCanvasOpen,
        content: canvasContent,
        openCanvas,
        closeCanvas
    };

    return (
        <CanvasContext.Provider value={contextValue}>
            <div className="h-screen w-full flex overflow-hidden bg-gray-50">
                {/* ===== Minimal Sidebar ===== */}
                <MinimalSidebar
                    activeItem={activeNav}
                    onNavClick={handleNavClick}
                    personaEmoji={personaEmoji}
                    personaName={personaName}
                    userName={userName}
                    corporationName={corporationName}
                />

                {/* ===== Left Pane: Chat Console ===== */}
                <div className={`
                    flex flex-col h-full transition-all duration-300 ease-in-out bg-white
                    ${isCanvasOpen
                        ? 'w-full lg:w-1/2 lg:border-r lg:border-gray-200'
                        : 'flex-1'}
                `}>
                    {/* Chat Header */}
                    <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-md">
                                {personaEmoji}
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-900">{personaName}</h1>
                                <p className="text-xs text-gray-500">オンライン • いつでもお手伝いします</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Mobile Canvas Toggle (if content exists) */}
                            {canvasContent && (
                                <button
                                    onClick={() => setIsMobileCanvasOpen(true)}
                                    className="lg:hidden p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                >
                                    <FileText className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Chat Content (children = AoiChat component) */}
                    <div className="flex-1 overflow-hidden">
                        {children}
                    </div>
                </div>

                {/* ===== Right Pane: Smart Canvas (Desktop) ===== */}
                {isCanvasOpen && (
                    <div className="hidden lg:flex flex-col h-full bg-white w-1/2 transition-all duration-300 ease-in-out">
                        {isCanvasOpen && canvasContent ? (
                            <>
                                {/* Canvas Header */}
                                <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-gray-600" />
                                        <h2 className="font-semibold text-gray-900">{canvasContent.title}</h2>
                                    </div>
                                    <button
                                        onClick={closeCanvas}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                {/* Canvas Content */}
                                <div className="flex-1 overflow-auto p-4">
                                    {canvasContent.component}
                                </div>
                            </>
                        ) : (
                            /* Empty State - Aoi Waiting Animation */
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <div className="relative">
                                    {/* Pulsing background */}
                                    <div className="absolute inset-0 w-32 h-32 bg-indigo-100 rounded-full animate-pulse opacity-50" />
                                    {/* Main avatar */}
                                    <div className="relative w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-6xl shadow-2xl">
                                        {personaEmoji}
                                    </div>
                                </div>
                                <h3 className="mt-8 text-xl font-bold text-gray-900">
                                    {personaName}と対話してください
                                </h3>
                                <p className="mt-2 text-gray-500 max-w-sm">
                                    議事録作成や役員名簿の編集など、タスクを依頼すると<br />
                                    ここに作業スペースが表示されます
                                </p>
                                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full">
                                        「議事録を作成して」
                                    </span>
                                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full">
                                        「役員名簿を見せて」
                                    </span>
                                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full">
                                        「理事会の招集通知」
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== Mobile Canvas Modal ===== */}
                {isMobileCanvasOpen && canvasContent && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={() => setIsMobileCanvasOpen(false)}
                        />
                        {/* Modal */}
                        <div className="absolute inset-x-0 bottom-0 top-16 bg-white rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-out">
                            {/* Header */}
                            <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-2xl">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-gray-600" />
                                    <h2 className="font-semibold text-gray-900">{canvasContent.title}</h2>
                                </div>
                                <button
                                    onClick={() => setIsMobileCanvasOpen(false)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    チャットに戻る
                                </button>
                            </div>
                            {/* Content */}
                            <div className="flex-1 overflow-auto p-4">
                                {canvasContent.component}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </CanvasContext.Provider>
    );
}
