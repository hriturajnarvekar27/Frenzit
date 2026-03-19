import React from 'react';
import { Download, Camera, FileSpreadsheet } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import * as XLSX from 'xlsx';

interface ExportActionsProps {
  data: any[];
  filename: string;
  elementId: string;
}

export const ExportActions: React.FC<ExportActionsProps> = ({ data, filename, elementId }) => {
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const takeSnapshot = async () => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      const dataUrl = await htmlToImage.toPng(element, {
        backgroundColor: '#121212',
        style: {
          borderRadius: '0'
        }
      });
      const link = document.createElement('a');
      link.download = `${filename}-snapshot.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Snapshot failed:', error);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={exportToExcel}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black text-zinc-400 hover:text-toxic-lime transition-all uppercase tracking-widest"
        title="Export to Excel"
      >
        <FileSpreadsheet size={14} strokeWidth={2.5} />
        <span>EXCEL</span>
      </button>
      <button
        onClick={takeSnapshot}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black text-zinc-400 hover:text-toxic-lime transition-all uppercase tracking-widest"
        title="Take Snapshot"
      >
        <Camera size={14} strokeWidth={2.5} />
        <span>SNAPSHOT</span>
      </button>
    </div>
  );
};
