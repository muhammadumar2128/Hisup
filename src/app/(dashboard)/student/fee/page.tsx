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

    const libraryFee = 5000;
    const tuitionFee = Math.max(inv.total_amount - libraryFee, 0);
    const grandTotal = inv.total_amount;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Fee Challan - ${inv.challan_number}</title>
          <style>
              body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                  padding: 20px; 
                  color: #000; 
                  font-size: 14px;
                  background: #fff;
              }
              .challan-container {
                  max-width: 800px;
                  margin: 0 auto;
                  border: 2px solid #1a365d;
                  padding: 30px;
                  position: relative;
              }
              .watermark {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%) rotate(-45deg);
                  font-size: 80px;
                  color: rgba(0, 0, 0, 0.04);
                  white-space: nowrap;
                  pointer-events: none;
                  z-index: 0;
              }
              .header { 
                  text-align: center; 
                  margin-bottom: 30px; 
                  border-bottom: 2px solid #1a365d; 
                  padding-bottom: 15px; 
                  position: relative;
                  z-index: 1;
              }
              .header h1 { 
                  margin: 0; 
                  color: #1a365d; 
                  font-size: 28px;
                  text-transform: uppercase;
                  letter-spacing: 2px;
              }
              .header p { 
                  margin: 5px 0 0; 
                  font-weight: bold; 
                  color: #4a5568;
                  font-size: 16px;
              }
              .top-details {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 25px;
                  z-index: 1;
                  position: relative;
              }
              .details-box { 
                  width: 48%; 
              }
              .details-box p {
                  margin: 8px 0;
              }
              .label {
                  font-weight: 600;
                  display: inline-block;
                  width: 120px;
              }
              .value {
                  border-bottom: 1px dotted #ccc;
                  display: inline-block;
                  width: calc(100% - 130px);
                  padding-left: 5px;
              }
              .due-date {
                  color: #e53e3e;
                  font-weight: bold;
              }
              table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin-bottom: 30px; 
                  z-index: 1;
                  position: relative;
              }
              th, td { 
                  padding: 12px; 
                  text-align: left; 
                  border: 1px solid #cbd5e0; 
              }
              th { 
                  background-color: #f7fafc; 
                  color: #1a365d;
                  font-weight: 600;
                  text-transform: uppercase;
                  font-size: 12px;
              }
              .amount-col {
                  text-align: right;
              }
              .total-row {
                  font-weight: bold;
                  background-color: #f7fafc;
              }
              .total-row td {
                  font-size: 16px;
                  border-top: 2px solid #1a365d;
              }
              .bank-details {
                  margin-bottom: 40px;
                  padding: 15px;
                  background-color: #f7fafc;
                  border: 1px solid #cbd5e0;
                  border-radius: 4px;
                  z-index: 1;
                  position: relative;
              }
              .bank-details h4 {
                  margin: 0 0 10px 0;
                  color: #1a365d;
              }
              .bank-details p {
                  margin: 4px 0;
              }
              .signatures {
                  display: flex;
                  justify-content: space-between;
                  margin-top: 60px;
                  z-index: 1;
                  position: relative;
              }
              .sig-line {
                  width: 200px;
                  text-align: center;
                  border-top: 1px solid #000;
                  padding-top: 8px;
                  font-size: 12px;
              }
              .footer { 
                  text-align: center; 
                  margin-top: 40px; 
                  font-size: 11px; 
                  color: #718096;
                  border-top: 1px dashed #cbd5e0;
                  padding-top: 15px;
                  z-index: 1;
                  position: relative;
              }
              
              @media print {
                  body { padding: 0; }
                  .challan-container { border: none; padding: 0; max-width: 100%; }
              }
          </style>
      </head>
      <body>
          <div class="challan-container">
              <div class="watermark">HITEC UNIVERSITY</div>
              
              <div class="header">
                  <h1>HITEC University</h1>
                  <p>Official Fee Challan / Invoice</p>
              </div>
              
              <div class="top-details">
                  <div class="details-box">
                      <p><span class="label">Student Name:</span> <span class="value">${user?.firstName || 'Student'} ${user?.lastName || ''}</span></p>
                      <p><span class="label">Email:</span> <span class="value">${user?.email}</span></p>
                      <p><span class="label">Academic Term:</span> <span class="value">${inv.semesters.term} ${inv.semesters.academic_year}</span></p>
                  </div>
                  <div class="details-box">
                      <p><span class="label">Challan No:</span> <span class="value" style="font-family: monospace; font-weight: bold;">${inv.challan_number}</span></p>
                      <p><span class="label">Issue Date:</span> <span class="value">${new Date().toLocaleDateString()}</span></p>
                      <p><span class="label">Due Date:</span> <span class="value due-date">${new Date(inv.due_date).toLocaleDateString()}</span></p>
                  </div>
              </div>

              <table>
                  <thead>
                      <tr>
                          <th>S.No</th>
                          <th>Description of Particulars</th>
                          <th class="amount-col">Amount (PKR)</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr>
                          <td>1</td>
                          <td>Course Tuition & Registration Fee</td>
                          <td class="amount-col">${tuitionFee.toLocaleString()}.00</td>
                      </tr>
                      <tr>
                          <td>2</td>
                          <td>Library / IT Services</td>
                          <td class="amount-col">${libraryFee.toLocaleString()}.00</td>
                      </tr>
                      <tr>
                          <td>3</td>
                          <td>Late Fee Surcharge (If applicable)</td>
                          <td class="amount-col">0.00</td>
                      </tr>
                      <tr class="total-row">
                          <td colspan="2" style="text-align: right;">Total Amount Payable:</td>
                          <td class="amount-col">${grandTotal.toLocaleString()}.00</td>
                      </tr>
                  </tbody>
              </table>

              <div class="bank-details">
                  <h4>Bank Payment Details</h4>
                  <p><strong>Bank Name:</strong> Habib Bank Limited (HBL) - University Branch</p>
                  <p><strong>Account Title:</strong> HITEC University Fee Collection</p>
                  <p><strong>Account Number:</strong> 0123-456789-012</p>
              </div>

              <div class="signatures">
                  <div class="sig-line">Cashier / Bank Officer Signature</div>
                  <div class="sig-line">Depositor Signature</div>
              </div>

              <div class="footer">
                  <p>1. Please deposit the fee before the due date. A late fee of PKR 1,000 will be charged after the due date.</p>
                  <p>2. This challan is generated electronically and requires a bank stamp to be considered a valid receipt.</p>
                  <p>3. Submit the University Copy to the Accounts Office immediately after payment.</p>
              </div>
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
