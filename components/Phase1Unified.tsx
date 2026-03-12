'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Loader2, ChevronDown, Camera, Crosshair, Grid3x3, MessageSquare, Target, X, ImageIcon, Download, LogOut, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUserMemory } from '@/hooks/useUserMemory'
import LoginModal from '@/components/Auth/LoginModal'

interface RenderNode {
  id: string
  type: 'massing' | 'render'
  imageUrl: string | null
  file?: File
  title: string
  status: 'uploaded' | 'generating' | 'complete' | 'error'
  timestamp: string
}

interface CameraPosition {
  id: string
  x: number
  y: number
  type: 'camera' | 'target'
}

const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9' },
  { id: '4:3', label: '4:3' },
  { id: '9:16', label: '9:16' },
]

const STYLE_PRESETS = [
  { id: 'modern', name: 'Modern Minimal' },
  { id: 'timber', name: 'Timber Warm' },
  { id: 'brutalist', name: 'Brutalist Concrete' },
  { id: 'glass', name: 'Glass & Steel' },
]

const STUDIO_AESTHETICS = {
  commercial: [
    { id: 'mir', name: 'MIR' },
    { id: 'luxigon', name: 'Luxigon' },
    { id: 'brick', name: 'Brick Visual' },
    { id: 'dbox', name: 'DBox' },
    { id: 'plomp', name: 'Plomp' },
    { id: 'top-tier', name: 'Top-Tier' },
  ],
  atmospheric: [
    { id: 'atelier', name: 'Atelier' },
    { id: 'nightnord', name: 'NightNord' },
    { id: 'snohetta', name: 'Snohetta' },
  ],
  bold: [
    { id: 'big', name: 'BIG-style' },
    { id: 'zaha', name: 'Zaha Hadid' },
  ]
}

export default function Phase1Unified() {
  const [nodes, setNodes] = useState<RenderNode[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { user, logout } = useAuth()
  const { profile, logGeneration } = useUserMemory()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const [activeTool, setActiveTool] = useState<'massing' | 'styleSwap' | 'perspective' | null>(null)

  const [cameraPositions, setCameraPositions] = useState<CameraPosition[]>([])
  const [placementMode, setPlacementMode] = useState<'camera' | 'target'>('camera')
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [styleReferenceImage, setStyleReferenceImage] = useState<string | null>(null)
  const [customStylePrompt, setCustomStylePrompt] = useState('')

  const [step2Enabled, setStep2Enabled] = useState({
    context: false,
    aesthetic: false,
    detail: false,
  })
  const [timelineExpanded, setTimelineExpanded] = useState(true)
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)

  const [contextSettings, setContextSettings] = useState({
    timeOfDay: 'Golden Hour',
    surroundings: 'Urban',
    customCountry: '',
    customStreet: '',
    customContext: ''
  })
  const [selectedAesthetic, setSelectedAesthetic] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')

  const [resolution, setResolution] = useState('2k')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [aiEngine, setAiEngine] = useState('nano-banana-2')

  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  const isStyleSwapActive = activeTool === 'styleSwap'
  const isPerspectiveActive = activeTool === 'perspective'
  const disableStep2 = activeTool !== 'massing'
  const canGenerate = selectedNode?.type === 'massing' && activeTool !== null

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
    })
  }

  const downloadImage = (imageUrl: string | null, filename: string) => {
    if (!imageUrl) return
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const cleanFilename = filename.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `${cleanFilename}_${timestamp}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const imageUrl = URL.createObjectURL(file)
      const newNode: RenderNode = {
        id: Date.now().toString(),
        type: 'massing',
        imageUrl: imageUrl,
        file: file,
        title: `Massing - ${file.name}`,
        status: 'uploaded',
        timestamp: new Date().toISOString(),
      }
      setNodes(prev => [...prev, newNode])
      setSelectedNodeId(newNode.id)
      setCameraPositions([])
      setIsUploading(false)
    } catch (err) {
      setError('Failed to upload image')
      setIsUploading(false)
    }
  }, [])

  const handleStyleReferenceUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const imageUrl = URL.createObjectURL(file)
    setStyleReferenceImage(imageUrl)
    setSelectedStyle('custom')
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent, itemId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggedItem(itemId)
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const item = cameraPositions.find(p => p.id === itemId)
      if (item) {
        const itemX = (item.x / 100) * rect.width
        const itemY = (item.y / 100) * rect.height
        setDragOffset({
          x: e.clientX - itemX,
          y: e.clientY - itemY
        })
      }
    }
  }, [cameraPositions])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedItem || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((e.clientX - dragOffset.x) / rect.width) * 100
    const y = ((e.clientY - dragOffset.y) / rect.height) * 100
    const clampedX = Math.max(0, Math.min(100, x))
    const clampedY = Math.max(0, Math.min(100, y))
    setCameraPositions(prev => prev.map(p => p.id === draggedItem ? { ...p, x: clampedX, y: clampedY } : p))
  }, [draggedItem, dragOffset])

  const handleMouseUp = useCallback(() => {
    setDraggedItem(null)
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (draggedItem || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    const clickedItem = cameraPositions.find(p => {
      const px = (p.x / 100) * rect.width
      const py = (p.y / 100) * rect.height
      const dist = Math.sqrt(Math.pow(px - clickX, 2) + Math.pow(py - clickY, 2))
      return dist < 30
    })
    if (!clickedItem) {
      const x = (clickX / rect.width) * 100
      const y = (clickY / rect.height) * 100
      const newItem: CameraPosition = {
        id: `pos-${Date.now()}`,
        x,
        y,
        type: placementMode
      }
      setCameraPositions(prev => [...prev.filter(p => p.type !== placementMode), newItem])
    }
  }, [draggedItem, placementMode, cameraPositions])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') setPlacementMode('camera')
      if (e.key === 't' || e.key === 'T') setPlacementMode('target')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleStep1 = (key: 'massing' | 'styleSwap' | 'perspective') => {
    if (activeTool === key) {
      setActiveTool(null) // Deselect if clicking the already active tool
      return
    }

    setActiveTool(key)
    if (key === 'massing') {
      setSelectedStyle(null)
      setStyleReferenceImage(null)
      setCameraPositions([])
    } else if (key === 'styleSwap') {
      setCameraPositions([])
    } else if (key === 'perspective') {
      setSelectedStyle(null)
      setStyleReferenceImage(null)
    }
  }

  const cancelPerspective = () => {
    setCameraPositions([])
    setActiveTool('massing')
  }

  const toggleStep2 = (key: keyof typeof step2Enabled) => {
    if (disableStep2) return
    setStep2Enabled(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const clearPositions = () => setCameraPositions([])

  const buildPrompt = (): string => {
    const parts: string[] = []
    if (activeTool === 'styleSwap') {
      parts.push('Apply style transformation')
      if (selectedStyle && selectedStyle !== 'custom') {
        const styleName = STYLE_PRESETS.find(s => s.id === selectedStyle)?.name
        if (styleName) parts.push(`in ${styleName} style`)
      }
    } else {
      parts.push('Transform into photorealistic render')
    }
    if (activeTool === 'perspective' && cameraPositions.length >= 2) parts.push('with custom camera angle')
    if (activeTool === 'massing') {
      if (step2Enabled.context) {
        parts.push(`${contextSettings.timeOfDay} lighting`)
        parts.push(`${contextSettings.surroundings.toLowerCase()} surroundings`)
      }
      if (step2Enabled.aesthetic && selectedAesthetic) {
        const aestheticName = [...STUDIO_AESTHETICS.commercial, ...STUDIO_AESTHETICS.atmospheric, ...STUDIO_AESTHETICS.bold]
          .find(s => s.id === selectedAesthetic)?.name
        if (aestheticName) parts.push(`${aestheticName} aesthetic`)
      }
      if (step2Enabled.detail && customPrompt) parts.push(customPrompt)
    }
    return parts.join(', ') || 'High-end architectural visualization'
  }

  const generateRender = useCallback(async () => {
    if (!user) {
      setIsLoginModalOpen(true)
      return
    }

    if (profile && profile.generationCount >= 30) {
      setError('Generation limit reached (30/30). Please upgrade your account.')
      return
    }

    const selectedNode = nodes.find(n => n.id === selectedNodeId)
    if (!selectedNode || !selectedNode.file) {
      setError('Please upload a massing first')
      return
    }
    setIsGenerating(true)
    setError(null)
    const renderNode: RenderNode = {
      id: `render-${Date.now()}`,
      type: 'render',
      imageUrl: null,
      title: `Render - ${new Date().toLocaleTimeString()}`,
      status: 'generating',
      timestamp: new Date().toISOString(),
    }
    setNodes(prev => [...prev, renderNode])
    setSelectedNodeId(renderNode.id)
    try {
      const base64Image = await fileToBase64(selectedNode.file)
      let camera = {}
      if (cameraPositions.length >= 2) {
        const cam = cameraPositions.find(p => p.type === 'camera')
        const target = cameraPositions.find(p => p.type === 'target')
        if (cam && target) {
          camera = { cameraX: Math.round(cam.x), cameraY: Math.round(cam.y), targetX: Math.round(target.x), targetY: Math.round(target.y) }
        }
      }

      const n8nPayload = {
        taskType: activeTool === 'styleSwap' ? 'style' : (activeTool === 'perspective' && cameraPositions.length >= 2) ? 'angle' : 'sketch',
        userPrompt: buildPrompt(),
        size: resolution.toUpperCase(),
        settings: {
          camera,
          aesthetic: 'high-end editorial',
          aspectRatio,
          context: (activeTool === 'massing' && step2Enabled.context) ? {
            timeOfDay: contextSettings.timeOfDay,
            surroundings: contextSettings.surroundings
          } : null
        },
        baseImage: base64Image,
        styleImage: (activeTool === 'styleSwap' && styleReferenceImage) ? styleReferenceImage : undefined,
        engine: aiEngine === 'nano-banana-2' ? 'gemini-3.1-flash-image-preview' : 'gemini-3-pro-image-preview'
      }
      // Priority: 1. NEXT_PUBLIC_N8N_WEBHOOK_URL, 2. VITE_N8N_WEBHOOK_URL (for compatibility), 3. Hardcoded Fallback
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 
                         process.env.VITE_N8N_WEBHOOK_URL || 
                         'https://n8n.dashinglads.cloud/webhook/studio-nomad-render-v2';
      console.log('[DEBUG] Webhook URL source:', process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ? 'ENVVar' : 'Fallback');
      console.log('[DEBUG] Initiating render fetch to:', webhookUrl);
      console.log('[DEBUG] Payload keys:', Object.keys(n8nPayload));

      // Test connectivity before main call (Development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] Performing reachability test...');
        fetch(webhookUrl, { method: 'HEAD' })
          .then(res => console.log('[DEBUG] Reachability check status:', res.status))
          .catch(err => console.error('[DEBUG] Reachability check failed:', err.message));
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(n8nPayload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Render failed (${response.status}): ${errorText || 'Server error'}`);
      }

      const data = await response.json();
      let imageUrl = null;
      if (data.candidates && data.candidates[0]?.content?.parts) {
        const imagePart = data.candidates[0].content.parts.find((part: any) => part.inlineData || part.inline_data);
        if (imagePart) {
          const base64Data = imagePart.inlineData?.data || imagePart.inline_data?.data;
          const mimeType = imagePart.inlineData?.mimeType || imagePart.inline_data?.mime_type || 'image/png';
          if (base64Data) imageUrl = `data:${mimeType};base64,${base64Data}`;
        }
      }

      if (!imageUrl) {
        throw new Error('Render process completed but no image was returned. Please try again.');
      }

      setNodes(prev => prev.map(node => node.id === renderNode.id ? { ...node, imageUrl: imageUrl, status: imageUrl ? 'complete' : 'error' } : node))

      if (imageUrl) {
        await logGeneration(n8nPayload.userPrompt, n8nPayload.settings, imageUrl);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate render')
      setNodes(prev => prev.map(node => node.id === renderNode.id ? { ...node, status: 'error' } : node))
    } finally {
      setIsGenerating(false)
    }
  }, [nodes, selectedNodeId, cameraPositions, aspectRatio, resolution, aiEngine, activeTool, styleReferenceImage, step2Enabled, contextSettings, selectedAesthetic, customPrompt, user, profile, logGeneration])

  return (
    <div className="min-h-screen bg-surface p-6">
      {/* Floating Timeline Toggle Button - Left Side (Mobile Only) */}
      <button
        onClick={() => setIsTimelineOpen(!isTimelineOpen)}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-30 lg:hidden 
          bg-white shadow-lg rounded-full p-3 border border-border
          hover:shadow-xl hover:scale-105 active:scale-95
          transition-all duration-200 ease-out"
      >
        <Grid3x3 className="w-5 h-5 text-text-secondary" />
      </button>

      {/* Debug Webhook Test - Only visible in development or via specific state */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={async () => {
            const testUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.dashinglads.cloud/webhook/studio-nomad-render-v2';
            console.log('[DEBUG] Manual Webhook Test to:', testUrl);
            try {
              const res = await fetch(testUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test: true, timestamp: new Date().toISOString() })
              });
              alert(`Webhook Result: ${res.status} ${res.ok ? 'OK' : 'FAIL'}`);
            } catch (e) {
              alert(`Webhook Error: ${e instanceof Error ? e.message : String(e)}`);
            }
          }}
          className="bg-black/50 text-white text-[10px] px-2 py-1 rounded hover:bg-black/80 transition-opacity opacity-20 hover:opacity-100"
        >
          Test Webhook
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-semibold text-text mb-2">Studio Nomad</h1>
            <p className="text-text-secondary">Quick Touchup Dashboard v1.0</p>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3 bg-white border border-border rounded-full py-1.5 pl-4 pr-1.5 shadow-sm">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">{user.email?.split('@')[0]}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text">
                      {profile ? `${Math.max(0, 30 - profile.generationCount)} left` : 'Loading...'}
                    </span>
                    <span className="text-[10px] text-[#C4A46D] font-medium flex items-center">
                      <span className="material-symbols-outlined text-[14px] mr-0.5">diamond</span>
                      {profile?.credits || 100}
                    </span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface hover:bg-red-50 hover:text-red-500 transition-colors"
                  aria-label="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-text text-white rounded-full text-sm font-medium hover:bg-text/90 transition-all hover:shadow-md"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Timeline Panel - Left */}
          <div className={`
            lg:col-span-2 lg:block
            fixed lg:static left-0 top-0 h-full lg:h-auto z-50 lg:z-auto
            w-64 lg:w-auto bg-white lg:bg-transparent
            transform transition-transform duration-300 ease-in-out
            ${isTimelineOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="h-full lg:h-auto overflow-y-auto p-4 lg:p-0 space-y-4">
              <div className="lg:hidden flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-text">Timeline</h3>
                <button onClick={() => setIsTimelineOpen(false)} className="p-1 hover:bg-surface rounded">
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setTimelineExpanded(!timelineExpanded)}
                  className="w-full p-3 bg-surface border-b border-border flex items-center justify-between hover:bg-surface/80 transition-all duration-200 ease-out hover:shadow-sm active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="w-4 h-4 text-text-secondary" />
                    <h3 className="text-xs font-medium text-text uppercase tracking-wider">Timeline</h3>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform ${timelineExpanded ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {timelineExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto">
                        {nodes.length === 0 ? (
                          <p className="text-[10px] text-text-secondary text-center py-4">No renders yet</p>
                        ) : (
                          nodes.map((node) => (
                            <div key={node.id} className="relative">
                              <button
                                onClick={() => setSelectedNodeId(node.id)}
                                className={`w-full p-1.5 rounded-lg border-2 transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.02] active:scale-95 ${selectedNodeId === node.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                              >
                                <div className="w-full aspect-video bg-surface rounded overflow-hidden mb-1">
                                  {node.imageUrl ? <img src={node.imageUrl} alt={node.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-[8px] text-text-secondary">{node.type}</span></div>}
                                </div>
                                <p className="text-[9px] font-medium text-text truncate">{node.title.slice(0, 15)}</p>
                                <p className="text-[8px] text-text-secondary capitalize">{node.status}</p>
                              </button>
                              {node.type === 'render' && node.status === 'complete' && node.imageUrl && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); downloadImage(node.imageUrl, node.title); }}
                                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white shadow-sm transition-all duration-200 ease-out hover:scale-110 active:scale-95 z-10"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mobile backdrop overlay */}
          {isTimelineOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsTimelineOpen(false)}
            />
          )}

          {/* Canvas Panel - Center */}
          <div className="lg:sticky lg:top-6 lg:col-span-6 bg-white rounded-xl border border-border p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-medium text-text">Canvas</h2>
              <div className="flex items-center gap-3">
                <div className="text-[11px] text-text-secondary bg-surface px-2 py-1 rounded">
                  Aspect: <span className="font-medium text-text">{aspectRatio}</span>
                </div>
                <div className="text-[10px] text-text-secondary">Press C/T for modes</div>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center bg-surface/30 rounded-xl overflow-hidden min-h-[500px] relative">
              {selectedNode ? (
                <div className="relative w-full max-w-4xl">
                  <div
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="relative rounded-xl overflow-hidden shadow-xl cursor-crosshair select-none"
                    style={{ aspectRatio: aspectRatio.replace(':', '/') }}
                  >
                    {selectedNode.status === 'generating' ? (
                      <div className="w-full h-full flex items-center justify-center bg-surface/50">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="ml-3 text-text-secondary">Generating render...</p>
                      </div>
                    ) : (
                      <img
                        src={selectedNode.imageUrl || ''}
                        alt={selectedNode.title}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                      />
                    )}

                    {selectedNode.type === 'render' && selectedNode.status === 'complete' && selectedNode.imageUrl && (
                      <button
                        onClick={() => downloadImage(selectedNode.imageUrl, selectedNode.title)}
                        className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-white shadow-lg transition-all duration-200 ease-out hover:scale-[1.02] active:scale-95 z-20"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    )}

                    {cameraPositions.map((pos) => (
                      <div
                        key={pos.id}
                        onMouseDown={(e) => handleMouseDown(e, pos.id)}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move z-10"
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-2xl border-2 border-white transition-transform ${draggedItem === pos.id ? 'scale-110' : ''} ${pos.type === 'camera' ? 'bg-red-500' : 'bg-green-500'}`}>
                          {pos.type === 'camera' ?
                            <Camera className="w-5 h-5 text-white" />
                            :
                            <Crosshair className="w-5 h-5 text-white" />
                          }
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-0.5 bg-text text-white text-[10px] rounded whitespace-nowrap font-medium">
                          {pos.type === 'camera' ? 'Camera' : 'Target'} ({Math.round(pos.x)}, {Math.round(pos.y)})
                        </div>
                      </div>
                    ))}

                    {cameraPositions.length === 2 && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
                        <line
                          x1={`${cameraPositions[0].x}%`}
                          y1={`${cameraPositions[0].y}%`}
                          x2={`${cameraPositions[1].x}%`}
                          y2={`${cameraPositions[1].y}%`}
                          stroke="white"
                          strokeWidth="3"
                          strokeDasharray="8,4"
                          className="drop-shadow-md"
                        />
                      </svg>
                    )}
                  </div>

                  {activeTool === 'perspective' && (
                    <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-white/95 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-lg z-20">
                      <button
                        onClick={() => setPlacementMode('camera')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.02] active:scale-95 ${placementMode === 'camera'
                          ? 'bg-red-500 text-white ring-2 ring-red-300'
                          : 'bg-surface border-2 border-border text-text-secondary hover:border-red-300 hover:text-red-500'
                          }`}
                      >
                        <Camera className="w-4 h-4" />
                        <span>Camera</span>
                      </button>

                      <div className="w-px h-6 bg-border" />

                      <button
                        onClick={() => setPlacementMode('target')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.02] active:scale-95 ${placementMode === 'target'
                          ? 'bg-green-500 text-white ring-2 ring-green-300'
                          : 'bg-surface border-2 border-border text-text-secondary hover:border-green-300 hover:text-green-500'
                          }`}
                      >
                        <Crosshair className="w-4 h-4" />
                        <span>Target</span>
                      </button>

                      {cameraPositions.length > 0 && (
                        <>
                          <div className="w-px h-6 bg-border" />
                          <button
                            onClick={clearPositions}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text bg-surface hover:bg-surface-hover rounded-lg transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.02] active:scale-95"
                          >
                            <X className="w-3.5 h-3.5" />
                            Clear
                          </button>
                        </>
                      )}

                      <div className="w-px h-6 bg-border" />
                      <button
                        onClick={cancelPerspective}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-500 hover:text-white bg-red-50 hover:bg-red-500 rounded-lg transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.02] active:scale-95 border border-red-200 hover:border-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>
                  )}

                  <div className="h-12" />
                </div>
              ) : (
                <label className={`flex-1 flex flex-col items-center justify-center bg-surface/30 rounded-xl cursor-pointer hover:bg-surface/50 transition-all duration-200 ease-out ${isUploading ? 'opacity-50' : ''}`}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  {isUploading ? (
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-16 h-16 text-text-secondary mb-4" />
                      <p className="text-lg text-text-secondary mb-2">Drop or click to upload</p>
                      <p className="text-sm text-text-secondary/60">PNG, JPG up to 10MB</p>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Controls Panel - Right */}
          <div className="lg:col-span-4 space-y-4">

            {/* STEP 1 */}
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="p-4 bg-surface border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</div>
                  <h2 className="font-heading font-semibold text-text">Generate</h2>
                  <span className="ml-2 text-[10px] text-text-secondary">choose 1 of the 3 function below</span>
                </div>
              </div>

              <div className="p-3 space-y-2">
                <div className="border border-border rounded-lg overflow-hidden">
                  <button disabled={activeTool !== null && activeTool !== 'massing'} onClick={() => toggleStep1('massing')} className={`w-full flex items-center justify-between p-3 hover:bg-surface transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.01] active:scale-95 border-l-4 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed ${activeTool === 'massing' ? 'bg-primary/5 border-primary' : 'border-transparent'}`}>
                    <div className="flex items-center gap-2"><ImageIcon className={`w-4 h-4 ${activeTool === 'massing' ? 'text-primary' : 'text-text-secondary'}`} /><span className={`font-medium text-sm ${activeTool === 'massing' ? 'text-primary' : 'text-text'}`}>Massing to Render</span></div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${activeTool === 'massing' ? 'rotate-180 text-primary' : 'text-text-secondary'}`} />
                  </button>
                  <AnimatePresence>
                    {activeTool === 'massing' && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-border">
                        <div className="p-3"><p className="text-xs text-text-secondary">Configure settings and click Generate in Step 3.</p></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <button disabled={activeTool !== null && activeTool !== 'styleSwap'} onClick={() => toggleStep1('styleSwap')} className={`w-full flex items-center justify-between p-3 hover:bg-surface transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.01] active:scale-95 border-l-4 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed ${activeTool === 'styleSwap' ? 'bg-primary/5 border-primary' : 'border-transparent'}`}>
                    <div className="flex items-center gap-2"><span className={`text-sm ${activeTool === 'styleSwap' ? '' : 'opacity-70 grayscale'}`}>🎨</span><span className={`font-medium text-sm ${activeTool === 'styleSwap' ? 'text-primary' : 'text-text'}`}>Style Swap</span></div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${activeTool === 'styleSwap' ? 'rotate-180 text-primary' : 'text-text-secondary'}`} />
                  </button>
                  <AnimatePresence>
                    {activeTool === 'styleSwap' && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-border">
                        <div className="p-3 space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {STYLE_PRESETS.map((style) => (
                              <button key={style.id} onClick={() => setSelectedStyle(selectedStyle === style.id ? null : style.id)} className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.02] active:scale-95 ${selectedStyle === style.id ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text hover:border-primary/50'}`}>
                                {style.name}
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={customStylePrompt}
                            onChange={(e) => setCustomStylePrompt(e.target.value)}
                            placeholder="e.g., Warm timber facade with concrete base, golden hour lighting..."
                            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs resize-none"
                            rows={2}
                            maxLength={200}
                          />
                          <label className="flex items-center justify-center gap-2 w-full p-2 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.01] active:scale-95">
                            <Upload className="w-4 h-4 text-text-secondary" />
                            <span className="text-xs text-text-secondary">Upload Reference</span>
                            <input type="file" accept="image/*" onChange={handleStyleReferenceUpload} className="hidden" />
                          </label>

                          {styleReferenceImage && (
                            <div className="mt-2 relative">
                              <img src={styleReferenceImage} alt="Reference" className="w-full h-16 object-cover rounded" />
                              <button onClick={() => { setStyleReferenceImage(null); setSelectedStyle(null); }} className="absolute top-1 right-1 w-5 h-5 bg-text/80 text-white rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <button disabled={activeTool !== null && activeTool !== 'perspective'} onClick={() => toggleStep1('perspective')} className={`w-full flex items-center justify-between p-3 hover:bg-surface transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.01] active:scale-95 border-l-4 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed ${activeTool === 'perspective' ? 'bg-primary/5 border-primary' : 'border-transparent'}`}>
                    <div className="flex items-center gap-2"><Camera className={`w-4 h-4 ${activeTool === 'perspective' ? 'text-primary' : 'text-text-secondary'}`} /><span className={`font-medium text-sm ${activeTool === 'perspective' ? 'text-primary' : 'text-text'}`}>Perspective & Framing</span></div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${activeTool === 'perspective' ? 'rotate-180 text-primary' : 'text-text-secondary'}`} />
                  </button>
                  <AnimatePresence>
                    {activeTool === 'perspective' && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-border">
                        <div className="p-3 space-y-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPlacementMode('camera')}
                              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${placementMode === 'camera'
                                ? 'bg-red-500 text-white border-red-500'
                                : 'bg-surface border-border text-text-secondary hover:border-red-300'
                                }`}
                            >
                              <Camera className="w-4 h-4" />
                              Camera
                            </button>
                            <button
                              onClick={() => setPlacementMode('target')}
                              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${placementMode === 'target'
                                ? 'bg-green-500 text-white border-green-500'
                                : 'bg-surface border-border text-text-secondary hover:border-green-300'
                                }`}
                            >
                              <Crosshair className="w-4 h-4" />
                              Target
                            </button>
                          </div>

                          <div className="flex items-center gap-4 text-[10px] text-text-secondary">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Camera</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>Target</span>
                          </div>

                          {cameraPositions.length > 0 && (
                            <button onClick={clearPositions} className="w-full px-2 py-1 text-[10px] text-text-secondary hover:text-text border border-border rounded hover:bg-surface transition-all duration-200 ease-out hover:shadow-sm hover:scale-[1.01] active:scale-95">Clear Positions</button>
                          )}

                          <button onClick={cancelPerspective} className="w-full px-2 py-1 mt-2 text-[10px] font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded transition-all duration-200 ease-out hover:shadow-sm hover:scale-[1.01] active:scale-95">Cancel</button>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* STEP 2 */}
            <div className={`bg-white rounded-xl border border-border overflow-hidden ${disableStep2 ? 'opacity-50' : ''}`}>
              <div className="p-4 bg-surface border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-text text-white flex items-center justify-center text-xs font-bold">2</div>
                  <h2 className="font-heading font-semibold text-text">Modify</h2>
                  {disableStep2 && <span className="ml-auto text-[10px] text-text-secondary bg-surface px-2 py-0.5 rounded">Disabled - Step 1 Output</span>}
                </div>
              </div>

              <div className="p-2 space-y-2">
                <div className="border border-border rounded-lg overflow-hidden">
                  <label className={`flex items-center gap-2 p-2 ${disableStep2 ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-surface'} transition-colors`}>
                    <input type="checkbox" checked={step2Enabled.context} onChange={() => toggleStep2('context')} disabled={disableStep2} className="w-3.5 h-3.5 rounded border-border text-primary" />
                    <div className="flex-1 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-text-secondary" />
                      <span className="font-medium text-text text-xs">Context & Environment</span>
                    </div>
                  </label>

                  <AnimatePresence>
                    {step2Enabled.context && !disableStep2 && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-border bg-surface/30">
                        <div className="p-2 space-y-2">
                          <div>
                            <label className="text-[9px] font-medium text-text-secondary uppercase tracking-wider mb-1 block">Time of Day</label>
                            <select value={contextSettings.timeOfDay} onChange={(e) => setContextSettings(prev => ({ ...prev, timeOfDay: e.target.value }))} className="w-full px-2 py-1.5 bg-white border border-border rounded text-xs">
                              <option>Golden Hour</option>
                              <option>Overcast</option>
                              <option>Night</option>
                              <option>Midday</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] font-medium text-text-secondary uppercase tracking-wider mb-1 block">Surroundings</label>
                            <select value={contextSettings.surroundings} onChange={(e) => setContextSettings(prev => ({ ...prev, surroundings: e.target.value }))} className="w-full px-2 py-1.5 bg-white border border-border rounded text-xs">
                              <option>Urban</option>
                              <option>Forest</option>
                              <option>Waterfront</option>
                              <option>Desert</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <label className={`flex items-center gap-2 p-2 ${disableStep2 ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-surface'} transition-colors`}>
                    <input type="checkbox" checked={step2Enabled.aesthetic} onChange={() => toggleStep2('aesthetic')} disabled={disableStep2} className="w-3.5 h-3.5 rounded border-border text-primary" />
                    <div className="flex-1 flex items-center gap-1.5">
                      <Grid3x3 className="w-3.5 h-3.5 text-text-secondary" />
                      <span className="font-medium text-text text-xs">Studio Aesthetic</span>
                    </div>
                  </label>

                  <AnimatePresence>
                    {step2Enabled.aesthetic && !disableStep2 && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-border bg-surface/30">
                        <div className="p-2 space-y-2 max-h-[200px] overflow-y-auto">
                          {Object.entries(STUDIO_AESTHETICS).map(([category, styles]) => (
                            <div key={category}>
                              <h4 className="text-[9px] font-medium text-text-secondary uppercase mb-1.5">{category}</h4>
                              <div className="grid grid-cols-3 gap-1">
                                {styles.map((style) => (
                                  <button key={style.id} onClick={() => setSelectedAesthetic(selectedAesthetic === style.id ? null : style.id)} className={`p-1.5 rounded border-2 text-center transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.02] active:scale-95 ${selectedAesthetic === style.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                    <div className="w-full aspect-square bg-surface rounded mb-1 flex items-center justify-center">
                                      <span className="text-[8px] text-text-secondary">{style.name.slice(0, 6)}</span>
                                    </div>
                                    <span className="text-[8px] text-text leading-tight block truncate">{style.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <label className={`flex items-center gap-2 p-2 ${disableStep2 ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-surface'} transition-colors`}>
                    <input type="checkbox" checked={step2Enabled.detail} onChange={() => toggleStep2('detail')} disabled={disableStep2} className="w-3.5 h-3.5 rounded border-border text-primary" />
                    <div className="flex-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-text-secondary" />
                      <span className="font-medium text-text text-xs">Customized Detail</span>
                    </div>
                  </label>

                  <AnimatePresence>
                    {step2Enabled.detail && !disableStep2 && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-border bg-surface/30">
                        <div className="p-2">
                          <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Add custom instructions..."
                            className="w-full px-2 py-1.5 bg-white border border-border rounded text-xs resize-none"
                            rows={2}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* STEP 3: OUTPUT */}
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="p-3 bg-surface border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-text/60 text-white flex items-center justify-center text-[10px] font-bold">3</div>
                  <h2 className="font-heading font-semibold text-text text-sm">Output Format</h2>
                </div>
              </div>

              <div className="p-3 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-text-secondary uppercase w-14">Res:</span>
                    <div className="flex gap-1">
                      {['2k', '4k'].map((res) => (
                        <button key={res} onClick={() => setResolution(res)} className={`px-2 py-1 rounded text-[11px] font-medium border transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.02] active:scale-95 ${resolution === res ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:border-primary/50'}`}>{res.toUpperCase()}</button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-text-secondary uppercase w-14">Aspect:</span>
                    <div className="flex gap-1">
                      {ASPECT_RATIOS.map((ratio) => (
                        <button key={ratio.id} onClick={() => setAspectRatio(ratio.id)} className={`px-2 py-1 rounded text-[11px] font-medium border transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.02] active:scale-95 ${aspectRatio === ratio.id ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:border-primary/50'}`}>{ratio.label}</button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-text-secondary uppercase w-14">Engine:</span>
                    <div className="flex gap-1 flex-1">
                      {['nano-banana-2', 'nano-banana-pro'].map((engine) => (
                        <button key={engine} onClick={() => setAiEngine(engine)} className={`flex-1 px-2 py-1 rounded text-[10px] border transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.02] active:scale-95 ${aiEngine === engine ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:border-primary/50'}`}>{engine === 'nano-banana-2' ? 'Nano 2' : 'Nano Pro'}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={generateRender}
                    disabled={(!canGenerate && !!user) || isGenerating || !!(profile && profile.generationCount >= 30)}
                    className="w-full px-4 py-3 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-200 ease-out flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Generating...</span></>
                    ) : !user ? (
                      <><span>🔒</span><span>Login to Generate</span></>
                    ) : (profile && profile.generationCount >= 30) ? (
                      <><span>⚠️</span><span>Generation Limit Reached (30/30)</span></>
                    ) : (
                      <><span>🎨</span><span>Generate Render</span></>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}