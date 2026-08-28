import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const DESKTOP_WORKSPACES = {
  'Startup Planning': {
    subtitle: 'Branch your plan into pricing, marketing, and risks — without losing your main thread.',
    nodes: [
      {
        id: 'sp-1',
        label: 'Card 01',
        dot: 'bg-brand',
        tag: 'GPT-4o',
        tagCls: 'bg-brand-soft text-brand',
        title: 'Launch Plan',
        body: 'Outline the core goals and target audience for the new product launch.',
        fl: '3 responses',
        fr: 'Active',
        frCls: 'text-emerald-600 font-semibold',
        ratioX: 0.04,
        ratioY: 0.18,
      },
      {
        id: 'sp-2',
        label: 'Card 02',
        dot: 'bg-brand',
        tag: 'Gemini',
        tagCls: 'bg-slate-100 text-slate-600',
        title: 'Pricing & Growth',
        body: 'Explore simple pricing plans and key launch channels.',
        fl: 'Linked to Card 1',
        fr: '',
        ratioX: 0.38,
        ratioY: 0.08,
      },
      {
        id: 'sp-3',
        label: 'Branch A',
        dot: 'bg-violet-500',
        tag: 'Claude 3.5',
        tagCls: 'bg-violet-50 text-violet-600',
        title: 'Risks & Ideas',
        body: 'List potential challenges and backup plans.',
        bodyCls: 'bg-violet-50/60 text-violet-950',
        fl: 'Side branch',
        fr: 'Separate',
        frCls: 'text-violet-600 font-semibold',
        ratioX: 0.68,
        ratioY: 0.40,
      },
    ],
    edges: [
      { id: 'edge-sp1-sp2', from: 'sp-1', to: 'sp-2' },
      { id: 'edge-sp2-sp3', from: 'sp-2', to: 'sp-3' },
    ],
  },

  'Research & Notes': {
    subtitle: 'Explore topics deeply without ever losing sight of your original question at the top.',
    nodes: [
      {
        id: 'rd-1',
        label: 'Card 01',
        dot: 'bg-brand',
        tag: 'GPT-4o',
        tagCls: 'bg-brand-soft text-brand',
        title: 'Main Topic Overview',
        body: 'Summarize key concepts and main takeaways from recent research.',
        fl: '4 references',
        fr: 'Active',
        frCls: 'text-emerald-600 font-semibold',
        ratioX: 0.04,
        ratioY: 0.16,
      },
      {
        id: 'rd-2',
        label: 'Card 02',
        dot: 'bg-brand',
        tag: 'Claude 3.5',
        tagCls: 'bg-brand-soft text-brand',
        title: 'Detailed Analysis',
        body: 'Break down specific findings and compare different approaches.',
        fl: 'Linked to Card 1',
        fr: '',
        ratioX: 0.38,
        ratioY: 0.08,
      },
      {
        id: 'rd-3',
        label: 'Branch A',
        dot: 'bg-violet-500',
        tag: 'Gemini',
        tagCls: 'bg-violet-50 text-violet-600',
        title: 'Open Questions',
        body: 'Highlight areas needing more testing or follow-up.',
        bodyCls: 'bg-violet-50/60 text-violet-950',
        fl: 'Side branch',
        fr: 'Separate',
        frCls: 'text-violet-600 font-semibold',
        ratioX: 0.68,
        ratioY: 0.42,
      },
    ],
    edges: [
      { id: 'edge-rd1-rd2', from: 'rd-1', to: 'rd-2' },
      { id: 'edge-rd2-rd3', from: 'rd-2', to: 'rd-3' },
    ],
  },

  'Writing & Creative': {
    subtitle: 'Draft different options side by side, compare them live, and pick the best direction.',
    nodes: [
      {
        id: 'ws-1',
        label: 'Card 01',
        dot: 'bg-brand',
        tag: 'GPT-4o',
        tagCls: 'bg-brand-soft text-brand',
        title: 'Story Setup',
        body: 'Introduce main characters and set up the opening scene.',
        fl: '2 drafts',
        fr: 'Active',
        frCls: 'text-emerald-600 font-semibold',
        ratioX: 0.04,
        ratioY: 0.20,
      },
      {
        id: 'ws-2',
        label: 'Option A',
        dot: 'bg-brand',
        tag: 'Claude 3.5',
        tagCls: 'bg-brand-soft text-brand',
        title: 'Ending A (Upbeat)',
        body: 'A positive resolution focused on teamwork and success.',
        fl: 'Linked to Card 1',
        fr: 'Compare',
        ratioX: 0.38,
        ratioY: 0.06,
      },
      {
        id: 'ws-3',
        label: 'Option B',
        dot: 'bg-violet-500',
        tag: 'GPT-4o',
        tagCls: 'bg-violet-50 text-violet-600',
        title: 'Ending B (Mystery)',
        body: 'A twist ending that leaves a mystery open for next time.',
        bodyCls: 'bg-violet-50/60 text-violet-950',
        fl: 'Linked to Card 1',
        fr: 'Compare',
        frCls: 'text-violet-600 font-semibold',
        ratioX: 0.38,
        ratioY: 0.48,
      },
    ],
    edges: [
      { id: 'edge-ws1-ws2', from: 'ws-1', to: 'ws-2' },
      { id: 'edge-ws1-ws3', from: 'ws-1', to: 'ws-3' },
    ],
  },

  'Quick Notes & Ideas': {
    subtitle: "Ask quick questions against your project's memory without cluttering your main work.",
    nodes: [
      {
        id: 'sc-1',
        label: 'Card 01',
        dot: 'bg-brand',
        tag: 'GPT-4o',
        tagCls: 'bg-brand-soft text-brand',
        title: 'Project Context',
        body: 'Saved guidelines, reference materials, and project goals.',
        fl: 'Main context',
        fr: 'Synced',
        frCls: 'text-emerald-600 font-semibold',
        ratioX: 0.04,
        ratioY: 0.20,
      },
      {
        id: 'sc-2',
        label: 'Quick Note',
        dot: 'bg-amber-500',
        tag: 'Private',
        tagCls: 'bg-amber-50 text-amber-600',
        title: 'Sanity Check',
        body: 'Check ideas quickly without adding noise to your main project space.',
        bodyCls: 'bg-amber-50/50 text-amber-950',
        fl: 'Private note',
        fr: 'Clean',
        frCls: 'text-amber-600 font-semibold',
        ratioX: 0.48,
        ratioY: 0.20,
      },
    ],
    edges: [
      { id: 'edge-sc1-sc2', from: 'sc-1', to: 'sc-2' },
    ],
  },
};

const INITIAL_MOBILE_CHAT = [
  {
    id: 'm-1',
    userPrompt: 'Launch Plan — Startup Planning',
    branches: [
      {
        model: 'GPT-4o',
        tag: 'Pricing & Growth',
        response: 'Explore simple pricing plans and direct launch channels for your product.',
      },
      {
        model: 'Gemini 1.5',
        tag: 'Risks & Ideas',
        response: 'List potential challenges early and keep backup plans ready.',
      },
    ],
  },
  {
    id: 'm-2',
    userPrompt: 'Research Overview — Detailed Analysis',
    branches: [
      {
        model: 'Claude 3.5 Sonnet',
        tag: 'Main Insights',
        response: 'Explore topics deeply while keeping your original question visible at all times.',
      },
    ],
  },
];

export default function ProductShowcaseSection() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const mobileFeedRef = useRef(null);

  const [activeWorkspace, setActiveWorkspace] = useState('Startup Planning');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Mobile Vertical Chat Feed State
  const [mobileChat, setMobileChat] = useState(INITIAL_MOBILE_CHAT);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  const [, setRenderTick] = useState(0);

  // Live Wire Connection State
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Modal State
  const [showTryModal, setShowTryModal] = useState(true);
  const [modalFadingOut, setModalFadingOut] = useState(false);

  // Drag State
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const dismissModal = () => {
    setModalFadingOut(true);
    setTimeout(() => {
      setShowTryModal(false);
    }, 600);
  };

  const calculateResponsiveNodes = (wsName) => {
    const ws = DESKTOP_WORKSPACES[wsName] || DESKTOP_WORKSPACES['Startup Planning'];
    if (!ws || !ws.nodes) return [];
    if (!canvasRef.current) return ws.nodes.map((n) => ({ ...n, x: n.ratioX * 900, y: n.ratioY * 500 }));
    
    const cw = canvasRef.current.clientWidth || 900;
    const ch = canvasRef.current.clientHeight || 580;

    const nodeW = cw < 1024 ? 200 : 230;
    return ws.nodes.map((n) => {
      const px = Math.max(15, Math.min(cw - nodeW - 15, Math.floor(n.ratioX * cw)));
      const py = Math.max(20, Math.min(ch - 180, Math.floor(n.ratioY * ch)));
      return { ...n, x: px, y: py };
    });
  };

  useEffect(() => {
    const ws = DESKTOP_WORKSPACES[activeWorkspace] || DESKTOP_WORKSPACES['Startup Planning'];
    const initNodes = calculateResponsiveNodes(activeWorkspace);
    setNodes(initNodes);
    setEdges(ws ? ws.edges : []);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setConnectingFrom(null);

    const handleResize = () => {
      setNodes(calculateResponsiveNodes(activeWorkspace));
      setRenderTick((t) => t + 1);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeWorkspace]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderTick((t) => t + 1);
    }, 50);
    return () => clearTimeout(timer);
  }, [nodes]);

  // GSAP ScrollTrigger Entrance Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '#showcase-kicker, #showcase-title, #showcase-copy, .showcase-ws-tab, .showcase-cap',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
          },
        }
      );

      gsap.fromTo(
        '#showcase-product-frame',
        { opacity: 0, y: 55, rotateX: 10, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          duration: 1.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Keyboard shortcut for Backspace / Delete
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          deleteNode(selectedNodeId);
        } else if (selectedEdgeId) {
          deleteEdge(selectedEdgeId);
        }
      }
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setConnectingFrom(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, nodes, edges]);

  // Mouse Move on Canvas
  const handleMouseMove = (e) => {
    if (window.innerWidth < 640) return;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = zoomLevel / 100;
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    setMousePos({ x: mouseX, y: mouseY });

    if (draggingNodeId) {
      const cw = Math.max(750, canvasRef.current.clientWidth);
      const ch = Math.max(600, canvasRef.current.clientHeight);
      const nodeW = 230;

      const newX = Math.max(10, Math.min(mouseX - dragOffset.x, cw - nodeW - 10));
      const newY = Math.max(10, Math.min(mouseY - dragOffset.y, ch - 150));

      setNodes((prev) =>
        prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
      );
      setRenderTick((t) => t + 1);
    }
  };

  const handleMouseDownNode = (e, node) => {
    if (window.innerWidth < 640) return;
    e.stopPropagation();
    if (showTryModal) dismissModal();

    if (connectingFrom && connectingFrom !== node.id) {
      const edgeId = `edge-${connectingFrom}-${node.id}`;
      if (!edges.some((ed) => ed.id === edgeId || (ed.from === node.id && ed.to === connectingFrom))) {
        setEdges((prev) => [...prev, { id: edgeId, from: connectingFrom, to: node.id }]);
      }
      setConnectingFrom(null);
      return;
    }

    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    setDraggingNodeId(node.id);

    const rect = canvasRef.current.getBoundingClientRect();
    const scale = zoomLevel / 100;
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    setDragOffset({
      x: mouseX - node.x,
      y: mouseY - node.y,
    });
  };

  const handleMouseUpNode = (nodeId) => {
    if (window.innerWidth < 640) return;
    if (connectingFrom && connectingFrom !== nodeId) {
      const edgeId = `edge-${connectingFrom}-${nodeId}`;
      if (!edges.some((ed) => ed.id === edgeId || (ed.from === nodeId && ed.to === connectingFrom))) {
        setEdges((prev) => [...prev, { id: edgeId, from: connectingFrom, to: nodeId }]);
      }
      setConnectingFrom(null);
    }
    setDraggingNodeId(null);
  };

  const handleCanvasMouseUp = () => {
    setDraggingNodeId(null);
  };

  const handleStartConnection = (e, nodeId) => {
    if (window.innerWidth < 640) return;
    e.stopPropagation();
    e.preventDefault();
    if (showTryModal) dismissModal();

    if (connectingFrom === nodeId) {
      setConnectingFrom(null);
    } else if (connectingFrom && connectingFrom !== nodeId) {
      const edgeId = `edge-${connectingFrom}-${nodeId}`;
      if (!edges.some((ed) => ed.id === edgeId || (ed.from === nodeId && ed.to === connectingFrom))) {
        setEdges((prev) => [...prev, { id: edgeId, from: connectingFrom, to: nodeId }]);
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom(nodeId);
    }
  };

  const deleteNode = (nodeId) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.from !== nodeId && e.to !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const deleteEdge = (edgeId) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    if (selectedEdgeId === edgeId) setSelectedEdgeId(null);
  };

  const handleAddNode = () => {
    if (showTryModal) dismissModal();

    const newMobMessage = {
      id: `m-${mobileChat.length + 1}`,
      userPrompt: `New Idea Thread #${mobileChat.length + 1}`,
      branches: [
        {
          model: 'Claude 3.5 Sonnet',
          tag: 'Response Option 1',
          response: 'Synthesized response created from your active workspace context.',
        },
      ],
    };
    setMobileChat((prev) => [...prev, newMobMessage]);

    const cw = Math.max(750, canvasRef.current?.clientWidth || 800);
    const ch = Math.max(600, canvasRef.current?.clientHeight || 500);
    const newId = `node-${Date.now()}`;
    const newNode = {
      id: newId,
      label: `Card 0${nodes.length + 1}`,
      dot: 'bg-brand',
      tag: 'Claude 3.5',
      tagCls: 'bg-brand-soft text-brand',
      title: 'New Response Card',
      body: 'Synthesized AI response. Connect ideas or branch off into new options.',
      fl: '1 message',
      fr: 'Active',
      frCls: 'text-brand font-semibold',
      x: Math.max(20, Math.min(cw - 220, 40 + (nodes.length % 3) * 40)),
      y: Math.max(30, Math.min(ch - 170, 100 + (nodes.length % 3) * 40)),
    };
    setNodes((prev) => [...prev, newNode]);
    if (nodes.length > 0) {
      setEdges((prev) => [
        ...prev,
        { id: `edge-${nodes[nodes.length - 1].id}-${newId}`, from: nodes[nodes.length - 1].id, to: newId },
      ]);
    }

    setTimeout(() => {
      if (mobileFeedRef.current) {
        mobileFeedRef.current.scrollTo({ top: mobileFeedRef.current.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  };

  const getHandlePosition = (nodeId, side) => {
    if (typeof document !== 'undefined' && canvasRef.current) {
      const nodeEl = document.getElementById(nodeId);
      const svgEl = canvasRef.current.querySelector('svg');
      if (nodeEl && svgEl) {
        const handleEl = nodeEl.querySelector(`.olai-handle-${side}`);
        if (handleEl) {
          const hRect = handleEl.getBoundingClientRect();
          const svgRect = svgEl.getBoundingClientRect();
          const scale = zoomLevel / 100;
          return {
            x: (hRect.left + hRect.width / 2 - svgRect.left) / scale,
            y: (hRect.top + hRect.height / 2 - svgRect.top) / scale,
          };
        }
      }
    }
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return {
      x: side === 'right' ? node.x + 230 : node.x,
      y: node.y + 75,
    };
  };

  const getCurvePath = (fromNodeId, toNodeId) => {
    const p1 = getHandlePosition(fromNodeId, 'right');
    const p2 = getHandlePosition(toNodeId, 'left');
    const dx = Math.max(30, Math.abs(p2.x - p1.x) * 0.45);

    return `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;
  };

  const getLiveWirePath = () => {
    if (!connectingFrom) return '';
    const p1 = getHandlePosition(connectingFrom, 'right');
    const dx = Math.max(30, Math.abs(mousePos.x - p1.x) * 0.45);

    return `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${mousePos.x - dx} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`;
  };

  return (
    <section ref={sectionRef} id="showcase" className="relative w-full overflow-hidden bg-[#F8F8F7] text-ink px-[12px] sm:px-[20px] py-14 sm:py-20 lg:py-28">
      <div className="border-t border-black/[0.07] mb-12"></div>

      <div className="w-full max-w-[1750px] mx-auto">
        
        {/* ═══════════════════════════════════════════════
             PROPORTIONAL LEFT-RIGHT GRID (LEFT: col-span-3, RIGHT: col-span-9)
        ════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8 items-start">
          
          {/* ── LEFT COLUMN: BIGGER TITLE, CONTENT & 2x2 QUADRANTS (lg:col-span-3) ── */}
          <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
            <div>
              <p id="showcase-kicker" className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/40">
                03 / The Nodewise Canvas
              </p>

              {/* BIGGER TITLE */}
              <h2 id="showcase-title" className="mt-3 max-w-4xl font-display text-4xl sm:text-5xl lg:text-[54px] xl:text-[62px] font-medium leading-[1.0] tracking-[-0.045em]">
                Built for the way <span className="text-ink/30 italic font-normal">real work happens.</span>
              </h2>

              <p id="showcase-copy" className="mt-4 text-xs leading-[1.75] text-ink/55 sm:text-[14px]">
                {DESKTOP_WORKSPACES[activeWorkspace]?.subtitle ||
                  'Nodewise gives every conversation a place on the canvas. Start a thread, branch it, or leave a thought on its own.'}
              </p>

              {/* Real Work Presets Menu */}
              <div className="mt-6 border-t border-black/[0.08] pt-5">
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ink/35 mb-2.5">
                  Select Example Use Case
                </p>
                <div className="space-y-1.5">
                  {Object.keys(DESKTOP_WORKSPACES).map((ws) => (
                    <button
                      key={ws}
                      type="button"
                      onClick={() => setActiveWorkspace(ws)}
                      className={`showcase-ws-tab flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[11.5px] font-medium transition-all ${
                        activeWorkspace === ws
                          ? 'bg-white shadow-xs text-brand font-semibold border border-black/[0.08]'
                          : 'bg-white/50 text-ink/65 hover:bg-white hover:text-ink border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${activeWorkspace === ws ? 'bg-brand' : 'bg-slate-300'}`}></span>
                        <span>{ws}</span>
                      </div>
                      <span className="font-mono text-[8.5px] text-ink/35">View →</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2x2 QUADRANT FORMAT SEPARATED BY INTERSECTING PLUS SIGN LINES */}
            <div className="relative border-t border-black/[0.08] pt-6 mt-6">
              <div className="absolute top-[calc(50%+12px)] left-0 right-0 h-px bg-black/[0.08]"></div>
              <div className="absolute left-1/2 top-6 bottom-0 w-px bg-black/[0.08]"></div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-6">
                <div className="showcase-cap pr-2 pb-2">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-ink/35">01 / Visual Cards</p>
                  <p className="mt-1 text-xs font-semibold text-slate-900">Organized Cards</p>
                </div>
                <div className="showcase-cap pl-2 pb-2">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-ink/35">02 / Connected Threads</p>
                  <p className="mt-1 text-xs font-semibold text-slate-900">Linked Ideas</p>
                </div>
                <div className="showcase-cap pr-2 pt-2">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-ink/35">03 / Shared Context</p>
                  <p className="mt-1 text-xs font-semibold text-slate-900">Project Memory</p>
                </div>
                <div className="showcase-cap pl-2 pt-2">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-ink/35">04 / AI Models</p>
                  <p className="mt-1 text-xs font-semibold text-slate-900">GPT-4o & Claude</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: CANVAS / MOBILE VERTICAL CHAT FEED (lg:col-span-9) ── */}
          <div className="lg:col-span-9 w-full">
            <div
              id="showcase-product-frame"
              className="relative overflow-hidden rounded-[24px] border border-black/[0.10] bg-white shadow-[0_30px_80px_rgba(11,13,18,0.08)]"
            >
              {/* FULL-COVERING "TRY IT OUT!" OVERLAY MODAL */}
              {showTryModal && (
                <div
                  className={`absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md transition-opacity duration-600 ${
                    modalFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                  }`}
                >
                  <div
                    id="try-card"
                    className="flex flex-col items-center text-center px-7 py-8 rounded-3xl border border-black/10 bg-white/95 shadow-[0_25px_70px_rgba(11,13,18,0.15)] max-w-sm"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white mb-3.5 shadow-lg">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                      </svg>
                    </div>
                    <h3 className="font-display text-xl font-medium tracking-tight text-ink">Try it out!</h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink/60">
                      Drag cards · click side dots to connect threads · click a thread or press ⌫ to delete.
                    </p>
                    <button
                      type="button"
                      onClick={dismissModal}
                      className="mt-5 rounded-xl bg-ink hover:bg-black px-6 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95"
                    >
                      Start Exploring
                    </button>
                  </div>
                </div>
              )}

              {/* Top Browser Bar */}
              <div className="flex h-13 items-center justify-between border-b border-black/[0.07] bg-white px-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-black/15"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-black/15"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-black/15"></span>
                  </div>
                  <div className="hidden h-7 items-center gap-2 rounded-lg border border-black/[0.06] bg-[#F7F7F6] px-3 sm:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    <span className="font-mono text-[9.5px] font-semibold text-ink/50">
                      Nodewise / {activeWorkspace}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden rounded-full bg-[#F4F4F2] px-3 py-1 font-mono text-[9px] font-semibold text-ink/50 sm:inline-flex">
                    Saved
                  </span>
                  <button
                    type="button"
                    onClick={handleAddNode}
                    className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-dark active:scale-95"
                  >
                    <span>+</span> Add Node
                  </button>
                </div>
              </div>

              {/* MOBILE VIEW: CLEAN VERTICAL CHAT FEED */}
              <div
                ref={mobileFeedRef}
                className="block sm:hidden bg-[#FBFBFA] p-4 h-[560px] overflow-y-auto space-y-4"
              >
                {mobileChat.map((msg) => (
                  <div key={msg.id} className="space-y-2.5">
                    {/* User Question */}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-xs bg-ink px-3.5 py-2 text-xs font-medium text-white shadow-xs">
                        {msg.userPrompt}
                      </div>
                    </div>

                    {/* AI Response Branches */}
                    <div className="flex gap-3 overflow-x-auto snap-x scrollbar-none pb-1">
                      {msg.branches.map((b, bIdx) => (
                        <div
                          key={bIdx}
                          className="min-w-[85%] snap-start rounded-2xl border border-black/[0.08] bg-white p-3.5 shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between border-b border-black/[0.05] pb-2">
                            <span className="font-mono text-[8.5px] font-semibold uppercase text-brand">
                              {b.model}
                            </span>
                            {msg.branches.length > 1 && (
                              <span className="font-mono text-[7.5px] text-ink/40">
                                Swipe for Branch ({bIdx + 1}/{msg.branches.length})
                              </span>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed text-ink/75">
                            {b.response}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP VIEW: SPATIAL GRAPH CANVAS (≥640px) */}
              <div className="hidden sm:grid min-h-[580px] lg:min-h-[640px] grid-cols-1 lg:grid-cols-[210px_minmax(0,1fr)]">
                
                {/* Internal Application Sidebar */}
                <aside className="hidden border-r border-black/[0.07] bg-[#FBFBFA] lg:flex lg:flex-col justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2.5 border-b border-black/[0.06] pb-4 mb-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-white font-display font-semibold text-sm">
                        N
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold tracking-tight text-ink">Nodewise</p>
                        <p className="font-mono text-[8.5px] uppercase tracking-wider text-ink/40">AI Workspace</p>
                      </div>
                    </div>

                    <p className="px-2 pb-2 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ink/35">
                      Example Use Cases
                    </p>
                    <div className="space-y-1">
                      {Object.keys(DESKTOP_WORKSPACES).map((ws) => (
                        <button
                          key={ws}
                          type="button"
                          onClick={() => setActiveWorkspace(ws)}
                          className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[11px] font-medium transition-all ${
                            activeWorkspace === ws
                              ? 'bg-white shadow-xs text-brand font-semibold border border-black/[0.06]'
                              : 'text-ink/60 hover:bg-black/[0.03]'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${activeWorkspace === ws ? 'bg-brand' : 'bg-slate-300'}`}></span>
                          <span className="truncate">{ws}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-black/[0.06] pt-3">
                    <div className="flex items-center gap-2 rounded-xl bg-slate-100/70 p-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand font-mono text-[9.5px] font-bold">
                        NW
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-semibold text-slate-800">Workspace</p>
                        <p className="font-mono text-[8px] text-ink/40">Personal</p>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Interactive Canvas Surface */}
                <main
                  ref={canvasRef}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onScroll={() => setRenderTick((t) => t + 1)}
                  onClick={() => {
                    setSelectedNodeId(null);
                    setSelectedEdgeId(null);
                    setConnectingFrom(null);
                  }}
                  className="relative min-w-0 h-[580px] sm:h-auto overflow-auto bg-[#F7F7F5] cursor-crosshair select-none"
                >
                  {/* Toolbar Top Left */}
                  <div className="sticky left-3 top-3 z-30 inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white/95 p-1 shadow-md backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={handleAddNode}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-ink text-white font-bold hover:bg-slate-800 active:scale-95 transition-transform"
                      title="Add node"
                    >
                      +
                    </button>
                    <span className="h-4 w-px bg-black/[0.1] mx-1"></span>
                    <span className="font-mono text-[8.5px] sm:text-[9px] font-semibold uppercase tracking-wider text-ink/50 px-1">
                      Canvas
                    </span>
                  </div>

                  {/* Toolbar Top Right Zoom */}
                  <div className="absolute right-3 top-3 sm:right-4 sm:top-4 z-30 flex items-center gap-1 rounded-xl border border-black/[0.08] bg-white/95 p-1 shadow-md backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                      className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg font-bold text-slate-600 hover:bg-slate-100"
                    >
                      −
                    </button>
                    <span className="font-mono text-[8.5px] sm:text-[9px] font-semibold text-slate-600 px-1">{zoomLevel}%</span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                      className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg font-bold text-slate-600 hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>

                  {/* Grid Background Pattern */}
                  <div
                    className="absolute inset-0 opacity-[0.045] min-w-[780px] min-h-[620px]"
                    style={{
                      backgroundImage: 'radial-gradient(#0B0D12 1px, transparent 1px)',
                      backgroundSize: `${18 * (zoomLevel / 100)}px ${18 * (zoomLevel / 100)}px`,
                    }}
                  />

                  {/* Canvas Content Container */}
                  <div
                    className="relative min-w-[780px] min-h-[620px] h-full w-full origin-top-left"
                    style={{ transform: `scale(${zoomLevel / 100})` }}
                  >
                    {/* SVG Connections Layer */}
                    <svg className="absolute inset-0 h-full w-full pointer-events-none z-10 min-h-[650px] min-w-[800px]">
                      {/* Saved Edges */}
                      {edges.map((edge) => {
                        const pathD = getCurvePath(edge.from, edge.to);
                        const isSelected = selectedEdgeId === edge.id;
                        return (
                          <g
                            key={edge.id}
                            className="cursor-pointer pointer-events-auto group"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedEdgeId === edge.id) {
                                deleteEdge(edge.id);
                              } else {
                                setSelectedEdgeId(edge.id);
                                setSelectedNodeId(null);
                              }
                            }}
                          >
                            <path d={pathD} stroke="transparent" strokeWidth="18" fill="none" />
                            <path
                              d={pathD}
                              stroke={isSelected ? '#F43F5E' : '#2E7CF6'}
                              strokeWidth="6"
                              strokeLinecap="round"
                              fill="none"
                              className="opacity-30 blur-xs"
                            />
                            <path
                              d={pathD}
                              stroke={isSelected ? '#F43F5E' : '#2E7CF6'}
                              strokeWidth={isSelected ? '2.5' : '1.8'}
                              strokeDasharray="4 6"
                              strokeLinecap="round"
                              fill="none"
                              className="animate-stroke-flow"
                            />
                          </g>
                        );
                      })}

                      {/* Live Wire */}
                      {connectingFrom && (
                        <path
                          d={getLiveWirePath()}
                          stroke="#2E7CF6"
                          strokeWidth="2.5"
                          strokeDasharray="5 5"
                          fill="none"
                          className="animate-stroke-flow filter drop-shadow-md"
                        />
                      )}
                    </svg>

                    {/* Draggable Desktop Nodes */}
                    {nodes.map((node) => {
                      const isSelected = selectedNodeId === node.id;
                      const isConnecting = connectingFrom === node.id;
                      return (
                        <article
                          id={node.id}
                          key={node.id}
                          onMouseDown={(e) => handleMouseDownNode(e, node)}
                          onMouseUp={() => handleMouseUpNode(node.id)}
                          className={`group absolute z-20 w-[200px] lg:w-[230px] rounded-2xl border bg-white p-3 sm:p-3.5 shadow-[0_12px_35px_rgba(11,13,18,0.06)] cursor-grab active:cursor-grabbing transition-shadow active:scale-98 ${
                            isSelected
                              ? 'border-brand ring-2 ring-brand/20 shadow-xl'
                              : 'border-black/[0.08] hover:border-black/20'
                          } ${isConnecting ? 'ring-2 ring-amber-400' : ''}`}
                          style={{ left: `${node.x}px`, top: `${node.y}px` }}
                        >
                          {/* Delete Badge */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNode(node.id);
                            }}
                            title="Delete node"
                            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-xs shadow-md opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-30"
                          >
                            ✕
                          </button>

                          {/* Handle Left */}
                          <button
                            type="button"
                            onMouseDown={(e) => handleStartConnection(e, node.id)}
                            onClick={(e) => handleStartConnection(e, node.id)}
                            title="Click to connect thread"
                            className="olai-handle-left absolute left-[-7px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-[#0B0D12] shadow-xs hover:scale-125 hover:bg-brand opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30 cursor-crosshair"
                          />

                          {/* Node Header */}
                          <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${node.dot}`}></span>
                              <span className="font-mono text-[8.5px] sm:text-[9px] font-semibold uppercase tracking-wider text-ink/40 truncate">
                                {node.label}
                              </span>
                            </div>
                            <span className={`rounded-md px-1.5 py-0.5 font-mono text-[7.5px] sm:text-[8px] font-semibold ${node.tagCls}`}>
                              {node.tag}
                            </span>
                          </div>

                          {/* Node Content */}
                          <div className="mt-2 space-y-1.5">
                            <p className="text-[10.5px] font-semibold leading-snug tracking-tight text-slate-900 truncate">
                              {node.title}
                            </p>
                            <div className={`rounded-xl px-2.5 py-2 text-[9.5px] leading-relaxed ${node.bodyCls || 'bg-[#F6F6F5] text-ink/55'}`}>
                              {node.body}
                            </div>
                            <div className="flex items-center justify-between pt-0.5 font-mono text-[7.5px] sm:text-[8px] text-ink/30">
                              <span>{node.fl}</span>
                              <span className={node.frCls}>{node.fr}</span>
                            </div>
                          </div>

                          {/* Handle Right */}
                          <button
                            type="button"
                            onMouseDown={(e) => handleStartConnection(e, node.id)}
                            onClick={(e) => handleStartConnection(e, node.id)}
                            title="Click to connect thread"
                            className="olai-handle-right absolute right-[-7px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-[#0B0D12] shadow-xs hover:scale-125 hover:bg-brand opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30 cursor-crosshair"
                          />
                        </article>
                      );
                    })}
                  </div>

                  {/* Bottom Desktop Hint Bar */}
                  <div className="sticky bottom-4 left-4 z-30 hidden sm:inline-flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white/95 px-3 py-1.5 shadow-xs">
                    <span className="font-mono text-[8.5px] font-semibold uppercase tracking-wider text-ink/40">
                      Drag cards · click side dots to connect · click thread or press ⌫ to delete
                    </span>
                  </div>
                </main>

              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
