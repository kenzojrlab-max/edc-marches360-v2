import React from 'react';
import type { TableColumnsType } from 'antd';
import { PencilLine, Trash2 } from 'lucide-react';
import { Marche } from '../types';
import { JALONS_PPM_CONFIG } from '../constants';
import { formatDate } from '../utils/date';
import { TruncatedText } from '../components/TruncatedText';

export const PPM_JALON_GROUPS = [
  { id: 'preparation', label: 'Préparation', keys: ['saisine_cipm', 'ano_bailleur_dao', 'lancement_ao'] },
  { id: 'consultation', label: 'Consultation', keys: ['depouillement'] },
  { id: 'attribution', label: 'Attribution', keys: ['prop_attribution', 'negociation_contractuelle', 'ano_bailleur_attrib', 'avis_conforme_ca', 'publication'] },
  { id: 'contractualisation', label: 'Contract.', keys: ['souscription', 'saisine_cipm_projet', 'ano_bailleur_projet', 'signature_marche'] },
];

interface UseProjectColumnsParams {
  theme: any;
  expandedGroups: Set<string>;
  toggleGroup: (id: string) => void;
  hiddenColumns: Set<string>;
  openModal: (market: Marche) => void;
  removeMarket: (id: string) => void;
}

export function useProjectColumns({
  theme, expandedGroups, toggleGroup, hiddenColumns, openModal, removeMarket
}: UseProjectColumnsParams): TableColumnsType<Marche> {

  const baseColumns: TableColumnsType<Marche> = [
    {
      title: 'Dossier & Objet',
      dataIndex: 'numDossier',
      key: 'dossier',
      fixed: 'left' as const,
      width: 350,
      onHeaderCell: () => ({ className: 'th-fixed-priority' }),
      render: (_, m) => (
        <div className="flex flex-col">
          <span className={`text-[10px] font-black ${theme.textAccent} uppercase`}>{m.numDossier}</span>
          <TruncatedText text={m.objet} className={`text-xs font-bold ${theme.textMain} uppercase leading-tight line-clamp-2`} />
        </div>
      ),
    },
    {
      title: 'Budget Estimé',
      dataIndex: 'montant_prevu',
      key: 'budget',
      width: 180,
      align: 'right',
      sorter: (a: Marche, b: Marche) => (a.montant_prevu || 0) - (b.montant_prevu || 0),
      render: (value) => (
        <span className={`text-sm font-black ${theme.textMain}`}>{(value || 0).toLocaleString()}</span>
      ),
    },
    {
      title: 'Fonction Analytique',
      dataIndex: 'fonction',
      key: 'fonction',
      width: 150,
      render: (value) => (
        <span className={`text-[10px] font-black ${theme.textMain} uppercase`}>
          {value || '-'}
        </span>
      ),
    },
    {
      title: 'Activité',
      dataIndex: 'activite',
      key: 'activite',
      width: 150,
      render: (value) => (
        <TruncatedText text={value || '-'} className={`text-[10px] font-bold ${theme.textSecondary} uppercase line-clamp-2`} />
      ),
    },
    {
      title: 'Financement',
      dataIndex: 'source_financement',
      key: 'financement',
      width: 150,
      render: (_: any, m: Marche) => {
        const label = m.source_financement === 'BUDGET_EDC'
          ? 'Budget EDC'
          : m.nom_bailleur || 'Bailleur';
        return (
          <span className={`text-[9px] font-black px-2 py-1 rounded ${m.source_financement === 'BUDGET_EDC' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
            {label}
          </span>
        );
      },
    },
  ];

  const jalonColumns: TableColumnsType<Marche> = PPM_JALON_GROUPS.flatMap(group => {
    const isExpanded = expandedGroups.has(group.id);

    if (!isExpanded) {
      return [{
        title: (<span onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleGroup(group.id); }} className="cursor-pointer select-none whitespace-nowrap">{'\u25B8'} {group.label}</span>),
        key: `group_${group.id}`,
        width: 140,
        align: 'center' as const,
        render: (_: any, m: Marche) => {
          const total = group.keys.length;
          const filled = group.keys.filter(k => m.dates_prevues[k as keyof typeof m.dates_prevues]).length;
          const pct = Math.round((filled / total) * 100);
          return (
            <div className="flex items-center gap-1.5 justify-center">
              <div className="w-10 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.2)' }}>
                <div className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-500' : 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
              </div>
              <span className={`text-[9px] font-black ${pct === 100 ? 'text-green-500' : theme.textSecondary}`}>{filled}/{total}</span>
            </div>
          );
        },
      }] as TableColumnsType<Marche>;
    }

    return [{
      title: (<span onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleGroup(group.id); }} className="cursor-pointer select-none whitespace-nowrap">{'\u25BE'} {group.label}</span>),
      key: `group_${group.id}`,
      children: group.keys.map(key => {
        const jalon = JALONS_PPM_CONFIG.find(j => j.key === key)!;
        return {
          title: jalon.label,
          key: jalon.key,
          children: [
            {
              title: 'Prévue',
              dataIndex: ['dates_prevues', jalon.key],
              key: `${jalon.key}_prevue`,
              width: 100,
              align: 'center' as const,
              render: (_: any, m: Marche) => (
                <span className={`text-[10px] font-black ${theme.textAccent}`}>
                  {formatDate(m.dates_prevues[jalon.key as keyof typeof m.dates_prevues] || null)}
                </span>
              ),
            },
            {
              title: 'Réalisée',
              dataIndex: ['dates_realisees', jalon.key],
              key: `${jalon.key}_realisee`,
              width: 100,
              align: 'center' as const,
              render: (_: any, m: Marche) => (
                <span className={`text-[10px] font-black ${theme.textSecondary}`}>
                  {formatDate(m.dates_realisees[jalon.key as keyof typeof m.dates_realisees] || null)}
                </span>
              ),
            },
          ],
        };
      }),
    }] as TableColumnsType<Marche>;
  });

  const filteredBaseColumns = baseColumns.filter(c => !hiddenColumns.has(c.key as string));

  return [
    ...filteredBaseColumns,
    ...jalonColumns,
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 120,
      align: 'center' as const,
      onHeaderCell: () => ({ className: 'th-fixed-priority' }),
      render: (_: any, m: Marche) => (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => openModal(m)} className={`p-2.5 ${theme.buttonSecondary} ${theme.buttonShape} transition-all`}>
            <PencilLine size={16} />
          </button>
          <button onClick={() => removeMarket(m.id)} className={`p-2.5 ${theme.buttonDanger} ${theme.buttonShape} transition-all`}>
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];
}
