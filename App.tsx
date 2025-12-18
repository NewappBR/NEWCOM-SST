
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, X, Send, Loader2, 
  BarChart3, AlertTriangle, CheckCircle2,
  User, Moon, Sun, Search, Settings, 
  Save, Users, ShieldCheck, Plus, Trash2, Edit3, LogOut,
  QrCode, UserMinus, Download, Eye, Bell, KeyRound, Shield, 
  Check, Fingerprint, Key, ArrowUpDown, ChevronUp, ChevronDown, Printer,
  Clock, AlertOctagon
} from 'lucide-react';
import { getAIAnalysis } from './services/geminiService';

/**
 * Ícone Temático SST: Escudo de Segurança
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

interface UserPermissions {
  canAddItems: boolean;
  canEditItems: boolean;
  canDeleteItems: boolean;
  canManageUsers: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  role: string;
  pass: string;
  isAdmin?: boolean;
  resetRequested?: boolean;
  permissions: UserPermissions;
}

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

const FULL_PERMISSIONS: UserPermissions = {
  canAddItems: true,
  canEditItems: true,
  canDeleteItems: true,
  canManageUsers: true,
};

const STANDARD_PERMISSIONS: UserPermissions = {
  canAddItems: true,
  canEditItems: true,
  canDeleteItems: false,
  canManageUsers: false,
};

const VIEW_ONLY_PERMISSIONS: UserPermissions = {
  canAddItems: false,
  canEditItems: false,
  canDeleteItems: false,
  canManageUsers: false,
};

const ADMIN_MASTER: UserProfile = { 
  id: 'admin', 
  name: 'Administrador Master', 
  role: 'Diretoria / TI', 
  pass: '@dm123', 
  isAdmin: true,
  permissions: FULL_PERMISSIONS
};

const INITIAL_USERS: UserProfile[] = [
  { id: '1', name: 'Ricardo Santos', role: 'Eng. de Segurança', pass: '1234', permissions: { ...STANDARD_PERMISSIONS, canDeleteItems: true } },
  { id: '2', name: 'Ana Paula', role: 'Técnico SST', pass: '1234', permissions: STANDARD_PERMISSIONS },
  { id: '3', name: 'Carlos Ferreira', role: 'Supervisor Logístico', pass: '1234', permissions: STANDARD_PERMISSIONS },
  { id: '4', name: 'Juliana Lima', role: 'Segurança Patrimonial', pass: '1234', permissions: VIEW_ONLY_PERMISSIONS },
  { id: '5', name: 'Marcos Oliveira', role: 'Auxiliar SST', pass: '1234', permissions: VIEW_ONLY_PERMISSIONS },
];

const INITIAL_DATA: InventoryItem[] = [
  { 
    id: '1', code: 'S001', description: 'ENTRADA PEDESTRE', classification: 'IDENTIFICAÇÃO', 
    function: 'INFORMAÇÃO', color: 'VERDE', shape: 'RETANGULAR', size: '30x20cm', extras: 'Refletiva',
    entry: 50, exit: 10, minStock: 15, maxStock: 100,
    observations: 'Placas instaladas no portão A.', createdBy: 'Ricardo Santos', 
    updatedBy: 'Ricardo Santos', updatedAt: '20/05/2025 10:00' 
  },
  { 
    id: '2', code: 'A005', description: 'SAÍDA DE EMERGÊNCIA', classification: 'SEGURANÇA', 
    function: 'SALVAMENTO', color: 'VERDE', shape: 'RETANGULAR', size: '40x15cm', extras: 'Fotoluminescente',
    entry: 20, exit: 5, minStock: 10, maxStock: 50,
    observations: 'Corredor principal.', createdBy: 'Ana Paula', 
    updatedBy: 'Ana Paula', updatedAt: '21/05/2025 14:30' 
  },
  { 
    id: '3', code: 'P012', description: 'CUIDADO: ALTA TENSÃO', classification: 'AVISO', 
    function: 'ADVERTÊNCIA', color: 'AMARELO', shape: 'TRIANGULAR', size: '20x20cm', extras: 'Alumínio',
    entry: 30, exit: 28, minStock: 5, maxStock: 40,
    observations: 'Subestação Sul.', createdBy: 'Carlos Ferreira', 
    updatedBy: 'Carlos Ferreira', updatedAt: '22/05/2025 09:00' 
  },
  { 
    id: '4', code: 'H009', description: 'USO DE EPI OBRIGATÓRIO', classification: 'OBRIGATORIEDADE', 
    function: 'PROTEÇÃO', color: 'AZUL', shape: 'CIRCULAR', size: '30cm', extras: 'Vinil',
    entry: 100, exit: 40, minStock: 20, maxStock: 150,
    observations: 'Área de produção.', createdBy: 'Ana Paula', 
    updatedBy: 'Ricardo Santos', updatedAt: '23/05/2025 11:20' 
  },
];

type SortKey = 'description' | 'size' | 'saldo';

const App: React.FC = () => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [postLoginLoading, setPostLoginLoading] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [resetRequestedFeedback, setResetRequestedFeedback] = useState(false);
  
  // Auditoria
  const [lastAccess, setLastAccess] = useState<{name: string, date: string} | null>(null);
  
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>({ key: 'description', direction: 'asc' });
  
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_DATA);
  const [users, setUsers] = useState<UserProfile[]>([...INITIAL_USERS, ADMIN_MASTER]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [qrPreviewItem, setQrPreviewItem] = useState<InventoryItem | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  
  // Exclusão
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  
  const [aiChat, setAiChat] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState("");

  const [changingPass, setChangingPass] = useState(false);
  const [newPass, setNewPass] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 1500);
    const savedAccess = localStorage.getItem('newcom_last_access');
    if (savedAccess) setLastAccess(JSON.parse(savedAccess));
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const totalEntrada = items.reduce((acc, item) => acc + item.entry, 0);
    const totalSaida = items.reduce((acc, item) => acc + item.exit, 0);
    const alertItems = items.filter(item => (item.entry - item.exit) <= item.minStock);
    const resetRequests = users.filter(u => u.resetRequested).length;
    return { 
      totalEntrada, 
      totalSaida, 
      saldo: totalEntrada - totalSaida, 
      itensCriticos: alertItems.length,
      alertItems,
      resetRequests
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
        let aVal: any, bVal: any;
        if (sortConfig.key === 'saldo') {
          aVal = a.entry - a.exit;
          bVal = b.entry - b.exit;
        } else {
          aVal = a[sortConfig.key as keyof InventoryItem];
          bVal = b[sortConfig.key as keyof InventoryItem];
        }
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
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
      const now = new Date().toLocaleString('pt-BR');
      const accessInfo = { name: userInList.name, date: now };
      setTimeout(() => {
        setPostLoginLoading(false);
        setIsLogged(true);
        setLoginPass("");
        localStorage.setItem('newcom_last_access', JSON.stringify(accessInfo));
      }, 1000);
    } else {
      setLoginError("Senha incorreta.");
      setTimeout(() => setLoginError(""), 3000);
    }
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleForgotPassword = () => {
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, resetRequested: true } : u));
    setResetRequestedFeedback(true);
    setTimeout(() => setResetRequestedFeedback(false), 5000);
  };

  const handleChangeOwnPassword = () => {
    if (newPass.length < 4) {
      alert("A senha deve ter pelo menos 4 caracteres.");
      return;
    }
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, pass: newPass } : u));
    alert("Senha alterada com sucesso!");
    setChangingPass(false);
    setNewPass("");
  };

  const handleSaveItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingItem && !currentUser.permissions.canEditItems) {
      alert("Permissão Negada: Você não pode editar itens.");
      return;
    }
    if (!editingItem && !currentUser.permissions.canAddItems) {
      alert("Permissão Negada: Você não pode adicionar itens.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const now = new Date().toLocaleString('pt-BR');
    const newItem: InventoryItem = {
      id: editingItem?.id || Math.random().toString(36).substr(2, 9),
      code: (formData.get('code') as string).toUpperCase(),
      description: (formData.get('description') as string).toUpperCase(),
      classification: formData.get('classification') as string || 'GERAL',
      function: formData.get('function') as string || 'SINALIZAÇÃO',
      color: formData.get('color') as string || 'VERDE',
      shape: formData.get('shape') as string || 'RETANGULAR',
      size: (formData.get('size') as string).toUpperCase() || 'PADRÃO',
      extras: formData.get('extras') as string || 'NENHUM',
      observations: formData.get('observations') as string || '',
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
    if (!currentUser.permissions.canDeleteItems) {
      alert("Permissão Negada: Você não tem autorização para excluir itens.");
      return;
    }
    const item = items.find(i => i.id === id);
    if (item) setItemToDelete(item);
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
      if (qrPreviewItem?.id === itemToDelete.id) setQrPreviewItem(null);
      setItemToDelete(null);
    }
  };

  const handleRemoveUser = (userId: string) => {
    if (!currentUser.permissions.canManageUsers) {
      alert("Acesso Restrito: Apenas administradores podem gerenciar a equipe.");
      return;
    }
    if (userId === currentUser.id) {
      alert("Ação Inválida: Você não pode excluir a si mesmo.");
      return;
    }
    const user = users.find(u => u.id === userId);
    if (user) setUserToDelete(user);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    }
  };

  const handleAdminResetPassword = (userId: string) => {
    if (!currentUser.permissions.canManageUsers) return;
    const tempPass = "1234";
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, pass: tempPass, resetRequested: false } : u));
    alert(`Senha resetada para "1234" com sucesso!`);
  };

  const toggleUserPermission = (userId: string, permission: keyof UserPermissions) => {
    if (!currentUser.isAdmin) return;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          permissions: {
            ...u.permissions,
            [permission]: !u.permissions[permission]
          }
        };
      }
      return u;
    }));
  };

  const downloadQRCode = async (item: InventoryItem, format: 'png' | 'pdf') => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${item.code}`;
    if (format === 'png') {
      try {
        const response = await fetch(qrUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `QR_SST_${item.code}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        alert("Erro ao baixar imagem.");
      }
    } else {
      window.open(qrUrl, '_blank');
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
      setAiChat(prev => [...prev, { role: 'bot', text: "IA indisponível temporariamente." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center ${darkMode ? 'bg-[#0a0a0a]' : 'bg-[#375623]'}`}>
        <SSTIcon size={120} className="text-white animate-pulse mb-6" />
        <h1 className="text-white text-3xl font-black uppercase tracking-widest text-center">Grupo <span className="text-[#76923c]">Newcom</span></h1>
        <p className="text-white/40 text-[10px] uppercase font-bold mt-4 tracking-widest">NR-26 Compliance Management</p>
      </div>
    );
  }

  if (postLoginLoading) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
        <div className="flex flex-col items-center space-y-6">
          <SSTIcon className={`${darkMode ? 'text-[#76923c]' : 'text-[#375623]'} animate-bounce`} size={100} />
          <h2 className={`text-2xl font-black uppercase ${darkMode ? 'text-white' : 'text-[#375623]'}`}>Conectando...</h2>
        </div>
      </div>
    );
  }

  if (!isLogged) {
    return (
      <div className={`h-screen w-full flex items-center justify-center p-4 ${darkMode ? 'bg-[#0a0a0a]' : 'bg-[#f0f4ef]'}`}>
        <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl transition-all duration-500 ${darkMode ? 'bg-[#121212] border border-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="p-5 bg-[#375623] rounded-3xl mb-4 shadow-xl">
              <SSTIcon className="text-white" size={64} />
            </div>
            <h2 className={`text-2xl font-black uppercase ${darkMode ? 'text-white' : 'text-[#375623]'}`}>Newcom SST</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-gray-400">Logística de Sinalização Técnica</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Perfil do Operador</label>
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
                className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${loginError ? 'border-red-500' : (darkMode ? 'bg-[#1a1a1a] border-gray-800 text-white focus:border-[#76923c]' : 'bg-gray-50 border-gray-200 text-black focus:border-[#375623]')}`}
                value={loginPass} onChange={(e) => setLoginPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            {loginError && <p className="text-xs text-red-500 font-bold text-center">{loginError}</p>}
            <button onClick={handleLogin} className="w-full bg-[#375623] hover:bg-[#2a411a] text-white py-4 rounded-xl font-black shadow-xl flex items-center justify-center space-x-2 transition-transform active:scale-95">
              <ShieldCheck size={20} /> <span>ENTRAR NO SISTEMA</span>
            </button>
            <button 
              onClick={handleForgotPassword} 
              className={`w-full text-[10px] font-black uppercase transition-colors text-gray-400 hover:text-[#76923c]`}
            >
              {resetRequestedFeedback ? "Solicitação de Reset Enviada!" : "Esqueci minha senha"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-[#0f0f0f] text-white' : 'bg-[#f8faf7] text-black'}`}>
      
      {/* HEADER */}
      <header className={`px-4 py-3 shadow-lg border-b-4 z-50 transition-colors duration-500 ${darkMode ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-[#375623] border-[#76923c] text-white'}`}>
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <SSTIcon size={32} className="text-white" />
              <h1 className="text-xl font-black uppercase tracking-tighter">Newcom <span className="text-[#76923c]">SST</span></h1>
            </div>
            <div className="hidden sm:flex items-center space-x-2 bg-white/10 px-4 py-1.5 rounded-full text-[10px] font-black shadow-inner">
              <User size={12} className="text-white" />
              <span className="text-white uppercase truncate max-w-[120px]">{currentUser.name}</span>
              {currentUser.isAdmin && <Shield size={10} className="text-[#76923c]" />}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className={`p-2 rounded-lg transition-colors ${notifOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                <Bell size={22} className={(stats.itensCriticos > 0 || stats.resetRequests > 0) ? 'text-orange-400 animate-pulse' : 'text-white'} />
              </button>
              
              {notifOpen && (
                <div className="absolute right-0 mt-4 w-72 rounded-2xl shadow-2xl border border-gray-700 bg-[#1a1a1a] text-white z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2">
                   <div className="p-4 border-b border-gray-700 bg-black/40 flex justify-between items-center">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#76923c]">Status Operacional</h4>
                      <button onClick={() => setNotifOpen(false)} className="hover:text-red-500"><X size={14}/></button>
                   </div>
                   <div className="max-h-80 overflow-y-auto">
                      {stats.resetRequests > 0 && currentUser.isAdmin && (
                        <div className="p-4 border-b border-gray-800 bg-orange-600/10">
                          <p className="text-[9px] font-black text-orange-400 uppercase mb-1">Acesso</p>
                          <p className="text-[11px] font-bold text-white">{stats.resetRequests} solicitações de senha pendentes.</p>
                        </div>
                      )}
                      {stats.alertItems.length > 0 ? (
                        stats.alertItems.map(item => (
                          <div key={item.id} className="p-4 border-b border-gray-800 hover:bg-white/5 transition-colors cursor-pointer">
                            <p className="text-[11px] font-black uppercase mb-1">{item.description}</p>
                            <span className="text-[9px] text-red-500 font-black uppercase tracking-tighter">ALERTA DE REPOSIÇÃO: {item.entry - item.exit}</span>
                          </div>
                        ))
                      ) : stats.resetRequests === 0 && (
                        <div className="p-10 text-center opacity-30">
                          <p className="text-[10px] font-black uppercase">Sem alertas ativos</p>
                        </div>
                      )}
                   </div>
                </div>
              )}
            </div>

            <button onClick={() => setAiPanelOpen(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center space-x-2">
              <Sparkles size={18} className="text-[#76923c]" />
              <span className="text-[9px] font-black uppercase hidden lg:inline text-white">IA LOGÍSTICA</span>
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-white hover:bg-white/10 rounded-lg transition-all">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setSettingsOpen(true)} className="p-2 text-white hover:bg-white/10 rounded-lg">
              <Settings size={20} />
            </button>
            <button onClick={() => setIsLogged(false)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      {/* DASHBOARD STATS */}
      <div className="p-4 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Entradas', val: stats.totalEntrada, icon: SSTIcon, color: 'bg-blue-600' },
          { label: 'Saídas', val: stats.totalSaida, icon: BarChart3, color: 'bg-orange-600' },
          { label: 'Saldo Atual', val: stats.saldo, icon: CheckCircle2, color: 'bg-[#375623]' },
          { label: 'Reposições', val: stats.itensCriticos, icon: AlertTriangle, color: 'bg-red-600' },
        ].map((item, i) => (
          <div key={i} className={`p-5 rounded-3xl border flex items-center justify-between ${item.color} text-white shadow-xl transition-all hover:-translate-y-1`}>
            <div>
              <p className="text-[9px] font-black opacity-80 uppercase tracking-widest">{item.label}</p>
              <p className="text-3xl font-black">{item.val}</p>
            </div>
            <item.icon size={36} className="opacity-30" />
          </div>
        ))}
      </div>

      {/* TOOLS & SEARCH */}
      <div className="px-4 md:px-6 pb-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            placeholder="Pesquisar por descrição ou código técnico..." 
            className={`w-full pl-12 pr-4 py-3.5 rounded-2xl outline-none border font-bold text-sm shadow-sm transition-all ${darkMode ? 'bg-[#1a1a1a] border-gray-800 text-white focus:border-[#76923c]' : 'bg-white border-gray-200 text-black focus:border-[#375623]'}`}
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {currentUser.permissions.canAddItems && (
          <button onClick={() => {setEditingItem(null); setIsFormOpen(true);}} className="bg-[#375623] hover:bg-[#2a411a] text-white px-8 py-3.5 rounded-2xl font-black flex items-center justify-center space-x-2 shadow-lg transition-transform active:scale-95 uppercase tracking-widest text-xs">
            <Plus size={20} />
            <span>Adicionar Sinalização</span>
          </button>
        )}
      </div>

      {/* DATA TABLE */}
      <main className="flex-1 overflow-auto px-4 md:px-6 pb-4">
        <div className={`rounded-3xl border overflow-hidden transition-all ${darkMode ? 'bg-[#121212] border-gray-800 shadow-none' : 'bg-white border-gray-200 shadow-xl'}`}>
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`font-black uppercase tracking-widest ${darkMode ? 'bg-[#1a1a1a] text-gray-400' : 'bg-gray-50 text-gray-400'}`}>
              <tr>
                <th 
                  className="px-6 py-4 cursor-pointer hover:text-[#76923c] transition-colors"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Sinalização</span>
                    {sortConfig?.key === 'description' ? (sortConfig.direction === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>) : <ArrowUpDown size={12}/>}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:text-[#76923c] transition-colors hidden sm:table-cell"
                  onClick={() => handleSort('size')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Tamanho</span>
                    {sortConfig?.key === 'size' ? (sortConfig.direction === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>) : <ArrowUpDown size={12}/>}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-center cursor-pointer hover:text-[#76923c] transition-colors"
                  onClick={() => handleSort('saldo')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Saldo</span>
                    {sortConfig?.key === 'saldo' ? (sortConfig.direction === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>) : <ArrowUpDown size={12}/>}
                  </div>
                </th>
                <th className="px-6 py-4 hidden md:table-cell">Histórico</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors duration-500 ${darkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
              {processedItems.map(item => {
                const saldo = item.entry - item.exit;
                const isCrit = saldo <= item.minStock;
                return (
                  <tr key={item.id} className={`transition-colors duration-300 ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4 flex items-center space-x-4">
                      <div className="cursor-pointer group relative" onClick={() => setQrPreviewItem(item)}>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${item.code}`} className="w-10 h-10 border border-gray-200 dark:border-gray-700 p-1 rounded-lg bg-white" alt="QR"/>
                        <div className="absolute inset-0 bg-[#375623]/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye size={12} className="text-white" />
                        </div>
                      </div>
                      <div>
                        <p className={`font-black uppercase text-[13px] ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.description}</p>
                        <p className="text-[10px] text-[#76923c] font-black uppercase tracking-widest">{item.code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell font-bold opacity-60 uppercase">{item.size}</td>
                    <td className={`px-6 py-4 text-center font-black text-base ${isCrit ? 'text-red-500 animate-pulse' : (darkMode ? 'text-white' : 'text-gray-900')}`}>
                      {saldo} {isCrit && '⚠️'}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-[10px]">
                      <p className="font-bold uppercase opacity-50">{item.updatedBy}</p>
                      <p className="opacity-30">{item.updatedAt}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-1">
                        {currentUser.permissions.canEditItems && (
                          <button onClick={() => {setEditingItem(item); setIsFormOpen(true);}} className="p-2.5 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all" title="Editar"><Edit3 size={18} /></button>
                        )}
                        {currentUser.permissions.canDeleteItems && (
                          <button onClick={() => handleDeleteItem(item.id)} className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all" title="Remover da Lista"><Trash2 size={18} /></button>
                        )}
                        <button onClick={() => setQrPreviewItem(item)} className="p-2.5 text-[#76923c] hover:bg-green-500/10 rounded-xl transition-all" title="QR Code"><QrCode size={18}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {processedItems.length === 0 && (
            <div className="p-20 text-center">
               <SSTIcon size={48} className="mx-auto mb-4 opacity-10"/>
               <p className="text-sm font-black uppercase tracking-widest opacity-20">Nenhum registro encontrado</p>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER AUDITORIA */}
      <footer className={`px-6 py-3 border-t flex items-center justify-between text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${darkMode ? 'bg-[#0a0a0a] border-gray-800 text-gray-500' : 'bg-white border-gray-100 text-gray-400'}`}>
        <div className="flex items-center space-x-6">
          <span>GESTÃO NEWCOM SST V3.1 | NR-26 COMPLIANCE</span>
          {lastAccess && (
            <div className="hidden sm:flex items-center space-x-2 bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full border border-current">
              <Clock size={10} />
              <span>ÚLTIMO LOGIN: {lastAccess.name} EM {lastAccess.date}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
           <Shield size={10} className="text-[#76923c]"/>
           <span>© 2025 GRUPO NEWCOM</span>
        </div>
      </footer>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE ITEM */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
          <div className={`w-full max-w-sm p-8 rounded-[2rem] shadow-2xl relative border animate-in zoom-in duration-300 ${darkMode ? 'bg-[#121212] border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'}`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertOctagon size={32} />
              </div>
              <h3 className="text-lg font-black uppercase mb-2">Confirmar Exclusão?</h3>
              <p className="text-[11px] opacity-60 mb-6 font-bold leading-relaxed px-2">
                Deseja remover permanentemente <strong>{itemToDelete.description}</strong> ({itemToDelete.code})? Esta ação não poderá ser desfeita.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${darkMode ? 'border-gray-700 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDeleteItem}
                  className="py-3 rounded-xl text-[10px] font-black uppercase bg-red-600 hover:bg-red-700 text-white shadow-lg transition-transform active:scale-95"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE USUÁRIO */}
      {userToDelete && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
          <div className={`w-full max-w-sm p-8 rounded-[2rem] shadow-2xl relative border animate-in zoom-in duration-300 ${darkMode ? 'bg-[#121212] border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'}`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserMinus size={32} />
              </div>
              <h3 className="text-lg font-black uppercase mb-2">Remover Operador?</h3>
              <p className="text-[11px] opacity-60 mb-6 font-bold leading-relaxed px-2">
                Deseja revogar definitivamente o acesso de <strong>{userToDelete.name}</strong>? Ele será desconectado e removido da base.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setUserToDelete(null)}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${darkMode ? 'border-gray-700 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  Manter
                </button>
                <button 
                  onClick={confirmDeleteUser}
                  className="py-3 rounded-xl text-[10px] font-black uppercase bg-red-600 hover:bg-red-700 text-white shadow-lg transition-transform active:scale-95"
                >
                  Revogar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GESTÃO DE OPERADORES MODAL */}
      {userManagementOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-md bg-black/70 animate-in fade-in duration-300">
          <div className={`w-full max-w-3xl p-8 rounded-3xl shadow-2xl relative border ${darkMode ? 'bg-[#121212] border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase flex items-center space-x-3">
                <Users size={24} className="text-[#76923c]"/>
                <span>Equipe & Permissões Granulares</span>
              </h3>
              <button onClick={() => setUserManagementOpen(false)} className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-red-500"><X size={24}/></button>
            </div>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {users.map(u => (
                <div key={u.id} className={`p-5 border rounded-2xl transition-all ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${u.isAdmin ? 'bg-[#375623] text-white' : 'bg-gray-300 text-gray-700'}`}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase flex items-center space-x-2">
                          <span>{u.name}</span>
                          {u.isAdmin && <span className="bg-[#76923c] text-white text-[8px] px-2 py-0.5 rounded-full">MASTER</span>}
                          {u.resetRequested && <span className="bg-orange-500 text-white text-[8px] px-2 py-0.5 rounded-full animate-pulse">PENDENTE RESET</span>}
                        </p>
                        <p className="text-[10px] opacity-60 font-bold uppercase">{u.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {currentUser.isAdmin && u.resetRequested && (
                        <button 
                          onClick={() => handleAdminResetPassword(u.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-all active:scale-95"
                        >
                          <Key size={12} />
                          <span>RESETAR SENHA</span>
                        </button>
                      )}
                      {currentUser.permissions.canManageUsers && !u.isAdmin && (
                        <button 
                          onClick={() => handleRemoveUser(u.id)} 
                          className="p-3 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                          title="Excluir Usuário Definitivamente"
                        >
                          <UserMinus size={20}/>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* GRID DE PERMISSÕES */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { key: 'canAddItems', label: 'Cadastrar', icon: Plus },
                      { key: 'canEditItems', label: 'Editar', icon: Edit3 },
                      { key: 'canDeleteItems', label: 'Excluir', icon: Trash2 },
                      { key: 'canManageUsers', label: 'Gestão', icon: Users },
                    ].map(p => {
                      const hasPerm = u.permissions[p.key as keyof UserPermissions];
                      return (
                        <button
                          key={p.key}
                          disabled={!currentUser.isAdmin || u.isAdmin}
                          onClick={() => toggleUserPermission(u.id, p.key as keyof UserPermissions)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${
                            hasPerm 
                              ? 'bg-[#375623]/10 border-[#375623] text-[#375623] dark:text-[#76923c] dark:border-[#76923c]' 
                              : 'bg-transparent border-gray-300 text-gray-400 opacity-50'
                          } ${(!currentUser.isAdmin || u.isAdmin) ? 'cursor-default' : 'hover:scale-105 active:scale-95'}`}
                        >
                          <div className="flex items-center space-x-2">
                            <p.icon size={12} />
                            <span>{p.label}</span>
                          </div>
                          {hasPerm && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL SINALIZAÇÃO */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 overflow-y-auto">
          <form onSubmit={handleSaveItem} className={`w-full max-w-2xl p-8 rounded-[2.5rem] shadow-2xl relative my-auto transition-colors duration-500 ${darkMode ? 'bg-[#121212] border border-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase text-[#375623] dark:text-[#76923c] flex items-center space-x-2">
                <Edit3 size={24} />
                <span>{editingItem ? 'Ficha Técnica de Sinalização' : 'Novo Cadastro NR-26'}</span>
              </h3>
              <button type="button" onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-red-500/10 rounded-full text-red-500"><X size={24}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block ml-1">Código Identificador</label>
                  <input required name="code" defaultValue={editingItem?.code} className={`w-full p-3.5 rounded-2xl border font-bold outline-none transition-all ${darkMode ? 'bg-gray-900 border-gray-800 text-white focus:border-[#76923c]' : 'bg-gray-50 border-gray-200 focus:border-[#375623]'}`} />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block ml-1">Descrição Técnica</label>
                  <input required name="description" defaultValue={editingItem?.description} className={`w-full p-3.5 rounded-2xl border font-bold outline-none transition-all ${darkMode ? 'bg-gray-900 border-gray-800 text-white focus:border-[#76923c]' : 'bg-gray-50 border-gray-200 focus:border-[#375623]'}`} />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block ml-1">Tamanho/Dimensões</label>
                  <input name="size" defaultValue={editingItem?.size} placeholder="EX: 40X20CM" className={`w-full p-3.5 rounded-2xl border font-bold outline-none transition-all uppercase ${darkMode ? 'bg-gray-900 border-gray-800 focus:border-[#76923c]' : 'bg-gray-50 border-gray-200 focus:border-[#375623]'}`} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-blue-500 mb-1 block ml-1">Entrada (+)</label>
                    <input required type="number" name="entry" defaultValue={editingItem?.entry || 0} className={`w-full p-3.5 rounded-2xl border font-bold outline-none transition-all ${darkMode ? 'bg-gray-900 border-blue-900 focus:border-blue-500' : 'bg-blue-50 border-blue-100 focus:border-blue-500'}`} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-orange-500 mb-1 block ml-1">Saída (-)</label>
                    <input required type="number" name="exit" defaultValue={editingItem?.exit || 0} className={`w-full p-3.5 rounded-2xl border font-bold outline-none transition-all ${darkMode ? 'bg-gray-900 border-orange-900 focus:border-orange-500' : 'bg-orange-50 border-orange-100 focus:border-orange-500'}`} />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-red-500 mb-1 block ml-1">Estoque Mínimo Alerta</label>
                  <input required type="number" name="minStock" defaultValue={editingItem?.minStock || 5} className={`w-full p-3.5 rounded-2xl border font-bold outline-none transition-all ${darkMode ? 'bg-gray-900 border-red-900 focus:border-red-500' : 'bg-red-50 border-red-100 focus:border-red-500'}`} />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block ml-1">Tipo/Material</label>
                  <input name="extras" defaultValue={editingItem?.extras || 'ALUMÍNIO'} className={`w-full p-3.5 rounded-2xl border font-bold outline-none transition-all ${darkMode ? 'bg-gray-900 border-gray-800 focus:border-[#76923c]' : 'bg-gray-50 border-gray-200 focus:border-[#375623]'}`} />
                </div>
              </div>
            </div>
            <div className="mb-6">
               <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block ml-1">Observações Operacionais</label>
               <textarea name="observations" defaultValue={editingItem?.observations} rows={3} className={`w-full p-4 rounded-3xl border font-bold outline-none resize-none transition-all ${darkMode ? 'bg-gray-900 border-gray-800 text-white focus:border-[#76923c]' : 'bg-gray-50 border-gray-200 focus:border-[#375623]'}`} />
            </div>
            <button type="submit" className="w-full bg-[#375623] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl transition-all hover:bg-[#2a411a] active:scale-95">Salvar Atualização de Banco</button>
          </form>
        </div>
      )}

      {/* QR PREVIEW MODAL */}
      {qrPreviewItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className={`w-full max-w-sm p-10 rounded-[3rem] shadow-2xl relative text-center border animate-in zoom-in duration-300 ${darkMode ? 'bg-[#121212] border-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <button onClick={() => setQrPreviewItem(null)} className="absolute top-6 right-6 p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"><X size={24}/></button>
            <div className="mb-6 p-4 bg-white rounded-3xl border inline-block shadow-inner">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrPreviewItem.code}`} className="w-56 h-56" alt="Full QR Code"/>
            </div>
            <h3 className="text-xl font-black uppercase mb-1">{qrPreviewItem.description}</h3>
            <p className="text-[10px] font-bold uppercase text-[#76923c] mb-8">{qrPreviewItem.code} | {qrPreviewItem.size}</p>
            <div className="flex flex-col space-y-3">
              <button onClick={() => downloadQRCode(qrPreviewItem, 'png')} className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase flex items-center justify-center space-x-2 text-[10px] shadow-lg transition-transform active:scale-95">
                <Download size={16}/> <span>SALVAR IMAGEM</span>
              </button>
              <button onClick={() => downloadQRCode(qrPreviewItem, 'pdf')} className="bg-[#375623] hover:bg-[#2a411a] text-white py-4 rounded-2xl font-black uppercase flex items-center justify-center space-x-2 text-[10px] shadow-lg transition-transform active:scale-95">
                <Printer size={16}/> <span>IMPRIMIR FICHA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS PANEL */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSettingsOpen(false)}></div>
          <div className={`w-full max-w-xs h-full p-8 shadow-2xl relative border-l animate-in slide-in-from-right duration-300 transition-colors duration-500 ${darkMode ? 'bg-[#121212] border-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-black uppercase tracking-tighter">Painel de Usuário</h2>
              <button onClick={() => setSettingsOpen(false)} className="text-red-500"><X size={24}/></button>
            </div>
            <div className="space-y-6">
              {currentUser.isAdmin && (
                <button onClick={() => {setUserManagementOpen(true); setSettingsOpen(false);}} className={`w-full flex items-center justify-between p-6 rounded-3xl border transition-all hover:border-[#76923c] group ${darkMode ? 'bg-gray-900 border-gray-800 shadow-none' : 'bg-gray-50 border-gray-200 shadow-sm'}`}>
                  <span className="font-black text-xs uppercase">Gestão & Permissões</span>
                  <Fingerprint size={20} className="text-[#76923c] group-hover:scale-110 transition-transform"/>
                </button>
              )}
              
              <div className={`p-6 rounded-3xl border transition-colors ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200 shadow-sm'}`}>
                <p className="text-[10px] font-black uppercase opacity-40 mb-3">Minha Sessão</p>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-[#375623] text-white rounded-full flex items-center justify-center font-black">{currentUser.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-black uppercase truncate max-w-[140px]">{currentUser.name}</p>
                    <p className="text-[9px] opacity-60 font-bold uppercase">{currentUser.role}</p>
                  </div>
                </div>
                
                {changingPass ? (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <input 
                      type="password" 
                      placeholder="Nova senha operacional" 
                      className={`w-full p-3 rounded-xl border text-[11px] font-black outline-none transition-all ${darkMode ? 'bg-black border-gray-700' : 'bg-white border-gray-300'}`}
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                    />
                    <div className="flex space-x-2">
                      <button 
                        onClick={handleChangeOwnPassword}
                        className="flex-1 bg-[#375623] text-white py-2 rounded-lg text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all"
                      >
                        Salvar
                      </button>
                      <button 
                        onClick={() => setChangingPass(false)}
                        className="flex-1 bg-red-500/10 text-red-500 py-2 rounded-lg text-[9px] font-black uppercase transition-all"
                      >
                        Voltar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setChangingPass(true)}
                    className="w-full flex items-center justify-center space-x-2 p-3 border border-[#375623]/20 rounded-xl hover:bg-[#375623]/5 transition-colors text-[9px] font-black uppercase text-[#375623] dark:text-[#76923c]"
                  >
                    <KeyRound size={14} />
                    <span>Redefinir Senha Própria</span>
                  </button>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-300 dark:border-gray-800 opacity-40 text-center">
                 <ShieldCheck size={32} className="mx-auto mb-2 text-[#76923c]"/>
                 <p className="text-[8px] font-black uppercase tracking-widest leading-loose">Conformidade Ativa NR-26<br/>Gestão de Sinalização Newcom</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IA PANEL */}
      {aiPanelOpen && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAiPanelOpen(false)}></div>
          <div className={`w-full max-w-md h-full shadow-2xl flex flex-col relative animate-in slide-in-from-right duration-300 border-l transition-colors duration-500 ${darkMode ? 'bg-[#1a1a1a] border-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <div className={`p-6 border-b flex justify-between items-center transition-colors duration-500 ${darkMode ? 'border-gray-800 bg-black/50' : 'bg-[#375623] text-white'}`}>
              <div className="flex items-center space-x-3">
                <Sparkles size={24} className="text-[#76923c] animate-pulse"/>
                <h2 className="text-lg font-black uppercase tracking-tighter">Consultoria Técnica IA</h2>
              </div>
              <button onClick={() => setAiPanelOpen(false)} className="hover:rotate-90 transition-transform"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4 custom-scrollbar">
              {aiChat.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-6">
                   <SSTIcon size={64} className="mb-4 text-[#76923c]"/>
                   <p className="font-black uppercase text-[10px] tracking-widest leading-loose">Análise Logística Preditiva de SST.<br/>Consulte tendências de consumo ou normas técnicas.</p>
                </div>
              )}
              {aiChat.map((chat, i) => (
                <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-[11px] font-bold shadow-sm ${chat.role === 'user' ? 'bg-[#375623] text-white' : (darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100')}`}>
                    {chat.text}
                  </div>
                </div>
              ))}
              {isAiLoading && <div className="flex justify-center py-2"><Loader2 size={24} className="animate-spin text-[#76923c]" /></div>}
            </div>
            <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="relative">
                <input 
                  value={aiInput} 
                  onChange={(e) => setAiInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAi()} 
                  placeholder="Consulte o assistente Newcom..." 
                  className={`w-full p-4 pr-12 rounded-2xl border outline-none font-bold text-xs transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-[#76923c]' : 'bg-gray-50 focus:border-[#375623]'}`} 
                />
                <button onClick={handleAskAi} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#375623] hover:bg-[#2a411a] text-white rounded-xl shadow-lg transition-transform active:scale-90">
                  <Send size={18}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
};

export default App;
