import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BulleInput } from '../components/BulleInput';
import { Modal } from '../components/Modal';
import { Lock, Mail, ArrowRight, User, Briefcase, UserPlus, LogIn, RefreshCcw, Save } from 'lucide-react';
import { UserRole } from '../types';
import { storage } from '../utils/storage';

export const Login: React.FC = () => {
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  const { theme, themeType } = useTheme();
  
  // États du formulaire Login/SignUP
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [fonction, setFonction] = useState('');
  
  // États Réinitialisation
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 500));
    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('Identifiants incorrects. Astuce Admin: EDC2025');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setLoading(true);
    try {
      register({
        name,
        email,
        password,
        fonction,
        role: UserRole.GUEST,
        statut: 'actif'
      });
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError("Erreur lors de l'inscription.");
    }
    setLoading(false);
  };

  const handleDoReset = () => {
    if (!resetEmail || !resetNewPassword) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    const allUsers = storage.getUsers();
    const userIndex = allUsers.findIndex(u => u.email.toLowerCase() === resetEmail.toLowerCase());

    if (userIndex === -1) {
      alert("Aucun compte associé à cet email n'a été trouvé.");
      return;
    }

    allUsers[userIndex].password = resetNewPassword;
    storage.saveUsers(allUsers);
    
    alert("✅ Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.");
    setShowResetModal(false);
    setResetEmail('');
    setResetNewPassword('');
  };

  return (
    <div className={`min-h-screen ${theme.bgPage} flex items-center justify-center p-4 overflow-hidden relative font-sans transition-colors duration-500`}>
      
      {/* --- BACKGROUND ANIMÉ (uniquement pour certains thèmes pour garder la cohérence) --- */}
      {(themeType === 'glass' || themeType === 'cyber') && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
      )}

      <style>{`
        .container-glass {
          position: relative;
          overflow: hidden;
          width: 720px;
          max-width: 100%;
          min-height: 480px;
        }
        
        .form-container {
          position: absolute;
          top: 0;
          height: 100%;
          transition: all 0.6s ease-in-out;
        }

        .sign-in-container {
          left: 0;
          width: 50%;
          z-index: 2;
        }

        .sign-up-container {
          left: 0;
          width: 50%;
          opacity: 0;
          z-index: 1;
        }

        .container-glass.right-panel-active .sign-in-container {
          transform: translateX(100%);
          opacity: 0;
          z-index: 1;
        }

        .container-glass.right-panel-active .sign-up-container {
          transform: translateX(100%);
          opacity: 1;
          z-index: 5;
          animation: show 0.6s;
        }

        @keyframes show {
          0%, 49.99% { opacity: 0; z-index: 1; }
          50%, 100% { opacity: 1; z-index: 5; }
        }

        .overlay-container {
          position: absolute;
          top: 0;
          left: 50%;
          width: 50%;
          height: 100%;
          overflow: hidden;
          transition: transform 0.6s ease-in-out;
          z-index: 100;
        }

        .container-glass.right-panel-active .overlay-container {
          transform: translateX(-100%);
        }

        .overlay {
          background: ${themeType === 'glass' ? 'rgba(255, 255, 255, 0.03)' : themeType === 'retro' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.4)'};
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-left: 1px solid rgba(255,255,255,0.1);
          color: white;
          position: relative;
          left: -100%;
          height: 100%;
          width: 200%;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
        }

        .container-glass.right-panel-active .overlay {
          transform: translateX(50%);
        }

        .overlay-panel {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 25px;
          text-align: center;
          top: 0;
          height: 100%;
          width: 50%;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
        }

        .overlay-left { transform: translateX(-20%); }
        .container-glass.right-panel-active .overlay-left { transform: translateX(0); }
        
        .overlay-right { right: 0; transform: translateX(0); }
        .container-glass.right-panel-active .overlay-right { transform: translateX(20%); }

        @media (max-width: 768px) {
          .container-glass { min-height: auto; height: auto; overflow: visible; background: transparent; border: none; box-shadow: none; }
          .form-container { position: relative; width: 100%; height: auto; transition: none; background: rgba(255,255,255,0.05); border-radius: 2.5rem; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); margin-bottom: 2rem; }
          .sign-in-container, .sign-up-container { opacity: 1 !important; z-index: 1 !important; transform: none !important; display: none; }
          .sign-in-container.mobile-active, .sign-up-container.mobile-active { display: block; }
          .overlay-container { display: none; }
        }
      `}</style>

      {/* --- CONTENEUR PRINCIPAL --- */}
      <div className={`container-glass ${theme.card} ${isSignUpActive ? 'right-panel-active' : ''} transition-all duration-500 overflow-hidden shadow-2xl`}>
        
        {/* --- FORMULAIRE INSCRIPTION --- */}
        <div className={`form-container sign-up-container ${isSignUpActive ? 'mobile-active' : ''}`}>
          <form onSubmit={handleRegister} className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
            <h1 className={`text-xl font-black ${theme.textMain} tracking-tight uppercase`}>Créer un compte</h1>
            <div className="flex gap-2.5">
               <div className={`w-8 h-8 ${theme.buttonShape} bg-black/5 flex items-center justify-center ${theme.textMain} cursor-pointer hover:bg-black/10 border border-black/5 text-[9px] font-bold`}>G</div>
               <div className={`w-8 h-8 ${theme.buttonShape} bg-black/5 flex items-center justify-center ${theme.textMain} cursor-pointer hover:bg-black/10 border border-black/5 text-[9px] font-bold`}>in</div>
               <div className={`w-8 h-8 ${theme.buttonShape} bg-black/5 flex items-center justify-center ${theme.textMain} cursor-pointer hover:bg-black/10 border border-black/5 text-[9px] font-bold`}>f</div>
            </div>
            <span className={`${theme.textSecondary} text-[8px] font-black uppercase tracking-[0.2em]`}>ou par email</span>
            
            <div className="w-full space-y-2.5 text-left max-w-[260px]">
              <div className="relative group">
                <User className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textSecondary} group-focus-within:${theme.textAccent} transition-colors`} size={14} />
                <input type="text" placeholder="Nom & Prénom" className={`${theme.input} w-full pl-10 pr-4 py-2 text-xs`} value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="relative group">
                <Briefcase className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textSecondary} group-focus-within:${theme.textAccent} transition-colors`} size={14} />
                <input type="text" placeholder="Fonction" className={`${theme.input} w-full pl-10 pr-4 py-2 text-xs`} value={fonction} onChange={e => setFonction(e.target.value)} />
              </div>
              <div className="relative group">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textSecondary} group-focus-within:${theme.textAccent} transition-colors`} size={14} />
                <input type="email" placeholder="Email" className={`${theme.input} w-full pl-10 pr-4 py-2 text-xs`} value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="relative group">
                 <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textSecondary} group-focus-within:${theme.textAccent} transition-colors`} size={14} />
                 <input type="password" placeholder="Mot de passe" className={`${theme.input} w-full pl-10 pr-4 py-2 text-xs`} value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>

            <button type="submit" disabled={loading} className={`${theme.buttonPrimary} ${theme.buttonShape} px-9 py-2.5 font-black uppercase text-[8px] tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95`}>
               {loading ? 'Traitement...' : "S'inscrire"}
            </button>
          </form>
        </div>

        {/* --- FORMULAIRE CONNEXION --- */}
        <div className={`form-container sign-in-container ${!isSignUpActive ? 'mobile-active' : ''}`}>
          <form onSubmit={handleLogin} className="h-full flex flex-col items-center justify-center p-6 text-center space-y-6">
            <h1 className={`text-xl font-black ${theme.textMain} tracking-tight uppercase hidden md:block`}>Connexion</h1>
            
            <div className="flex gap-2.5 hidden md:flex">
               <div className={`w-8 h-8 ${theme.buttonShape} bg-black/5 flex items-center justify-center ${theme.textMain} cursor-pointer hover:bg-black/10 border border-black/5 text-[9px] font-bold`}>f</div>
               <div className={`w-8 h-8 ${theme.buttonShape} bg-black/5 flex items-center justify-center ${theme.textMain} cursor-pointer hover:bg-black/10 border border-black/5 text-[9px] font-bold`}>in</div>
               <div className={`w-8 h-8 ${theme.buttonShape} bg-black/5 flex items-center justify-center ${theme.textMain} cursor-pointer hover:bg-black/10 border border-black/5 text-[9px] font-bold`}>G</div>
            </div>
            
            <span className={`${theme.textSecondary} text-[8px] font-black uppercase tracking-[0.2em] hidden md:block`}>Accès Sécurisé</span>

            <div className="w-full space-y-3 text-left max-w-[260px]">
              <div className="relative group">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textSecondary} group-focus-within:${theme.textAccent} transition-colors`} size={14} />
                <input type="email" placeholder="Email" className={`${theme.input} w-full pl-10 pr-4 py-2.5 text-xs`} value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="relative group">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textSecondary} group-focus-within:${theme.textAccent} transition-colors`} size={14} />
                <input type="password" placeholder="Mot de passe" className={`${theme.input} w-full pl-10 pr-4 py-2.5 text-xs`} value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="flex justify-end pr-1">
                 <button 
                  type="button" 
                  onClick={() => setShowResetModal(true)}
                  className={`text-[8px] ${theme.textSecondary} hover:${theme.textMain} transition-colors font-black uppercase tracking-wider outline-none`}
                 >
                   Mot de passe oublié
                 </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-[8px] font-black bg-red-500/10 py-1.5 px-3 rounded-lg w-full border border-red-500/20">{error}</p>}

            <button type="submit" disabled={loading} className={`${theme.buttonPrimary} ${theme.buttonShape} w-full md:w-auto px-10 py-3 font-black uppercase text-[8px] tracking-[0.15em] shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2`}>
               {loading ? 'Validation...' : 'Se connecter'}
               {!loading && <ArrowRight size={12} />}
            </button>
          </form>
        </div>

        {/* --- OVERLAY COULISSANT --- */}
        <div className="overlay-container">
          <div className="overlay">
            
            <div className="overlay-panel overlay-left">
              <div className={`mb-4 w-14 h-14 bg-white/10 ${theme.buttonShape} flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/10`}>
                 <LogIn size={24} className="text-white" />
              </div>
              <h1 className="text-xl font-black text-white mb-2 tracking-tight uppercase">Déjà inscrit ?</h1>
              <p className="text-[10px] font-medium text-slate-100 mb-6 max-w-[200px] leading-relaxed opacity-90">
                Connectez-vous pour continuer votre suivi sur EDC Marchés360.
              </p>
              <button 
                className={`px-9 py-2.5 border-2 border-white/40 text-white ${theme.buttonShape} font-black uppercase text-[8px] tracking-widest hover:bg-white hover:text-slate-900 transition-all active:scale-95`}
                onClick={() => setIsSignUpActive(false)}
              >
                Se connecter
              </button>
            </div>

            <div className="overlay-panel overlay-right">
              <h1 className="text-xl font-black text-white mb-2 tracking-tight uppercase">Nouveau ?</h1>
              <p className="text-xs font-medium text-slate-100 mb-6 max-w-[240px] leading-relaxed opacity-90">
                créer votre profil pour accéder à la plateforme de suivi et d'archivage des marchés de EDC
              </p>
              <button 
                className={`px-9 py-2.5 border-2 border-white/40 text-white ${theme.buttonShape} font-black uppercase text-[8px] tracking-widest hover:bg-white hover:text-slate-900 transition-all active:scale-95`}
                onClick={() => setIsSignUpActive(true)}
              >
                S'inscrire
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* --- MODALE DE RÉINITIALISATION --- */}
      <Modal 
        isOpen={showResetModal} 
        onClose={() => setShowResetModal(false)} 
        title="Réinitialisation du compte"
        size="sm"
      >
        <div className="space-y-6 pt-4">
           <div className="text-center space-y-2">
              <div className={`w-16 h-16 bg-blue-edc-50 text-blue-edc-900 ${theme.buttonShape} flex items-center justify-center mx-auto mb-4 shadow-inner`}>
                 <RefreshCcw size={28} />
              </div>
              <p className={`text-xs font-medium ${theme.textSecondary} leading-relaxed px-4`}>
                Veuillez saisir votre email et votre nouveau mot de passe pour mettre à jour votre compte.
              </p>
           </div>

           <div className="space-y-4">
              <BulleInput 
                label="Adresse Email" 
                icon={Mail} 
                placeholder="ex: jean.dupont@edc.cm" 
                value={resetEmail} 
                onChange={(e) => setResetEmail(e.target.value)} 
              />
              <BulleInput 
                label="Nouveau Mot de Passe" 
                icon={Lock} 
                type="password" 
                placeholder="••••••••" 
                value={resetNewPassword} 
                onChange={(e) => setResetNewPassword(e.target.value)} 
              />
           </div>

           <button 
             onClick={handleDoReset}
             className={`${theme.buttonPrimary} w-full py-4 ${theme.buttonShape} font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3`}
           >
             <Save size={16} /> Réinitialiser maintenant
           </button>
        </div>
      </Modal>
      
      <p className={`absolute bottom-4 ${theme.textSecondary} text-[8px] font-black uppercase tracking-[0.3em] opacity-40`}>© 2025 EDC S.A. • Secure Enterprise Access</p>
    </div>
  );
};