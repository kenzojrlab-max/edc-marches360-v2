import React, { useState, useEffect } from 'react'; // AJOUT: useEffect
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BulleInput } from '../components/BulleInput';
import { Modal } from '../components/Modal';
import { Lock, Mail, ArrowRight, User, Briefcase, LogIn, RefreshCcw, Save } from 'lucide-react';
import { UserRole } from '../types';
// import { storage } from '../utils/storage'; // SUPPRIMÉ : Plus besoin
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { initAppCheck } from "../appCheck";

export const Login: React.FC = () => {
  // Initialiser App Check au premier rendu de la page Login
  useEffect(() => {
    initAppCheck();
  }, []);

  const [isSignUpActive, setIsSignUpActive] = useState(false);
  const { theme, themeType } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [fonction, setFonction] = useState('');
  
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // On récupère 'user' du contexte pour surveiller la connexion
  const { login, loginWithGoogle, register, user } = useAuth();
  const navigate = useNavigate();

  // AJOUT : Redirection automatique dès que l'utilisateur est détecté par le contexte
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(email, password);
    if (!success) {
      setError('Identifiants incorrects.');
    }
    // Si success est vrai, le useEffect ci-dessus déclenchera la redirection
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await loginWithGoogle();
    setLoading(false);
    // SUPPRIMÉ : if (storage.getSession()) navigate('/'); 
    // La redirection est gérée par le useEffect
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        fonction,
        role: UserRole.GUEST,
        statut: 'actif'
      });
      // Après inscription, on connecte l'utilisateur
      await login(email, password);
    } catch (err) {
      setError("Erreur lors de l'inscription.");
    }
    setLoading(false);
  };

  const handleDoReset = async () => {
    if (!resetEmail) {
      alert("Veuillez saisir votre email.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alert("📧 Un email de réinitialisation a été envoyé ! Vérifiez vos spams.");
      setShowResetModal(false);
    } catch (error: any) {
      console.error(error);
      alert("Erreur : " + error.message);
    }
  };

  return (
    <div className={`min-h-screen ${theme.bgPage} flex items-center justify-center p-4 overflow-hidden relative font-sans transition-colors duration-500`}>
      
      {(themeType === 'glass' || themeType === 'cyber') && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
      )}

      {/* Effet d'arrière-plan pour le thème Metal */}
      {themeType === 'metal' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 via-slate-700/30 to-slate-900/50"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-600/20 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-full h-1/2 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-slate-500/10 via-transparent to-transparent"></div>
        </div>
      )}

      <style>{`
        .container-glass { position: relative; overflow: hidden; width: 720px; max-width: 100%; min-height: 520px; }
        .form-container { position: absolute; top: 0; height: 100%; transition: all 0.6s ease-in-out; }
        .sign-in-container { left: 0; width: 50%; z-index: 2; }
        .sign-up-container { left: 0; width: 50%; opacity: 0; z-index: 1; }
        .container-glass.right-panel-active .sign-in-container { transform: translateX(100%); opacity: 0; z-index: 1; }
        .container-glass.right-panel-active .sign-up-container { transform: translateX(100%); opacity: 1; z-index: 5; animation: show 0.6s; }
        @keyframes show { 0%, 49.99% { opacity: 0; z-index: 1; } 50%, 100% { opacity: 1; z-index: 5; } }
        .overlay-container { position: absolute; top: 0; left: 50%; width: 50%; height: 100%; overflow: hidden; transition: transform 0.6s ease-in-out; z-index: 100; }
        .container-glass.right-panel-active .overlay-container { transform: translateX(-100%); }
        .overlay { background: ${themeType === 'glass' ? 'rgba(255, 255, 255, 0.03)' : themeType === 'retro' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.4)'}; backdrop-filter: blur(20px); border-left: 1px solid rgba(255,255,255,0.1); color: white; position: relative; left: -100%; height: 100%; width: 200%; transform: translateX(0); transition: transform 0.6s ease-in-out; }
        .container-glass.right-panel-active .overlay { transform: translateX(50%); }
        .overlay-panel { position: absolute; display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 0 25px; text-align: center; top: 0; height: 100%; width: 50%; transform: translateX(0); transition: transform 0.6s ease-in-out; }
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

      <div className={`container-glass ${theme.card} ${isSignUpActive ? 'right-panel-active' : ''} transition-all duration-500 overflow-hidden shadow-2xl`}>
        
        {/* --- INSCRIPTION --- */}
        <div className={`form-container sign-up-container ${isSignUpActive ? 'mobile-active' : ''}`}>
          <form onSubmit={handleRegister} className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4" autoComplete="off">
            <h1 className={`text-xl font-black ${theme.textMain} tracking-tight uppercase`} style={{ fontFamily: "'Poppins', sans-serif" }}>Créer un compte</h1>
            
            <button type="button" onClick={handleGoogleLogin} className={`flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-all font-bold text-[10px] uppercase tracking-wide`}>
               <svg className="w-4 h-4" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
               S'inscrire avec Google
            </button>

            <span className={`${theme.textSecondary} text-[8px] font-black uppercase tracking-[0.2em]`}>ou par email</span>
            
            <div className="w-full space-y-2.5 text-left max-w-[260px]">
              <BulleInput icon={User} placeholder="Nom & Prénom" value={name} onChange={e => setName(e.target.value)} label="" required autoComplete="off" />
              <BulleInput icon={Briefcase} placeholder="Fonction" value={fonction} onChange={e => setFonction(e.target.value)} label="" autoComplete="off" />
              <BulleInput icon={Mail} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} label="" required autoComplete="new-password" />
              <BulleInput icon={Lock} type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} label="" required autoComplete="new-password" />
            </div>

            <button type="submit" disabled={loading} className={`${theme.buttonPrimary} ${theme.buttonShape} px-9 py-2.5 font-black uppercase text-[8px] tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95`}>
               {loading ? 'Traitement...' : "S'inscrire"}
            </button>
          </form>
        </div>

        {/* --- CONNEXION --- */}
        <div className={`form-container sign-in-container ${!isSignUpActive ? 'mobile-active' : ''}`}>
          <form onSubmit={handleLogin} className="h-full flex flex-col items-center justify-center p-6 text-center space-y-6" autoComplete="off">
            <h1 className={`text-xl font-black ${theme.textMain} tracking-tight uppercase hidden md:block`} style={{ fontFamily: "'Poppins', sans-serif" }}>Connexion</h1>
            
            <button type="button" onClick={handleGoogleLogin} className={`flex items-center gap-2 px-6 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-all font-bold text-[10px] uppercase tracking-wide group`}>
               <svg className="w-4 h-4" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
               <span className="group-hover:text-black">Continuer avec Google</span>
            </button>
            
            <div className="flex items-center gap-2 w-full max-w-[200px]">
               <div className="h-[1px] bg-black/10 flex-1"></div>
               <span className={`${theme.textSecondary} text-[8px] font-black uppercase tracking-[0.2em]`}>OU Email</span>
               <div className="h-[1px] bg-black/10 flex-1"></div>
            </div>

            <div className="w-full space-y-3 text-left max-w-[260px]">
              <BulleInput icon={Mail} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} label="" required autoComplete="new-password" />
              <div className="space-y-1">
                <BulleInput icon={Lock} type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} label="" required autoComplete="new-password" />
                <div className="flex justify-end pr-1">
                   <button type="button" onClick={() => setShowResetModal(true)} className={`text-[8px] ${theme.textSecondary} hover:${theme.textMain} transition-colors font-black uppercase tracking-wider outline-none`}>
                     Mot de passe oublié
                   </button>
                </div>
              </div>
            </div>

            {error && <p className="text-red-400 text-[8px] font-black bg-red-500/10 py-1.5 px-3 rounded-lg w-full border border-red-500/20">{error}</p>}

            <button type="submit" disabled={loading} className={`${theme.buttonPrimary} ${theme.buttonShape} w-full md:w-auto px-10 py-3 font-black uppercase text-[8px] tracking-[0.15em] shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2`}>
               {loading ? 'Validation...' : 'Se connecter'}
               {!loading && <ArrowRight size={12} />}
            </button>
          </form>
        </div>

        {/* --- OVERLAY --- */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <div className={`mb-4 w-14 h-14 bg-white/10 ${theme.buttonShape} flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/10`}>
                 <LogIn size={24} className="text-white" />
              </div>
              <h1 className="text-xl font-black text-white mb-2 tracking-tight uppercase" style={{ fontFamily: "'Poppins', sans-serif" }}>Déjà inscrit ?</h1>
              <p className="text-[10px] font-medium text-slate-100 mb-6 max-w-[200px] leading-relaxed opacity-90">
                Connectez-vous pour continuer votre suivi sur EDC Marchés360.
              </p>
              <button className={`px-9 py-2.5 border-2 border-white/40 text-white ${theme.buttonShape} font-black uppercase text-[8px] tracking-widest hover:bg-white hover:text-slate-900 transition-all active:scale-95`} onClick={() => setIsSignUpActive(false)}>
                Se connecter
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1 className="text-xl font-black text-white mb-2 tracking-tight uppercase" style={{ fontFamily: "'Poppins', sans-serif" }}>Nouveau ?</h1>
              <p className="text-xs font-medium text-slate-100 mb-6 max-w-[240px] leading-relaxed opacity-90">
                Créez votre profil pour accéder à la plateforme de suivi et d'archivage des marchés.
              </p>
              <button className={`px-9 py-2.5 border-2 border-white/40 text-white ${theme.buttonShape} font-black uppercase text-[8px] tracking-widest hover:bg-white hover:text-slate-900 transition-all active:scale-95`} onClick={() => setIsSignUpActive(true)}>
                S'inscrire
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Réinitialisation du compte" size="sm">
        <div className="space-y-6 pt-4">
           <div className="text-center space-y-2">
              <div className={`w-16 h-16 bg-blue-edc-50 text-blue-edc-900 ${theme.buttonShape} flex items-center justify-center mx-auto mb-4 shadow-inner`}><RefreshCcw size={28} /></div>
              <p className={`text-xs font-medium ${theme.textSecondary} leading-relaxed px-4`}>Saisissez votre email. Un lien de réinitialisation vous sera envoyé par email.</p>
           </div>
           <div className="space-y-4">
              <BulleInput label="Email" icon={Mail} value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} autoComplete="off" />
           </div>
           <button onClick={handleDoReset} className={`${theme.buttonPrimary} w-full py-4 ${theme.buttonShape} font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3`}>
             <Save size={16} /> Envoyer le lien
           </button>
        </div>
      </Modal>
      
      <p className={`absolute bottom-4 ${theme.textSecondary} text-[8px] font-black uppercase tracking-[0.3em] opacity-40`}>© {new Date().getFullYear()} EDC S.A. • Secure Enterprise Access</p>
    </div>
  );
};