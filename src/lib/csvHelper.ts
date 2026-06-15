export function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) return;
  const separator = ';'; // Semicolon is standard for Brazilian Excel
  const keys = Object.keys(data[0]).filter(k => {
    // Keep only primitive values, filter out nested arrays/objects
    const val = data[0][k];
    return typeof val !== 'object' || val === null;
  });
  
  const csvContent = [
    keys.join(separator),
    ...data.map(item => {
      return keys.map(key => {
        let val = item[key];
        if (val === null || val === undefined) return '';
        
        // Clean values
        let strVal = String(val);
        
        // Format dates if matched
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
          strVal = new Date(val).toLocaleString('pt-BR');
        } else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
          strVal = new Date(val + 'T00:00:00').toLocaleDateString('pt-BR');
        }
        
        // Replace decimals for BR Excel compatibility
        if (typeof val === 'number') {
          strVal = strVal.replace('.', ',');
        }
        
        // Escape double quotes
        strVal = strVal.replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(separator);
    })
  ].join('\n');

  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
