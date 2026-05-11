/**
 * PDF Generator Utility for Quotations
 * Uses html2pdf.js for client-side PDF generation
 */

export async function generateQuotationPDF(quotation, options = {}) {
  // Verificar que html2pdf esté disponible
  if (typeof window.html2pdf === 'undefined') {
    throw new Error('html2pdf library not loaded. Please ensure it is included in your project.')
  }

  const element = document.getElementById('quotation-pdf-content')
  
  if (!element) {
    throw new Error('PDF content element not found')
  }

  const filename = `Cotizacion_${quotation.numero}-${quotation.empresa?.replace(/[^a-z0-9]/gi, '_') || 'Cliente'}.pdf`

  const opt = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      allowTaint: true,
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait',
      compress: true,
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    ...options
  }

  try {
    // Generar y descargar PDF
    await window.html2pdf().set(opt).from(element).save()
    return true
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

export async function printQuotationPDF(quotation) {
  const element = document.getElementById('quotation-pdf-content')
  
  if (!element) {
    throw new Error('PDF content element not found')
  }

  // Crear ventana de impresión
  const printWindow = window.open('', '_blank')
  
  if (!printWindow) {
    throw new Error('Unable to open print window. Please check popup blocker settings.')
  }

  // Obtener estilos computados
  const styles = Array.from(document.styleSheets)
    .filter(sheet => {
      try {
        return sheet.cssRules && sheet.href?.includes(window.location.origin)
      } catch (e) {
        return false
      }
    })
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n')
      } catch (e) {
        return ''
      }
    })
    .join('\n')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cotización ${quotation.numero} - ${quotation.empresa || 'Cliente'}</title>
        <style>
          ${styles}
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `)

  printWindow.document.close()
  
  // Esperar a que carguen las imágenes
  await new Promise(resolve => {
    printWindow.onload = resolve
    setTimeout(resolve, 1000)
  })

  printWindow.print()
}

export function openPDFInNewTab(quotationData) {
  // Crear una vista previa en nueva pestaña
  const printWindow = window.open('', '_blank')
  
  if (!printWindow) {
    throw new Error('Unable to open new tab. Please check popup blocker settings.')
  }

  // Aquí podrías renderizar el componente PDF en un iframe o usar una ruta dedicada
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cotización ${quotationData.numero}</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          .pdf-preview {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <div id="pdf-container"></div>
        <script>
          // Aquí se montaría el componente QuotationPDF
          console.log('PDF Preview for quotation:', ${JSON.stringify(quotationData)})
        </script>
      </body>
    </html>
  `)

  printWindow.document.close()
}
