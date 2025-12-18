
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, X, Send, Loader2, 
  BarChart3, AlertTriangle, CheckCircle2,
  User, Moon, Sun, Search, Settings, 
  Clock, Save, Users, ShieldCheck, Plus, Trash2, Edit3, LogOut,
  HelpCircle, QrCode, UserPlus, UserMinus, Info,
  ChevronRight, Download, Eye, Bell, BellRing, KeyRound, RefreshCw, Printer,
  ArrowUpDown, ChevronUp, ChevronDown, FileJson, Lock, Shield, AlertOctagon
} from 'lucide-react';
import { getAIAnalysis } from './services/geminiService';

/**
 * Ícone Temático SST: Escudo de Segurança (Versão Original)
 * Design limpo e profissional focado em conformidade técnica.
 */
const SSTIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);

interface InventoryItem {
  id: string;
  code: string;
  description: string;
  classification: string;
  function: string;
  color: string;
  shape: string;
  size: string;
  extras: string;
  entry: number;
  exit: number;
  minStock: number;
  maxStock: number;
  observations: string;
  createdBy: string;
  updatedBy: string;
  updatedAt: string;
}

interface UserProfile {
  id: string;
  name: string;
  role: string;
  pass: string;
  isAdmin?: boolean;
  resetRequested?: boolean;
}

const ADMIN_MASTER: UserProfile = { 
  id: 'admin', 
  name: 'Administrador', 
  role: 'Diretoria / TI', 
  pass: '@dm123', 
  isAdmin: true 
};

// Mais usuários para teste
const INITIAL_USERS: UserProfile[] = [
  { id: '1', name: 'Ricardo Santos', role: 'Eng. de Segurança', pass: '1234' },
  { id: '2', name: 'Ana Paula', role: 'Técnico SST', pass: '1234' },
  { id: '3', name: 'Carlos Oliveira', role: 'Supervisor Logístico', pass: '1234' },
  { id: '4', name: 'Juliana Lima', role: 'Auxiliar de Almoxarifado', pass: '1234' },
];

// Mais itens para teste
const INITIAL_DATA: InventoryItem[] = [
  { 
    id: '1', code: 'S001', description: 'ENTRADA PEDESTRE', classification: 'IDENTIFICAÇÃO', 
    function: 'INFORMAÇÃO', color: 'VERDE', shape: 'RETANGULAR', size: '30x20cm', extras: 'Refletiva',
    entry: 50, exit: 10, minStock: 15, maxStock: 100,
    observations: 'Placas instaladas no portão A.', createdBy: 'Ricardo Santos', 
    updatedBy: 'Ricardo Santos', updatedAt: '2025-05-20 10:00' 
  },
  { 
    id: '2', code: 'A005', description: 'SAÍDA DE EMERGÊNCIA', classification: 'SEGURANÇA', 
    function: 'SALVAMENTO', color: 'VERDE', shape: 'RETANGULAR', size: '40x15cm', extras: 'Fotoluminescente',
    entry: 20, exit: 5, minStock: 10, maxStock: 50,
    observations: 'Corredor principal.', createdBy: 'Ana Paula', 
    updatedBy: 'Ana Paula', updatedAt: '2025-05-21 14:30' 
  },
  { 
    id: '3', code: 'P012', description: 'PERIGO ALTA TENSÃO', classification: 'AVISO', 
    function: 'ADVERTÊNCIA', color: 'AMARELO', shape: 'TRIANGULAR', size: '20x20cm', extras: 'Alumínio 1mm',
    entry: 30, exit: 25, minStock: 10, maxStock: 60,
    observations: 'Subestação Sul.', createdBy: 'Carlos Oliveira', 
    updatedBy: 'Carlos Oliveira', updatedAt: '2025-05-22 09:15' 
  },
  { 
    id: '4', code: 'E008', description: 'USO OBRIGATÓRIO DE CAPACETE', classification: 'OBRIGATORIEDADE', 
    function: 'PREVENÇÃO', color: 'AZUL', shape: 'CIRCULAR', size: '30cm Diâmetro', extras: 'Vinil Adesivo',
    entry: 100, exit: 20, minStock: 20, maxStock: 200,
    observations: 'Áreas de carga e descarga.', createdBy: 'Juliana Lima', 
    updatedBy: 'Juliana Lima', updatedAt: '2025-05-23 16:40' 
  },
  { 
    id: '5', code: 'X003', description: 'EXTINTOR DE INCÊNDIO', classification: 'SEGURANÇA', 
    function: 'EQUIPAMENTO', color: 'VERMELHO', shape: 'QUADRADA', size: '20x20cm', extras: 'Fotoluminescente',
    entry: 15, exit: 12, minStock: 5, maxStock: 30,
    observations: 'Troca anual necessária.', createdBy: 'Ana Paula', 
    updatedBy: 'Ana Paula', updatedAt: '2025-05-24 11:00' 
  },
];

type SortKey = keyof InventoryItem | 'saldo';

const App: React.FC = () => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [postLoginLoading, setPostLoginLoading] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  
  const [previousAccessInfo, setPreviousAccessInfo] = useState<{name: string, time: string} | null>({
    name: "Acesso de Teste", time: "24/05/2025, 09:12:44"
  });
  const [currentSessionAccess, setCurrentSessionAccess] = useState<{name: string, time: string} | null>(null);
  
  const [forgotPassSent, setForgotPassSent] = useState(false);
  
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>(null);
  
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_DATA);
  const [users, setUsers] = useState<UserProfile[]>([...INITIAL_USERS, ADMIN_MASTER]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [qrPreviewItem, setQrPreviewItem] = useState<InventoryItem | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState("");

  const [aiChat, setAiChat] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const totalEntrada = items.reduce((acc, item) => acc + item.entry, 0);
    const totalSaida = items.reduce((acc, item) => acc + item.exit, 0);
    const alertItems = items.filter(item => (item.entry - item.exit) <= item.minStock);
    const resetRequests = users.filter(u => u.resetRequested);
    return { 
      totalEntrada, 
      totalSaida, 
      saldo: totalEntrada - totalSaida, 
      itensCriticos: alertItems.length,
      alertItems,
      resetRequests,
      resetRequestsCount: resetRequests.length
    };
  }, [items, users]);

  const processedItems = useMemo(() => {
    let result = [...items];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(i => 
        i.description.toLowerCase().includes(term) || 
        i.code.toLowerCase().includes(term)
      );
    }
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = sortConfig.key === 'saldo' ? (a.entry - a.exit) : (a[sortConfig.key as keyof InventoryItem] as any);
        const bVal = sortConfig.key === 'saldo' ? (b.entry - b.exit) : (b[sortConfig.key as keyof InventoryItem] as any);
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [items, searchTerm, sortConfig]);

  const handleLogin = () => {
    const userInList = users.find(u => u.id === currentUser.id);
    if (userInList && loginPass === userInList.pass) {
      setLoginError("");
      setPostLoginLoading(true);
      const accessTime = new Date().toLocaleString('pt-BR');
      if (currentSessionAccess) setPreviousAccessInfo(currentSessionAccess);
      setCurrentSessionAccess({ name: userInList.name, time: accessTime });
      setTimeout(() => {
        setPostLoginLoading(false);
        setIsLogged(true);
        setLoginPass("");
      }, 3000);
    } else {
      setLoginError("Senha incorreta.");
      setTimeout(() => setLoginError(""), 3000);
    }
  };

  const handleForgotPassword = () => {
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, resetRequested: true } : u));
    setForgotPassSent(true);
    setTimeout(() => setForgotPassSent(false), 5000);
  };

  const handleAdminResetPassword = (userId: string, targetPass?: string) => {
    const p = targetPass || "1234";
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, pass: p, resetRequested: false } : u));
    alert("Senha alterada com sucesso via Administração.");
  };

  const handleChangeOwnPassword = () => {
    if (!newPass || newPass.length < 4) { setPassError("Mínimo 4 caracteres."); return; }
    if (newPass !== confirmPass) { setPassError("Senhas não coincidem."); return; }
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, pass: newPass, resetRequested: false } : u));
    alert("Sua senha foi alterada com sucesso!");
    setIsChangingPass(false);
    setNewPass("");
    setConfirmPass("");
  };

  const handleSaveItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date().toLocaleString();
    const newItem: InventoryItem = {
      id: editingItem?.id || Math.random().toString(36).substr(2, 9),
      code: (formData.get('code') as string).toUpperCase(),
      description: (formData.get('description') as string).toUpperCase(),
      classification: formData.get('classification') as string,
      function: formData.get('function') as string,
      color: formData.get('color') as string,
      shape: formData.get('shape') as string,
      size: formData.get('size') as string,
      extras: formData.get('extras') as string,
      observations: formData.get('observations') as string,
      entry: parseInt(formData.get('entry') as string) || 0,
      exit: parseInt(formData.get('exit') as string) || 0,
      minStock: parseInt(formData.get('minStock') as string) || 0,
      maxStock: parseInt(formData.get('maxStock') as string) || 100,
      createdBy: editingItem?.createdBy || currentUser.name,
      updatedBy: currentUser.name,
      updatedAt: now,
    };
    if (editingItem) {
      setItems(prev => prev.map(i => i.id === editingItem.id ? newItem : i));
    } else {
      setItems(prev => [newItem, ...prev]);
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    const itemToDelete = items.find(i => i.id === id);
    if (!itemToDelete) return;

    const confirm = window.confirm(`CONFIRMAÇÃO DE EXCLUSÃO DEFINITIVA:\nDeseja remover a placa "${itemToDelete.description}" do estoque?\nEsta ação é irreversível.`);
    
    if (confirm) {
      setItems(prev => prev.filter(item => item.id !== id));
      if (qrPreviewItem?.id === id) setQrPreviewItem(null);
    }
  };

  const handleRemoveUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.isAdmin && user.id === 'admin') {
      alert("Operação Bloqueada: O perfil mestre (Administrador) não pode ser excluído.");
      return;
    }

    const confirm = window.confirm(`AVISO DE SEGURANÇA:\nDeseja remover permanentemente o acesso do operador "${user.name}"?\nEsta exclusão é definitiva e imediata.`);
    
    if (confirm) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleAskAi = async () => {
    if (!aiInput.trim()) return;
    const userMsg = aiInput;
    setAiInput("");
    setAiChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAiLoading(true);
    try {
      const result = await getAIAnalysis(items, userMsg);
      setAiChat(prev => [...prev, { role: 'bot', text: result }]);
    } catch (error) {
      setAiChat(prev => [...prev, { role: 'bot', text: "Erro ao processar requisição na IA." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const downloadQRCode = async (item: InventoryItem, format: 'png' | 'pdf') => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${item.code}-${item.id}`;
    if (format === 'png') {
      const response = await fetch(url);
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = `QR_${item.code}.png`;
      a.click();
    } else {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;margin:0;padding:20px;text-align:center;">
          <h1 style="color:#375623;text-transform:uppercase;font-size:24px;">${item.description}</h1>
          <div style="border:10px solid #375623;display:inline-block;padding:20px;border-radius:30px;">
            <img src="${url}" style="width:300px;"/>
          </div>
          <p style="font-weight:900;margin-top:20px;font-size:18px;">CÓDIGO: ${item.code}</p>
          <p style="font-weight:700;">TAMANHO: ${item.size} | FORMATO: ${item.shape}</p>
          <p style="color:#666;font-size:12px;margin-top:40px;">GRUPO NEWCOM - SISTEMAS DE SINALIZAÇÃO TÉCNICA</p>
          <script>setTimeout(() => {window.print();window.close();}, 800);</script>
        </body>
      `);
    }
  };

  if (initialLoading) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center ${darkMode ? 'bg-[#0a0a0a]' : 'bg-[#375623]'}`}>
        <SSTIcon size={120} className="text-white animate-pulse mb-6" />
        <h1 className="text-white text-3xl font-black uppercase tracking-widest">Grupo <span className="text-[#76923c]">Newcom</span></h1>
        <p className="text-white/40 text-[10px] uppercase font-bold mt-4 tracking-widest">Iniciando Banco de Dados SST</p>
      </div>
    );
  }

  if (postLoginLoading) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center ${darkMode ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
        <div className="flex flex-col items-center space-y-6">
          <SSTIcon className={`${darkMode ? 'text-[#76923c]' : 'text-[#375623]'} animate-bounce`} size={100} />
          <h2 className={`text-2xl font-black uppercase ${darkMode ? 'text-white' : 'text-[#375623]'}`}>Autenticando</h2>
          <div className="w-64 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#76923c] animate-[loading_3s_ease-in-out_forwards]" style={{width: '0%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLogged) {
    return (
      <div className={`h-screen w-full flex items-center justify-center p-4 ${darkMode ? 'bg-[#0a0a0a]' : 'bg-[#f0f4ef]'}`}>
        <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${darkMode ? 'bg-[#121212] border border-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="p-5 bg-[#375623] rounded-3xl mb-4 shadow-xl">
              <SSTIcon className="text-white" size={64} />
            </div>
            <h2 className={`text-2xl font-black uppercase ${darkMode ? 'text-white' : 'text-[#375623]'}`}>Newcom SST</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-gray-400">Logística de Sinalização Técnica</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Selecione Operador</label>
              <select 
                className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-[#1a1a1a] border-gray-800 text-white focus:border-[#76923c]' : 'bg-gray-50 border-gray-200 text-black focus:border-[#375623]'}`}
                onChange={(e) => setCurrentUser(users.find(u => u.id === e.target.value) || users[0])}
                value={currentUser.id}
              >
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Credencial de Acesso</label>
              <input 
                type="password" placeholder="••••••••"
                className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${loginError ? 'border-red-500 animate-shake' : (darkMode ? 'bg-[#1a1a1a] border-gray-800 text-white focus:border-[#76923c]' : 'bg-gray-50 border-gray-200 text-black focus:border-[#375623]')}`}
                value={loginPass} onChange={(e) => {setLoginPass(e.target.value); setLoginError("");}}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              {loginError && <p className="text-[10px] text-red-500 font-bold uppercase mt-2 ml-2">{loginError}</p>}
            </div>
            <button onClick={handleLogin} className="w-full bg-[#375623] hover:bg-[#2a411a] text-white py-4 rounded-xl font-black shadow-xl flex items-center justify-center space-x-2 transition-transform active:scale-95">
              <ShieldCheck size={20} /> <span>ENTRAR NO SISTEMA</span>
            </button>
            <button onClick={handleForgotPassword} className="w-full text-[10px] text-gray-400 hover:text-[#375623] font-black uppercase tracking-widest pt-2">
              {forgotPassSent ? "SOLICITAÇÃO ENVIADA AO ADMIN" : "Esqueci minha senha"}
            </button>
          </div>
        </div>
        <style>{`.animate-shake { animation: shake 0.5s; } @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } }`}</style>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${darkMode ? 'bg-[#0f0f0f] text-white' : 'bg-[#f8faf7] text-black'}`}>
      
      {/* HEADER */}
      <header className={`px-4 py-3 shadow-lg border-b-4 z-50 ${darkMode ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-[#375623] border-[#76923c] text-white'}`}>
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <SSTIcon size={32} className="text-white" />
              <h1 className="text-xl font-black uppercase tracking-tighter">Newcom <span className="text-[#76923c]">SST</span></h1>
            </div>
            <div className="hidden sm:flex items-center space-x-2 bg-white/10 px-4 py-1.5 rounded-full text-[10px] font-black shadow-inner">
              <User size={12} className="text-white" />
              <span className="text-white uppercase">OPERADOR: {currentUser.name} | {currentUser.role}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className={`p-2 rounded-lg transition-colors ${notifOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                <Bell size={22} className={(stats.itensCriticos > 0 || stats.resetRequestsCount > 0) ? 'text-orange-400 animate-pulse' : 'text-white'} />
                {(stats.itensCriticos + stats.resetRequestsCount) > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black border-2 border-[#375623]">
                    {stats.itensCriticos + stats.resetRequestsCount}
                  </span>
                )}
              </button>
              
              {/* NOTIFICATION PANEL - ESTILIZADO COM FUNDO ESCURO E LETRAS BRANCAS CONFORME SOLICITADO */}
              {notifOpen && (
                <div className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl border z-[60] overflow-hidden bg-[#1e1e1e] border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200`}>
                   <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#151515]">
                      <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Alertas do Sistema</h4>
                      <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-white transition-colors"><X size={16}/></button>
                   </div>
                   <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {stats.resetRequestsCount > 0 && currentUser.isAdmin && (
                        <div className="p-4 bg-orange-600/10 border-b border-gray-700">
                          <p className="text-[9px] font-black text-orange-400 uppercase mb-2 flex items-center tracking-widest"><KeyRound size={12} className="mr-1" /> Solicitações de Senha</p>
                          {stats.resetRequests.map(u => (
                            <div key={u.id} className="flex justify-between items-center mb-2 last:mb-0">
                               <span className="text-xs font-bold truncate pr-2 text-white">{u.name}</span>
                               <button onClick={() => handleAdminResetPassword(u.id, "1234")} className="bg-orange-600 text-white text-[8px] px-2 py-1 rounded font-black hover:bg-orange-700 transition-colors">RESETAR (1234)</button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-4">
                        <p className="text-[9px] font-black text-red-400 uppercase mb-2 flex items-center tracking-widest"><AlertTriangle size={12} className="mr-1" /> Estoque Crítico</p>
                        {stats.alertItems.length > 0 ? (
                          stats.alertItems.map(item => (
                            <div key={item.id} className="mb-3 last:mb-0 p-3 rounded-xl bg-white/5 flex items-center justify-between border border-white/5 hover:border-white/10 transition-all">
                               <div>
                                  <p className="text-xs font-black truncate max-w-[140px] text-white uppercase">{item.description}</p>
                                  <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">{item.code} | SALDO ATUAL: {item.entry - item.exit}</p>
                               </div>
                               <button 
                                 onClick={() => {setEditingItem(item); setIsFormOpen(true); setNotifOpen(false);}} 
                                 className="text-[#76923c] hover:bg-[#76923c]/10 p-1.5 rounded-lg transition-all"
                               >
                                 <Plus size={16}/>
                               </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-gray-500 italic py-4 text-center">Nenhum item em nível crítico detectado.</p>
                        )}
                      </div>
                   </div>
                </div>
              )}
            </div>

            <button onClick={() => setAiPanelOpen(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center space-x-2 transition-colors">
              <Sparkles size={18} className="text-[#76923c]" />
              <span className="text-[9px] font-black uppercase hidden sm:inline text-white">IA LOGÍSTICA</span>
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
            <button onClick={() => setSettingsOpen(true)} className="p-2 relative text-white hover:bg-white/10 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
            <button onClick={() => setIsLogged(false)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      {/* DASHBOARD STATS */}
      <div className="p-4 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Entradas', val: stats.totalEntrada, icon: SSTIcon, color: 'bg-blue-600' },
          { label: 'Total Saídas', val: stats.totalSaida, icon: BarChart3, color: 'bg-orange-600' },
          { label: 'Saldo Operacional', val: stats.saldo, icon: CheckCircle2, color: 'bg-[#375623]' },
          { label: 'Itens Críticos', val: stats.itensCriticos, icon: AlertTriangle, color: 'bg-red-600' },
        ].map((item, i) => (
          <div key={i} className={`p-5 rounded-3xl border flex items-center justify-between ${item.color} text-white shadow-xl transition-transform hover:scale-[1.02]`}>
            <div>
              <p className="text-[9px] font-black opacity-90 uppercase text-white tracking-widest">{item.label}</p>
              <p className="text-3xl font-black text-white">{item.val}</p>
            </div>
            <item.icon size={36} className="opacity-30 text-white" />
          </div>
        ))}
      </div>

      {/* TOOLS */}
      <div className="px-4 md:px-6 pb-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            placeholder="Pesquisar por descrição ou código técnico..." 
            className={`w-full pl-12 pr-4 py-3.5 rounded-2xl outline-none border font-bold text-sm shadow-sm transition-all ${darkMode ? 'bg-[#1a1a1a] border-gray-800 text-white focus:border-[#76923c]' : 'bg-white border-gray-200 text-black focus:border-[#375623]'}`}
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => {setEditingItem(null); setIsFormOpen(true);}} className="bg-[#375623] hover:bg-[#2a411a] text-white px-8 py-3.5 rounded-2xl font-black flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs">
          <Plus size={20} />
          <span>Nova Placa</span>
        </button>
      </div>

      {/* TABLE */}
      <main className="flex-1 overflow-auto px-4 md:px-6 pb-4">
        <div className={`rounded-3xl border overflow-hidden transition-all ${darkMode ? 'bg-[#121212] border-gray-800 shadow-none' : 'bg-white border-gray-200 shadow-xl'}`}>
          <table className="w-full text-left text-xs">
            <thead className={`font-black uppercase tracking-widest ${darkMode ? 'bg-[#1a1a1a] text-gray-400' : 'bg-gray-50 text-gray-400'}`}>
              <tr>
                <th className="px-6 py-4">Sinalização Técnica</th>
                <th className="px-6 py-4 text-center">Saldo</th>
                <th className="px-6 py-4 hidden sm:table-cell">Última Edição</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
              {processedItems.map(item => {
                const saldo = item.entry - item.exit;
                const isCrit = saldo <= item.minStock;
                return (
                  <tr key={item.id} className={`hover:bg-gray-500/5 transition-colors ${darkMode ? 'text-white' : 'text-black'}`}>
                    <td className="px-6 py-4 flex items-center space-x-4">
                      <div className="cursor-pointer group relative" onClick={() => setQrPreviewItem(item)}>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${item.code}`} className="w-12 h-12 border p-1 rounded-xl bg-white shadow-sm transition-transform group-hover:scale-110"/>
                      </div>
                      <div>
                        <p className={`font-black uppercase text-sm ${darkMode ? 'text-white' : 'text-black'}`}>{item.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                           <span className="text-[8px] bg-[#76923c]/20 text-[#375623] dark:text-[#76923c] px-2 py-0.5 rounded-full font-black uppercase">{item.code}</span>
                           <span className="text-[8px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase">{item.size}</span>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-center font-black text-base ${isCrit ? 'text-red-500 animate-pulse' : ''}`}>{saldo} {isCrit && '⚠️'}</td>
                    <td className="px-6 py-4 hidden sm:table-cell text-[10px]">
                      <p className="font-bold uppercase opacity-60">{item.updatedBy}</p>
                      <p className="opacity-40">{item.updatedAt}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => {setEditingItem(item); setIsFormOpen(true);}} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl" title="Editar Detalhes"><Edit3 size={18} /></button>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl" title="Excluir Definitivamente"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {processedItems.length === 0 && (
            <div className="p-24 text-center">
              <SSTIcon size={80} className="mx-auto mb-4 opacity-10 text-gray-400"/>
              <p className="text-gray-400 font-black uppercase text-xs tracking-widest leading-loose">Nenhuma placa encontrada<br/>com os termos pesquisados.</p>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className={`px-6 py-3 border-t flex items-center justify-between text-[9px] font-black uppercase tracking-widest ${darkMode ? 'bg-[#0a0a0a] border-gray-800 text-gray-400' : 'bg-white border-gray-100 text-gray-500'}`}>
        <div className="flex items-center space-x-8">
          <span>NEWCOM SST GESTÃO V3.1 | NR-26 COMPLIANCE</span>
          {previousAccessInfo && (
            <span className="hidden sm:inline-block text-[#76923c] bg-[#76923c]/5 px-3 py-1 rounded-full border border-[#76923c]/20">
              AUDITORIA: ÚLTIMO LOGIN POR {previousAccessInfo.name} ÀS {previousAccessInfo.time}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3 opacity-70">
           <SSTIcon size={16} className="text-[#375623] dark:text-[#76923c]" />
           <span>© 2025 GRUPO NEWCOM</span>
        </div>
      </footer>

      {/* USER MANAGEMENT MODAL */}
      {userManagementOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-black/70 animate-in fade-in duration-300">
          <div className={`w-full max-w-2xl p-8 rounded-[2.5rem] shadow-2xl relative border ${darkMode ? 'bg-[#121212] border-gray-800 text-white' : 'bg-white border-gray-100 text-black'}`}>
            <div className="flex justify-between items-center mb-8 border-b pb-5 dark:border-gray-800">
              <h3 className="text-2xl font-black uppercase flex items-center space-x-4">
                <Users className="text-[#76923c] w-7 h-7"/>
                <span>Gestão de Operadores</span>
              </h3>
              <button onClick={() => setUserManagementOpen(false)} className="p-2"><X size={28}/></button>
            </div>
            {currentUser.isAdmin ? (
              <div className="space-y-8">
                <div className="space-y-3 max-h-72 overflow-auto pr-3 custom-scrollbar">
                  {users.map(u => (
                    <div key={u.id} className={`flex items-center justify-between p-4 border rounded-2xl ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white shadow-sm border-gray-100'}`}>
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black ${u.isAdmin ? 'bg-[#375623]' : 'bg-[#76923c]'}`}>
                           {u.resetRequested ? <AlertOctagon size={16} className="animate-pulse" /> : u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-sm flex items-center">
                            {u.name} 
                            {u.resetRequested && <span className="ml-2 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded animate-bounce">RESET</span>}
                          </p>
                          <p className="text-[10px] opacity-40 uppercase font-black">{u.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {u.resetRequested && (
                          <button onClick={() => handleAdminResetPassword(u.id, "1234")} className="p-2 bg-orange-600 text-white rounded-lg text-[8px] font-black uppercase">REDEFINIR PARA 1234</button>
                        )}
                        {!u.isAdmin && (
                          <button onClick={() => handleRemoveUser(u.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl" title="Excluir Usuário">
                            <Trash2 size={20}/>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-red-500">
                <ShieldCheck size={80} className="mx-auto mb-6 opacity-20"/>
                <h4 className="font-black uppercase text-2xl tracking-tighter">Acesso Administrativo Restrito</h4>
                <p className="text-xs font-bold uppercase opacity-60">Somente o administrador pode gerenciar perfis.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORM MODAL (ADICIONAR/EDITAR ITEM) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSaveItem} className={`w-full max-w-2xl p-8 my-8 rounded-[2.5rem] shadow-2xl relative ${darkMode ? 'bg-[#121212] border border-gray-800 text-white' : 'bg-white text-black'}`}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black uppercase text-[#375623] dark:text-[#76923c] flex items-center space-x-3">
                <Edit3 size={24}/>
                <span>{editingItem ? 'Informações Técnicas' : 'Novo Cadastro SST'}</span>
              </h3>
              <button type="button" onClick={() => setIsFormOpen(false)}><X size={28}/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-[#76923c] uppercase tracking-widest border-b pb-1">Identificação e Formato</h4>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Cód Técnico</label>
                  <input required name="code" defaultValue={editingItem?.code} placeholder="Ex: A001, S005..." className={`w-full p-3.5 rounded-2xl border font-black outline-none ${darkMode ? 'bg-gray-900 border-gray-800 focus:border-[#76923c]' : 'bg-gray-50 focus:border-[#375623]'}`} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Descrição da Sinalização</label>
                  <input required name="description" defaultValue={editingItem?.description} placeholder="Ex: SAÍDA DE EMERGÊNCIA" className={`w-full p-3.5 rounded-2xl border font-black outline-none ${darkMode ? 'bg-gray-900 border-gray-800 focus:border-[#76923c]' : 'bg-gray-50 focus:border-[#375623]'}`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Formato</label>
                      <select name="shape" defaultValue={editingItem?.shape || 'RETANGULAR'} className={`w-full p-3.5 rounded-2xl border font-black outline-none ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50'}`}>
                        <option>RETANGULAR</option>
                        <option>QUADRADA</option>
                        <option>CIRCULAR</option>
                        <option>TRIANGULAR</option>
                        <option>SETORIAL</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Tamanho</label>
                      <input name="size" defaultValue={editingItem?.size} placeholder="Ex: 40x15cm" className={`w-full p-3.5 rounded-2xl border font-black outline-none ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50'}`} />
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b pb-1">Logística e Extras</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-blue-500 mb-1 block">Entradas</label>
                    <input required type="number" name="entry" defaultValue={editingItem?.entry || 0} className={`w-full p-3.5 rounded-2xl border font-black outline-none ${darkMode ? 'bg-gray-900 border-gray-800 focus:border-blue-500' : 'bg-blue-50 border-blue-200 focus:border-blue-500'}`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-orange-500 mb-1 block">Saídas</label>
                    <input required type="number" name="exit" defaultValue={editingItem?.exit || 0} className={`w-full p-3.5 rounded-2xl border font-black outline-none ${darkMode ? 'bg-gray-900 border-gray-800 focus:border-orange-500' : 'bg-orange-50 border-orange-200 focus:border-orange-500'}`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-red-500 mb-1 block">Nível Mín.</label>
                    <input required type="number" name="minStock" defaultValue={editingItem?.minStock || 5} className={`w-full p-3.5 rounded-2xl border font-black outline-none ${darkMode ? 'bg-gray-900 border-gray-800 focus:border-red-500' : 'bg-red-50 border-red-200 focus:border-red-500'}`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-green-600 mb-1 block">Nível Máx.</label>
                    <input required type="number" name="maxStock" defaultValue={editingItem?.maxStock || 100} className={`w-full p-3.5 rounded-2xl border font-black outline-none ${darkMode ? 'bg-gray-900 border-gray-800 focus:border-green-600' : 'bg-green-50 border-green-200 focus:border-green-600'}`} />
                  </div>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Extras (Refletiva, Fotolumin., etc)</label>
                   <input name="extras" defaultValue={editingItem?.extras} placeholder="Ex: FOTOLUMINESCENTE" className={`w-full p-3.5 rounded-2xl border font-black outline-none ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50'}`} />
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Observações Técnicas e Instalação</label>
                 <textarea name="observations" defaultValue={editingItem?.observations} rows={3} className={`w-full p-4 rounded-2xl border font-black outline-none resize-none transition-all ${darkMode ? 'bg-gray-900 border-gray-800 focus:border-[#76923c]' : 'bg-gray-50 border-gray-200 focus:border-[#375623]'}`} placeholder="Detalhes específicos para instalação, normativas ou avisos internos..."></textarea>
              </div>
            </div>

            <button type="submit" className="w-full bg-[#375623] hover:bg-[#2a411a] text-white py-5 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95">Salvar Atualização SST</button>
          </form>
        </div>
      )}

      {/* SETTINGS PANEL */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSettingsOpen(false)}></div>
          <div className={`w-full max-w-sm h-full p-8 shadow-2xl relative border-l transition-transform animate-in slide-in-from-right ${darkMode ? 'bg-[#121212] border-gray-800 text-white' : 'bg-white border-gray-100 text-black'}`}>
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Opções</h2>
              <button onClick={() => setSettingsOpen(false)}><X size={28}/></button>
            </div>
            <div className="space-y-10">
              <section>
                <h3 className="text-[10px] font-black text-gray-400 uppercase mb-5">Meus Dados</h3>
                <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  {!isChangingPass ? (
                    <button onClick={() => setIsChangingPass(true)} className="w-full flex items-center justify-between font-black text-sm">
                      <span>Alterar Minha Senha</span>
                      <ChevronRight size={20}/>
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Nova senha" className={`w-full p-3 rounded-xl border text-sm font-black outline-none ${darkMode ? 'bg-gray-800 border-gray-700 focus:border-[#76923c]' : 'bg-white border-gray-200 focus:border-[#375623]'}`}/>
                      <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Confirmar" className={`w-full p-3 rounded-xl border text-sm font-black outline-none ${darkMode ? 'bg-gray-800 border-gray-700 focus:border-[#76923c]' : 'bg-white border-gray-200 focus:border-[#375623]'}`}/>
                      <button onClick={handleChangeOwnPassword} className="w-full bg-[#375623] text-white py-3 rounded-xl font-black uppercase text-xs">Atualizar Agora</button>
                    </div>
                  )}
                </div>
              </section>
              {currentUser.isAdmin && (
                <section>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase mb-5">Controle Master</h3>
                  <button onClick={() => {setUserManagementOpen(true); setSettingsOpen(false);}} className={`w-full flex items-center justify-between p-6 rounded-3xl border transition-all hover:border-[#76923c] ${darkMode ? 'bg-gray-900 border-gray-800 shadow-inner' : 'bg-gray-50 border-gray-200 shadow-sm'}`}>
                    <span className="font-black text-sm">Gerenciar Equipe</span>
                    <Users size={22} className="text-[#76923c]"/>
                  </button>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR PREVIEW MODAL */}
      {qrPreviewItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className={`w-full max-w-sm p-10 rounded-[3rem] shadow-2xl relative text-center border animate-in zoom-in duration-300 ${darkMode ? 'bg-[#121212] border-gray-800 text-white' : 'bg-white text-black'}`}>
            <button onClick={() => setQrPreviewItem(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/10 transition-colors"><X size={28}/></button>
            <div className="mb-8 p-6 bg-white rounded-[2rem] border-8 border-[#375623]/10 inline-block shadow-inner">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrPreviewItem.code}`} className="w-56 h-56 transition-transform group-hover:scale-105"/>
            </div>
            <h3 className="text-2xl font-black uppercase mb-4">{qrPreviewItem.description}</h3>
            <p className="text-[10px] font-bold uppercase opacity-40 mb-8">{qrPreviewItem.code} | {qrPreviewItem.size}</p>
            <div className="flex flex-col space-y-4">
              <button onClick={() => downloadQRCode(qrPreviewItem, 'png')} className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase flex items-center justify-center space-x-3 text-xs shadow-lg transition-all active:scale-95">
                <Download size={20}/> <span>EXPORTAR IMAGEM</span>
              </button>
              <button onClick={() => downloadQRCode(qrPreviewItem, 'pdf')} className="bg-[#334155] hover:bg-[#1e293b] text-white py-4 rounded-2xl font-black uppercase flex items-center justify-center space-x-3 text-xs shadow-lg transition-all active:scale-95">
                <Printer size={20}/> <span>IMPRIMIR FICHA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI PANEL */}
      {aiPanelOpen && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAiPanelOpen(false)}></div>
          <div className={`w-full max-w-lg h-full shadow-2xl flex flex-col relative animate-in slide-in-from-right duration-300 border-l ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white text-black'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${darkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-[#375623] text-white'}`}>
              <div className="flex items-center space-x-4">
                <Sparkles size={24} className="text-[#76923c] animate-pulse"/>
                <h2 className="text-xl font-black uppercase text-white tracking-tighter">IA Logística</h2>
              </div>
              <button onClick={() => setAiPanelOpen(false)} className="text-white hover:rotate-90 transition-transform"><X size={28}/></button>
            </div>
            <div className="flex-1 overflow-auto p-8 space-y-6 custom-scrollbar">
              {aiChat.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-12">
                   <SSTIcon size={64} className="mb-6"/>
                   <p className="font-black uppercase text-xs tracking-[0.2em]">Consultoria de Estoque e Normas SST.<br/>Pergunte sobre reposição ou sinalização.</p>
                </div>
              )}
              {aiChat.map((chat, i) => (
                <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-4 rounded-2xl text-xs font-black shadow-lg ${chat.role === 'user' ? 'bg-[#375623] text-white' : (darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-gray-100 text-black border border-gray-200')}`}>
                    {chat.text}
                  </div>
                </div>
              ))}
              {isAiLoading && <div className="flex justify-center py-4"><Loader2 size={24} className="animate-spin text-[#76923c]" /></div>}
            </div>
            <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="relative">
                <input 
                  value={aiInput} 
                  onChange={(e) => setAiInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAi()} 
                  placeholder="Consulte o estoque técnico aqui..." 
                  className={`w-full p-4 pr-16 rounded-2xl border outline-none font-black text-xs transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-[#76923c]' : 'bg-gray-50 focus:border-[#375623]'}`} 
                />
                <button onClick={handleAskAi} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-[#375623] hover:bg-[#2a411a] text-white rounded-xl shadow-lg transition-transform active:scale-90">
                  <Send size={18}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes loading { 0% { width: 0%; } 100% { width: 100%; } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
};

export default App;
