
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Printer, X, FileText, Search, User, ClipboardList, LayoutList, FileDown, CheckCircle2, Copy, Info } from 'lucide-react';
import { ClinicService } from '../services/api';
import { Invoice, InvoiceDetails } from '../types';
import { jsPDF } from 'jspdf';

const BillingView: React.FC = () => {
    const location = useLocation();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetails | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewType, setPreviewType] = useState<'INVOICE' | 'PRESCRIPTION'>('INVOICE');

    const BACKGROUND_IMAGE_URL = "https://ytvvqf2doe9bgkjx.public.blob.vercel-storage.com/Teath.png";
    const LOGO_URL = "https://ytvvqf2doe9bgkjx.public.blob.vercel-storage.com/Teath.png";

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        ClinicService.getInvoices().then(invs => {
            setInvoices(invs.sort((a, b) => b.invoice_id - a.invoice_id));
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const generatePdf = useCallback(() => {
        if (!selectedInvoice) return;

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const drawBackground = (docInstance: any) => {
            docInstance.saveGraphicsState();
            docInstance.setGState(new docInstance.GState({ opacity: 0.1 }));
            const imgWidth = 150;
            const imgHeight = 150;
            const x = (210 - imgWidth) / 2;
            const y = (297 - imgHeight) / 2 + 20;
            docInstance.addImage(BACKGROUND_IMAGE_URL, 'PNG', x, y, imgWidth, imgHeight);
            docInstance.restoreGraphicsState();
        };

        const drawHeader = (docInstance: any, title: string) => {
            const pageWidth = 210;
            const headerHeight = 55;
            
            // Draw Blue Background with "Wave" effect (simplified for PDF)
            docInstance.setFillColor(0, 163, 255); // Blue
            docInstance.rect(0, 0, 100, headerHeight, 'F');
            
            // Draw a subtle curve/triangle to simulate the wave
            docInstance.setFillColor(255, 255, 255);
            docInstance.triangle(100, 0, 115, 0, 100, headerHeight, 'F');
            
            // Add Logo
            docInstance.addImage(LOGO_URL, 'PNG', 15, 10, 30, 30);
            
            // Text side (Right)
            const textStartX = 120;
            
            docInstance.setTextColor(150, 160, 180); // Light blue-grey
            docInstance.setFont('helvetica', 'normal');
            docInstance.setFontSize(14);
            docInstance.text("Chaina", textStartX, 22);
            
            docInstance.setTextColor(30, 45, 90); // Dark Blue
            docInstance.setFont('helvetica', 'bold');
            docInstance.setFontSize(24);
            docInstance.text("Dental Clinic", textStartX, 32);
            
            docInstance.setTextColor(0, 140, 255); // Bright Blue
            docInstance.setFont('helvetica', 'bold');
            docInstance.setFontSize(36);
            docInstance.text(title.toUpperCase(), textStartX, 48);
        };

        const drawFooter = (docInstance: any) => {
            const pageHeight = docInstance.internal.pageSize.height;
            docInstance.setFont('helvetica', 'italic');
            docInstance.setFontSize(8);
            docInstance.setTextColor(150, 150, 150);
            docInstance.text(`This is a digitally generated document. No physical signature required.`, 15, pageHeight - 15);
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB');
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            docInstance.text(`Generated on: ${dateStr} ${timeStr}`, 150, pageHeight - 15);
            docInstance.setTextColor(50, 50, 50);
            docInstance.setFontSize(9);
            docInstance.setFont('helvetica', 'bold');
            docInstance.text("Checked By:", 15, pageHeight - 35);
            docInstance.setTextColor(0, 140, 180);
            docInstance.text(selectedInvoice!.doctor.full_name, 15, pageHeight - 30);
            docInstance.setFont('helvetica', 'normal');
            docInstance.setFontSize(8);
            docInstance.setTextColor(100, 100, 100);
            docInstance.text(selectedInvoice!.doctor.specialty, 15, pageHeight - 25);
            docInstance.setDrawColor(200, 200, 200);
            docInstance.line(140, pageHeight - 35, 195, pageHeight - 35);
            docInstance.setTextColor(0, 0, 0);
            docInstance.setFont('helvetica', 'bold');
            docInstance.setFontSize(10);
            docInstance.text("Dr. Bashir Khan D.H.", 195, pageHeight - 30, { align: 'right' });
            docInstance.setFont('helvetica', 'normal');
            docInstance.setFontSize(8);
            docInstance.setTextColor(100, 100, 100);
            docInstance.text("Authorized Signature", 195, pageHeight - 25, { align: 'right' });
        };

        drawBackground(doc);

        if (previewType === 'INVOICE') {
            drawHeader(doc, "Invoice");
            let contentStart = 75;
            doc.setTextColor(30, 35, 45);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("PATIENT INFORMATION", 15, contentStart);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(`Name: ${selectedInvoice.patient.full_name}`, 15, contentStart + 7);
            doc.text(`MR No: ${selectedInvoice.patient.mrn}`, 15, contentStart + 13);
            
            doc.setFont('helvetica', 'bold');
            doc.text("BILLING SUMMARY", 130, contentStart);
            doc.setFont('helvetica', 'normal');
            const invDate = new Date(selectedInvoice.invoice_date).toLocaleDateString('en-GB');
            doc.text(`Invoice No: ${selectedInvoice.invoice_no}`, 130, contentStart + 7);
            doc.text(`Date: ${invDate}`, 130, contentStart + 13);

            doc.setFillColor(245, 247, 250);
            doc.rect(15, contentStart + 35, 180, 10, 'F');
            doc.setFont('helvetica', 'bold');
            doc.text("Description of Treatment / Procedure", 20, contentStart + 41);
            doc.text("Amount (PKR)", 160, contentStart + 41);

            let y = contentStart + 53;
            doc.setFont('helvetica', 'normal');
            selectedInvoice.items.forEach(item => {
                doc.text(item.proc_name || 'Procedure', 20, y);
                doc.text(`Rs. ${item.amount.toLocaleString()}`, 160, y);
                y += 8;
            });

            doc.setDrawColor(0, 140, 180);
            doc.setLineWidth(0.5);
            doc.line(15, y, 195, y);
            y += 10;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text("Total Amount:", 110, y);
            doc.text(`Rs. ${selectedInvoice.total_amount.toLocaleString()}`, 160, y);
            drawFooter(doc);
        } else {
            drawHeader(doc, "Prescription");
            let contentStart = 75;
            doc.setTextColor(30, 35, 45);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Patient: ${selectedInvoice.patient.full_name}`, 15, contentStart);
            doc.text(`MR No: ${selectedInvoice.patient.mrn}`, 15, contentStart + 7);
            doc.text(`Diagnosis: ${selectedInvoice.visit.diagnosis || 'Clinical Checkup'}`, 15, contentStart + 14);
            
            doc.setFontSize(30);
            doc.setTextColor(230, 230, 235);
            doc.text("Rx", 15, contentStart + 35);
            
            doc.setTextColor(30, 35, 45);
            doc.setFontSize(12);
            let ry = contentStart + 45;
            
            if (selectedInvoice.prescriptions.length === 0) {
                doc.setFont('helvetica', 'italic');
                doc.text("No specific medications prescribed.", 25, ry);
            } else {
                selectedInvoice.prescriptions.forEach((rx, idx) => {
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${idx + 1}. ${rx.medication}`, 25, ry);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.text(`   Instructions: ${rx.instructions}`, 25, ry + 6);
                    ry += 18;
                });
            }
            drawFooter(doc);
        }

        const typeStr = previewType === 'INVOICE' ? 'Invoice' : 'Prescription';
        const fileName = `${typeStr}_${selectedInvoice.invoice_no}_${selectedInvoice.patient.full_name.replace(/\s+/g, '_')}.pdf`;
        doc.save(fileName);
    }, [selectedInvoice, previewType]);

    const handlePrintPreview = async (id: number, type: 'INVOICE' | 'PRESCRIPTION' = 'INVOICE', autoShow: boolean = false) => {
        const details = await ClinicService.getInvoiceDetails(id);
        if (details) {
            setSelectedInvoice(details);
            setPreviewType(type);
            setShowPreview(true);
        }
    };

    useEffect(() => {
        const state = location.state as { openInvoiceId?: number, autoPrint?: boolean } | null;
        if (state?.openInvoiceId) {
            handlePrintPreview(state.openInvoiceId, 'INVOICE', true);
            window.history.replaceState({}, '');
        }
    }, [location]);

    const filteredInvoices = invoices.filter(inv => 
        inv.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (inv.mrn && inv.mrn.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const renderDocumentHeader = (title: string) => {
        if (!selectedInvoice) return null;
        return (
            <div className="flex h-48 -mx-12 -mt-12 mb-12 relative z-10 overflow-hidden bg-white border-b border-gray-100">
                {/* Left Blue Wave Part */}
                <div 
                    className="w-1/2 bg-[#00a3ff] flex items-center justify-center relative"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)' }}
                >
                    <img src={LOGO_URL} alt="Logo" className="w-24 h-24" />
                </div>
                
                {/* Right Text Part */}
                <div className="flex-1 flex flex-col justify-center pl-8">
                    <p className="text-gray-400 font-bold text-lg uppercase tracking-widest leading-none mb-1">Chaina</p>
                    <h1 className="text-3xl font-black text-[#1e2d5a] uppercase tracking-tight leading-none mb-4">Dental Clinic</h1>
                    <h2 className="text-6xl font-black text-[#008cff] uppercase tracking-tighter leading-none">{title}</h2>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 p-4">
            <div className="flex justify-between items-end no-print">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase">Medical Records</h1>
                    <p className="text-gray-500 text-sm">View finalized invoices and prescriptions.</p>
                </div>
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search records..." 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm no-print">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5">Inv No</th>
                            <th className="px-8 py-5">Patient Name</th>
                            <th className="px-8 py-5 text-right">Amount</th>
                            <th className="px-8 py-5 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredInvoices.map(inv => (
                            <tr key={inv.invoice_id} className="hover:bg-cyan-50/50 transition-colors cursor-pointer" onClick={() => handlePrintPreview(inv.invoice_id)}>
                                <td className="px-8 py-6 font-mono font-bold text-cyan-700">{inv.invoice_no}</td>
                                <td className="px-8 py-6 font-black text-gray-800 uppercase">{inv.patient_name}</td>
                                <td className="px-8 py-6 text-right font-black text-gray-900">Rs. {inv.total_amount.toLocaleString()}</td>
                                <td className="px-8 py-6 text-center">
                                    <button className="bg-white border border-gray-200 text-gray-900 px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-sm">View Record</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showPreview && selectedInvoice && (
                <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-md flex overflow-hidden print-container">
                    <div className="flex-1 overflow-auto p-4 md:p-12 flex flex-col items-center scrollbar-hide">
                        <div id="printable-document" className="max-w-[210mm] w-full bg-white p-12 shadow-2xl rounded-sm min-h-[297mm] flex flex-col animate-in zoom-in-95 duration-300 relative overflow-hidden">
                            <img src={BACKGROUND_IMAGE_URL} alt="Background" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150mm] h-[150mm] object-contain opacity-[0.05] pointer-events-none" />
                            
                            {previewType === 'INVOICE' ? (
                                <div className="relative z-10 flex flex-col h-full">
                                    {renderDocumentHeader('Invoice')}
                                    <div className="space-y-8 flex-1">
                                        <div className="grid grid-cols-2 gap-10">
                                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                                <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Patient Details</p>
                                                <p className="text-xl font-black text-gray-900">{selectedInvoice.patient.full_name}</p>
                                                <p className="text-sm text-gray-500 font-bold mt-1">MRN: {selectedInvoice.patient.mrn}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 py-4 border-t border-b border-gray-50">
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Billing Summary</p>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-gray-900">Invoice No: {selectedInvoice.invoice_no}</p>
                                                    <p className="text-[10px] text-gray-400">Date: {new Date(selectedInvoice.invoice_date).toLocaleDateString('en-GB')}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest">
                                                    <th className="px-6 py-4 text-left">Description</th>
                                                    <th className="px-6 py-4 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedInvoice.items.map(item => (
                                                    <tr key={item.item_id}>
                                                        <td className="px-6 py-4 font-bold text-gray-800">{item.proc_name}</td>
                                                        <td className="px-6 py-4 text-right font-black">Rs. {item.amount}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-cyan-50">
                                                    <td className="px-6 py-6 text-right text-xs font-black uppercase text-cyan-700">Total:</td>
                                                    <td className="px-6 py-6 text-right text-2xl font-black text-cyan-900">Rs. {selectedInvoice.total_amount.toLocaleString()}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative z-10 flex flex-col h-full">
                                    {renderDocumentHeader('Prescription')}
                                    <div className="flex-1">
                                        <div className="text-4xl font-serif text-gray-100 mb-6">Rx</div>
                                        <div className="pl-12 space-y-8">
                                            {selectedInvoice.prescriptions.length === 0 ? (
                                                <p className="text-gray-400 italic">No specific medications prescribed.</p>
                                            ) : (
                                                selectedInvoice.prescriptions.map((rx, idx) => (
                                                    <div key={rx.rx_id} className="border-b border-gray-50 pb-6">
                                                        <p className="text-2xl font-black text-gray-900 uppercase">{rx.medication}</p>
                                                        <p className="text-gray-600 font-bold text-lg mt-2 italic">{rx.instructions}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-start relative z-10">
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Checked By:</p>
                                    <p className="text-sm font-black text-cyan-700 uppercase leading-none">{selectedInvoice.doctor.full_name}</p>
                                    <p className="text-[10px] text-gray-500 mt-1 font-bold uppercase">{selectedInvoice.doctor.specialty}</p>
                                </div>
                                <div className="text-right">
                                    <div className="w-48 h-px bg-gray-300 ml-auto mb-4"></div>
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-900">Dr. Bashir Khan D.H.</p>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase">Authorized Signature</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-[400px] bg-white border-l border-gray-100 p-10 flex flex-col shadow-2xl record-panel no-print">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Record Panel</h2>
                            <button onClick={() => setShowPreview(false)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={32}/></button>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-2xl flex gap-2">
                                <button onClick={() => setPreviewType('INVOICE')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${previewType === 'INVOICE' ? 'bg-[#008cb4] text-white shadow-lg' : 'text-gray-400'}`}>Invoice</button>
                                <button onClick={() => setPreviewType('PRESCRIPTION')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${previewType === 'PRESCRIPTION' ? 'bg-purple-700 text-white shadow-lg' : 'text-gray-400'}`}>Prescription</button>
                            </div>
                            <div className="h-px bg-gray-100 my-4"></div>
                            <button onClick={handlePrint} className="w-full flex items-center justify-center gap-4 bg-gray-900 hover:bg-black text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-gray-900/20 transition-all active:scale-95">
                                <Printer size={24} />
                                <span>Print View</span>
                            </button>
                            <button onClick={generatePdf} className="w-full flex items-center justify-center gap-4 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all active:scale-95">
                                <FileDown size={24} />
                                <span>Download PDF</span>
                            </button>
                        </div>
                        <div className="mt-auto bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-start gap-3">
                            <Info size={20} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed tracking-wider">
                                Click "Download PDF" to save the currently selected document ({previewType.toLowerCase()}).
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingView;
