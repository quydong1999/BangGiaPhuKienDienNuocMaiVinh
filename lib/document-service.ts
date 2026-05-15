import * as XLSX from 'xlsx-js-style';
import { ReadingConfig, doReadNumber } from 'read-vietnamese-number';
import { formatVND } from '@/lib/utils';
import type { CartItem } from '@/store/cartSlice';

export const cleanSpecName = (spec: string) => {
  if (!spec) return spec;
  // Strip quotes if both start and end exist
  if (spec.startsWith('"') && spec.endsWith('"')) {
    return spec.substring(1, spec.length - 1);
  }
  return spec;
};

export const exportDocumentToExcel = (items: CartItem[], grandTotal: number, docType: 'receipt' | 'quotation', includeVAT: boolean = false) => {
  const aoa: any[][] = [];

  // Header
  aoa.push(['Cửa hàng Điện nước Mai Vinh', '', '', '', '', '']);
  aoa.push(['Địa chỉ: Thắng Kiên - Đề Gi - Gia Lai', '', '', '', '', '']);
  aoa.push(['SĐT: 0976 576 443 - 0982 390 943', '', '', '', '', '']);
  aoa.push(['', '', '', '', '', '']);

  // Title
  const title = docType === 'quotation' ? 'BẢNG BÁO GIÁ' : 'PHIẾU BÁN HÀNG';
  aoa.push([title, '', '', '', '', '']);
  aoa.push(['', '', '', '', '', '']);

  // Customer info
  aoa.push(['Tên khách hàng:', '', '', '', '', '']);
  aoa.push(['Mã số thuế:', '', '', '', '', '']);
  aoa.push(['Điện thoại:', '', '', '', '', '']);
  aoa.push(['Email:', '', '', '', '', '']);
  aoa.push(['', '', '', '', '', '']);

  // Table Header
  const tableStartRow = aoa.length;
  aoa.push(['STT', 'Tên sản phẩm', 'Đvt', 'Số lượng', 'Đơn giá', 'Thành tiền']);

  // Table Body
  items.forEach((item, index) => {
    const cleanedSpec = cleanSpecName(item.specName);
    const isVisibleSpec = cleanedSpec && cleanedSpec !== '-' && cleanedSpec !== 'Mặc định';
    const productName = isVisibleSpec
      ? `${item.product.name} ${cleanedSpec}`
      : item.product.name;
    aoa.push([index + 1, productName, item.unit, item.quantity, item.price, item.price * item.quantity]);
  });

  // Table Footer (Total)
  if (docType === 'quotation' && includeVAT) {
    aoa.push(['', 'TỔNG CỘNG TRƯỚC VAT', '', '', '', grandTotal]);
    aoa.push(['', 'VAT (8%)', '', '', '', Math.round(grandTotal * 0.08)]);
    aoa.push(['', 'TỔNG CỘNG SAU VAT', '', '', '', Math.round(grandTotal * 1.08)]);
  } else {
    aoa.push(['', 'TỔNG CỘNG', '', '', '', grandTotal]);
  }
  const tableEndRow = aoa.length - 1;

  // "Bằng chữ"
  aoa.push(['', '', '', '', '', '']);
  const finalTotal = docType === 'quotation' && includeVAT ? Math.round(grandTotal * 1.08) : Math.round(grandTotal);
  const cfg = new ReadingConfig();
  cfg.unit = ['đồng'];
  const txt = doReadNumber(String(finalTotal), cfg);
  const bangChu = txt.charAt(0).toUpperCase() + txt.slice(1);
  aoa.push(['Bằng chữ:', bangChu, '', '', '', '']);
  aoa.push(['', '', '', '', '', '']);

  // Date and Signatures
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  aoa.push(['', '', '', '', `Đề Gi, ngày ${day} tháng ${month} năm ${year}`, '']);
  aoa.push(['', 'Người nhận', '', '', 'Người lập', '']);
  aoa.push(['', '(Ký và ghi rõ họ tên)', '', '', '(Ký và ghi rõ họ tên)', '']);
  aoa.push(['', '', '', '', '', '']);
  aoa.push(['', '', '', '', '', '']);
  aoa.push(['', '', '', '', '', '']);
  aoa.push(['', '', '', '', 'Nguyễn Thị Mai', '']);

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  // Merges
  const merges: XLSX.Range[] = [];
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } });
  merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 5 } });
  merges.push({ s: { r: 4, c: 0 }, e: { r: 4, c: 5 } }); // Title

  const bangChuRow = tableEndRow + 2;
  merges.push({ s: { r: bangChuRow, c: 1 }, e: { r: bangChuRow, c: 5 } });

  const dateRow = bangChuRow + 2;
  merges.push({ s: { r: dateRow, c: 4 }, e: { r: dateRow, c: 5 } });
  merges.push({ s: { r: dateRow + 1, c: 1 }, e: { r: dateRow + 1, c: 2 } }); // Người nhận
  merges.push({ s: { r: dateRow + 1, c: 4 }, e: { r: dateRow + 1, c: 5 } }); // Người lập
  merges.push({ s: { r: dateRow + 2, c: 1 }, e: { r: dateRow + 2, c: 2 } }); // (Ký)
  merges.push({ s: { r: dateRow + 2, c: 4 }, e: { r: dateRow + 2, c: 5 } }); // (Ký)
  merges.push({ s: { r: dateRow + 6, c: 4 }, e: { r: dateRow + 6, c: 5 } }); // Mai

  if (docType === 'quotation' && includeVAT) {
    merges.push({ s: { r: tableEndRow - 2, c: 1 }, e: { r: tableEndRow - 2, c: 4 } });
    merges.push({ s: { r: tableEndRow - 1, c: 1 }, e: { r: tableEndRow - 1, c: 4 } });
    merges.push({ s: { r: tableEndRow, c: 1 }, e: { r: tableEndRow, c: 4 } });
  } else {
    merges.push({ s: { r: tableEndRow, c: 1 }, e: { r: tableEndRow, c: 4 } });
  }

  worksheet['!merges'] = merges;
  worksheet['!cols'] = [
    { wch: 8 },  // STT
    { wch: 45 }, // Tên sản phẩm
    { wch: 10 }, // Đvt
    { wch: 10 }, // Số lượng
    { wch: 15 }, // Đơn giá
    { wch: 15 }, // Thành tiền
  ];

  const range = XLSX.utils.decode_range(worksheet['!ref'] as string);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = { c: C, r: R };
      const cellRef = XLSX.utils.encode_cell(cellAddress);
      if (!worksheet[cellRef]) {
        worksheet[cellRef] = { t: 's', v: '' };
      }
      const cell = worksheet[cellRef];
      if (!cell.s) cell.s = {};

      cell.s.font = { name: 'Times New Roman', sz: 12 };

      // Header styling
      if (R === 0) {
        cell.s.font.bold = true;
        cell.s.font.sz = 16;
        cell.s.alignment = { horizontal: 'center' };
      } else if (R === 1 || R === 2) {
        cell.s.alignment = { horizontal: 'center' };
      } else if (R === 4) { // Title
        cell.s.font.bold = true;
        cell.s.font.sz = 20;
        cell.s.alignment = { horizontal: 'center' };
      } else if (R >= 6 && R <= 9) { // Customer info
        if (C === 0) cell.s.font.bold = true;
      }

      // Table styling
      if (R >= tableStartRow && R <= tableEndRow) {
        const isTableHeader = R === tableStartRow;
        const isTotalRow = R > tableStartRow + items.length;

        cell.s.border = {
          top: { style: 'thin', color: { rgb: "000000" } },
          bottom: { style: 'thin', color: { rgb: "000000" } },
          left: { style: 'thin', color: { rgb: "000000" } },
          right: { style: 'thin', color: { rgb: "000000" } }
        };

        if (isTableHeader || isTotalRow) {
          cell.s.fill = { fgColor: { rgb: "EAEAEA" } };
          cell.s.font.bold = true;
        }
        if (isTableHeader) {
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
        } else {
          if (C === 0 || C === 2 || C === 3) { // STT, Đvt, Số lượng
            cell.s.alignment = { horizontal: 'center', vertical: 'center' };
          }
          if (isTotalRow && (C >= 1 && C <= 4)) {
            cell.s.alignment = { horizontal: 'center', vertical: 'center' };
          }
          if (C === 4 || C === 5) { // Prices
            cell.z = '#,##0';
          }
        }
      }

      // Bang chu styling
      if (R === bangChuRow) {
        if (C === 0) cell.s.font.bold = true;
        if (C === 1) cell.s.font.italic = true;
      }

      // Date & Signatures styling
      if (R === dateRow && C === 4) {
        cell.s.font.italic = true;
        cell.s.alignment = { horizontal: 'center' };
      }
      if ((R === dateRow + 1 || R === dateRow + 6) && (C === 1 || C === 4)) {
        cell.s.font.bold = true;
        cell.s.alignment = { horizontal: 'center' };
      }
      if (R === dateRow + 2 && (C === 1 || C === 4)) {
        cell.s.font.italic = true;
        cell.s.alignment = { horizontal: 'center' };
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  const sheetName = docType === 'quotation' ? 'BaoGia' : 'PhieuBanHang';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const prefix = docType === 'quotation' ? 'BaoGia' : 'PhieuBanHang';
  const fileName = `${prefix}_MaiVinh_${day}${month}${year}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};
export const printSalesReceiptHTML = (items: CartItem[], grandTotal: number) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép trình duyệt hiển thị popup để in phiếu bán hàng.');
    return;
  }

  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const rowsHtml = items.map((item, index) => {
    const cleanedSpec = cleanSpecName(item.specName);
    const isVisibleSpec = cleanedSpec && cleanedSpec !== '-' && cleanedSpec !== 'Mặc định';
    const productName = isVisibleSpec
      ? `${item.product.name} ${cleanedSpec}`
      : item.product.name;

    const fmtNum = (v: number) => new Intl.NumberFormat('vi-VN').format(v);
    return `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td>${productName}</td>
        <td class="text-center">${item.unit}</td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">${fmtNum(item.price)}</td>
        <td class="text-right">${fmtNum(item.price * item.quantity)}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Phiếu bán hàng - Cửa hàng Điện nước Mai Vinh</title>
      <meta charset="utf-8">
      <style>
        body { font-family: "Times New Roman", Times, serif; padding: 20px; color: #000; line-height: 1.4; }
        .header-container { text-align: center; margin-bottom: 20px; }
        .store-name { font-weight: bold; text-transform: uppercase; font-size: 20px; margin-bottom: 4px; }
        .title-container { text-align: center; margin: 30px 0; }
        .title { font-size: 32px; font-weight: bold; }
        .info-section { margin-bottom: 16px; font-size: 15px; }
        .info-row { display: flex; align-items: baseline; margin-bottom: 8px; }
        .info-label { white-space: nowrap; margin-right: 4px; }
        .info-dots { flex: 1; border-bottom: 1px dotted #000; margin-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 8px; font-size: 15px; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .footer { margin-top: 8px; display: flex; justify-content: space-between; }
        .footer-column { text-align: center; width: 280px; }
        .date { font-style: italic; margin-bottom: 10px; font-size: 15px; }
        .signature-space { height: 100px; }
        @media print {
          body { padding: 0; }
          @page { margin: 1.5cm; }
        }
      </style>
    </head>
    <body>
      <div class="header-container">
        <div class="store-info">
          <div class="store-name">Cửa hàng Điện nước Mai Vinh</div>
          <div>Địa chỉ: Thắng Kiên - Đề Gi - Gia Lai</div>
          <div>SĐT: 0976 576 443 - 0982 390 943</div>
        </div>
      </div>

      <div class="title-container">
        <div class="title">PHIẾU BÁN HÀNG</div>
      </div>

      <div class="info-section">
        <div class="info-row"><span class="info-label">Tên khách hàng:</span><span class="info-dots"></span></div>
        <div class="info-row"><span class="info-label">Mã số thuế:</span><span class="info-dots"></span></div>
        <div class="info-row"><span class="info-label">Điện thoại:</span><span class="info-dots"></span></div>
        <div class="info-row"><span class="info-label">Email:</span><span class="info-dots"></span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th width="5%">STT</th>
            <th width="45%">Tên sản phẩm</th>
            <th width="10%">Đvt</th>
            <th width="10%">Số lượng</th>
            <th width="15%">Đơn giá</th>
            <th width="15%">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold; background-color: #f2f2f2;">
            <td colspan="5" class="text-center">TỔNG CỘNG</td>
            <td class="text-right">${new Intl.NumberFormat('vi-VN').format(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top: 10px; font-size: 15px;">
        <strong>Bằng chữ:</strong> <em>${(() => { const cfg = new ReadingConfig(); cfg.unit = ['đồng']; const txt = doReadNumber(String(Math.round(grandTotal)), cfg); return txt.charAt(0).toUpperCase() + txt.slice(1); })()}</em>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 40px;">
        <div style="width: 280px;"></div>
        <div style="width: 280px; text-align: center;">
          <span class="date">Đề Gi, ngày ${day} tháng ${month} năm ${year}</span>
        </div>
      </div>
      <div class="footer">
        <div class="footer-column">
          <div style="font-weight: bold;">Người nhận</div>
          <div style="font-style: italic; margin-top: 4px;">(Ký và ghi rõ họ tên)</div>
          <div class="signature-space"></div>
        </div>
        <div class="footer-column">
          <div style="font-weight: bold;">Người lập</div>
          <div style="font-style: italic; margin-top: 4px;">(Ký và ghi rõ họ tên)</div>
          <div class="signature-space"></div>
          <div style="font-weight: bold; font-size: 18px;">Nguyễn Thị Mai</div>
        </div>
      </div>

      <script>
        window.onload = () => {
          window.print();
          window.close();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

export const printQuotationHTML = (items: CartItem[], grandTotal: number, includeVAT: boolean = true) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép trình duyệt hiển thị popup để in báo giá.');
    return;
  }

  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const rowsHtml = items.map((item, index) => {
    const cleanedSpec = cleanSpecName(item.specName);
    const isVisibleSpec = cleanedSpec && cleanedSpec !== '-' && cleanedSpec !== 'Mặc định';
    const productName = isVisibleSpec
      ? `${item.product.name} ${cleanedSpec}`
      : item.product.name;

    const fmtNum = (v: number) => new Intl.NumberFormat('vi-VN').format(v);
    return `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td>${productName}</td>
        <td class="text-center">${item.unit}</td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">${fmtNum(item.price)}</td>
        <td class="text-right">${fmtNum(item.price * item.quantity)}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Báo giá - Cửa hàng Điện nước Mai Vinh</title>
      <meta charset="utf-8">
      <style>
        body { font-family: "Times New Roman", Times, serif; padding: 20px; color: #000; line-height: 1.4; }
        .header-container { text-align: center; margin-bottom: 20px; }
        .store-name { font-weight: bold; text-transform: uppercase; font-size: 20px; margin-bottom: 4px; }
        .title-container { text-align: center; margin: 30px 0; }
        .title { font-size: 32px; font-weight: bold; }
        .info-section { margin-bottom: 16px; font-size: 15px; }
        .info-row { display: flex; align-items: baseline; margin-bottom: 8px; }
        .info-label { white-space: nowrap; margin-right: 4px; }
        .info-dots { flex: 1; border-bottom: 1px dotted #000; margin-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 8px; font-size: 15px; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .footer { margin-top: 8px; display: flex; justify-content: space-between; }
        .footer-column { text-align: center; width: 280px; }
        .date { font-style: italic; margin-bottom: 10px; font-size: 15px; }
        .signature-space { height: 100px; }
        @media print {
          body { padding: 0; }
          @page { margin: 1.5cm; }
        }
      </style>
    </head>
    <body>
      <div class="header-container">
        <div class="store-info">
          <div class="store-name">Cửa hàng Điện nước Mai Vinh</div>
          <div>Địa chỉ: Thắng Kiên - Đề Gi - Gia Lai</div>
          <div>SĐT: 0976 576 443 - 0982 390 943</div>
        </div>
      </div>

      <div class="title-container">
        <div class="title">BẢNG BÁO GIÁ</div>
      </div>

      <div class="info-section">
        <div class="info-row"><span class="info-label">Tên khách hàng:</span><span class="info-dots"></span></div>
        <div class="info-row"><span class="info-label">Mã số thuế:</span><span class="info-dots"></span></div>
        <div class="info-row"><span class="info-label">Điện thoại:</span><span class="info-dots"></span></div>
        <div class="info-row"><span class="info-label">Email:</span><span class="info-dots"></span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th width="5%">STT</th>
            <th width="45%">Tên sản phẩm</th>
            <th width="10%">Đvt</th>
            <th width="10%">Số lượng</th>
            <th width="15%">Đơn giá</th>
            <th width="15%">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          ${includeVAT ? `
          <tr style="font-weight: bold; background-color: #f2f2f2;">
            <td colspan="5" class="text-center">TỔNG CỘNG TRƯỚC VAT</td>
            <td class="text-right">${new Intl.NumberFormat('vi-VN').format(grandTotal)}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #f2f2f2;">
            <td colspan="5" class="text-center">VAT (8%)</td>
            <td class="text-right">${new Intl.NumberFormat('vi-VN').format(Math.round(grandTotal * 0.08))}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #f2f2f2;">
            <td colspan="5" class="text-center">TỔNG CỘNG SAU VAT</td>
            <td class="text-right">${new Intl.NumberFormat('vi-VN').format(Math.round(grandTotal * 1.08))}</td>
          </tr>
          ` : `
          <tr style="font-weight: bold; background-color: #f2f2f2;">
            <td colspan="5" class="text-center">TỔNG CỘNG</td>
            <td class="text-right">${new Intl.NumberFormat('vi-VN').format(grandTotal)}</td>
          </tr>
          `}
        </tfoot>
      </table>

      <div style="margin-top: 10px; font-size: 15px;">
        <strong>Bằng chữ:</strong> <em>${(() => { const cfg = new ReadingConfig(); cfg.unit = ['đồng']; const finalTotal = includeVAT ? Math.round(grandTotal * 1.08) : Math.round(grandTotal); const txt = doReadNumber(String(finalTotal), cfg); return txt.charAt(0).toUpperCase() + txt.slice(1); })()}</em>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 40px;">
        <div style="width: 280px;"></div>
        <div style="width: 280px; text-align: center;">
          <span class="date">Đề Gi, ngày ${day} tháng ${month} năm ${year}</span>
        </div>
      </div>
      <div class="footer">
        <div class="footer-column">
          <div style="font-weight: bold;">Người nhận</div>
          <div style="font-style: italic; margin-top: 4px;">(Ký và ghi rõ họ tên)</div>
          <div class="signature-space"></div>
        </div>
        <div class="footer-column">
          <div style="font-weight: bold;">Người lập</div>
          <div style="font-style: italic; margin-top: 4px;">(Ký và ghi rõ họ tên)</div>
          <div class="signature-space"></div>
          <div style="font-weight: bold; font-size: 18px;">Nguyễn Thị Mai</div>
        </div>
      </div>

      <script>
        window.onload = () => {
          window.print();
          window.close();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

export const exportDocumentToPDF = (items: CartItem[], grandTotal: number, docType: 'receipt' | 'quotation', includeVAT: boolean = false) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép trình duyệt hiển thị popup để xuất PDF.');
    return;
  }

  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const rowsHtml = items.map((item, index) => {
    const cleanedSpec = cleanSpecName(item.specName);
    const isVisibleSpec = cleanedSpec && cleanedSpec !== '-' && cleanedSpec !== 'Mặc định';
    const productName = isVisibleSpec
      ? `${item.product.name} ${cleanedSpec}`
      : item.product.name;

    const fmtNum = (v: number) => new Intl.NumberFormat('vi-VN').format(v);
    return `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td>${productName}</td>
        <td class="text-center">${item.unit}</td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">${fmtNum(item.price)}</td>
        <td class="text-right">${fmtNum(item.price * item.quantity)}</td>
      </tr>
    `;
  }).join('');

  const title = docType === 'quotation' ? 'BẢNG BÁO GIÁ' : 'PHIẾU BÁN HÀNG';
  const prefix = docType === 'quotation' ? 'BaoGia' : 'PhieuBanHang';
  const fileName = `${prefix}_MaiVinh_${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}${year}.pdf`;

  let tfootHtml = '';
  if (docType === 'quotation' && includeVAT) {
    tfootHtml = `
      <tr style="font-weight: bold; background-color: #f2f2f2;">
        <td colspan="5" class="text-center">TỔNG CỘNG TRƯỚC VAT</td>
        <td class="text-right">${new Intl.NumberFormat('vi-VN').format(grandTotal)}</td>
      </tr>
      <tr style="font-weight: bold; background-color: #f2f2f2;">
        <td colspan="5" class="text-center">VAT (8%)</td>
        <td class="text-right">${new Intl.NumberFormat('vi-VN').format(Math.round(grandTotal * 0.08))}</td>
      </tr>
      <tr style="font-weight: bold; background-color: #f2f2f2;">
        <td colspan="5" class="text-center">TỔNG CỘNG SAU VAT</td>
        <td class="text-right">${new Intl.NumberFormat('vi-VN').format(Math.round(grandTotal * 1.08))}</td>
      </tr>
    `;
  } else {
    tfootHtml = `
      <tr style="font-weight: bold; background-color: #f2f2f2;">
        <td colspan="5" class="text-center">TỔNG CỘNG</td>
        <td class="text-right">${new Intl.NumberFormat('vi-VN').format(grandTotal)}</td>
      </tr>
    `;
  }

  const finalTotal = docType === 'quotation' && includeVAT ? Math.round(grandTotal * 1.08) : Math.round(grandTotal);
  const cfg = new ReadingConfig();
  cfg.unit = ['đồng'];
  const txt = doReadNumber(String(finalTotal), cfg);
  const bangChu = txt.charAt(0).toUpperCase() + txt.slice(1);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Đang xuất PDF...</title>
      <meta charset="utf-8">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <style>
        body { font-family: "Times New Roman", Times, serif; margin: 0; padding: 0; color: #000; line-height: 1.4; background: #fff; }
        #pdf-content { padding: 40px; }
        .header-container { text-align: center; margin-bottom: 20px; }
        .store-name { font-weight: bold; text-transform: uppercase; font-size: 20px; margin-bottom: 4px; }
        .title-container { text-align: center; margin: 30px 0; }
        .title { font-size: 32px; font-weight: bold; }
        .info-section { margin-bottom: 16px; font-size: 15px; }
        .info-row { display: flex; align-items: baseline; margin-bottom: 8px; }
        .info-label { white-space: nowrap; margin-right: 4px; }
        .info-dots { flex: 1; border-bottom: 1px dotted #000; margin-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 8px; font-size: 15px; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .footer { margin-top: 8px; display: flex; justify-content: space-between; }
        .footer-column { text-align: center; width: 280px; }
        .date { font-style: italic; margin-bottom: 10px; font-size: 15px; }
        .signature-space { height: 100px; }
      </style>
    </head>
    <body>
      <div style="position: fixed; z-index: 9999; top: 0; left: 0; right: 0; bottom: 0; background: white; display: flex; align-items: center; justify-content: center; font-family: sans-serif; font-size: 18px; color: #333;">
        Đang tạo file PDF, vui lòng đợi...
      </div>
      <div id="pdf-content" style="width: 800px; padding: 40px; background: white; margin: 0; box-sizing: border-box;">
        <div class="header-container">
          <div class="store-info">
            <div class="store-name">Cửa hàng Điện nước Mai Vinh</div>
            <div>Địa chỉ: Thắng Kiên - Đề Gi - Gia Lai</div>
            <div>SĐT: 0976 576 443 - 0982 390 943</div>
          </div>
        </div>

        <div class="title-container">
          <div class="title">${title}</div>
        </div>

        <div class="info-section">
          <div class="info-row"><span class="info-label">Tên khách hàng:</span><span class="info-dots"></span></div>
          <div class="info-row"><span class="info-label">Mã số thuế:</span><span class="info-dots"></span></div>
          <div class="info-row"><span class="info-label">Điện thoại:</span><span class="info-dots"></span></div>
          <div class="info-row"><span class="info-label">Email:</span><span class="info-dots"></span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="5%">STT</th>
              <th width="45%">Tên sản phẩm</th>
              <th width="10%">Đvt</th>
              <th width="10%">Số lượng</th>
              <th width="15%">Đơn giá</th>
              <th width="15%">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            ${tfootHtml}
          </tfoot>
        </table>

        <div style="margin-top: 10px; font-size: 15px;">
          <strong>Bằng chữ:</strong> <em>${bangChu}</em>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
          <div style="width: 280px;"></div>
          <div style="width: 280px; text-align: center;">
            <span class="date">Đề Gi, ngày ${day} tháng ${month} năm ${year}</span>
          </div>
        </div>
        <div class="footer">
          <div class="footer-column">
            <div style="font-weight: bold;">Người nhận</div>
            <div style="font-style: italic; margin-top: 4px;">(Ký và ghi rõ họ tên)</div>
            <div class="signature-space"></div>
          </div>
          <div class="footer-column">
            <div style="font-weight: bold;">Người lập</div>
            <div style="font-style: italic; margin-top: 4px;">(Ký và ghi rõ họ tên)</div>
            <div class="signature-space"></div>
            <div style="font-weight: bold; font-size: 18px;">Nguyễn Thị Mai</div>
          </div>
        </div>
      </div>

      <script>
        setTimeout(() => {
          if (typeof html2pdf === 'undefined') {
            alert('Không thể tải thư viện PDF. Vui lòng kiểm tra kết nối mạng và thử lại.');
            window.close();
            return;
          }
          const element = document.getElementById('pdf-content');
          const opt = {
            margin: 0,
            filename: '${fileName}',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, windowWidth: 800, scrollX: 0, scrollY: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          html2pdf().set(opt).from(element).save().then(() => {
            setTimeout(() => window.close(), 1000);
          });
        }, 1500);
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
