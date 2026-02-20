import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { BulleInput } from '../components/BulleInput';
import { Save, User as UserIcon, Briefcase, Camera, Upload, CheckCircle2, Loader2 } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const { theme, themeType } = useTheme();
  const toast = useToast();

  const [name, setName] = useState('');
  const [fonction, setFonction] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialisation des données
  useEffect(() => {
    if (user) {
      setName(user.name);
      setFonction(user.fonction || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.id, { name, fonction, photoURL });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch {
      toast.error("Erreur lors de la sauvegarde du profil.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      toast.error("Image trop volumineuse (max 500 Ko).");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoURL(reader.result as string);
    };
    reader.onerror = () => {
      toast.error("Impossible de lire le fichier image.");
    };
    reader.readAsDataURL(file);
  };

  // Sélection d'avatars prédéfinis
  const presetAvatars = [
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || '1'}`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${(user?.id || '1') + 'abc'}`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || '1'}`,
    `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className={`text-3xl font-black ${theme.textMain} tracking-tight uppercase`} style={{ fontFamily: "'Poppins', sans-serif" }}>Mon Profil</h1>
          <p className={`${theme.textSecondary} font-medium text-sm italic`}>Gérez vos informations personnelles et préférences.</p>
        </div>
        
        {showSuccess && (
          <div className="flex items-center gap-2 px-6 py-3 bg-success/10 text-success rounded-xl text-sm font-black uppercase animate-in fade-in slide-in-from-right">
            <CheckCircle2 size={18} /> Modifications enregistrées
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Colonne Gauche : Avatar */}
        <div className={`md:col-span-1 ${theme.card} p-8 flex flex-col items-center gap-6`}>
          <div className="relative group">
            <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl ${theme.buttonShape}`}>
              <img 
                src={photoURL || `https://picsum.photos/seed/${user?.id}/200`} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/80 transition-all shadow-lg">
              <Camera size={16} />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>
          
          <div className="w-full space-y-4">
            <p className={`text-[10px] font-black uppercase tracking-widest text-center ${theme.textSecondary}`}>Choisir un avatar</p>
            <div className="flex justify-center gap-3 flex-wrap">
              {presetAvatars.map((avatar, idx) => (
                <button 
                  key={idx}
                  onClick={() => setPhotoURL(avatar)}
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${photoURL === avatar ? 'border-primary' : 'border-transparent'}`}
                >
                  <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne Droite : Formulaire */}
        <div className={`md:col-span-2 ${theme.card} p-8 md:p-12 space-y-8`}>
          <div className="space-y-6">
            <BulleInput 
              label="Nom & Prénom" 
              icon={UserIcon} 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Votre nom complet"
            />
            
            <BulleInput 
              label="Fonction / Poste" 
              icon={Briefcase} 
              value={fonction} 
              onChange={(e) => setFonction(e.target.value)} 
              placeholder="Ex: Chef de Projet, Ingénieur..."
            />
            
            <div className="pt-2">
              <label className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} ml-1`}>Email (Non modifiable)</label>
              <div className={`mt-1.5 w-full p-3 ${theme.input} opacity-50 cursor-not-allowed text-sm font-bold`}>
                {user?.email}
              </div>
            </div>

            <div className="pt-2">
              <label className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} ml-1`}>Rôle Système</label>
              <div className="mt-2 flex gap-2">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary`}>
                  {user?.role}
                </span>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user?.statut === 'actif' ? 'bg-success/10 text-success' : 'bg-red-500/10 text-red-500'}`}>
                  {user?.statut}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`${theme.buttonPrimary} px-8 py-3 ${theme.buttonShape} font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait`}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};