import { createStyles } from 'antd-style';

const useLightTableStyles = createStyles(({ css }) => ({
  customTable: css`
    .ant-table { background: transparent !important; font-family: 'DM Sans', sans-serif !important; }
    .ant-table-container { .ant-table-body, .ant-table-content { scrollbar-width: thin; scrollbar-color: #3b82f6 #FDFEFE; } .ant-table-body::-webkit-scrollbar { width: 8px; height: 8px; } .ant-table-body::-webkit-scrollbar-track { background: #FDFEFE; } .ant-table-body::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 4px; } }
    .ant-table-thead > tr > th { background: #e0eaf7 !important; color: #1a2333 !important; border-bottom: 2px solid #b8cce8 !important; font-family: 'Poppins', sans-serif !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 14px 12px !important; position: sticky; top: 0; z-index: 2 !important; }
    .ant-table-thead > tr > th.th-fixed-priority { z-index: 100 !important; }
    .ant-table-thead > tr > th span, .ant-table-thead > tr > th div { color: #1a2333 !important; }
    .ant-table-tbody > tr > td { background: #FDFEFE !important; color: #1a2333 !important; border-bottom: 1px solid #e5e7eb !important; font-family: 'DM Sans', sans-serif !important; padding: 16px 12px !important; font-size: 12px !important; }
    .ant-table-tbody > tr:hover > td { background: #f3f4f6 !important; }
    .ant-table-thead > tr > th.ant-table-cell-fix-left, .ant-table-thead > tr > th.ant-table-cell-fix-right { background: #e0eaf7 !important; z-index: 3 !important; }
    .ant-table-tbody > tr > td.ant-table-cell-fix-left, .ant-table-tbody > tr > td.ant-table-cell-fix-right { background: #FDFEFE !important; z-index: 1 !important; }
    .ant-table-tbody > tr:hover > .ant-table-cell-fix-left, .ant-table-tbody > tr:hover > .ant-table-cell-fix-right { background: #f3f4f6 !important; }
  `,
}));

const useDarkTableStyles = createStyles(({ css }) => ({
  customTable: css`
    .ant-table { background: transparent !important; font-family: 'DM Sans', sans-serif !important; }
    .ant-table-container { .ant-table-body, .ant-table-content { scrollbar-width: thin; scrollbar-color: #3b82f6 #1a2333; } .ant-table-body::-webkit-scrollbar { width: 8px; height: 8px; } .ant-table-body::-webkit-scrollbar-track { background: #1a2333; } .ant-table-body::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 4px; } }
    .ant-table-thead > tr > th { background: #0d1a30 !important; color: #ffffff !important; border-bottom: 2px solid rgba(59,130,246,0.3) !important; font-family: 'Poppins', sans-serif !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 14px 12px !important; position: sticky; top: 0; z-index: 2 !important; }
    .ant-table-thead > tr > th.th-fixed-priority { z-index: 100 !important; }
    .ant-table-thead > tr > th span, .ant-table-thead > tr > th div { color: #ffffff !important; }
    .ant-table-tbody > tr > td { background: #1e293b !important; color: #ffffff !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; font-family: 'DM Sans', sans-serif !important; padding: 16px 12px !important; font-size: 12px !important; }
    .ant-table-tbody > tr:hover > td { background: #334155 !important; }
    .ant-table-thead > tr > th.ant-table-cell-fix-left, .ant-table-thead > tr > th.ant-table-cell-fix-right { background: #0d1a30 !important; z-index: 3 !important; }
    .ant-table-tbody > tr > td.ant-table-cell-fix-left, .ant-table-tbody > tr > td.ant-table-cell-fix-right { background: #1e293b !important; z-index: 1 !important; }
    .ant-table-tbody > tr:hover > .ant-table-cell-fix-left, .ant-table-tbody > tr:hover > .ant-table-cell-fix-right { background: #334155 !important; }
  `,
}));

export function useProjectTableStyles(isDark: boolean) {
  const { styles: lightStyles } = useLightTableStyles();
  const { styles: darkStyles } = useDarkTableStyles();
  return isDark ? darkStyles : lightStyles;
}
