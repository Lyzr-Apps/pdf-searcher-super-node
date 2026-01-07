'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Menu,
  X,
  Upload,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  FileText,
  Search,
  RefreshCw,
  Plus,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { callAIAgent } from '@/utils/aiAgent'

// Constants
const AGENT_ID = '695e3a21e02ec0b2d8e567cf'
const KB_ID = '695e3a1a1fd00875a2eb6b8b'
const KB_NAME = 'documentkbhrqa'

// Type definitions
interface Document {
  id: string
  name: string
  pages: number
  uploadedAt: string
}

interface Source {
  document: string
  page: number
  excerpt: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'agent'
  content: string
  timestamp: string
  sources?: Source[]
  confidence?: number
}

interface UploadingFile {
  id: string
  name: string
  progress: number
}

// Sample data for demo
const SAMPLE_DOCUMENTS: Document[] = [
  { id: '1', name: 'Company Handbook.pdf', pages: 42, uploadedAt: '2025-01-15T10:30:00Z' },
  { id: '2', name: 'Product Roadmap.pdf', pages: 18, uploadedAt: '2025-01-14T14:22:00Z' },
  { id: '3', name: 'API Documentation.pdf', pages: 156, uploadedAt: '2025-01-13T09:15:00Z' },
]

const SAMPLE_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    type: 'user',
    content: 'What are the key features of the product roadmap?',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    type: 'agent',
    content:
      'Based on the Product Roadmap document, the key features planned include: enhanced analytics dashboard, improved user authentication, mobile app expansion, and API v2 implementation. The roadmap is structured in three quarters with specific milestones for each feature.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    sources: [
      {
        document: 'Product Roadmap.pdf',
        page: 5,
        excerpt: 'Q1 2025 will focus on analytics dashboard enhancement and user authentication improvements...',
      },
      {
        document: 'Product Roadmap.pdf',
        page: 12,
        excerpt: 'Mobile app expansion is targeted for Q2 2025 with iOS and Android releases...',
      },
    ],
    confidence: 92,
  },
  {
    id: '3',
    type: 'user',
    content: 'What should I know about our company culture?',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: '4',
    type: 'agent',
    content:
      "According to the Company Handbook, our culture is built on three pillars: collaboration, innovation, and integrity. We emphasize cross-functional teamwork, encourage experimentation and learning from failures, and maintain transparent communication at all levels. Remote-first policies and flexible working hours are core to supporting work-life balance.",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    sources: [
      {
        document: 'Company Handbook.pdf',
        page: 3,
        excerpt: 'Our core values are collaboration, innovation, and integrity that guide every decision...',
      },
      {
        document: 'Company Handbook.pdf',
        page: 8,
        excerpt: 'We support flexible working arrangements to maintain work-life balance and productivity...',
      },
    ],
    confidence: 88,
  },
]

// ============================================================================
// COMPONENT: Sidebar
// ============================================================================
function Sidebar({ documents, isOpen, onClose, onNewConversation, onDeleteDocument }: any) {
  const [showUploadModal, setShowUploadModal] = useState(false)

  const handleNewConversation = () => {
    onNewConversation()
    onClose()
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 h-screen w-[280px] bg-[#0A0F1C] border-r border-slate-700/50 flex flex-col transition-transform duration-300 z-40',
          'md:static md:translate-x-0 md:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between md:block">
            <div>
              <h1 className="text-xl font-bold text-white">Knowledge Hub</h1>
              <p className="text-xs text-slate-400 mt-1">Document Search</p>
            </div>
            <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-b border-slate-700/50 space-y-2">
          <Button
            onClick={() => setShowUploadModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Upload size={16} className="mr-2" />
            Upload Documents
          </Button>
          <Button
            onClick={handleNewConversation}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            size="sm"
          >
            <Plus size={16} className="mr-2" />
            New Conversation
          </Button>
        </div>

        {/* Documents Section */}
        <div className="flex-1 overflow-hidden flex flex-col p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Documents ({documents.length})
          </h3>
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {documents.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No documents uploaded yet</p>
              ) : (
                documents.map((doc: Document) => (
                  <div key={doc.id} className="group p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                        <p className="text-xs text-slate-400">{doc.pages} pages</p>
                      </div>
                      <button
                        onClick={() => onDeleteDocument(doc.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* KB Status */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Knowledge Base</span>
              <Badge variant="outline" className="text-xs">
                Active
              </Badge>
            </div>
            <p className="text-xs text-slate-300">
              <strong>{documents.length}</strong> documents indexed
            </p>
            <p className="text-xs text-slate-400">
              {documents.length > 0 ? 'Last updated: Today' : 'No documents'}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />
    </>
  )
}

// ============================================================================
// COMPONENT: Upload Modal
// ============================================================================
function UploadModal({ isOpen, onClose }: any) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current?.classList.add('bg-blue-900/20', 'border-blue-500')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current?.classList.remove('bg-blue-900/20', 'border-blue-500')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current?.classList.remove('bg-blue-900/20', 'border-blue-500')

    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files))
    }
  }

  const processFiles = (files: File[]) => {
    const pdfFiles = files.filter((f) => f.type === 'application/pdf')
    const newFiles: UploadingFile[] = pdfFiles.map((f) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: f.name,
      progress: 0,
    }))

    setUploadingFiles((prev) => [...prev, ...newFiles])

    // Simulate upload progress
    newFiles.forEach((file) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
        }
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, progress: Math.min(progress, 100) } : f))
        )
      }, 300)
    })
  }

  const handleProcess = () => {
    setShowSuccess(true)
    setTimeout(() => {
      setUploadingFiles([])
      setShowSuccess(false)
      onClose()
    }, 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0A0F1C] border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Upload Documents</DialogTitle>
          <DialogDescription className="text-slate-400">
            Add PDF files to your knowledge base for searching
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag Drop Zone */}
          <div
            ref={dragRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-900/10 transition-colors"
          >
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">Drag and drop PDF files</p>
            <p className="text-xs text-slate-400 mt-1">or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* File List */}
          {uploadingFiles.length > 0 && (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {uploadingFiles.map((file) => (
                <div key={file.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300 truncate">{file.name}</p>
                    <span className="text-xs text-slate-400">{Math.round(file.progress)}%</span>
                  </div>
                  <Progress value={file.progress} className="h-1 bg-slate-700" />
                </div>
              ))}
            </div>
          )}

          {showSuccess && (
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-300">Documents processed successfully!</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleProcess}
            disabled={uploadingFiles.length === 0 || uploadingFiles.some((f) => f.progress < 100)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Process Documents
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// COMPONENT: Confidence Bar
// ============================================================================
function ConfidenceBar({ score }: { score: number }) {
  const color = score >= 85 ? 'bg-green-500' : score >= 70 ? 'bg-yellow-500' : 'bg-orange-500'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">Confidence</span>
        <span className="text-xs font-semibold text-slate-300">{score}%</span>
      </div>
      <Progress value={score} className="h-1.5 bg-slate-700" />
    </div>
  )
}

// ============================================================================
// COMPONENT: Source Card
// ============================================================================
function SourceCard({ source }: { source: Source }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3 text-sm space-y-2 border border-slate-700/50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-300 truncate">{source.document}</p>
          <p className="text-xs text-slate-400">Page {source.page}</p>
        </div>
        <Badge variant="secondary" className="text-xs flex-shrink-0">
          Page {source.page}
        </Badge>
      </div>
      <p className="text-slate-400 text-xs leading-relaxed italic">{source.excerpt}</p>
    </div>
  )
}

// ============================================================================
// COMPONENT: Answer Card
// ============================================================================
function AnswerCard({ message }: { message: ChatMessage }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <p className="text-slate-100 leading-relaxed">{message.content}</p>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="space-y-2">
            <Collapsible value={expanded ? 'open' : 'closed'} onValueChange={setExpanded}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  <span>Sources ({message.sources.length})</span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-3 pt-3 border-t border-slate-700/50">
                {message.sources.map((source, idx) => (
                  <SourceCard key={idx} source={source} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        <div className="space-y-2">
          {message.confidence !== undefined && <ConfidenceBar score={message.confidence} />}

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
            >
              <Copy size={14} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// COMPONENT: Chat Message Bubble
// ============================================================================
function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.type === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-blue-600/90 rounded-lg rounded-tr-none px-4 py-3 max-w-xs lg:max-w-md text-white">
          <p className="text-sm">{message.content}</p>
          <p className="text-xs text-blue-200 mt-1 opacity-70">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
          <Search className="h-4 w-4 text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-blue-400 mb-1">Knowledge Agent</p>
          <AnswerCard message={message} />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENT: Main Page
// ============================================================================
export default function Home() {
  const [documents, setDocuments] = useState<Document[]>(SAMPLE_DOCUMENTS)
  const [messages, setMessages] = useState<ChatMessage[]>(SAMPLE_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef<string>('')

  // Initialize session ID on mount
  useEffect(() => {
    sessionIdRef.current = `session-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSearch = async (query: string) => {
    if (!query.trim() || loading) return

    // Add user message
    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Call the Knowledge Search Agent
      const result = await callAIAgent(query, AGENT_ID, {
        session_id: sessionIdRef.current,
      })

      if (result.success && result.response) {
        // Parse the response - full structure: { status, result: { answer_text, sources, confidence_score }, metadata }
        const apiResponse = result.response
        let answerText = ''
        let sources: Source[] = []
        let confidence = 75

        // Extract from result object
        if (apiResponse.result) {
          answerText = apiResponse.result.answer_text || ''
          sources = Array.isArray(apiResponse.result.sources) ? apiResponse.result.sources : []
          confidence = apiResponse.result.confidence_score !== undefined ? Math.round(apiResponse.result.confidence_score * 100) : 75
        } else if (typeof apiResponse === 'string') {
          answerText = apiResponse
        } else {
          answerText = JSON.stringify(apiResponse)
        }

        // Add agent message
        const agentMessage: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'agent',
          content: answerText,
          timestamp: new Date().toISOString(),
          sources: sources.length > 0 ? sources : undefined,
          confidence: confidence,
        }

        setMessages((prev) => [...prev, agentMessage])
      } else {
        // Add error message
        const errorMessage: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'agent',
          content: `Error: ${result.error || 'Failed to process your question. Please try again.'}`,
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Search error:', error)
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'agent',
        content: 'An unexpected error occurred. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleNewConversation = () => {
    setMessages([])
    setInput('')
    sessionIdRef.current = `session-${Math.random().toString(36).substr(2, 9)}`
  }

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault()
      handleSearch(input)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="h-screen bg-[#0A0F1C] flex">
      {/* Sidebar */}
      <Sidebar
        documents={documents}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewConversation={handleNewConversation}
        onDeleteDocument={handleDeleteDocument}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-700/50 bg-[#0A0F1C] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-white">Knowledge Search</h2>
              <p className="text-xs text-slate-400">Ask questions about your documents</p>
            </div>
          </div>
          <Badge variant="secondary" className="hidden md:inline-flex">
            {KB_NAME}
          </Badge>
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1">
          <div ref={scrollRef} className="p-4 md:p-6 max-w-4xl mx-auto w-full">
            {isEmpty ? (
              // Empty State
              <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-blue-600/10 rounded-full p-6 mb-4">
                  <Search className="h-12 w-12 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to Knowledge Search</h2>
                <p className="text-slate-400 max-w-sm mb-8">
                  Upload your documents to the sidebar and ask questions about them. I'll search through your knowledge
                  base and provide answers with sources.
                </p>
                <div className="space-y-2 text-sm text-slate-400">
                  <p className="font-medium text-white">Getting started:</p>
                  <ul className="space-y-1">
                    <li>1. Click "Upload Documents" to add PDF files</li>
                    <li>2. Ask any question about your documents</li>
                    <li>3. Get answers with source references</li>
                  </ul>
                </div>
              </div>
            ) : (
              // Messages
              <div>
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
                {loading && (
                  <div className="flex gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-blue-400 mb-2">Knowledge Agent</p>
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                          <p className="text-sm text-slate-400">Searching documents...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Search Input */}
        <div className="border-t border-slate-700/50 bg-[#0A0F1C] p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your documents..."
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button
                onClick={() => handleSearch(input)}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3"
                size="sm"
              >
                <Send size={16} />
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Press Enter to search or click the send button
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
