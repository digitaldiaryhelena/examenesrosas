import React, { useState, useEffect } from 'react';
import { 
  Folder, FolderPlus, FileText, Plus, Trash2, Edit3, ChevronRight, ChevronDown, 
  Play, BookOpen, CheckCircle2, XCircle, ArrowLeft, Download, Upload, Video, 
  Sparkles, Clock, Award, Globe, Layers, AlertCircle, Save, Check, RefreshCw, Printer, FileDown,
  HelpCircle, Eye, RefreshCcw, CheckCircle, HelpCircle as QuestionIcon
} from 'lucide-react';

// --- INITIAL DEFAULT DATA (French Rose & White Theme Default Structure) ---
const initialFolders = [
  {
    id: 'c1',
    name: '1º Bachillerato - Biología y Geología',
    type: 'course',
    children: [
      {
        id: 't1',
        name: '1er Trimestre',
        type: 'trimester',
        children: [
          {
            id: 'm1',
            name: 'Tema 1: La Célula, Estructura y Función',
            type: 'topic',
            exams: [
              {
                id: 'ex1',
                title: 'Evaluación Diagnóstica: Citología y Organelos',
                description: 'Examen de prueba sobre ultraestructura celular, transporte de membrana y mitocondrias.',
                createdAt: '2026-10-24',
                questions: [
                  {
                    id: 1,
                    type: 'mc',
                    question: '¿Cuál es la función metabólica primordial de las mitocondrias en células eucariotas?',
                    options: [
                      'Síntesis y ensamblaje de ribosomas',
                      'Generación de ATP a través del proceso de respiración celular',
                      'Digestión enzimática de polisacáridos complejos',
                      'Almacenamiento de material genético cromosómico'
                    ],
                    correctAnswer: 1,
                    explanation: 'Las mitocondrias son los orgánulos encargados de la fosforilación oxidativa y la respiración celular aeróbica.'
                  },
                  {
                    id: 2,
                    type: 'tf',
                    question: 'Las células procariotas carecen de envoltura nuclear y organelos delimitados por membranas.',
                    correctAnswer: true,
                    explanation: 'Verdadero. El ADN procariota se encuentra libre en el citoplasma en la región nucleoide.'
                  },
                  {
                    id: 3,
                    type: 'short',
                    question: '¿Qué organelo contiene enzimas hidrolíticas para la digestión intracelular y reciclaje de componentes?',
                    correctAnswer: 'Lisosoma',
                    explanation: 'Los lisosomas actúan como el sistema digestivo celular al degradar material sobrante o dañado.'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

export default function App() {
  // --- PERSISTENT STATE ---
  const [folders, setFolders] = useState(() => {
    try {
      const saved = localStorage.getItem('examarosa_folders_db');
      return saved ? JSON.parse(saved) : initialFolders;
    } catch (e) {
      console.error('Error loading state from localStorage', e);
      return initialFolders;
    }
  });

  // --- NAVIGATION & VIEWS ---
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [activeTab, setActiveTab] = useState('library'); // 'library', 'generator', 'practice', 'deployment'
  const [expandedFolders, setExpandedFolders] = useState({ c1: true, t1: true });

  // --- GENERATOR STATE ---
  const [inputSourceType, setInputSourceType] = useState('text'); // 'text', 'file'
  const [inputText, setInputText] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('Media');
  const [questionTypes, setQuestionTypes] = useState({ mc: true, tf: true, short: true });
  const [examTitle, setExamTitle] = useState('');
  const [selectedTargetTopicId, setSelectedTargetTopicId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- GENERATED EXAM PREVIEW / EDIT STATE ---
  const [editingExam, setEditingExam] = useState(null);

  // --- PRACTICE MODE STATE ---
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // --- MODAL STATE ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('course'); // 'course', 'trimester', 'topic'
  const [modalParentId, setModalParentId] = useState(null);
  const [newItemName, setNewItemName] = useState('');

  // --- SAVE TO LOCALSTORAGE ---
  useEffect(() => {
    try {
      localStorage.setItem('examarosa_folders_db', JSON.stringify(folders));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }, [folders]);

  // --- TIMER EFFECT FOR PRACTICE MODE ---
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // --- FOLDER TREE TOGGLE ---
  const toggleFolder = (id) => {
    setExpandedFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // --- ADD ITEM TO TREE (Course, Trimester, Topic) ---
  const handleAddItem = () => {
    if (!newItemName.trim()) return;

    const newId = 'id_' + Date.now();
    const updated = JSON.parse(JSON.stringify(folders));

    if (modalType === 'course') {
      updated.push({
        id: newId,
        name: newItemName.trim(),
        type: 'course',
        children: []
      });
    } else if (modalType === 'trimester') {
      const course = updated.find((c) => c.id === modalParentId);
      if (course) {
        course.children = course.children || [];
        course.children.push({
          id: newId,
          name: newItemName.trim(),
          type: 'trimester',
          children: []
        });
      }
    } else if (modalType === 'topic') {
      for (const c of updated) {
        const trimester = (c.children || []).find((t) => t.id === modalParentId);
        if (trimester) {
          trimester.children = trimester.children || [];
          trimester.children.push({
            id: newId,
            name: newItemName.trim(),
            type: 'topic',
            exams: []
          });
          break;
        }
      }
    }

    setFolders(updated);
    setNewItemName('');
    setModalOpen(false);
  };

  // --- DELETE ITEM FROM TREE ---
  const handleDeleteItem = (e, id, type) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de borrar este elemento y todos sus datos asociados?')) return;

    let updated = JSON.parse(JSON.stringify(folders));

    if (type === 'course') {
      updated = updated.filter((c) => c.id !== id);
    } else if (type === 'trimester') {
      updated.forEach((c) => {
        c.children = (c.children || []).filter((t) => t.id !== id);
      });
    } else if (type === 'topic') {
      updated.forEach((c) => {
        (c.children || []).forEach((t) => {
          t.children = (t.children || []).filter((m) => m.id !== id);
        });
      });
    }

    setFolders(updated);
    if (selectedTopic?.id === id) setSelectedTopic(null);
  };

  // --- FILE READING FOR GENERATOR ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setInputText(event.target.result || '');
    };
    reader.readAsText(file);
  };

  // --- AUTOMATIC EXAM GENERATOR LOGIC ---
  const handleGenerateExam = () => {
    if (!inputText.trim()) {
      alert('Por favor, ingresa o sube apuntes de texto para generar el examen.');
      return;
    }

    if (!examTitle.trim()) {
      alert('Por favor, indica un título para el examen.');
      return;
    }

    setIsGenerating(true);

    setTimeout(() => {
      // Split text into meaningful sentences/paragraphs
      const sentences = inputText
        .split(/(?<=[.?!])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 15);

      const fallbackSentences = [
        'Los principios fundamentales de esta materia requieren un análisis riguroso.',
        'La estructura celular representa la unidad anatómica y funcional.',
        'El proceso se regula mediante retroalimentación biológica directa.'
      ];

      const pool = sentences.length > 0 ? sentences : fallbackSentences;

      const allowedTypes = [];
      if (questionTypes.mc) allowedTypes.push('mc');
      if (questionTypes.tf) allowedTypes.push('tf');
      if (questionTypes.short) allowedTypes.push('short');
      if (allowedTypes.length === 0) allowedTypes.push('mc');

      const generatedQuestions = [];

      for (let i = 0; i < numQuestions; i++) {
        const type = allowedTypes[i % allowedTypes.length];
        const rawSentence = pool[i % pool.length];
        const cleanText = rawSentence.replace(/^[•\-\d\.]+\s*/, '');

        if (type === 'mc') {
          generatedQuestions.push({
            id: i + 1,
            type: 'mc',
            question: `Respecto al temario: ¿Qué afirmación describe con exactitud el principio de "${cleanText.substring(0, 45)}..."?`,
            options: [
              cleanText,
              'Se trata de un axioma descartado por investigaciones recientes.',
              'Corresponde únicamente a procesos inorgánicos secundarios.',
              'Ocurre exclusivamente en condiciones extremas de laboratorio.'
            ],
            correctAnswer: 0, // Option 0 is correct by default
            explanation: `Referencia extraída directamente de tus apuntes: "${cleanText}"`
          });
        } else if (type === 'tf') {
          const isTrue = i % 2 === 0;
          generatedQuestions.push({
            id: i + 1,
            type: 'tf',
            question: isTrue
              ? `¿Es VERDADERO el enunciado: "${cleanText}"?`
              : `¿Es VERDADERO que la teoría niega expresamente que: "${cleanText.substring(0, 40)}..."?`,
            correctAnswer: isTrue,
            explanation: `Verificación basada en las notas de estudio.`
          });
        } else {
          // Short answer
          const words = cleanText.split(' ');
          const keyWord = words.find((w) => w.length > 5) || 'Concepto clave';
          generatedQuestions.push({
            id: i + 1,
            type: 'short',
            question: `Identifica o define brevemente el término referente a: "${cleanText.substring(0, 50)}..."`,
            correctAnswer: keyWord.replace(/[,.]/g, ''),
            explanation: `Concepto extraído: ${keyWord}`
          });
        }
      }

      const newExam = {
        id: 'ex_' + Date.now(),
        title: examTitle.trim(),
        description: `Examen generado automáticamente. Dificultad: ${difficulty}.`,
        createdAt: new Date().toISOString().split('T')[0],
        questions: generatedQuestions
      };

      setEditingExam(newExam);
      setIsGenerating(false);
    }, 800);
  };

  // --- SAVE GENERATED EXAM TO TARGET TOPIC ---
  const handleSaveExamToTopic = () => {
    if (!editingExam) return;

    if (selectedTargetTopicId) {
      const updated = JSON.parse(JSON.stringify(folders));
      let added = false;

      for (const c of updated) {
        for (const t of c.children || []) {
          for (const m of t.children || []) {
            if (m.id === selectedTargetTopicId) {
              m.exams = m.exams || [];
              m.exams.push(editingExam);
              added = true;
              setSelectedTopic(m);
              break;
            }
          }
        }
      }

      if (added) setFolders(updated);
    }

    setSelectedExam(editingExam);
    setEditingExam(null);
    setUserAnswers({});
    setSubmitted(false);
    setTimer(0);
    setIsTimerRunning(true);
    setActiveTab('practice');
  };

  // --- START EXAM PRACTICE ---
  const handleStartExam = (exam) => {
    setSelectedExam(exam);
    setUserAnswers({});
    setSubmitted(false);
    setTimer(0);
    setIsTimerRunning(true);
    setActiveTab('practice');
  };

  // --- SCORE CALCULATOR ---
  const calculateScore = () => {
    if (!selectedExam) return { total: 0, correct: 0, percentage: 0, mark: '0.0' };
    let correct = 0;

    selectedExam.questions.forEach((q) => {
      const uAns = userAnswers[q.id];
      if (q.type === 'mc' && uAns === q.correctAnswer) correct++;
      if (q.type === 'tf' && uAns === q.correctAnswer) correct++;
      if (
        q.type === 'short' &&
        uAns &&
        uAns.trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
      ) {
        correct++;
      }
    });

    const total = selectedExam.questions.length;
    const percentage = Math.round((correct / total) * 100);
    const mark = ((correct / total) * 10).toFixed(1);

    return { total, correct, percentage, mark };
  };

  // --- TIME FORMATTER ---
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- EXPORT JSON ---
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(folders, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ExamaRosa_Copia_De_Seguridad_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // --- IMPORT JSON ---
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData)) {
          setFolders(importedData);
          alert('¡Base de datos cargada correctamente!');
        } else {
          alert('El archivo cargado no tiene la estructura de carpetas válida.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  // --- HELPER: GET ALL TOPICS FOR DROPDOWN ---
  const getAllTopics = () => {
    const list = [];
    folders.forEach((c) => {
      (c.children || []).forEach((t) => {
        (t.children || []).forEach((m) => {
          list.push({ id: m.id, name: `${c.name} ➔ ${t.name} ➔ ${m.name}` });
        });
      });
    });
    return list;
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1a0910] font-serif flex flex-col selection:bg-[#ffccd5] selection:text-[#590d22]">
      {/* GLOBAL CUSTOM STYLES */}
      <style>{`
        body, button, input, textarea, select {
          font-family: 'Georgia', 'Times New Roman', serif;
        }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>

      {/* HEADER NAVBAR */}
      <header className="bg-gradient-to-r from-[#4a081a] via-[#700d27] to-[#800f2f] text-white shadow-md border-b border-[#a4133c] no-print">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-sm shadow-inner">
              <BookOpen className="w-6 h-6 text-[#ffccd5]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight italic flex items-center gap-2">
                ExamaRosa <span className="text-[10px] uppercase tracking-widest bg-[#ffccd5] text-[#590d22] font-sans not-italic font-extrabold px-2 py-0.5 rounded-full">Fondo Blanco</span>
              </h1>
              <p className="text-xs text-[#ffccd5] italic">Plataforma Educativa de Exámenes Interactivos</p>
            </div>
          </div>

          {/* TOP NAVIGATION BAR */}
          <nav className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-2xl backdrop-blur-md border border-white/10">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'library' ? 'bg-white text-[#800f2f] shadow-md' : 'text-[#ffccd5] hover:bg-white/10'
              }`}
            >
              <Folder className="w-4 h-4" /> Mis Cursos
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'generator' ? 'bg-white text-[#800f2f] shadow-md' : 'text-[#ffccd5] hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#a4133c]" /> Generar Examen
            </button>

            {selectedExam && (
              <button
                onClick={() => setActiveTab('practice')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'practice' ? 'bg-white text-[#800f2f] shadow-md' : 'text-[#ffccd5] hover:bg-white/10'
                }`}
              >
                <Play className="w-4 h-4" /> Modo Examen
              </button>
            )}

            <button
              onClick={() => setActiveTab('deployment')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'deployment' ? 'bg-white text-[#800f2f] shadow-md' : 'text-[#ffccd5] hover:bg-white/10'
              }`}
            >
              <Globe className="w-4 h-4" /> Guía Netlify
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-6 bg-[#ffffff]">
        
        {/* SIDEBAR: FOLDER HIERARCHY */}
        <aside className="w-full md:w-80 bg-[#fdf7f9] rounded-3xl shadow-sm border border-[#ffe5ec] p-5 no-print flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#ffccd5]">
            <h2 className="text-base font-bold text-[#800f2f] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#a4133c]" /> Asignaturas y Temas
            </h2>
            <button
              onClick={() => {
                setModalType('course');
                setModalParentId(null);
                setModalOpen(true);
              }}
              className="p-1.5 bg-[#800f2f] text-white hover:bg-[#590d22] rounded-xl transition-all shadow-sm"
              title="Añadir Curso"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[calc(100vh-220px)]">
            {folders.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs italic">
                No hay asignaturas creadas.<br />Haz clic en + para empezar.
              </div>
            ) : (
              folders.map((course) => (
                <div key={course.id} className="text-xs">
                  {/* COURSE ROW */}
                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#ffe5ec] text-[#1a0910] font-bold transition-colors group">
                    <div 
                      className="flex items-center gap-2 cursor-pointer flex-1 truncate"
                      onClick={() => toggleFolder(course.id)}
                    >
                      {expandedFolders[course.id] ? (
                        <ChevronDown className="w-4 h-4 text-[#a4133c]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#a4133c]" />
                      )}
                      <Folder className="w-4 h-4 text-[#800f2f]" />
                      <span className="truncate">{course.name}</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={() => {
                          setModalType('trimester');
                          setModalParentId(course.id);
                          setModalOpen(true);
                        }}
                        className="p-1 text-[#800f2f] hover:bg-[#ffb3c6] rounded-md"
                        title="Añadir Trimestre"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteItem(e, course.id, 'course')}
                        className="p-1 text-rose-600 hover:bg-rose-100 rounded-md"
                        title="Eliminar Curso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* TRIMESTERS LIST */}
                  {expandedFolders[course.id] && (
                    <div className="pl-4 ml-2 border-l-2 border-[#ffccd5] space-y-1 mt-1">
                      {(course.children || []).map((trimester) => (
                        <div key={trimester.id}>
                          <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#ffe5ec] text-[#1a0910] group">
                            <div 
                              className="flex items-center gap-2 cursor-pointer flex-1 truncate"
                              onClick={() => toggleFolder(trimester.id)}
                            >
                              {expandedFolders[trimester.id] ? (
                                <ChevronDown className="w-3.5 h-3.5 text-[#c9184a]" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-[#c9184a]" />
                              )}
                              <Folder className="w-3.5 h-3.5 text-[#a4133c]" />
                              <span className="truncate font-medium">{trimester.name}</span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setModalType('topic');
                                  setModalParentId(trimester.id);
                                  setModalOpen(true);
                                }}
                                className="p-1 text-[#800f2f] hover:bg-[#ffb3c6] rounded-md"
                                title="Añadir Tema"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteItem(e, trimester.id, 'trimester')}
                                className="p-1 text-rose-600 hover:bg-rose-100 rounded-md"
                                title="Eliminar Trimestre"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* TOPICS LIST */}
                          {expandedFolders[trimester.id] && (
                            <div className="pl-4 ml-2 border-l border-[#ffccd5] space-y-1 mt-1">
                              {(trimester.children || []).map((topic) => (
                                <div
                                  key={topic.id}
                                  onClick={() => {
                                    setSelectedTopic(topic);
                                    setActiveTab('library');
                                  }}
                                  className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-all group ${
                                    selectedTopic?.id === topic.id 
                                      ? 'bg-[#800f2f] text-white font-semibold shadow-sm' 
                                      : 'hover:bg-[#ffe5ec] text-[#1a0910]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <FileText className={`w-3.5 h-3.5 ${selectedTopic?.id === topic.id ? 'text-[#ffccd5]' : 'text-[#c9184a]'}`} />
                                    <span className="truncate">{topic.name}</span>
                                  </div>
                                  <button
                                    onClick={(e) => handleDeleteItem(e, topic.id, 'topic')}
                                    className={`opacity-0 group-hover:opacity-100 p-1 rounded ${
                                      selectedTopic?.id === topic.id ? 'text-white hover:bg-[#590d22]' : 'text-rose-600 hover:bg-rose-200'
                                    }`}
                                    title="Eliminar Tema"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* MAIN PANEL CONTENT */}
        <main className="flex-1 bg-[#ffffff] rounded-3xl shadow-sm border border-[#ffe5ec] p-6 min-h-[520px] flex flex-col">
          
          {/* TAB 1: LIBRARY & EXAMS LIST */}
          {activeTab === 'library' && (
            <div className="flex-1">
              {selectedTopic ? (
                <div>
                  <div className="flex justify-between items-center pb-4 mb-6 border-b border-[#ffe5ec]">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#a4133c]">Tema Seleccionado</span>
                      <h2 className="text-2xl font-bold text-[#1a0910]">{selectedTopic.name}</h2>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTargetTopicId(selectedTopic.id);
                        setActiveTab('generator');
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#800f2f] hover:bg-[#590d22] text-white rounded-2xl font-semibold shadow-sm transition-all text-xs"
                    >
                      <Plus className="w-4 h-4" /> Crear Nuevo Examen
                    </button>
                  </div>

                  {(!selectedTopic.exams || selectedTopic.exams.length === 0) ? (
                    <div className="text-center py-16 border-2 border-dashed border-[#ffb3c6] rounded-3xl p-8 bg-[#fdf7f9]">
                      <FileText className="w-12 h-12 text-[#a4133c] mx-auto mb-3 opacity-80" />
                      <h3 className="text-lg font-bold text-[#1a0910]">No hay exámenes guardados en este tema</h3>
                      <p className="text-xs text-gray-600 mb-5 italic">
                        Genera cuestionarios automatizados desde tus apuntes o creados manualmente.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedTargetTopicId(selectedTopic.id);
                          setActiveTab('generator');
                        }}
                        className="px-5 py-2.5 bg-[#800f2f] text-white rounded-xl hover:bg-[#590d22] transition-all font-bold text-xs shadow-md"
                      >
                        Abrir Generador de Exámenes
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTopic.exams.map((exam) => (
                        <div
                          key={exam.id}
                          className="border border-[#ffe5ec] rounded-2xl p-5 bg-[#fdf7f9] hover:bg-white hover:border-[#ffb3c6] hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-base text-[#800f2f]">{exam.title}</h3>
                              <span className="text-xs bg-[#ffe5ec] text-[#800f2f] px-2.5 py-0.5 rounded-full font-bold border border-[#ffccd5]">
                                {exam.questions.length} preg.
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-4 italic line-clamp-2">{exam.description}</p>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-[#ffe5ec] text-xs text-gray-500">
                            <span>Fecha: {exam.createdAt}</span>
                            <button
                              onClick={() => handleStartExam(exam)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#800f2f] text-white rounded-xl font-bold hover:bg-[#590d22] transition-all shadow-sm"
                            >
                              <Play className="w-3.5 h-3.5" /> Realizar Examen
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-20 my-auto">
                  <div className="w-16 h-16 bg-[#ffe5ec] text-[#800f2f] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#ffccd5] shadow-sm">
                    <Folder className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1a0910] mb-2">Selecciona un Tema para Comenzar</h3>
                  <p className="text-gray-600 max-w-md mx-auto text-xs italic mb-6">
                    Elige un tema en la barra lateral para ver o realizar sus exámenes, o haz clic en "Generar Examen".
                  </p>
                  <button
                    onClick={() => setActiveTab('generator')}
                    className="px-6 py-2.5 bg-[#800f2f] text-white rounded-2xl hover:bg-[#590d22] shadow-sm font-bold text-xs transition-all"
                  >
                    Crear un Examen sin Categorizar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUTOMATIC GENERATOR */}
          {activeTab === 'generator' && (
            <div className="space-y-6">
              {!editingExam ? (
                <>
                  <div className="border-b border-[#ffe5ec] pb-4">
                    <h2 className="text-2xl font-bold text-[#1a0910] flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-[#a4133c]" /> Generador Inteligente de Exámenes
                    </h2>
                    <p className="text-xs text-gray-600 italic">
                      Genera un examen tipo test, verdadero/falso y de respuesta corta a partir de tus notas de texto o archivos adjuntos.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#800f2f]">Título del Examen</label>
                      <input
                        type="text"
                        placeholder="Ej. Examen de Biología - Tema 1"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        className="w-full p-2.5 text-xs border border-[#ffe5ec] rounded-xl bg-[#fdf7f9] focus:outline-none focus:border-[#800f2f]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#800f2f]">Asignar a Tema (Opcional)</label>
                      <select
                        value={selectedTargetTopicId}
                        onChange={(e) => setSelectedTargetTopicId(e.target.value)}
                        className="w-full p-2.5 text-xs border border-[#ffe5ec] rounded-xl bg-[#fdf7f9] focus:outline-none focus:border-[#800f2f]"
                      >
                        <option value="">-- Sin asignar / General --</option>
                        {getAllTopics().map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* CONFIG OPTIONS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#fdf7f9] rounded-2xl border border-[#ffe5ec]">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#800f2f]">Número de Preguntas</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                        className="w-full p-2 text-xs border border-[#ffe5ec] rounded-xl bg-white focus:outline-none focus:border-[#800f2f]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#800f2f]">Dificultad Estimada</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full p-2 text-xs border border-[#ffe5ec] rounded-xl bg-white focus:outline-none focus:border-[#800f2f]"
                      >
                        <option value="Básica">Básica</option>
                        <option value="Media">Media</option>
                        <option value="Avanzada">Avanzada</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#800f2f]">Tipos de Pregunta</label>
                      <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={questionTypes.mc}
                            onChange={(e) => setQuestionTypes({ ...questionTypes, mc: e.target.checked })}
                          />
                          <span>Opción Múltiple</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={questionTypes.tf}
                            onChange={(e) => setQuestionTypes({ ...questionTypes, tf: e.target.checked })}
                          />
                          <span>V / F</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={questionTypes.short}
                            onChange={(e) => setQuestionTypes({ ...questionTypes, short: e.target.checked })}
                          />
                          <span>Respuesta Corta</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* INPUT SOURCE SELECTOR */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#800f2f]">Notas de Estudio o Contenido del Tema</label>
                      <label className="text-xs text-[#a4133c] hover:underline cursor-pointer flex items-center gap-1 font-bold">
                        <Upload className="w-3.5 h-3.5" /> Subir archivo de texto (.txt, .md)
                        <input type="file" accept=".txt,.md,.json" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>

                    <textarea
                      rows={6}
                      placeholder="Pega aquí tus apuntes o párrafos de texto. El sistema analizará el contenido para estructurar las preguntas..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="w-full p-3 text-xs border border-[#ffe5ec] rounded-xl bg-[#fdf7f9] focus:outline-none focus:border-[#800f2f]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleGenerateExam}
                      disabled={isGenerating}
                      className="px-6 py-3 bg-[#800f2f] hover:bg-[#590d22] text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
                    >
                      {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {isGenerating ? 'Generando Examen...' : 'Generar Cuestionario Automático'}
                    </button>
                  </div>
                </>
              ) : (
                /* PREVIEW GENERATED EXAM BEFORE SAVING */
                <div className="space-y-5">
                  <div className="flex justify-between items-center pb-3 border-b border-[#ffe5ec]">
                    <div>
                      <span className="text-xs font-bold text-[#a4133c] uppercase">Vista Previa del Examen</span>
                      <h3 className="text-xl font-bold text-[#800f2f]">{editingExam.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingExam(null)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
                      >
                        Regresar
                      </button>
                      <button
                        onClick={handleSaveExamToTopic}
                        className="px-5 py-2 bg-[#800f2f] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#590d22] flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" /> Guardar y Comenzar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {editingExam.questions.map((q, idx) => (
                      <div key={q.id} className="p-4 bg-[#fdf7f9] rounded-2xl border border-[#ffe5ec] text-xs space-y-2">
                        <div className="flex justify-between">
                          <p className="font-bold text-[#1a0910]">
                            {idx + 1}. [{q.type.toUpperCase()}] {q.question}
                          </p>
                        </div>
                        {q.type === 'mc' && (
                          <ul className="pl-4 space-y-1 text-gray-700 list-disc">
                            {q.options.map((opt, oIdx) => (
                              <li key={oIdx} className={oIdx === q.correctAnswer ? 'font-bold text-emerald-800' : ''}>
                                {opt} {oIdx === q.correctAnswer && '(Correcta)'}
                              </li>
                            ))}
                          </ul>
                        )}
                        {q.type === 'tf' && (
                          <p className="text-gray-700 font-semibold">Respuesta correcta: {q.correctAnswer ? 'Verdadero' : 'Falso'}</p>
                        )}
                        {q.type === 'short' && (
                          <p className="text-gray-700 font-semibold">Clave esperada: {q.correctAnswer}</p>
                        )}
                        <p className="text-[#a4133c] text-[11px] italic bg-white p-2 rounded-lg border border-[#ffe5ec]">
                          Explicación: {q.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRACTICE EXAM MODE */}
          {activeTab === 'practice' && selectedExam && (
            <div className="space-y-6">
              {/* TOP PRACTICE BAR */}
              <div className="flex justify-between items-center pb-4 border-b border-[#ffe5ec]">
                <div>
                  <span className="text-xs font-bold text-[#a4133c] uppercase">Modo Evaluación Activo</span>
                  <h2 className="text-xl font-bold text-[#800f2f]">{selectedExam.title}</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ffe5ec] text-[#800f2f] rounded-xl font-mono text-xs font-bold border border-[#ffccd5]">
                    <Clock className="w-4 h-4 text-[#a4133c]" />
                    <span>{formatTime(timer)}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('library')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Salir
                  </button>
                </div>
              </div>

              {/* QUESTIONS FORM */}
              <div className="space-y-6">
                {selectedExam.questions.map((q, idx) => (
                  <div key={q.id} className="p-5 bg-[#fdf7f9] rounded-2xl border border-[#ffe5ec] space-y-3">
                    <p className="font-bold text-sm text-[#1a0910]">
                      {idx + 1}. {q.question}
                    </p>

                    {/* MULTIPLE CHOICE */}
                    {q.type === 'mc' && (
                      <div className="space-y-2 pt-1">
                        {q.options.map((opt, oIdx) => (
                          <label
                            key={oIdx}
                            className={`flex items-center gap-2 text-xs cursor-pointer p-2.5 rounded-xl border transition-all ${
                              userAnswers[q.id] === oIdx
                                ? 'bg-[#ffe5ec] border-[#800f2f] font-bold text-[#800f2f]'
                                : 'bg-white border-[#ffe5ec] hover:border-[#ffccd5] text-gray-800'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q_${q.id}`}
                              checked={userAnswers[q.id] === oIdx}
                              onChange={() => setUserAnswers({ ...userAnswers, [q.id]: oIdx })}
                              disabled={submitted}
                              className="accent-[#800f2f]"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* TRUE / FALSE */}
                    {q.type === 'tf' && (
                      <div className="flex gap-3 pt-1 text-xs">
                        <label
                          className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            userAnswers[q.id] === true
                              ? 'bg-[#ffe5ec] border-[#800f2f] font-bold text-[#800f2f]'
                              : 'bg-white border-[#ffe5ec] hover:border-[#ffccd5]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            checked={userAnswers[q.id] === true}
                            onChange={() => setUserAnswers({ ...userAnswers, [q.id]: true })}
                            disabled={submitted}
                            className="accent-[#800f2f]"
                          />
                          <span>Verdadero</span>
                        </label>
                        <label
                          className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            userAnswers[q.id] === false
                              ? 'bg-[#ffe5ec] border-[#800f2f] font-bold text-[#800f2f]'
                              : 'bg-white border-[#ffe5ec] hover:border-[#ffccd5]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            checked={userAnswers[q.id] === false}
                            onChange={() => setUserAnswers({ ...userAnswers, [q.id]: false })}
                            disabled={submitted}
                            className="accent-[#800f2f]"
                          />
                          <span>Falso</span>
                        </label>
                      </div>
                    )}

                    {/* SHORT ANSWER */}
                    {q.type === 'short' && (
                      <input
                        type="text"
                        placeholder="Escribe aquí tu respuesta corta..."
                        value={userAnswers[q.id] || ''}
                        onChange={(e) => setUserAnswers({ ...userAnswers, [q.id]: e.target.value })}
                        disabled={submitted}
                        className="w-full p-2.5 text-xs border border-[#ffe5ec] rounded-xl bg-white focus:outline-none focus:border-[#800f2f]"
                      />
                    )}

                    {/* EXPLANATION UPON SUBMISSION */}
                    {submitted && (
                      <div className="mt-3 p-3 bg-white rounded-xl border border-[#ffccd5] text-xs space-y-1">
                        <p className="font-bold text-[#800f2f] flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-[#a4133c]" /> Justificación Didáctica:
                        </p>
                        <p className="text-gray-600 italic">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ACTION BUTTONS */}
              {!submitted ? (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => {
                      setSubmitted(true);
                      setIsTimerRunning(false);
                    }}
                    className="px-6 py-2.5 bg-[#800f2f] text-white rounded-xl text-xs font-bold hover:bg-[#590d22] shadow-md transition-all"
                  >
                    Entregar Examen y Calificar
                  </button>
                </div>
              ) : (
                <div className="p-6 bg-[#fdf7f9] rounded-2xl border border-[#ffccd5] text-center space-y-3">
                  <div className="w-12 h-12 bg-[#ffe5ec] text-[#800f2f] rounded-full flex items-center justify-center mx-auto border border-[#ffccd5]">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#800f2f]">¡Examen Finalizado!</h3>
                  <div className="text-sm font-bold text-[#1a0910]">
                    Nota Final: <span className="text-2xl text-[#a4133c]">{calculateScore().mark}</span> / 10
                  </div>
                  <p className="text-xs text-gray-600 italic">
                    Aciertos: {calculateScore().correct} de {calculateScore().total} ({calculateScore().percentage}%) en un tiempo de {formatTime(timer)}
                  </p>
                  <button
                    onClick={() => {
                      setUserAnswers({});
                      setSubmitted(false);
                      setTimer(0);
                      setIsTimerRunning(true);
                    }}
                    className="px-5 py-2 bg-[#800f2f] text-white rounded-xl text-xs font-bold hover:bg-[#590d22] transition-all"
                  >
                    Repetir Examen
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NETLIFY DEPLOYMENT & SPA CONFIGURATION GUIDE */}
          {activeTab === 'deployment' && (
            <div className="space-y-6">
              <div className="border-b border-[#ffe5ec] pb-4">
                <h2 className="text-2xl font-bold text-[#1a0910] flex items-center gap-2">
                  <Globe className="w-6 h-6 text-[#a4133c]" /> Configuración de Despliegue en Netlify
                </h2>
                <p className="text-xs text-gray-600 italic">
                  Solución definitiva para evitar el error "Page Not Found (404)" al desplegar aplicaciones React SPA.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* STEP 1 */}
                <div className="p-4 bg-[#fdf7f9] rounded-2xl border border-[#ffe5ec] space-y-2">
                  <h3 className="font-bold text-[#800f2f] text-sm flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#a4133c]" /> Paso 1: Crear el archivo de redirección SPA
                  </h3>
                  <p className="text-gray-700">
                    Crea un archivo llamado exactamente <code className="bg-white px-2 py-0.5 rounded border border-[#ffccd5] font-bold">_redirects</code> (sin ninguna extensión de archivo) dentro de la carpeta <code className="font-bold">public</code> de tu proyecto.
                  </p>
                  <pre className="bg-[#1a0910] text-[#ffccd5] p-3 rounded-xl font-mono text-[11px]">
{`/*    /index.html   200`}
                  </pre>
                </div>

                {/* STEP 2 */}
                <div className="p-4 bg-[#fdf7f9] rounded-2xl border border-[#ffe5ec] space-y-2">
                  <h3 className="font-bold text-[#800f2f] text-sm flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#a4133c]" /> Paso 2: Configurar parámetros en Netlify
                  </h3>
                  <p className="text-gray-700">En el panel de control de tu proyecto en Netlify, confirma los siguientes ajustes:</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li><strong>Build Command:</strong> <code className="bg-white px-1.5 py-0.5 rounded border">npm run build</code></li>
                    <li><strong>Publish Directory:</strong> <code className="bg-white px-1.5 py-0.5 rounded border">dist</code> (para proyectos con Vite) o <code className="bg-white px-1.5 py-0.5 rounded border">build</code> (para Create React App)</li>
                  </ul>
                </div>

                {/* BACKUP DATA SECTION */}
                <div className="p-4 bg-[#fdf7f9] rounded-2xl border border-[#ffe5ec] space-y-3">
                  <h3 className="font-bold text-[#800f2f] text-sm flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-[#a4133c]" /> Copia de Seguridad de Exámenes
                  </h3>
                  <p className="text-gray-700">
                    Exporta o importa tus cursos, temas y evaluaciones en formato JSON para transferirlos a cualquier otra instancia:
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      onClick={handleExportJSON}
                      className="px-4 py-2 bg-[#800f2f] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#590d22] transition-all shadow-sm"
                    >
                      <Download className="w-4 h-4" /> Exportar Copia JSON
                    </button>
                    <label className="px-4 py-2 bg-white text-[#800f2f] border border-[#ffccd5] rounded-xl font-bold flex items-center gap-2 cursor-pointer hover:bg-[#ffe5ec] transition-all">
                      <Upload className="w-4 h-4" /> Importar Copia JSON
                      <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL FOR ADDING COURSES / TRIMESTERS / TOPICS */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-[#ffe5ec] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#800f2f]">
              {modalType === 'course' && 'Añadir Nueva Asignatura / Curso'}
              {modalType === 'trimester' && 'Añadir Nuevo Trimestre'}
              {modalType === 'topic' && 'Añadir Nuevo Tema de Estudio'}
            </h3>
            <input
              type="text"
              placeholder="Escribe el nombre del elemento..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full p-3 text-xs border border-[#ffe5ec] rounded-xl bg-[#fdf7f9] focus:outline-none focus:border-[#800f2f]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem();
              }}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-[#800f2f] text-white rounded-xl text-xs font-bold hover:bg-[#590d22]"
              >
                Guardar Elemento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
