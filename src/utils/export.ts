import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Expense } from '../types';

export const exportToCSV = (data: Expense[], filename: string) => {
    const headers = ['Date', 'Description', 'Category', 'Wallet', 'Amount', 'Tags'];
    const rows = data.map(expense => [
        format(new Date(expense.date), 'yyyy-MM-dd'),
        `"${expense.description.replace(/"/g, '""')}"`, // Escape quotes
        expense.category?.name || '',
        expense.wallet?.name || '',
        expense.amount.toFixed(2),
        `"${expense.tags?.map(t => t.name).join(', ') || ''}"`
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const exportToPDF = (data: Expense[], title: string) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 30);

    const tableColumn = ['Date', 'Description', 'Category', 'Wallet', 'Amount', 'Tags'];
    const tableRows = data.map(expense => [
        format(new Date(expense.date), 'MMM dd, yyyy'),
        expense.description,
        expense.category?.name || '',
        expense.wallet?.name || '',
        `$${expense.amount.toFixed(2)}`,
        expense.tags?.map(t => t.name).join(', ') || ''
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] } // Indigo-600
    });

    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
};
