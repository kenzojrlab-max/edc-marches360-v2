import React, { useState } from 'react';
import { Gavel, AlertTriangle, CheckCircle2, XCircle, Clock, Shield, ArrowUpCircle, FileText } from 'lucide-react';
import { Marche, RecoursType, RecoursStatut, RecoursData, StatutGlobal } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useRecoursTimer, TimerInfo } from '../hooks/useRecoursTimer';
import { BulleInput } from './BulleInput';
import { MultiFileManager } from './MultiFileManager';
import { CustomBulleSelect } from './CustomBulleSelect';
import { checkRecoursEligibility, getRecoursTypeLabel, getRecoursTypeShortLabel, isSuspensif } from '../utils/recours';
import { formatDate } from '../utils/date';

interface Props {
  market: Marche;
  updateMarket: (id: string, updates: Partial<Marche>) => void;
  addMarketDocToArray: (marketId: string, jalonKey: string, docId: string) => void;
  removeMarketDocFromArray: (marketId: string, jalonKey: string, docId: string) => void;
}

// Compteur visuel
const RecoursCountdown: React.FC<{ timer: TimerInfo }> = ({ timer }) => {
  const { theme } = useTheme();
  const colorClass = timer.isExpired
    ? 'bg-red-500/20 text-red-400 animate-pulse'
    : timer.remaining <= 3
    ? 'bg-orange-500/20 text-orange-400'
    : 'bg-green-500/20 text-green-400';

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${colorClass}`}>
      <Clock size={12} />
      <span className="text-[10px] font-black uppercase tracking-tight">
        {timer.isExpired ? 'EXPIRÉ' : `J-${timer.remaining}`}
      </span>
      <span className="text-[8px] font-bold opacity-70">({timer.unit})</span>
    </div>
  );
};

// Indicateur d'étape
const StepIndicator: React.FC<{ step: number; currentStep: number; label: string }> = ({ step, currentStep, label }) => {
  const { theme } = useTheme();
  const isCompleted = currentStep > step;
  const isActive = currentStep === step;

  return (
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black
        ${isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-primary text-white' : `${theme.card} ${theme.textSecondary}`}
      `}>
        {isCompleted ? <CheckCircle2 size={14} /> : step}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-wide ${isActive ? theme.textMain : theme.textSecondary}`}>{label}</span>
    </div>
  );
};

export const RecoursSection: React.FC<Props> = ({ market, updateMarket, addMarketDocToArray, removeMarketDocFromArray }) => {
  const { theme } = useTheme();
  const timer = useRecoursTimer(market);
  const [selectedType, setSelectedType] = useState<RecoursType | null>(null);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  const recours = market.recours;
  const isCloture = recours?.date_cloture;

  // Helper pour mettre à jour le sous-objet recours
  const updateRecours = (updates: Partial<RecoursData>) => {
    updateMarket(market.id, {
      recours: { ...market.recours!, ...updates }
    });
  };

  // Initialiser un nouveau recours
  const initRecours = (type: RecoursType) => {
    const eligibility = checkRecoursEligibility(market, type);
    if (!eligibility.eligible) {
      setEligibilityError(eligibility.reason || 'Non éligible');
      return;
    }
    setEligibilityError(null);
    const statut = isSuspensif(type) ? RecoursStatut.SUSPENDU : RecoursStatut.EN_COURS_EXAMEN;
    const newRecours: RecoursData = {
      type,
      statut,
      date_introduction: new Date().toISOString().split('T')[0],
      current_step: 1
    };
    updateMarket(market.id, {
      has_recours: true,
      recours: newRecours,
      statut_global: isSuspensif(type) ? StatutGlobal.SUSPENDU : market.statut_global
    });
  };

  // Passer à l'étape suivante
  const advanceStep = () => {
    if (recours && recours.current_step < 2) {
      updateRecours({ current_step: 2 });
    }
  };

  // Clôturer le recours
  const clotureRecours = (verdict: 'REJETE' | 'ACCEPTE') => {
    const newStatut = verdict === 'REJETE' ? RecoursStatut.CLOTURE_REJETE : RecoursStatut.CLOTURE_ACCEPTE;
    const updates: Partial<Marche> = {
      recours: {
        ...market.recours!,
        statut: newStatut,
        verdict: verdict === 'REJETE' ? 'Recours rejeté' : 'Recours accepté',
        date_cloture: new Date().toISOString().split('T')[0]
      }
    };

    if (isSuspensif(recours?.type)) {
      if (verdict === 'REJETE') {
        updates.statut_global = market.dates_realisees.signature_marche
          ? StatutGlobal.SIGNE
          : StatutGlobal.EN_COURS;
      } else {
        updates.statut_global = StatutGlobal.ANNULE;
        updates.is_annule = true;
        updates.motif_annulation = `Annulé suite à recours accepté le ${new Date().toISOString().split('T')[0]}`;
      }
    }

    updateMarket(market.id, updates);
  };

  // Vérifier éligibilité quand on sélectionne un type
  const handleTypeSelect = (typeStr: string) => {
    const type = typeStr as RecoursType;
    setSelectedType(type);
    const eligibility = checkRecoursEligibility(market, type);
    if (!eligibility.eligible) {
      setEligibilityError(eligibility.reason || 'Non éligible');
    } else {
      setEligibilityError(null);
    }
  };

  return (
    <div className={`p-8 rounded-3xl ${theme.mode === 'dark' ? 'bg-white/5 border-white/10' : 'bg-blue-50/50 border-blue-100'} border space-y-5`}>
      {/* Toggle principal */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-3 ${theme.mode === 'dark' ? 'text-white' : 'text-blue-600'} font-black uppercase text-xs`}>
          <Gavel size={18} /> Y'a-t-il eu un Recours ?
        </div>
        <CustomBulleSelect
          label=""
          value={market.has_recours ? 'OUI' : 'NON'}
          options={[{ value: 'OUI', label: 'OUI' }, { value: 'NON', label: 'NON' }]}
          onChange={v => {
            if (v === 'NON') {
              updateMarket(market.id, { has_recours: false, recours: undefined as any });
              setSelectedType(null);
              setEligibilityError(null);
            } else {
              updateMarket(market.id, { has_recours: true });
            }
          }}
        />
      </div>

      {market.has_recours && !recours && (
        <div className="space-y-4 animate-in fade-in">
          {/* Sélection du type */}
          <div className={`p-4 ${theme.card} border border-white/10 rounded-2xl space-y-3`}>
            <p className={`text-[10px] font-black ${theme.textSecondary} uppercase tracking-widest`}>Type de recours</p>
            <CustomBulleSelect
              label=""
              value={selectedType || ''}
              options={[
                { value: RecoursType.AVANT_OUVERTURE, label: 'Avant l\'ouverture des plis (A)' },
                { value: RecoursType.DURANT_OUVERTURE, label: 'Durant l\'ouverture des plis (B)' },
                { value: RecoursType.APRES_ATTRIBUTION, label: 'Après l\'attribution - Résultats (C)' }
              ]}
              onChange={handleTypeSelect}
              placeholder="Sélectionner le type..."
            />

            {/* Message éligibilité */}
            {eligibilityError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in">
                <XCircle size={14} className="text-red-400 shrink-0" />
                <p className="text-[10px] font-bold text-red-400">{eligibilityError}</p>
              </div>
            )}

            {selectedType && !eligibilityError && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                  <p className="text-[10px] font-bold text-green-400">Recours recevable dans les délais</p>
                </div>
                <button
                  onClick={() => initRecours(selectedType)}
                  className={`${theme.buttonPrimary} px-6 py-2.5 ${theme.buttonShape} text-[10px] font-black uppercase w-full`}
                >
                  Enregistrer le recours
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recours actif - Workflow complet */}
      {market.has_recours && recours && (
        <div className="space-y-5 animate-in fade-in">
          {/* Bannière type + statut */}
          <div className={`p-4 rounded-2xl border ${
            isSuspensif(recours.type)
              ? 'bg-red-500/10 border-red-500/20'
              : 'bg-blue-500/10 border-blue-500/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield size={14} className={isSuspensif(recours.type) ? 'text-red-400' : 'text-blue-400'} />
                <span className="text-[10px] font-black uppercase tracking-wide text-white">
                  {getRecoursTypeShortLabel(recours.type)} — {getRecoursTypeLabel(recours.type)}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                isSuspensif(recours.type) ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {isSuspensif(recours.type) ? 'SUSPENSIF' : 'NON SUSPENSIF'}
              </span>
            </div>
            <p className={`text-[9px] font-bold ${isSuspensif(recours.type) ? 'text-red-300' : 'text-blue-300'}`}>
              {isSuspensif(recours.type)
                ? 'Le marché est suspendu. Aucune notification ou contrat ne peut être émis jusqu\'au verdict.'
                : 'Le marché continue normalement pendant l\'examen du recours.'}
            </p>
            <p className={`text-[9px] font-bold ${theme.textSecondary} mt-1`}>
              Introduit le {formatDate(recours.date_introduction)} — Destinataire : {
                recours.type === RecoursType.AVANT_OUVERTURE ? 'Directeur Général' : 'Comité d\'Arbitrage'
              }
            </p>
          </div>

          {/* Timer actif */}
          {timer && !isCloture && (
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black ${theme.textSecondary} uppercase`}>{timer.label}</span>
              <RecoursCountdown timer={timer} />
            </div>
          )}

          {/* Lettre initiale */}
          <div className={`p-4 ${theme.card} border border-white/5 rounded-2xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={14} className={theme.textAccent} />
                <span className={`text-[10px] font-black ${theme.textMain} uppercase`}>
                  Lettre de recours ({recours.type === RecoursType.AVANT_OUVERTURE ? 'au DG' : 'au Comité d\'Arbitrage'})
                </span>
              </div>
              <MultiFileManager
                existingDocIds={market.docs?.['recours_lettre']}
                onAdd={(id) => addMarketDocToArray(market.id, 'recours_lettre', id)}
                onRemove={(id) => removeMarketDocFromArray(market.id, 'recours_lettre', id)}
                disabled={!!isCloture}
              />
            </div>
          </div>

          {/* ========= TYPE A : Flux DG ========= */}
          {recours.type === RecoursType.AVANT_OUVERTURE && (
            <div className="space-y-4">
              {/* Step 1 : Réponse DG */}
              <StepIndicator step={1} currentStep={recours.date_reponse_dg ? 2 : 1} label="Réponse du Directeur Général (3 jours)" />
              <div className={`p-4 ${theme.card} border border-white/5 rounded-2xl space-y-3`}>
                <div className="flex items-center gap-4">
                  <div className="w-36">
                    <BulleInput
                      type="date"
                      label="Date réponse DG"
                      value={recours.date_reponse_dg || ''}
                      onChange={e => updateRecours({ date_reponse_dg: e.target.value })}
                      disabled={!!isCloture}
                    />
                  </div>
                  <MultiFileManager
                    existingDocIds={market.docs?.['recours_reponse_dg']}
                    onAdd={(id) => addMarketDocToArray(market.id, 'recours_reponse_dg', id)}
                    onRemove={(id) => removeMarketDocFromArray(market.id, 'recours_reponse_dg', id)}
                    disabled={!!isCloture}
                  />
                </div>

                {recours.date_reponse_dg && !isCloture && (
                  <div className="flex items-center justify-between animate-in fade-in">
                    <span className={`text-[10px] font-black ${theme.textSecondary} uppercase`}>Satisfait de la réponse ?</span>
                    <CustomBulleSelect
                      label=""
                      value={recours.is_satisfait_dg === undefined ? '' : recours.is_satisfait_dg ? 'OUI' : 'NON'}
                      options={[{ value: 'OUI', label: 'OUI' }, { value: 'NON', label: 'NON' }]}
                      onChange={v => {
                        updateRecours({ is_satisfait_dg: v === 'OUI' });
                        if (v === 'NON') advanceStep();
                      }}
                      placeholder="Sélectionner..."
                    />
                  </div>
                )}
              </div>

              {/* Step 2 : Escalade CA (si non satisfait) */}
              {recours.current_step >= 2 && recours.is_satisfait_dg === false && (
                <div className="animate-in slide-in-from-top-2">
                  <StepIndicator step={2} currentStep={recours.date_escalation_ca ? 3 : 2} label="Escalade au Président du CA" />
                  <div className={`p-4 ${theme.card} border border-white/5 rounded-2xl space-y-3`}>
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowUpCircle size={14} className="text-orange-400" />
                      <span className={`text-[9px] font-bold text-orange-400`}>Dossier escaladé au Président du Conseil d'Administration</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-36">
                        <BulleInput
                          type="date"
                          label="Date escalade"
                          value={recours.date_escalation_ca || ''}
                          onChange={e => updateRecours({ date_escalation_ca: e.target.value })}
                          disabled={!!isCloture}
                        />
                      </div>
                      <MultiFileManager
                        existingDocIds={market.docs?.['recours_escalation_ca']}
                        onAdd={(id) => addMarketDocToArray(market.id, 'recours_escalation_ca', id)}
                        onRemove={(id) => removeMarketDocFromArray(market.id, 'recours_escalation_ca', id)}
                        disabled={!!isCloture}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========= TYPES B & C : Flux Comité + CA ========= */}
          {recours.type !== RecoursType.AVANT_OUVERTURE && (
            <div className="space-y-4">
              {/* Step 1 : Avis Comité d'Arbitrage */}
              <StepIndicator step={1} currentStep={recours.date_avis_comite ? 2 : 1} label="Avis du Comité d'Arbitrage (7 jours ouvrables)" />
              <div className={`p-4 ${theme.card} border border-white/5 rounded-2xl space-y-3`}>
                <div className="flex items-center gap-4">
                  <div className="w-36">
                    <BulleInput
                      type="date"
                      label="Date avis comité"
                      value={recours.date_avis_comite || ''}
                      onChange={e => {
                        updateRecours({ date_avis_comite: e.target.value });
                        if (e.target.value && recours.current_step === 1) advanceStep();
                      }}
                      disabled={!!isCloture}
                    />
                  </div>
                  <MultiFileManager
                    existingDocIds={market.docs?.['recours_avis_comite']}
                    onAdd={(id) => addMarketDocToArray(market.id, 'recours_avis_comite', id)}
                    onRemove={(id) => removeMarketDocFromArray(market.id, 'recours_avis_comite', id)}
                    disabled={!!isCloture}
                  />
                </div>
              </div>

              {/* Step 2 : Décision finale CA */}
              {recours.current_step >= 2 && (
                <div className="animate-in slide-in-from-top-2">
                  <StepIndicator step={2} currentStep={recours.date_decision_ca ? 3 : 2} label="Décision finale du CA (15 jours max)" />
                  <div className={`p-4 ${theme.card} border border-white/5 rounded-2xl space-y-3`}>
                    <div className="flex items-center gap-4">
                      <div className="w-36">
                        <BulleInput
                          type="date"
                          label="Date décision CA"
                          value={recours.date_decision_ca || ''}
                          onChange={e => updateRecours({ date_decision_ca: e.target.value })}
                          disabled={!!isCloture}
                        />
                      </div>
                      <MultiFileManager
                        existingDocIds={market.docs?.['recours_decision_ca']}
                        onAdd={(id) => addMarketDocToArray(market.id, 'recours_decision_ca', id)}
                        onRemove={(id) => removeMarketDocFromArray(market.id, 'recours_decision_ca', id)}
                        disabled={!!isCloture}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========= CLÔTURE ========= */}
          {!isCloture && canClose(recours) && (
            <div className={`p-5 rounded-2xl border-2 border-dashed ${theme.mode === 'dark' ? 'border-white/20 bg-white/5' : 'border-slate-300 bg-slate-50'} space-y-4 animate-in fade-in`}>
              <p className={`text-[10px] font-black ${theme.textMain} uppercase tracking-widest`}>Clôture du recours</p>

              {/* Résolution finale CA */}
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black ${theme.textSecondary} uppercase`}>Résolution finale du CA</span>
                <MultiFileManager
                  existingDocIds={market.docs?.['recours_resolution_finale']}
                  onAdd={(id) => addMarketDocToArray(market.id, 'recours_resolution_finale', id)}
                  onRemove={(id) => removeMarketDocFromArray(market.id, 'recours_resolution_finale', id)}
                />
              </div>

              {/* Verdict */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => clotureRecours('REJETE')}
                  className="flex-1 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-[10px] font-black uppercase hover:bg-green-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle size={14} /> Recours Rejeté
                  {isSuspensif(recours.type) && <span className="text-[8px] opacity-70">(Marché débloqué)</span>}
                </button>
                <button
                  onClick={() => clotureRecours('ACCEPTE')}
                  className="flex-1 px-4 py-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 text-[10px] font-black uppercase hover:bg-orange-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={14} /> Recours Accepté
                  {isSuspensif(recours.type) && <span className="text-[8px] opacity-70">(Marché annulé)</span>}
                </button>
              </div>
            </div>
          )}

          {/* Affichage si clôturé */}
          {isCloture && (
            <div className={`p-4 rounded-2xl ${
              recours.statut === RecoursStatut.CLOTURE_REJETE ? 'bg-green-500/10 border border-green-500/20' : 'bg-orange-500/10 border border-orange-500/20'
            }`}>
              <div className="flex items-center gap-2">
                {recours.statut === RecoursStatut.CLOTURE_REJETE
                  ? <XCircle size={14} className="text-green-400" />
                  : <CheckCircle2 size={14} className="text-orange-400" />
                }
                <span className={`text-[11px] font-black uppercase ${
                  recours.statut === RecoursStatut.CLOTURE_REJETE ? 'text-green-400' : 'text-orange-400'
                }`}>
                  {recours.verdict || (recours.statut === RecoursStatut.CLOTURE_REJETE ? 'Recours rejeté' : 'Recours accepté')}
                </span>
              </div>
              <p className={`text-[9px] font-bold ${theme.textSecondary} mt-1`}>
                Clôturé le {formatDate(recours.date_cloture || null)}
                {isSuspensif(recours.type) && recours.statut === RecoursStatut.CLOTURE_REJETE && ' — Marché débloqué'}
                {isSuspensif(recours.type) && recours.statut === RecoursStatut.CLOTURE_ACCEPTE && ' — Marché annulé'}
              </p>
            </div>
          )}

          {/* Rétrocompatibilité : ancien format sans objet recours */}
          {market.has_recours && !recours && market.recours_issue && (
            <div className={`p-4 ${theme.card} border border-white/5 rounded-2xl`}>
              <p className={`text-[9px] font-bold ${theme.textSecondary} italic`}>
                Ancien format — Verdict : {market.recours_issue}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Vérifie si le recours peut être clôturé
function canClose(recours: RecoursData): boolean {
  if (recours.type === RecoursType.AVANT_OUVERTURE) {
    // Type A : peut clôturer si DG a répondu et soit satisfait, soit escaladé
    if (recours.is_satisfait_dg === true) return true;
    if (recours.is_satisfait_dg === false && recours.date_escalation_ca) return true;
    return false;
  }
  // Types B/C : doit avoir avis comité et décision CA
  return !!(recours.date_avis_comite && recours.date_decision_ca);
}
