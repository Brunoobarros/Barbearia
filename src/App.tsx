import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BarberService, WorkingConfig, Appointment, NotificationItem, Barber } from './types';
import { DEFAULT_SERVICES, DEFAULT_CONFIG, INITIAL_APPOINTMENTS, DEFAULT_BARBERS } from './data';
import { auth, db, isFirebaseConfigured } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import AppointmentForm from './components/AppointmentForm';
import AppointmentList from './components/AppointmentList';
import AdminPanel from './components/AdminPanel';
import NotificationCenter from './components/NotificationCenter';
import LucideIcon from './components/LucideIcon';
import InstallGuideModal from './components/InstallGuideModal';
import { motion, AnimatePresence } from 'motion/react';
import { timeToMinutes, hashPassword } from './utils';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'alert' | 'info' | 'reminder';
}

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<'agendar' | 'agenda' | 'admin' | 'notificacoes'>('agendar');

  // Reset scroll position to top when changing tabs
  useEffect(() => {
    // Scroll immediately
    window.scrollTo(0, 0);
    if (document.body) document.body.scrollTop = 0;
    if (document.documentElement) document.documentElement.scrollTop = 0;

    // Scroll again after exit transition completes (150ms) to ensure viewport starts at the top
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
      if (document.body) document.body.scrollTop = 0;
      if (document.documentElement) document.documentElement.scrollTop = 0;
    }, 180);

    return () => clearTimeout(timer);
  }, [currentTab]);

  // WhatsApp reminder / confirmation modal states
  const [pendingWhatsappApt, setPendingWhatsappApt] = useState<Appointment | null>(null);
  const [tempWhatsappPhone, setTempWhatsappPhone] = useState<string>('');

  // Core Persistent States
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    const saved = localStorage.getItem('barber_theme');
    return saved ? JSON.parse(saved) : false;
  });

  const [services, setServices] = useState<BarberService[]>(() => {
    const saved = localStorage.getItem('barber_services');
    return saved ? JSON.parse(saved) : DEFAULT_SERVICES;
  });

  const [workingConfig, setWorkingConfig] = useState<WorkingConfig>(() => {
    const saved = localStorage.getItem('barber_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Force-update working config to include Sunday (0) and updated hours if not set
        if (!parsed.workingDays.includes(0) || parsed.startHour !== '07:00' || parsed.endHour !== '22:00') {
          const updated = {
            ...parsed,
            startHour: '07:00',
            endHour: '22:00',
            workingDays: Array.from(new Set([0, ...parsed.workingDays])).sort((a, b) => a - b),
          };
          localStorage.setItem('barber_config', JSON.stringify(updated));
          return updated;
        }
        return parsed;
      } catch (e) {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem('barber_theme', JSON.stringify(isLightTheme));
    const bgColor = isLightTheme ? '#f8fafc' : '#020617';
    
    // Dynamically apply background color directly to html and body tags to prevent white borders on phone screens/notches
    document.documentElement.style.backgroundColor = bgColor;
    document.body.style.backgroundColor = bgColor;
    
    if (isLightTheme) {
      document.documentElement.classList.add('light-theme');
      document.body.classList.add('bg-slate-50');
      document.body.classList.remove('bg-slate-950');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.body.classList.add('bg-slate-950');
      document.body.classList.remove('bg-slate-50');
    }

    // Dynamic browser/PWA Address & Status Bar color styling
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', bgColor);
  }, [isLightTheme]);

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('barber_appointments');
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('barber_alerts');
    const defaultAlerts: NotificationItem[] = [
      {
        id: 'welcome-1',
        title: 'Bem-vindo ao Agendador!',
        message: 'Gerencie horários, adicione serviços no painel admin e configure alertas de lembrete como preferir.',
        time: '13:17',
        type: 'info',
        read: false,
      }
    ];
    return saved ? JSON.parse(saved) : defaultAlerts;
  });

  const [activeDate, setActiveDate] = useState<string>(() => {
    const now = new Date();
    const yStr = now.getFullYear();
    const mStr = (now.getMonth() + 1).toString().padStart(2, '0');
    const dStr = now.getDate().toString().padStart(2, '0');
    return `${yStr}-${mStr}-${dStr}`;
  }); // Dynamic today's date anchor
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [nativePermission, setNativePermission] = useState<boolean | null>(null);
  const [isInstallOpen, setIsInstallOpen] = useState<boolean>(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (isFirebaseConfigured) return false;
    const saved = localStorage.getItem('barber_admin_auth');
    return saved ? JSON.parse(saved) : false;
  });

  const [barbers, setBarbers] = useState<Barber[]>(() => {
    const saved = localStorage.getItem('barber_barbers');
    return saved ? JSON.parse(saved) : DEFAULT_BARBERS;
  });

  const [firebasePermissionError, setFirebasePermissionError] = useState<boolean>(false);

  const [loggedBarberId, setLoggedBarberId] = useState<string | null>(() => {
    const saved = localStorage.getItem('barber_logged_id');
    return saved || null;
  });

  const [shopName, setShopName] = useState<string>(() => {
    const saved = localStorage.getItem('barber_shop_name');
    return saved || 'Barbearia Premium';
  });

  // Sync shopName to localStorage
  useEffect(() => {
    localStorage.setItem('barber_shop_name', shopName);
  }, [shopName]);

  // Sync barbers of state to localStorage
  useEffect(() => {
    localStorage.setItem('barber_barbers', JSON.stringify(barbers));
  }, [barbers]);

  useEffect(() => {
    if (loggedBarberId) {
      localStorage.setItem('barber_logged_id', loggedBarberId);
    } else {
      localStorage.removeItem('barber_logged_id');
    }
  }, [loggedBarberId]);

  // Sync to standard LocalStorage
  useEffect(() => {
    localStorage.setItem('barber_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('barber_config', JSON.stringify(workingConfig));
  }, [workingConfig]);

  useEffect(() => {
    localStorage.setItem('barber_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('barber_alerts', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('barber_admin_auth', JSON.stringify(isAdmin));
  }, [isAdmin]);

  // --- STATE REFS FOR CALLBACKS ---
  const prevAptsRef = useRef<Appointment[]>([]);
  useEffect(() => {
    prevAptsRef.current = appointments;
  }, [appointments]);

  const stateRefs = useRef({ isAdmin, loggedBarberId, services, nativePermission });
  useEffect(() => {
    stateRefs.current = { isAdmin, loggedBarberId, services, nativePermission };
  }, [isAdmin, loggedBarberId, services, nativePermission]);

  const isInitialAptsLoad = useRef(true);

  // Request browser permission for native push alerts
  useEffect(() => {
    if (window.Notification) {
      if (Notification.permission === 'granted') {
        setNativePermission(true);
      } else if (Notification.permission === 'denied') {
        setNativePermission(false);
      }
    }
  }, []);

  // --- FIREBASE AUTH REAL-TIME SESSION SYNC ---
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdmin(true);
        setLoggedBarberId(null);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, [isFirebaseConfigured]);

  // --- FIRESTORE INTEGRATION REAL-TIME SYNC ---
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    // Real-time synchronization for Barbers
    const unsubBarbers = onSnapshot(collection(db, 'barbers'), (snapshot) => {
      const fbBarbers: Barber[] = [];
      snapshot.forEach((doc) => {
        fbBarbers.push({ id: doc.id, ...doc.data() } as Barber);
      });
      if (fbBarbers.length > 0) {
        setBarbers(fbBarbers);
      } else {
        // Seed Firestore if empty and we have local barbers
        if (barbers.length > 0) {
          barbers.forEach((barber) => {
            setDoc(doc(db!, 'barbers', barber.id), barber).catch(() => {});
          });
        }
      }
    }, (error) => {
      console.error('Barbers listener error:', error);
      if (error.code === 'permission-denied') {
        setFirebasePermissionError(true);
      }
    });

    // Real-time synchronization for Appointments (limited to last 30 days onwards to reduce Firestore reads drastically)
    const minDateStr = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const r = d.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${r}`;
    })();

    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('date', '>=', minDateStr)
    );

    const unsubAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const fbApts: Appointment[] = [];
      snapshot.forEach((doc) => {
        fbApts.push({ id: doc.id, ...doc.data() } as Appointment);
      });

      // Detecta novos agendamentos criados remotamente (por clientes) e dispara notificações
      if (!isInitialAptsLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const apt = change.doc.data() as Appointment;
            const alreadyExists = prevAptsRef.current.some(a => a.id === apt.id);
            
            if (!alreadyExists && apt.status !== 'canceled') {
              const { isAdmin: refIsAdmin, loggedBarberId: refBarberId, services: refServices, nativePermission: refNativePerm } = stateRefs.current;
              const isForMe = refIsAdmin || (refBarberId && (apt.barberId === refBarberId || apt.barberId === 'any' || !apt.barberId));
              
              if (isForMe) {
                const serviceName = refServices.find((s) => s.id === apt.serviceId)?.name || 'Serviço';
                const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const alertItem: NotificationItem = {
                  id: 'alert-' + Date.now() + Math.random().toString(36).substring(2, 7),
                  title: 'Novo Cliente Agendado! 💈',
                  message: `${apt.clientName} reservou ${serviceName} às ${apt.time} do dia ${apt.date.split('-').reverse().join('/')}`,
                  time: timeStr,
                  type: 'success',
                  read: false,
                };
                setNotifications((prev) => [alertItem, ...prev]);
                
                const toastId = 'toast-' + Math.random().toString(36).substring(2, 11);
                setToasts((prev) => [...prev, { id: toastId, title: alertItem.title, message: alertItem.message, type: 'success' }]);
                setTimeout(() => setToasts((current) => current.filter((t) => t.id !== toastId)), 4500);
                
                if (refNativePerm && window.Notification && Notification.permission === 'granted') {
                  new Notification(alertItem.title, { body: alertItem.message });
                }
              }
            }
          }
        });
      }
      isInitialAptsLoad.current = false;

      // Sort appointments by createdAt descending
      const sortedApts = fbApts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setAppointments(sortedApts);
    }, (error) => {
      console.error('Appointments listener error:', error);
      if (error.code === 'permission-denied') {
        setFirebasePermissionError(true);
      }
    });

    // Real-time synchronization for Services
    const unsubServices = onSnapshot(collection(db, 'services'), (snapshot) => {
      const fbServices: BarberService[] = [];
      snapshot.forEach((doc) => {
        fbServices.push({ id: doc.id, ...doc.data() } as BarberService);
      });
      if (fbServices.length > 0) {
        setServices(fbServices);
      } else {
        if (services.length > 0) {
          services.forEach((s) => {
            setDoc(doc(db!, 'services', s.id), s).catch(() => {});
          });
        }
      }
    }, (error) => {
      console.error('Services listener error:', error);
      if (error.code === 'permission-denied') {
        setFirebasePermissionError(true);
      }
    });

    // Real-time synchronization for configs (shopName, workingConfig)
    const unsubConfig = onSnapshot(doc(db, 'configs', 'settings'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.shopName) setShopName(data.shopName);
        if (data.workingConfig) setWorkingConfig(data.workingConfig);
      } else {
        if (auth?.currentUser) {
          setDoc(doc(db!, 'configs', 'settings'), { shopName, workingConfig }).catch(() => {});
        }
      }
    }, (error) => {
      console.error('Config listener error:', error);
      if (error.code === 'permission-denied') {
        setFirebasePermissionError(true);
      }
    });

    return () => {
      unsubBarbers();
      unsubAppointments();
      unsubServices();
      unsubConfig();
    };
  }, [isFirebaseConfigured]);

  const handleUpdateShopName = (newShopName: string) => {
    setShopName(newShopName);
    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'configs', 'settings'), { shopName: newShopName }, { merge: true })
        .catch((err) => {
          console.error("Firestore write shopName error:", err);
          if (err.code === 'permission-denied') setFirebasePermissionError(true);
        });
    }
  };

  const handleUpdateConfig = (newConfig: WorkingConfig) => {
    setWorkingConfig(newConfig);
    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'configs', 'settings'), { workingConfig: newConfig }, { merge: true })
        .catch((err) => {
          console.error("Firestore write config error:", err);
          if (err.code === 'permission-denied') setFirebasePermissionError(true);
        });
    }
  };

  const handleUpdateBarbers = (updatedBarbers: Barber[]) => {
    setBarbers(updatedBarbers);
    if (isFirebaseConfigured && db) {
      // Write/update each barber in Firestore
      updatedBarbers.forEach((barber) => {
        setDoc(doc(db!, 'barbers', barber.id), barber)
          .catch((err) => {
            console.error("Firestore write barber error:", err);
            if (err.code === 'permission-denied') setFirebasePermissionError(true);
          });
      });
      // Remove any barber from Firestore that is deleted locally
      barbers.forEach((b) => {
        if (!updatedBarbers.some((ub) => ub.id === b.id)) {
          deleteDoc(doc(db!, 'barbers', b.id))
            .catch((err) => {
              console.error("Firestore delete barber error:", err);
              if (err.code === 'permission-denied') setFirebasePermissionError(true);
            });
        }
      });
    }
  };

  const handleUpdateServices = (updatedServices: BarberService[]) => {
    setServices(updatedServices);
    if (isFirebaseConfigured && db) {
      updatedServices.forEach((service) => {
        setDoc(doc(db!, 'services', service.id), service)
          .catch((err) => {
            console.error("Firestore write service error:", err);
            if (err.code === 'permission-denied') setFirebasePermissionError(true);
          });
      });
      // Delete removed services
      services.forEach((s) => {
        if (!updatedServices.some((us) => us.id === s.id)) {
          deleteDoc(doc(db!, 'services', s.id))
            .catch((err) => {
              console.error("Firestore delete service error:", err);
              if (err.code === 'permission-denied') setFirebasePermissionError(true);
            });
        }
      });
    }
  };

  // --- FLOATING TOASTS TRIGGER ---
  const showToast = useCallback((title: string, message: string, type: 'success' | 'alert' | 'info' | 'reminder') => {
    const id = 'toast-' + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    // Auto remove toast
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const handleRequestNativePermission = () => {
    if (!window.Notification) {
      showToast('API Não Suportada', 'Este navegador ou ambiente iframe não oferece suporte a notificações push nativas.', 'alert');
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        setNativePermission(true);
        showToast('Permissão Concedida!', 'As notificações do sistema estão prontas e habilitadas.', 'success');
      } else {
        setNativePermission(false);
        showToast('Permissão Negada', 'Habilite as notificações nas configurações do navegador para usá-las.', 'alert');
      }
    });
  };

  // --- CONTROLLER HANDLERS ---
  const handleAddAppointment = async (aptData: {
    clientName: string;
    clientPhone: string;
    date: string;
    time: string;
    serviceId: string;
    notes: string;
    barberId?: string;
  }): Promise<boolean> => {
    // 1. Checagem em tempo real no Firestore se estiver online
    let exists = false;
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'appointments'),
          where('date', '==', aptData.date),
          where('status', '!=', 'canceled')
        );
        const snapshot = await getDocs(q);
        const latestAppointments: Appointment[] = [];
        snapshot.forEach((doc) => {
          latestAppointments.push({ id: doc.id, ...doc.data() } as Appointment);
        });

        exists = latestAppointments.some((a) => {
          if (aptData.barberId && a.barberId === aptData.barberId) {
            const startExisting = timeToMinutes(a.time);
            const serviceExisting = services.find(s => s.id === a.serviceId);
            const durationExisting = serviceExisting ? serviceExisting.duration : 30;
            
            const startTarget = timeToMinutes(aptData.time);
            const serviceTarget = services.find(s => s.id === aptData.serviceId);
            const durationTarget = serviceTarget ? serviceTarget.duration : 30;
            
            return (startTarget < startExisting + durationExisting) && (startTarget + durationTarget > startExisting);
          }
          return false;
        });
      } catch (err) {
        console.error("Erro ao verificar agendamentos no Firestore:", err);
      }
    }

    // Fallback: se o check online falhou ou não rodou, verifica no estado local em memória
    if (!exists) {
      exists = appointments.some((a) => {
        if (a.date !== aptData.date || a.status === 'canceled') return false;
        
        if (aptData.barberId && a.barberId === aptData.barberId) {
          const startExisting = timeToMinutes(a.time);
          const serviceExisting = services.find(s => s.id === a.serviceId);
          const durationExisting = serviceExisting ? serviceExisting.duration : 30;
          
          const startTarget = timeToMinutes(aptData.time);
          const serviceTarget = services.find(s => s.id === aptData.serviceId);
          const durationTarget = serviceTarget ? serviceTarget.duration : 30;
          
          return (startTarget < startExisting + durationExisting) && (startTarget + durationTarget > startExisting);
        }
        return false;
      });
    }

    if (exists) {
      showToast('Horário Indisponível', 'Este horário para o profissional escolhido acabou de ser preenchido por outro cliente. Por favor, escolha outro horário.', 'alert');
      return false;
    }

    const newApt: Appointment = {
      ...aptData,
      id: 'apt-' + Date.now(),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    setAppointments((prev) => [newApt, ...prev]);
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'appointments', newApt.id), newApt);
      } catch (err: any) {
        console.error("Firestore write appointment error:", err);
        if (err.code === 'permission-denied') setFirebasePermissionError(true);
        return false;
      }
    }

    // Create Notification item
    const serviceName = services.find((s) => s.id === aptData.serviceId)?.name || 'Serviço';
    const alertItem: NotificationItem = {
      id: 'alert-' + Date.now(),
      title: 'Novo Cliente Agendado! 💈',
      message: `${aptData.clientName} reservou ${serviceName} às ${aptData.time} do dia ${aptData.date.split('-').reverse().join('/')}`,
      time: 'Agora',
      type: 'success',
      read: false,
    };
    setNotifications((prev) => [alertItem, ...prev]);

    // Show instant success notification
    showToast('Agendamento Concluído', `Horário reservado com sucesso para ${aptData.clientName} às ${aptData.time}!`, 'success');
    
    // Set states to trigger the WhatsApp Confirmation popup instead of immediate tab change
    setPendingWhatsappApt(newApt);
    setTempWhatsappPhone(aptData.clientPhone || '');
    return true;
  };

  const handleSendWhatsapp = (apt: Appointment) => {
    const serviceName = services.find((s) => s.id === apt.serviceId)?.name || 'Serviço';
    const cleanPhone = tempWhatsappPhone.replace(/\D/g, '');
    
    // Validate phone length (should be 10 or 11 digits when ignoring country code 55)
    let baseDigits = cleanPhone;
    if (cleanPhone.startsWith('55') && (cleanPhone.length === 12 || cleanPhone.length === 13)) {
      baseDigits = cleanPhone.slice(2);
    }

    if (baseDigits.length !== 10 && baseDigits.length !== 11) {
      showToast(
        'Nº de WhatsApp Inválido',
        'O WhatsApp deve conter o DDD com 10 ou 11 dígitos. Ex: (11) 99999-9999',
        'alert'
      );
      return;
    }

    let formattedPhone = cleanPhone;
    if (cleanPhone.length > 0) {
      if (!cleanPhone.startsWith('55') && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
        formattedPhone = '55' + cleanPhone;
      }
    }

    const message = `Agendamento na *${shopName}* foi confirmado com sucesso! \n*Serviço:* ${serviceName}\n📅 *Data:* ${apt.date.split('-').reverse().join('/')}\n⏰ *Horário:* ${apt.time}\n📍 \n`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    setPendingWhatsappApt(null);
    setCurrentTab('agenda'); // Navigate to agenda automatically after
  };

  const handleDismissWhatsapp = () => {
    setPendingWhatsappApt(null);
    setCurrentTab('agenda'); // Navigate to agenda automatically
  };

  const handleRemoveAppointment = (id: string) => {
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === id) {
          const serviceName = services.find((s) => s.id === apt.serviceId)?.name || 'Serviço';
          // Record cancel activity
          const alertItem: NotificationItem = {
            id: 'alert-' + Date.now(),
            title: 'Agendamento Cancelado 🅇',
            message: `O horário de ${apt.clientName} (${serviceName}) às ${apt.time} foi removido do catálogo.`,
            time: 'Agora',
            type: 'alert',
            read: false,
          };
          setNotifications((alerts) => [alertItem, ...alerts]);
          return { ...apt, status: 'canceled' as const };
        }
        return apt;
      })
    );
    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, 'appointments', id), { status: 'canceled' })
        .catch((err) => {
          console.error("Firestore cancel appointment error:", err);
          if (err.code === 'permission-denied') setFirebasePermissionError(true);
        });
    }
  };

  const handleCompleteAppointment = (id: string) => {
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === id) {
          const serviceName = services.find((s) => s.id === apt.serviceId)?.name || 'Serviço';
          // Record completed activity in notifications
          const alertItem: NotificationItem = {
            id: 'alert-' + Date.now(),
            title: 'Atendimento Concluído! 🥳',
            message: `O atendimento de ${apt.clientName} (${serviceName}) foi marcado como concluído. Seus lucros e estatísticas foram atualizados.`,
            time: 'Agora',
            type: 'success',
            read: false,
          };
          setNotifications((alerts) => [alertItem, ...alerts]);
          return { ...apt, status: 'completed' as const };
        }
        return apt;
      })
    );
    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, 'appointments', id), { status: 'completed' })
        .catch((err) => {
          console.error("Firestore complete appointment error:", err);
          if (err.code === 'permission-denied') setFirebasePermissionError(true);
        });
    }
    showToast('Atendimento Concluído', 'O atendimento foi marcado como concluído e adicionado ao histórico.', 'success');
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    showToast('Limpeza Concluída', 'Seu histórico foi removido com sucesso.', 'info');
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleAdminLogin = async () => {
    const user = adminUsername.trim().toLowerCase();
    const pass = adminPassword.trim();

    if (!user || !pass) {
      setAdminError('Por favor, digite o usuário e senha.');
      return;
    }

    // 1. Verifica primeiro se o usuário é um Barbeiro (salvo no banco de dados Firestore)
    const targetUsername = user.includes('@') ? user.split('@')[0].toLowerCase() : user;
    const barber = barbers.find((b) => b.active && b.username.toLowerCase() === targetUsername);

    if (barber) {
      const hashed = await hashPassword(pass);
      const isPlaintextMatch = barber.password === pass;
      const isHashedMatch = barber.password === hashed;

      if (isHashedMatch || isPlaintextMatch) {
        // Migração automática de texto claro para hash SHA-256
        if (isPlaintextMatch) {
          const updatedBarbersList = barbers.map((b) =>
            b.id === barber.id ? { ...b, password: hashed } : b
          );
          handleUpdateBarbers(updatedBarbersList);
        }

        setIsAdmin(false);
        setLoggedBarberId(barber.id);
        setCurrentTab('admin');
        setIsAdminAuthOpen(false);
        setAdminUsername('');
        setAdminPassword('');
        setAdminError('');
        showToast('Login Realizado', `Bem-vindo, ${barber.name}!`, 'success');
        return;
      } else {
        setAdminError('Senha incorreta para este barbeiro.');
        setAdminPassword('');
        return;
      }
    }

    // 2. Se não for barbeiro, tenta autenticar como Administrador Geral via Firebase Auth
    if (isFirebaseConfigured && auth) {
      let loginEmail = user;
      if (!loginEmail.includes('@')) {
        loginEmail = loginEmail === 'admin' ? 'admin@barbeiro.com.br' : `${loginEmail}@barbeiro.com.br`;
      }

      try {
        await signInWithEmailAndPassword(auth, loginEmail, pass);
        setIsAdmin(true);
        setLoggedBarberId(null);
        localStorage.removeItem('barber_logged_id');
        setCurrentTab('admin');
        setIsAdminAuthOpen(false);
        setAdminUsername('');
        setAdminPassword('');
        setAdminError('');
        showToast('Login Realizado', 'Bem-vindo, Administrador!', 'success');
      } catch (err: any) {
        console.error('Firebase Auth error:', err);
        let errorMsg = 'Erro ao realizar login. Verifique as credenciais.';
        if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          errorMsg = 'Usuário ou senha incorretos.';
        } else if (err.code === 'auth/network-request-failed') {
          errorMsg = 'Falha de rede. Verifique sua conexão.';
        } else if (err.code === 'auth/operation-not-allowed') {
          errorMsg = 'Login com Email/Senha não habilitado no Firebase.';
        }
        setAdminError(errorMsg);
        setAdminPassword('');
      }
    } else {
      setAdminError('Usuário não encontrado. O Firebase não está configurado.');
    }
  };

  const handleAdminLogout = async () => {
    setIsAdmin(false);
    setLoggedBarberId(null);
    setCurrentTab('agendar');
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Error signing out of Firebase', err);
      }
    }
    showToast('Sessão Encerrada', 'Desconectado com sucesso.', 'info');
  };

  const handleAdminButtonClick = () => {
    if (isAdmin || loggedBarberId) {
      setCurrentTab('admin');
    } else {
      setIsAdminAuthOpen(true);
      setAdminUsername('');
      setAdminPassword('');
      setAdminError('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`min-h-screen ${isLightTheme ? 'light-theme bg-slate-50 text-slate-800' : 'bg-slate-950 text-slate-200'} font-sans selection:bg-amber-500 selection:text-slate-950 pb-20 md:pb-6 transition-colors duration-300`}
    >
      
      {/* Dynamic Floating Toast System */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className={`p-3.5 rounded-2xl shadow-2xl pointer-events-auto border flex gap-3.5 items-start ${
                toast.type === 'success'
                  ? 'bg-slate-900 border-emerald-500 text-white shadow-emerald-500/10'
                  : toast.type === 'alert'
                  ? 'bg-slate-900 border-red-500 text-white shadow-red-500/10'
                  : toast.type === 'reminder'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 border-amber-400 text-slate-950 font-bold shadow-amber-500/20'
                  : 'bg-slate-900 border-indigo-500 text-white shadow-indigo-500/10'
              }`}
            >
              <div className={`p-1.5 rounded-md ${
                toast.type === 'reminder' ? 'bg-slate-950/25 text-slate-950' : 'bg-slate-850 text-amber-500'
              }`}>
                <LucideIcon
                  name={toast.type === 'success' ? 'CheckCircle' : toast.type === 'alert' ? 'AlertTriangle' : 'Bell'}
                  size={16}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className={`text-xs font-display font-extrabold tracking-wide uppercase ${
                  toast.type === 'reminder' ? 'text-slate-950' : 'text-slate-300'
                }`}>
                  {toast.title}
                </h5>
                <p className={`text-xs leading-relaxed mt-0.5 ${
                  toast.type === 'reminder' ? 'text-slate-950 font-medium' : 'text-slate-400'
                }`}>
                  {toast.message}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Container Header */}
      <header className={`py-2 px-4 sticky top-0 z-40 backdrop-blur-md transition-all duration-300 border-b bg-opacity-95 ${
        isLightTheme
          ? 'bg-white border-slate-150 shadow-sm'
          : 'bg-slate-900 border-slate-800/85'
      }`}>
        <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Visual Barber Logo Icon */}
            <div className={`p-1 rounded-xl flex items-center justify-center transition-colors border overflow-hidden ${
              isLightTheme
                ? 'bg-amber-50 border-amber-100 text-amber-600'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {/* Substitua a URL abaixo pelo link ou caminho da sua imagem */}
              <img src="/logo.png" alt="Logo Barbearia" className="w-6 h-6 object-cover rounded-lg scale-[1.08]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className={`text-lg font-display font-black tracking-tight uppercase leading-none transition-colors duration-300 ${isLightTheme ? 'text-slate-950' : 'text-white'}`}>
                  {shopName}
                </h1>
                {(isAdmin || loggedBarberId) && (
                  <button 
                    onClick={() => {
                      const newName = prompt("Digite o novo nome da Barbearia:", shopName);
                      if (newName && newName.trim()) {
                        setShopName(newName.trim());
                        showToast('Nome da Barbearia', `Nome alterado para "${newName.trim()}"`, 'success');
                      }
                    }} 
                    className="p-1 text-amber-500 hover:text-amber-400 transition-colors cursor-pointer flex items-center justify-center rounded-lg hover:bg-amber-500/10"
                    title="Editar nome da barbearia"
                  >
                    <LucideIcon name="Edit" size={12} />
                  </button>
                )}
              </div>
              {isAdmin && (
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-500">PAINEL ADMIN</span>
              )}
              {loggedBarberId && (
                <div className="flex items-center gap-1.5 mt-1 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] uppercase font-bold text-slate-450 text-slate-400">
                    Agenda: <strong className="text-emerald-450">{barbers.find(b => b.id === loggedBarberId)?.name.split(' ')[0]}</strong>
                  </span>
                  <button 
                    onClick={handleAdminLogout} 
                    className="text-[9px] uppercase font-bold text-red-500 hover:text-red-400 ml-1.5 hover:underline cursor-pointer"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLightTheme(!isLightTheme)}
              className={`p-2 rounded-xl transition-all border outline-none cursor-pointer flex items-center justify-center ${
                isLightTheme
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-705 text-amber-400'
              }`}
              title={isLightTheme ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
            >
              <LucideIcon name={isLightTheme ? 'Moon' : 'Sun'} size={18} />
            </button>
            {(isAdmin || loggedBarberId) && (
              <button
                onClick={() => setCurrentTab('notificacoes')}
                className={`p-2 rounded-xl transition-all border outline-none cursor-pointer flex items-center justify-center relative ${
                  isLightTheme
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-705 text-amber-400'
                }`}
                title="Notificações"
              >
                <LucideIcon name="Bell" size={18} />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white font-mono font-bold text-[8px] px-1 py-0.1 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Primary Dynamic App Body Context Router */}
      <main className="max-w-md md:max-w-xl mx-auto px-4 pt-5 pb-28 md:pb-12">
        {isFirebaseConfigured && firebasePermissionError && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 mb-5 shadow-lg text-amber-200">
            <div className="flex justify-between items-start gap-2.5">
              <div className="flex gap-2.5">
                <span className="text-xl">⚠️</span>
                <div>
                  <h3 className="font-display font-black text-amber-400 text-sm uppercase tracking-wide">
                    Erro de Permissão no Firestore
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    As regras de segurança do seu Firestore estão bloqueando o acesso aos dados (leitura ou escrita negada).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFirebasePermissionError(false)}
                className="hover:bg-amber-500/20 p-1 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-white"
                title="Fechar aviso"
              >
                <LucideIcon name="X" size={14} />
              </button>
            </div>

            <div className="mt-4 bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-[11px] font-mono leading-relaxed overflow-x-auto text-slate-300">
              <div className="flex justify-between items-center mb-1.5 text-[9px] text-slate-400 uppercase font-black tracking-wider">
                <span>REGRAS DO FIRESTORE RECOMENDADAS:</span>
                <button
                  onClick={() => {
                    const rulesText = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /barbers/{document} {\n      allow read: if true;\n      allow write: if request.auth != null;\n    }\n    match /services/{document} {\n      allow read: if true;\n      allow write: if request.auth != null;\n    }\n    match /configs/{document} {\n      allow read: if true;\n      allow write: if request.auth != null;\n    }\n    match /appointments/{document} {\n      allow read, write: if true;\n    }\n  }\n}`;
                    navigator.clipboard.writeText(rulesText);
                    showToast('Copiado!', 'Regras de segurança copiadas para a área de transferência.', 'success');
                  }}
                  className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded transition-colors text-[9px] cursor-pointer"
                >
                  Copiar Regras
                </button>
              </div>
              <pre className="whitespace-pre">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /barbers/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /services/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /configs/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /appointments/{document} {
      allow read, write: if true;
    }
  }
}`}</pre>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              👉 Acesse seu <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-amber-400 underline hover:text-amber-300">Firebase Console → Firestore Database → aba Rules</a>, cole as regras acima e clique em <strong>Publicar</strong>. Enquanto isso, o app está operando em <strong>modo de backup local offline</strong> para não interromper seu uso.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentTab === 'agendar' && (
            <motion.div
              key="tab-schedule-wizard"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <AppointmentForm
                services={services}
                workingConfig={workingConfig}
                appointments={appointments}
                onAddAppointment={handleAddAppointment}
                activeDate={activeDate}
                setActiveDate={setActiveDate}
                showToast={showToast}
                isLightTheme={isLightTheme}
                barbers={barbers}
              />
            </motion.div>
          )}

          {currentTab === 'agenda' && (
            <motion.div
              key="tab-appointments-list"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <AppointmentList
                appointments={appointments}
                services={services}
                onRemoveAppointment={handleRemoveAppointment}
                onCompleteAppointment={handleCompleteAppointment}
                showToast={showToast}
                isLightTheme={isLightTheme}
                isAdmin={isAdmin}
                barbers={barbers}
                loggedBarberId={loggedBarberId || undefined}
                shopName={shopName}
              />
            </motion.div>
          )}

          {currentTab === 'admin' && (
            <motion.div
              key="tab-admin-dashboard"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className={`rounded-3xl p-5 shadow-lg border transition-colors duration-300 ${
                isLightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-xl font-display font-black flex items-center gap-2 ${isLightTheme ? 'text-slate-950' : 'text-white'}`}>
                      <span>⚙️</span> Painel Administrativo
                    </h2>
                    <p className={`text-xs font-medium uppercase tracking-widest mt-0.5 ${isLightTheme ? 'text-slate-550 text-slate-500' : 'text-slate-400'}`}>Gestão de Serviços e Horários</p>
                  </div>
                  <button
                    onClick={handleAdminLogout}
                    className="text-[10px] uppercase tracking-wider text-red-400 hover:text-red-300 font-bold transition-colors flex items-center gap-1"
                  >
                    <LucideIcon name="LogOut" size={14} />
                    Sair
                  </button>
                </div>
              </div>
              <AdminPanel
                services={services}
                onUpdateServices={handleUpdateServices}
                workingConfig={workingConfig}
                onUpdateConfig={handleUpdateConfig}
                appointments={appointments}
                showToast={showToast}
                isLightTheme={isLightTheme}
                barbers={barbers}
                onUpdateBarbers={handleUpdateBarbers}
                loggedBarberId={loggedBarberId || undefined}
                shopName={shopName}
                onUpdateShopName={handleUpdateShopName}
              />
            </motion.div>
          )}

          {currentTab === 'notificacoes' && (
            <motion.div
              key="tab-notifications-screen"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
                <h2 className="text-xl font-display font-black text-white flex items-center gap-2">
                  <span>🔔</span> Notificações Push
                </h2>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-0.5">Alertas de Atendimento instantâneos</p>
              </div>
              <NotificationCenter
                notifications={notifications}
                onClearNotifications={handleClearNotifications}
                onMarkAllAsRead={handleMarkAllAsRead}
                showToast={showToast}
                onRequestNativePermission={handleRequestNativePermission}
                hasNativePermission={nativePermission}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Sticky Native Navigation Controls for Smartphone views */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800/90 py-2.5 px-3 px-safe z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.65)]">
        <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-around">
          <button
            onClick={() => setCurrentTab('agendar')}
            id="tab-button-agendar"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
              currentTab === 'agendar' ? 'text-amber-500 font-extrabold scale-105 bg-slate-950/40 border border-slate-800' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LucideIcon name="Calendar" size={18} className={currentTab === 'agendar' ? 'stroke-[2.5]' : 'stroke-2'} />
            <span className="text-[10px] mt-1 font-display font-semibold tracking-wide">Agendar</span>
          </button>

          <button
            onClick={() => setCurrentTab('agenda')}
            id="tab-button-agenda"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer relative ${
              currentTab === 'agenda' ? 'text-amber-500 font-extrabold scale-105 bg-slate-950/40 border border-slate-800' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LucideIcon name="Briefcase" size={18} className={currentTab === 'agenda' ? 'stroke-[2.5]' : 'stroke-2'} />
            <span className="text-[10px] mt-1 font-display font-semibold tracking-wide">Agendamento</span>
            {appointments.filter(a => {
              const todayStr = (() => {
                const now = new Date();
                const yStr = now.getFullYear();
                const mStr = (now.getMonth() + 1).toString().padStart(2, '0');
                const dStr = now.getDate().toString().padStart(2, '0');
                return `${yStr}-${mStr}-${dStr}`;
              })();
              return a.date === todayStr && a.status !== 'canceled';
            }).length > 0 && (
              <span className="absolute top-1 right-2.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={handleAdminButtonClick}
            id="tab-button-admin"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
              currentTab === 'admin' ? 'text-amber-500 font-extrabold scale-105 bg-slate-950/40 border border-slate-800' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LucideIcon name="Settings" size={18} className={currentTab === 'admin' ? 'stroke-[2.5]' : 'stroke-2'} />
            <span className="text-[10px] mt-1 font-display font-semibold tracking-wide">Admin</span>
          </button>
        </div>
      </nav>

      {/* Admin Auth Modal */}
      <AnimatePresence>
        {isAdminAuthOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex p-4 overflow-y-auto bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAdminAuthOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm mx-auto mt-10 mb-auto sm:m-auto shrink-0 rounded-3xl p-6 shadow-2xl border ${
                isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <LucideIcon name="Lock" size={32} className="text-amber-500" />
                </div>
                <h3 className={`text-xl font-display font-black ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
                  Área Administrativa
                </h3>
                <p className={`text-xs mt-1 ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                  Digite a senha para acessar o painel
                </p>
                {isFirebaseConfigured ? (
                  <div className="inline-flex items-center gap-1.5 mt-3.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Firebase Ativo (Login Firebase)
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 mt-3.5 px-3 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Chaves não configuradas no Vercel (Requer Firebase)
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>
                    Usuário de Login
                  </label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="usuario"
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${
                      isLightTheme
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                        : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-amber-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>
                    Senha
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                    placeholder="Digite sua senha"
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${
                      isLightTheme
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                        : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-amber-500'
                    }`}
                  />
                  {adminError && (
                    <p className="text-red-500 text-xs mt-2 text-center font-medium">
                      {adminError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsAdminAuthOpen(false);
                      setAdminPassword('');
                      setAdminError('');
                    }}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      isLightTheme
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAdminLogin}
                    className="flex-1 py-3 rounded-xl font-semibold bg-amber-500 text-slate-900 hover:bg-amber-400 transition-all"
                  >
                    Entrar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp Confirmation Choice Modal */}
      <AnimatePresence>
        {pendingWhatsappApt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex p-4 overflow-y-auto bg-black/60 backdrop-blur-sm"
            onClick={handleDismissWhatsapp}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-sm mx-auto mt-10 mb-auto sm:m-auto shrink-0 rounded-3xl p-6 shadow-2xl border transition-all duration-200 ${
                isLightTheme ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
              }`}
            >
              <div className="text-center mb-5">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center animate-pulse">
                  <LucideIcon name="MessageSquare" size={32} className="text-emerald-500" />
                </div>
                <h3 className={`text-xl font-display font-black leading-tight ${isLightTheme ? 'text-slate-950' : 'text-white'}`}>
                  Enviar Confirmação?
                </h3>
                <p className={`text-xs mt-1.5 leading-relaxed ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                  Deseja enviar a confirmação do horário para o WhatsApp de <span className="font-extrabold text-amber-500">{pendingWhatsappApt.clientName}</span>?
                </p>
              </div>

              {/* Summary recap ticket */}
              <div className={`p-4 rounded-2xl mb-5 space-y-2 text-xs border ${
                isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-955 border-slate-800/80 text-slate-300'
              }`}>
                <div className="flex justify-between items-center pb-1.5 border-b border-dashed border-slate-505/15">
                  <span className="text-slate-400 font-semibold">Serviço</span>
                  <span className={`font-bold ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>{services.find(s => s.id === pendingWhatsappApt.serviceId)?.name || 'Serviço'}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-dashed border-slate-505/15">
                  <span className="text-slate-405 text-slate-400 font-semibold">Data</span>
                  <span className={`font-bold ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>{pendingWhatsappApt.date.split('-').reverse().join('/')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Horário</span>
                  <span className="font-mono font-black text-amber-500 text-sm">{pendingWhatsappApt.time}</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Phone verification input */}
                <div>
                  <label htmlFor="modal-whatsapp-phone" className={`block text-xs font-semibold mb-1.5 ${isLightTheme ? 'text-slate-600' : 'text-slate-300'}`}>
                    Confirmar WhatsApp ou Celular:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-505">
                      <LucideIcon name="Phone" size={14} />
                    </div>
                    <input
                      type="tel"
                      id="modal-whatsapp-phone"
                      placeholder="Ex: (11) 99999-9999"
                      value={tempWhatsappPhone}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length > 11) value = value.slice(0, 11);
                        if (value.length > 6) {
                          value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
                        } else if (value.length > 2) {
                          value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                        } else if (value.length > 0) {
                          value = `(${value}`;
                        }
                        setTempWhatsappPhone(value);
                      }}
                      className={`block w-full pl-9 pr-3 py-2.5 border focus:border-emerald-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-mono transition-all ${
                        isLightTheme ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsapp(pendingWhatsappApt)}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <LucideIcon name="Send" size={14} className="stroke-[2.5]" />
                    Enviar pelo WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={handleDismissWhatsapp}
                    className={`w-full py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all ${
                      isLightTheme
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                    }`}
                  >
                    Fechar e Ver Agenda
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install Guide Modal Overlay */}
      <InstallGuideModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
        isLightTheme={isLightTheme}
      />
    </motion.div>
  );
}
