'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Download, CreditCard } from 'lucide-react';

interface Invoice {
  id: string;
  total_amount: number;
  due_date: string;
  status: string;
  challan_number: string;
  semesters: {
    semester_number: number;
    term: string;
    academic_year: string;
  }
}

export default function StudentFee() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            id,
            total_amount,
            due_date,
            status,
            challan_number,
            late_fee_amount,
            semesters (
              semester_number,
              term,
              academic_year
            )
          `)
          .eq('student_id', user.id)
          .order('due_date', { ascending: false });

        if (error) throw error;
        // @ts-ignore
        setInvoices(data || []);

        // Fetch student profile details as well
        const { data: sProfile } = await supabase
          .from('student_profiles')
          .select('registration_number, programs(name, code)')
          .eq('id', user.id)
          .single();
        setStudentProfile(sProfile);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, [user]);

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      // Find the invoice to check its type
      const invToPay = invoices.find(inv => inv.id === invoiceId);
      if (!invToPay) return;

      const { error } = await supabase
        .from('invoices')
        .update({ status: 'Paid' })
        .eq('id', invoiceId);

      if (error) throw error;

      // Log the payment in the payments table for Finance tracking
      const transactionRef = 'TRX-' + Math.floor(Date.now() / 1000) + '-' + invoiceId.substring(0, 6);
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoiceId,
          amount_paid: invToPay.total_amount,
          payment_method: 'Card',
          transaction_reference: transactionRef
        });
        
      if (paymentError) console.error("Failed to log payment record:", paymentError);
      
      // If this is a library subscription invoice, activate the subscription
      if (invToPay.challan_number.startsWith('LIB-') && user) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 30 days subscription
        
        const { error: subError } = await supabase
          .from('library_subscriptions')
          .upsert({ 
            student_id: user.id, 
            status: 'Active',
            start_date: new Date().toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0]
          }, { onConflict: 'student_id' });
          
        if (subError) console.error("Failed to activate library sub:", subError);
      }
      
      setInvoices(invoices.map(inv => inv.id === invoiceId ? { ...inv, status: 'Paid' } : inv));
      alert('Payment successful!');
    } catch (error: any) {
      console.error("Error paying invoice:", error);
      alert('Payment failed: ' + error.message);
    }
  };

  const handlePrintChallan = (inv: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Please allow popups for this site');

    // @ts-ignore
    const lateFee = inv.late_fee_amount || 0;
    const libraryFee = 5000;
    const tuitionFee = Math.max(inv.total_amount - libraryFee - lateFee, 0);
    const grandTotal = inv.total_amount;

    const copyTypes = ['Bank Copy', 'University Copy', 'Student Copy'];

    const copyHtmls = copyTypes.map((copyType) => `
      <div class="challan-copy">
        <div class="copy-header">
          <div class="copy-title-tag">${copyType}</div>
          <div class="university-brand">
            <div class="uni-name">HITEC UNIVERSITY</div>
            <div class="uni-sub">TAXILA CANTT, PAKISTAN</div>
          </div>
          <div class="bank-title">HABIB BANK LIMITED</div>
          <div class="bank-acct">A/C No: 0123-456789-012 (Fee Collection Branch)</div>
        </div>
        
        <div class="details-section">
          <div class="detail-row"><span class="det-label">Challan No:</span><span class="det-val font-mono">${inv.challan_number}</span></div>
          <div class="detail-row"><span class="det-label">Reg No:</span><span class="det-val font-mono">${studentProfile?.registration_number || 'N/A'}</span></div>
          <div class="detail-row"><span class="det-label">Name:</span><span class="det-val">${user?.firstName || 'New'} ${user?.lastName || 'User'}</span></div>
          <div class="detail-row"><span class="det-label">Program:</span><span class="det-val">${studentProfile?.programs?.code || 'N/A'}</span></div>
          <div class="detail-row"><span class="det-label">Semester:</span><span class="det-val">Semester ${inv.semesters?.semester_number || 'N/A'} (${inv.semesters?.term || ''})</span></div>
          <div class="detail-row"><span class="det-label">Due Date:</span><span class="det-val text-red">${new Date(inv.due_date).toLocaleDateString()}</span></div>
        </div>

        <table class="challan-table">
          <thead>
             <tr>
                <th>Particulars</th>
                <th class="text-right">Amount (PKR)</th>
             </tr>
          </thead>
          <tbody>
             <tr>
                <td>Tuition & Exam Fee</td>
                <td class="text-right">${tuitionFee.toLocaleString()}.00</td>
             </tr>
             <tr>
                <td>Library & IT Support</td>
                <td class="text-right">${libraryFee.toLocaleString()}.00</td>
             </tr>
             <tr>
                <td>Late Fee Surcharge</td>
                <td class="text-right">${lateFee.toLocaleString()}.00</td>
             </tr>
             <tr class="total-row">
                <td>Grand Total</td>
                <td class="text-right">PKR ${grandTotal.toLocaleString()}.00</td>
             </tr>
          </tbody>
        </table>

        <div class="barcode-container">
          <div class="barcode"></div>
          <div class="barcode-text">${inv.challan_number}</div>
        </div>

        <div class="signature-section">
          <div class="sig-col">
             <div class="sig-line"></div>
             <div class="sig-label">Depositor</div>
          </div>
          <div class="sig-col">
             <div class="sig-line"></div>
             <div class="sig-label">Bank Officer</div>
          </div>
        </div>

        <div class="challan-footer">
          * Please pay at any HBL Branch. Fee is non-refundable. Submit University Copy to accounts department immediately.
        </div>
      </div>
    `).join(`
      <div class="divider">
         <div class="scissors">✂</div>
      </div>
    `);

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Fee Challan - ${inv.challan_number}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
              @media print {
                  @page {
                      size: A4 landscape;
                      margin: 4mm;
                  }
                  body {
                      margin: 0;
                      padding: 0;
                      background: #fff;
                      -webkit-print-color-adjust: exact;
                      print-color-adjust: exact;
                  }
              }
              * {
                  box-sizing: border-box;
              }
              body {
                  font-family: 'Outfit', 'Inter', sans-serif;
                  color: #0f172a;
                  background-color: #ffffff;
                  margin: 0;
                  padding: 5px;
              }
              .challan-page {
                  display: flex;
                  justify-content: space-between;
                  width: 100%;
                  max-width: 1120px;
                  margin: 0 auto;
                  background: #fff;
                  padding: 5px;
              }
              .challan-copy {
                  width: 32%;
                  border: 1.5px solid #1e293b;
                  padding: 10px;
                  border-radius: 8px;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  background: #fff;
                  font-size: 10px;
              }
              .divider {
                  width: 2%;
                  position: relative;
                  border-left: 1px dashed #64748b;
                  display: flex;
                  align-items: center;
                  justify-content: center;
              }
              .scissors {
                  position: absolute;
                  top: 40%;
                  transform: translateY(-50%) rotate(90deg);
                  background: #fff;
                  color: #64748b;
                  font-size: 14px;
                  padding: 4px;
              }
              .copy-header {
                  text-align: center;
                  border-bottom: 2px solid #1e3a8a;
                  padding-bottom: 6px;
                  margin-bottom: 8px;
              }
              .copy-title-tag {
                  background: #1e3a8a;
                  color: #fff;
                  font-weight: 800;
                  font-size: 9px;
                  letter-spacing: 1px;
                  padding: 2px 8px;
                  border-radius: 4px;
                  display: inline-block;
                  margin-bottom: 4px;
                  text-transform: uppercase;
              }
              .uni-name {
                  font-size: 14px;
                  font-weight: 900;
                  color: #1e3a8a;
                  letter-spacing: 0.5px;
                  margin: 2px 0 0;
              }
              .uni-sub {
                  font-size: 8px;
                  color: #64748b;
                  font-weight: 700;
                  margin-bottom: 4px;
              }
              .bank-title {
                  font-size: 11px;
                  font-weight: 800;
                  color: #0f766e;
                  margin-top: 4px;
              }
              .bank-acct {
                  font-size: 8px;
                  font-weight: 700;
                  color: #374151;
              }
              .details-section {
                  margin-bottom: 8px;
                  display: flex;
                  flex-direction: column;
                  gap: 3px;
              }
              .detail-row {
                  display: flex;
                  justify-content: space-between;
                  line-height: 1.2;
              }
              .det-label {
                  font-weight: 700;
                  color: #64748b;
                  font-size: 8px;
                  text-transform: uppercase;
                  width: 70px;
                  flex-shrink: 0;
              }
              .det-val {
                  font-weight: 700;
                  color: #1e293b;
                  text-align: right;
                  border-bottom: 1px dotted #cbd5e1;
                  flex-grow: 1;
                  margin-left: 4px;
                  font-size: 9px;
              }
              .font-mono {
                  font-family: 'Courier New', Courier, monospace;
              }
              .text-red {
                  color: #ef4444 !important;
              }
              .challan-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 8px;
              }
              .challan-table th, .challan-table td {
                  border: 1px solid #cbd5e1;
                  padding: 4px 6px;
                  text-align: left;
                  font-size: 8.5px;
              }
              .challan-table th {
                  background: #f8fafc;
                  font-weight: 700;
                  color: #1e3a8a;
                  text-transform: uppercase;
              }
              .text-right {
                  text-align: right !important;
              }
              .total-row {
                  font-weight: 900;
                  background: #f1f5f9;
              }
              .total-row td {
                  font-size: 10px !important;
                  color: #1e3a8a;
                  border-top: 1.5px solid #1e3a8a;
              }
              .barcode-container {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  margin: 6px 0;
              }
              .barcode {
                  width: 130px;
                  height: 24px;
                  background: repeating-linear-gradient(
                      90deg,
                      #000,
                      #000 1.5px,
                      #fff 1.5px,
                      #fff 3.5px,
                      #000 3.5px,
                      #000 4.5px,
                      #fff 4.5px,
                      #fff 6.5px
                  );
              }
              .barcode-text {
                  font-size: 7px;
                  font-family: monospace;
                  margin-top: 2px;
                  letter-spacing: 2px;
                  font-weight: 700;
              }
              .signature-section {
                  display: flex;
                  justify-content: space-between;
                  margin-top: 15px;
                  margin-bottom: 6px;
              }
              .sig-col {
                  width: 45%;
                  text-align: center;
              }
              .sig-line {
                  border-top: 1px solid #475569;
                  margin-bottom: 2px;
              }
              .sig-label {
                  font-size: 7.5px;
                  color: #64748b;
                  font-weight: 650;
                  text-transform: uppercase;
              }
              .challan-footer {
                  font-size: 7px;
                  color: #64748b;
                  text-align: center;
                  border-top: 1px dotted #cbd5e1;
                  padding-top: 4px;
                  line-height: 1.25;
              }
          </style>
      </head>
      <body>
          <div class="challan-page">
              ${copyHtmls}
          </div>
          <script>
              window.onload = function() { 
                  setTimeout(function() { window.print(); }, 500);
              }
          </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };



  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fee & Invoices</h1>
        <p className="text-muted-foreground">Manage your fee challans and payment history.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices History</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-gray-500 text-sm">No invoices found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challan No.</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.challan_number}</TableCell>
                    <TableCell>{inv.semesters.term} {inv.semesters.academic_year}</TableCell>
                    <TableCell>PKR {inv.total_amount.toLocaleString()}</TableCell>
                    <TableCell>{new Date(inv.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        inv.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                        inv.status === 'Partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                        inv.status === 'Overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {inv.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePrintChallan(inv)}
                        title="Download/Print Challan"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Challan
                      </Button>
                      {inv.status !== 'Paid' && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handlePayInvoice(inv.id)}>
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
