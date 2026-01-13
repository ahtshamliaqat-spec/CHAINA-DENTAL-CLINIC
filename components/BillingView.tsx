import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Printer, X, Search, FileDown, ShieldCheck, MapPin, Phone, Heart } from 'lucide-react';
import { ClinicService } from '../services/api';
import { Invoice, InvoiceDetails } from '../types';
import { jsPDF } from 'jspdf';

const URDU_MAP: Record<string, string> = {
    'Oral Exam': 'معائنہ',
    'Scaling': 'دانتوں کی صفائی',
    'Filling': 'دانت بھرنا',
    'Root Canal': 'روٹ کینال',
    'Extraction': 'دانت نکالنا',
    'Braces': 'ٹیڑھے دانتوں کا علاج',
    'Cap': 'کیپسول',
    'Tab': 'گولی',
    '1-0-1 After meal': 'ایک صبح، ایک شام (کھانے کے بعد)',
    '1-1-1': 'صبح، دوپہر، شام',
    '1-0-1': 'صبح، شام',
    '1-0-0 Before breakfast': 'ایک صبح (ناشٹے سے پہلے)',
    'Once a day': 'دن میں ایک بار',
    'Sadia Bibi': 'سعدیہ بی بی',
    'Irfan Ali': 'عرفان علی',
    'Amina': 'آمنہ',
    'Faiza': 'فائزہ'
};

const BillingView: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetails | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewType, setPreviewType] = useState<'RECEIPT' | 'URDU_RECEIPT'>('RECEIPT');

    const LOGO_URL = "https://ytvvqf2doe9bgkjx.public.blob.vercel-storage.com/Teath.png";

    useEffect(() => {
        ClinicService.getInvoices().then(invs => {
            setInvoices(invs.sort((a, b) => b.invoice_id - a.invoice_id));
        });
    }, []);

    const getDocInstance = useCallback(() => {
        if (!selectedInvoice) return null;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        const drawCommonHeader = () => {
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 0, 210, 48, 'F');
            doc.addImage(LOGO_URL, 'PNG', 12, 10, 28, 28);
            
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(26);
            doc.setFont('helvetica', 'bold');
            doc.text("CHINA DENTAL SURGERY", 50, 22);
            
            doc.setTextColor(2, 132, 199);
            doc.setFontSize(8);
            doc.text("AL-MAJEED SHOPPING CENTER KOT RADHA KISHAN ROAD PHOOL NAGAR", 50, 28);
            doc.setFontSize(10);
            doc.text("03334216580", 50, 36);
            
            doc.setDrawColor(37, 99, 235);
            doc.setLineWidth(0.8);
            doc.line(15, 54, 195, 54);
        };

        const drawCommonFooter = () => {
            let footerY = 250;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text("Checked By:", 20, footerY);
            doc.setTextColor(2, 132, 199);
            doc.text("Dr. Bashir Khan D.H.", 20, footerY + 5);
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.3);
            doc.line(140, footerY + 5, 195, footerY + 5);
            doc.setTextColor(0, 0, 0);
            doc.text("Dr. Bashir Khan D.H.", 167.5, footerY + 10, { align: 'center' });
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.text("Authorized Signature", 167.5, footerY + 13, { align: 'center' });
            doc.setFontSize(6);
            doc.setTextColor(100, 116, 139);
            doc.text("This is a digitally generated document. No physical signature required.", 20, 275);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 195, 275, { align: 'right' });
        };

        const drawTwoColumnBody = () => {
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text("PATIENT INFORMATION", 20, 68);
            doc.text("BILLING SUMMARY", 130, 68);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`Name: ${selectedInvoice.patient.full_name}`, 20, 75);
            doc.text(`MR No: ${selectedInvoice.patient.mrn}`, 20, 80);

            doc.text(`Invoice No: ${selectedInvoice.invoice_no}`, 130, 75);
            doc.text(`Date: ${new Date(selectedInvoice.invoice_date).toLocaleDateString('en-GB')}`, 130, 80);

            doc.saveGraphicsState();
            doc.setGState(new (doc as any).GState({ opacity: 0.03 }));
            doc.addImage(LOGO_URL, 'PNG', 45, 105, 120, 120);
            doc.restoreGraphicsState();

            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(125, 95, 125, 230);

            doc.setTextColor(203, 213, 225);
            doc.setFontSize(30);
            doc.setFont('helvetica', 'bold');
            doc.text("Rx", 20, 100);

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            let rxY = 115;
            selectedInvoice.prescriptions.forEach(rx => {
                doc.setFont('helvetica', 'bold');
                doc.text(rx.medication, 25, rxY);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.text(rx.instructions, 25, rxY + 4);
                rxY += 12;
            });

            doc.setFillColor(241, 245, 249);
            doc.rect(130, 95, 65, 8, 'F');
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(2, 132, 199);
            doc.text("Procedure", 135, 100.5);
            doc.text("Amount (PKR)", 190, 100.5, { align: 'right' });

            doc.setTextColor(0, 0, 0);
            let procY = 112;
            selectedInvoice.items.forEach(item => {
                doc.text(item.proc_name || "Treatment", 135, procY);
                doc.text(`${item.amount}/-`, 190, procY, { align: 'right' });
                procY += 8;
            });

            doc.setDrawColor(2, 132, 199);
            doc.setLineWidth(0.8);
            doc.line(130, 125, 195, 125);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text("Total", 145, 135);
            doc.text(`Rs. ${selectedInvoice.total_amount}/-`, 190, 135, { align: 'right' });
        };

        drawCommonHeader();
        drawTwoColumnBody();
        drawCommonFooter();

        return doc;
    }, [selectedInvoice, previewType]);

    const handleAction = useCallback(() => {
        if (!selectedInvoice) return;
        
        if (previewType === 'URDU_RECEIPT') {
            // High reliability printing for Urdu
            // Browsers handle the fonts perfectly when printing/saving to PDF natively
            window.print();
        } else {
            // Standard English PDF generation
            const doc = getDocInstance();
            if (doc) doc.save(`Receipt_${selectedInvoice.invoice_no}.pdf`);
        }
    }, [getDocInstance, selectedInvoice, previewType]);

    const handleViewRecord = async (id: number) => {
        const details = await ClinicService.getInvoiceDetails(id);
        if (details) {
            setSelectedInvoice(details);
            setPreviewType('RECEIPT');
            setShowPreview(true);
        }
    };

    return (
        <div className="space-y-8 p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Billing & Records</h1>
                    <p className="text-gray-500 text-sm font-medium">Manage clinical receipts and billing history.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by MRN or Invoice..." 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none shadow-sm text-sm focus:ring-2 focus:ring-red-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm no-print">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5">Ref / Inv No</th>
                            <th className="px-8 py-5">Patient Name</th>
                            <th className="px-8 py-5">Date</th>
                            <th className="px-8 py-5 text-right">Bill Amount</th>
                            <th className="px-8 py-5 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {invoices.filter(inv => 
                            inv.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            inv.mrn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            inv.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map(inv => (
                            <tr key={inv.invoice_id} className="hover:bg-red-50/50 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="font-mono font-bold text-red-700">{inv.invoice_no}</div>
                                    <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{inv.mrn}</div>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="font-black text-gray-800 uppercase text-sm">{inv.patient_name}</p>
                                </td>
                                <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                                    {new Date(inv.invoice_date).toLocaleDateString('en-GB')}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <span className="font-black text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                        Rs. {inv.total_amount.toLocaleString()}/-
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <button 
                                        onClick={() => handleViewRecord(inv.invoice_id)} 
                                        className="bg-red-700 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-700/20 hover:bg-red-800 transition-all active:scale-95"
                                    >
                                        View Receipt
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showPreview && selectedInvoice && (
                <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-md flex flex-col md:flex-row overflow-hidden">
                    <div className="flex-1 overflow-auto p-4 md:p-12 flex flex-col items-center">
                        <div id="printable-document" className="max-w-[210mm] w-full bg-white shadow-2xl rounded-sm min-h-[297mm] flex flex-col animate-in zoom-in-95 duration-300 relative overflow-hidden p-0 font-sans">
                            
                            {/* HEADER */}
                            <div className="bg-slate-50 p-10 flex items-center gap-12 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-full bg-gray-100/30 skew-x-12 transform translate-x-16"></div>
                                <div className="w-24 h-24 bg-white rounded-2xl p-2 shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                                    <img src={LOGO_URL} className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1">
                                    {previewType === 'URDU_RECEIPT' ? (
                                        <div className="text-left">
                                            <h1 className="text-5xl font-black text-gray-800 tracking-tight leading-tight mb-1">چائنہ ڈینٹل سرجری</h1>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-[#008cb4] uppercase tracking-wide">المجید شاپنگ سینٹر کوٹ رادھا کشن روڈ پھول نگر</p>
                                                <p className="text-base font-black text-[#008cb4]">03334216580</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-left">
                                            <h1 className="text-4xl font-black text-gray-800 tracking-tighter uppercase leading-tight">CHINA DENTAL SURGERY</h1>
                                            <p className="text-[10px] font-bold text-sky-600 uppercase tracking-[0.2em] mb-3">AL-MAJEED SHOPPING CENTER KOT RADHA KISHAN ROAD PHOOL NAGAR</p>
                                            <p className="text-sm font-black text-sky-600">03334216580</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="h-1 bg-blue-600 mx-10 mt-6 mb-4"></div>

                            {/* PATIENT INFO */}
                            <div className="p-10 pb-6 grid grid-cols-2 gap-10">
                                <div className="space-y-1">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-2">
                                        {previewType === 'URDU_RECEIPT' ? "مریض کی تفصیلات" : "PATIENT INFORMATION"}
                                    </h3>
                                    <p className="text-sm">
                                        {previewType === 'URDU_RECEIPT' ? "نام" : "Name"}: <span className="font-bold">
                                            {previewType === 'URDU_RECEIPT' ? (URDU_MAP[selectedInvoice.patient.full_name] || selectedInvoice.patient.full_name) : selectedInvoice.patient.full_name}
                                        </span>
                                    </p>
                                    <p className="text-sm">MR No: <span className="font-bold">{selectedInvoice.patient.mrn}</span></p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-2">
                                        {previewType === 'URDU_RECEIPT' ? "بل کی تفصیل" : "BILLING SUMMARY"}
                                    </h3>
                                    <p className="text-sm">Invoice No: <span className="font-bold">{selectedInvoice.invoice_no}</span></p>
                                    <p className="text-sm">
                                        {previewType === 'URDU_RECEIPT' ? "تاریخ" : "Date"}: <span className="font-bold">{new Date(selectedInvoice.invoice_date).toLocaleDateString('en-GB')}</span>
                                    </p>
                                </div>
                            </div>

                            {/* BODY */}
                            <div className="px-10 mt-10 flex-1 relative flex">
                                <img src={LOGO_URL} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120mm] opacity-[0.03] pointer-events-none" />
                                <div className="w-3/5 pr-6 border-r border-gray-900 relative">
                                    <span className="text-6xl font-black text-gray-100 absolute top-0 left-0 -mt-4 -ml-2">Rx</span>
                                    <div className="mt-12 space-y-6 relative z-10">
                                        {selectedInvoice.prescriptions.map(rx => (
                                            <div key={rx.rx_id}>
                                                <p className="text-base font-bold text-gray-800">{rx.medication}</p>
                                                <p className="text-xs text-gray-500">
                                                    {previewType === 'URDU_RECEIPT' ? (URDU_MAP[rx.instructions] || rx.instructions) : rx.instructions}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-2/5 pl-6">
                                    <div className="bg-slate-100 p-2 flex justify-between text-[10px] font-black uppercase text-sky-600 mb-4">
                                        <span>{previewType === 'URDU_RECEIPT' ? "تفصیل" : "Procedure"}</span>
                                        <span>{previewType === 'URDU_RECEIPT' ? "رقم" : "Amount (PKR)"}</span>
                                    </div>
                                    <div className="space-y-3">
                                        {selectedInvoice.items.map(item => (
                                            <div key={item.item_id} className="flex justify-between text-xs">
                                                <span className="font-medium text-gray-700">
                                                    {previewType === 'URDU_RECEIPT' ? (URDU_MAP[item.proc_name || ''] || item.proc_name) : item.proc_name}
                                                </span>
                                                <span className="font-bold">{item.amount}/-</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-0.5 bg-sky-600 mt-6 mb-4"></div>
                                    <div className="flex justify-between items-center px-4">
                                        <span className="text-sm font-black text-gray-800">
                                            {previewType === 'URDU_RECEIPT' ? "کل رقم" : "Total"}
                                        </span>
                                        <span className="text-sm font-black text-gray-900">{previewType === 'URDU_RECEIPT' ? 'روپے' : 'Rs.'} {selectedInvoice.total_amount}/-</span>
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER */}
                            <div className="p-10 mt-auto">
                                <div className="grid grid-cols-2">
                                    <div>
                                        <p className="text-xs font-black text-gray-900 uppercase">Checked By:</p>
                                        <p className="text-sm font-black text-sky-600 mt-1">Dr. Bashir Khan D.H.</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-48 h-px bg-gray-300 mx-auto mb-2"></div>
                                        <p className="text-sm font-black text-gray-900">Dr. Bashir Khan D.H.</p>
                                        <p className="text-[10px] text-gray-500">Authorized Signature</p>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between text-[8px] text-gray-400 font-medium">
                                    <p>This is a digitally generated document. No physical signature required.</p>
                                    <p>Generated on: {new Date().toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-[400px] bg-white border-l border-gray-100 p-10 flex flex-col shadow-2xl no-print sidebar-options">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Receipt Options</h2>
                            <button onClick={() => setShowPreview(false)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={24}/></button>
                        </div>
                        
                        <div className="space-y-4 mb-10">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Choose Format</p>
                            {[
                                { id: 'RECEIPT', label: 'Receipt' },
                                { id: 'URDU_RECEIPT', label: 'RECEIPT (URDU)' }
                            ].map(btn => (
                                <button 
                                    key={btn.id}
                                    onClick={() => setPreviewType(btn.id as any)}
                                    className={`w-full py-5 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border flex items-center justify-between ${
                                        previewType === btn.id ? 'bg-sky-700 text-white border-sky-700 shadow-xl' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                                    }`}
                                >
                                    <span>{btn.label}</span>
                                    {previewType === btn.id && <ShieldCheck size={16} />}
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto space-y-4">
                            <button onClick={handleAction} className="w-full flex items-center justify-center gap-4 bg-gray-900 text-white px-8 py-5 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all">
                                <FileDown size={20} /> <span>{previewType === 'URDU_RECEIPT' ? 'Print / Save as PDF' : 'Download PDF'}</span>
                            </button>
                            <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-4 bg-white border-2 border-sky-700 text-sky-700 px-8 py-5 rounded-2xl font-black uppercase text-sm hover:bg-sky-50 transition-all">
                                <Printer size={20} /> <span>Print Copy</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingView;